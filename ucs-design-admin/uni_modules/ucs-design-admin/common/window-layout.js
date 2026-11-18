import { computed } from 'vue';
import pagesJson from '@/pages.json';
import store from './store.js';

// Keep the brand, menu and uni-app window allocation on the same width.
export const sidebarWidth = computed(() => store.isCollapsed
  ? '64px'
  : (pagesJson.leftWindow?.style?.width || '208px'));

export function syncSidebarWidth() {
  uni.setLeftWindowStyle({ width: sidebarWidth.value });
}
