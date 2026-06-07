<template>
  <div class="tool-videocall">
    <div v-if="!connected" class="videocall-connect">
      <div class="videocall-input-row">
        <input v-model="roomId" placeholder="输入房间号" @keyup.enter="join" />
        <button @click="join">加入</button>
      </div>
      <div class="videocall-hint">双方输入相同房间号即可视频通话</div>
    </div>
    <div v-else class="videocall-room">
      <div class="videocall-videos">
        <div class="videocall-video-wrap remote">
          <video ref="remoteVideoRef" autoplay playsinline></video>
          <div v-if="!remoteConnected" class="videocall-waiting">等待对方加入...</div>
        </div>
        <div class="videocall-video-wrap local">
          <video ref="localVideoRef" autoplay playsinline muted></video>
        </div>
      </div>
      <div class="videocall-actions">
        <button class="camera-btn secondary" @click="leave">离开</button>
        <div class="videocall-room-id">房间: {{ roomId }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, nextTick } from 'vue';

const roomId = ref('');
const connected = ref(false);
const remoteConnected = ref(false);
const localVideoRef = ref(null);
const remoteVideoRef = ref(null);

let ws = null;
let pc = null;
let localStream = null;

const SIGNAL_URL = 'ws://localhost:3001';
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

async function join() {
  const id = roomId.value.trim();
  if (!id) return;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch {
    alert('无法获取摄像头/麦克风');
    return;
  }

  connected.value = true;
  await nextTick();
  if (localVideoRef.value) localVideoRef.value.srcObject = localStream;

  ws = new WebSocket(SIGNAL_URL);
  ws.onopen = () => ws.send(JSON.stringify({ type: 'join', room: id }));
  ws.onmessage = async (e) => {
    const msg = JSON.parse(e.data);
    switch (msg.type) {
      case 'peer-joined': {
        createPC(true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: 'offer', sdp: pc.localDescription }));
        break;
      }
      case 'offer': {
        createPC(false);
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', sdp: pc.localDescription }));
        break;
      }
      case 'answer': {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        break;
      }
      case 'ice-candidate': {
        if (pc && msg.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
        break;
      }
      case 'peer-left': {
        remoteConnected.value = false;
        if (remoteVideoRef.value) remoteVideoRef.value.srcObject = null;
        break;
      }
    }
  };
}

function createPC(initiator) {
  pc = new RTCPeerConnection(ICE);
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

  pc.ontrack = (e) => {
    remoteConnected.value = true;
    if (remoteVideoRef.value) remoteVideoRef.value.srcObject = e.streams[0];
  };

  pc.onicecandidate = (e) => {
    if (e.candidate && ws?.readyState === 1) {
      ws.send(JSON.stringify({ type: 'ice-candidate', candidate: e.candidate }));
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      remoteConnected.value = false;
    }
  };
}

function leave() {
  if (pc) { pc.close(); pc = null; }
  if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
  if (ws) { ws.close(); ws = null; }
  connected.value = false;
  remoteConnected.value = false;
}

onUnmounted(() => leave());
</script>
