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
import PlanetManager from './PlanetManager.vue';
// 开发者子工具作为独立组件
import JsonFormat from './devtools/JsonFormat.vue';
import JsonDiff from './devtools/JsonDiff.vue';
import TimestampTool from './devtools/Timestamp.vue';
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
  { id: 'qrcode',   name: '二维码',   icon: '📱', color: '#26C6DA' },
  { id: 'planetmgr', name: '星球管理', icon: '🌍', color: '#00E676' },
  // 开发者子工具（独立卫星 & 独立面板）
  { id: 'json',      name: 'JSON',       icon: '🔧', color: '#4FC3F7' },
  { id: 'jsondiff',  name: 'JSON对比',   icon: '📊', color: '#BA68C8' },
  { id: 'timestamp', name: '时间戳',     icon: '⏰', color: '#FFB74D' },
  { id: 'base64',    name: 'Base64',    icon: '🔐', color: '#81C784' },
  { id: 'url',       name: 'URL',        icon: '🔗', color: '#FF8A65' },
  { id: 'textdiff',  name: '文本对比',   icon: '📝', color: '#F06292' },
  { id: 'sort',      name: '排序/去重', icon: '🔀', color: '#90A4AE' },
  { id: 'crontab',   name: 'Crontab',    icon: '⏱️', color: '#FFD54F' },
  { id: 'regex',     name: '正则',       icon: '🔍', color: '#A1887F' },
  { id: 'uuid',      name: 'UUID',       icon: '🆔', color: '#E57373' },
  { id: 'hash',      name: 'Hash',       icon: '🔑', color: '#4DD0E1' },
  { id: 'passwd',    name: '密码',       icon: '🔒', color: '#26C6DA' },
  { id: 'length',    name: '长度',       icon: '📏', color: '#AB47BC' },
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
  planetmgr: PlanetManager,
  // 开发者子工具组件
  json: JsonFormat,
  jsondiff: JsonDiff,
  timestamp: TimestampTool,
  base64: Base64Tool,
  url: UrlTool,
  textdiff: TextDiff,
  sort: SortTool,
  crontab: Crontab,
  regex: RegexTool,
  uuid: UuidTool,
  hash: HashTool,
  passwd: PasswordTool,
  length: LengthTool,
};
