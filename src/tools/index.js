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

export const TOOLS = [
  { id: 'calculator', name: '计算器', icon: '🧮', color: '#4FC3F7' },
  { id: 'weather', name: '天气', icon: '🌤️', color: '#FFB74D' },
  { id: 'notes', name: '备忘录', icon: '📝', color: '#81C784' },
  { id: 'timer', name: '计时器', icon: '⏱️', color: '#FF8A65' },
  { id: 'calendar', name: '日历', icon: '📅', color: '#BA68C8' },
  { id: 'music', name: '音乐', icon: '🎵', color: '#F06292' },
  { id: 'camera', name: '相机', icon: '📷', color: '#90A4AE' },
  { id: 'clock', name: '时钟', icon: '🕐', color: '#FFD54F' },
  { id: 'compass', name: '指南针', icon: '🧭', color: '#A1887F' },
  { id: 'drawing', name: '画板', icon: '🎨', color: '#FFB74D' },
  { id: 'colorpicker', name: '颜色', icon: '🎯', color: '#E57373' },
  { id: 'toolbox', name: '工具箱', icon: '🔧', color: '#A1887F' },
];

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
};
