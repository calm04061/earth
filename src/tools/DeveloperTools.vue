<template>
  <div class="tool-devtools">
    <div class="devtools-tabs">
      <button v-for="t in tabs" :key="t.id"
        :class="['devtools-tab', { active: activeTab === t.id }]"
        @click="activeTab = t.id">{{ t.label }}</button>
    </div>
    <div class="devtools-body">
      <JsonFormat v-if="activeTab === 'json'" />
      <JsonDiff v-if="activeTab === 'jsondiff'" />
      <Timestamp v-if="activeTab === 'timestamp'" />
      <Base64Tool v-if="activeTab === 'base64'" />
      <UrlTool v-if="activeTab === 'url'" />
      <TextDiff v-if="activeTab === 'textdiff'" />
      <SortTool v-if="activeTab === 'sort'" />
      <Crontab v-if="activeTab === 'crontab'" />
      <RegexTool v-if="activeTab === 'regex'" />
      <UuidTool v-if="activeTab === 'uuid'" />
      <HashTool v-if="activeTab === 'hash'" />
      <PasswordTool v-if="activeTab === 'passwd'" />
      <LengthTool v-if="activeTab === 'length'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  initialTab: { type: String, default: 'json' },
});

import JsonFormat from './devtools/JsonFormat.vue';
import JsonDiff from './devtools/JsonDiff.vue';
import Timestamp from './devtools/Timestamp.vue';
import Base64Tool from './devtools/Base64Tool.vue';
import UrlTool from './devtools/UrlTool.vue';
import TextDiff from './devtools/TextDiff.vue';
import SortTool from './devtools/SortTool.vue';
import Crontab from './devtools/Crontab.vue';
import RegexTool from './devtools/RegexTool.vue';
import UuidTool from './devtools/UuidTool.vue';
import HashTool from './devtools/HashTool.vue';
import PasswordTool from './devtools/PasswordTool.vue';
import LengthTool from './devtools/LengthTool.vue';

const tabs = [
  { id: 'json', label: 'JSON' },
  { id: 'jsondiff', label: 'JSON对比' },
  { id: 'timestamp', label: '时间戳' },
  { id: 'base64', label: 'Base64' },
  { id: 'url', label: 'URL' },
  { id: 'textdiff', label: '文本对比' },
  { id: 'sort', label: '排序/去重' },
  { id: 'crontab', label: 'Crontab' },
  { id: 'regex', label: '正则' },
  { id: 'uuid', label: 'UUID' },
  { id: 'hash', label: 'Hash' },
  { id: 'passwd', label: '密码' },
  { id: 'length', label: '长度' },
];
const activeTab = ref(props.initialTab);
</script>
