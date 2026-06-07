// 工具组件导入
import Calculator from './Calculator.vue';
import Weather from './Weather.vue';
import Notes from './Notes.vue';
import Timer from './Timer.vue';
import Calendar from './Calendar.vue';
import MusicPlayer from './MusicPlayer.vue';
import Camera from './Camera.vue';
import AnalogClock from './AnalogClock.vue';
import Compass from './Compass.vue';
import DrawingBoard from './DrawingBoard.vue';
import ColorPicker from './ColorPicker.vue';
import Toolbox from './Toolbox.vue';
import VideoCall from './VideoCall.vue';
import DeveloperTools from './DeveloperTools.vue';
import QRCode from './QRCode.vue';

// 工具定义列表：ID、名称、图标、主题色（用于卫星标记颜色）
export const TOOLS = [
  { id: 'calculator', name: '计算器', icon: '🧮', color: '#4FC3F7' },
  { id: 'weather',   name: '天气',   icon: '🌤️', color: '#FFB74D' },
  { id: 'notes',     name: '备忘录', icon: '📝', color: '#81C784' },
  { id: 'timer',     name: '计时器', icon: '⏱️', color: '#FF8A65' },
  { id: 'calendar',  name: '日历',   icon: '📅', color: '#BA68C8' },
  { id: 'music',     name: '音乐',   icon: '🎵', color: '#F06292' },
  { id: 'camera',    name: '相机',   icon: '📷', color: '#90A4AE' },
  { id: 'clock',     name: '时钟',   icon: '🕐', color: '#FFD54F' },
  { id: 'compass',   name: '指南针', icon: '🧭', color: '#A1887F' },
  { id: 'drawing',   name: '画板',   icon: '🎨', color: '#FFB74D' },
  { id: 'colorpicker', name: '颜色', icon: '🎯', color: '#E57373' },
  { id: 'toolbox',   name: '工具箱', icon: '🔧', color: '#A1887F' },
  { id: 'videocall', name: '视频通话', icon: '📹', color: '#4DD0E1' },
  { id: 'devtools', name: '开发者', icon: '🛠️', color: '#FF8A65' },
  { id: 'qrcode',   name: '二维码', icon: '📱', color: '#26C6DA' },
];

// 工具 ID 到 Vue 组件的映射表
export const toolComponents = {
  calculator: Calculator,
  weather: Weather,
  notes: Notes,
  timer: Timer,
  calendar: Calendar,
  music: MusicPlayer,
  camera: Camera,
  clock: AnalogClock,
  compass: Compass,
  drawing: DrawingBoard,
  colorpicker: ColorPicker,
  toolbox: Toolbox,
  videocall: VideoCall,
  devtools: DeveloperTools,
  qrcode: QRCode,
};
