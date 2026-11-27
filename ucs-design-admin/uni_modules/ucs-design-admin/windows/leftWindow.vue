<template>
	<div class="admin-sidebar" :class="{ 'is-collapsed': store.isCollapsed }" :style="{ width: sidebarWidth }">
		<el-scrollbar class="sidebar-scrollbar">
			<div v-if="loading" class="sidebar-state" role="status" aria-label="正在加载菜单">
				<el-skeleton :rows="store.isCollapsed ? 3 : 6" animated />
			</div>
			<div v-else-if="loadError" class="sidebar-state" role="alert">
				<el-icon class="state-icon"><Warning /></el-icon>
				<text v-if="!store.isCollapsed" class="state-description">{{ loadError }}</text>
				<el-button text type="primary" size="small" @click="getCurrentMenus()">重试</el-button>
			</div>
			<el-menu
				v-else-if="menus.length"
				ref="menuRef"
				class="sidebar-menu"
				popper-class="admin-sidebar-menu-popup"
				:collapse="store.isCollapsed"
				:default-openeds="openedKeys"
				:default-active="activeKey"
				:collapse-transition="false"
				@select="onMenuItemClick"
			>
				<leftWindowMenu :data="menus" />
			</el-menu>
			<div v-else class="sidebar-state">
				<el-icon class="state-icon"><FolderOpened /></el-icon>
				<text v-if="!store.isCollapsed" class="state-description">暂无可用菜单</text>
			</div>
		</el-scrollbar>
		<div class="sidebar-footer">
			<el-tooltip :content="'当前版本 v' + manifestJson.versionName" :disabled="!store.isCollapsed" placement="right">
				<div class="version-info">
					<el-icon><Monitor /></el-icon>
					<text v-if="!store.isCollapsed" class="version-label">系统版本 {{ manifestJson.versionName }}</text>
				</div>
			</el-tooltip>
		</div>
	</div>
</template>

<script setup>
import { ElButton, ElIcon, ElMenu, ElScrollbar, ElSkeleton, ElTooltip } from 'element-plus';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/icon/style/css.mjs';
import 'element-plus/es/components/menu/style/css.mjs';
import 'element-plus/es/components/scrollbar/style/css.mjs';
import 'element-plus/es/components/skeleton/style/css.mjs';
import 'element-plus/es/components/tooltip/style/css.mjs';

import { getCurrentInstance, nextTick, onBeforeMount, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { FolderOpened, Monitor, Warning } from '@element-plus/icons-vue';
import pagesJson from '@/pages.json';
import manifestJson from '@/manifest.json';
import store, { currentDelegationId } from '../common/store.js';
import { sidebarWidth, syncSidebarWidth } from '../common/window-layout.js';
import leftWindowMenu from './leftWindowMenu.vue';
import { MENU_TYPE } from '../common/menu.js';
import { loadNavigation } from '../common/navigation.js';
import { describeRequestError } from '../common/session-errors.js';

// Allocate space before the first menu render, and restore it on window remount.
onBeforeMount(syncSidebarWidth);
watch(sidebarWidth, syncSidebarWidth, { flush: 'sync' });
const menus = ref([]);
const loading = ref(false);
const loadError = ref('');
const menuRef = ref();
const activeKey = ref('');
const openedKeys = ref([]);
const menuIndex = new Map();
const instance = getCurrentInstance();
let requestId = 0;
const normalizeRoute = (url = '') => {
	const path = '/' + url.replace(/^\//, '').split(/[?#]/)[0];
	return path === '/' ? '/' + pagesJson.pages[0].path : path;
};
const currentRoute = () => {
	const hash = window.location.hash.slice(1);
	if (hash.startsWith('/')) return normalizeRoute(hash);
	const currentPages = getCurrentPages();
	return normalizeRoute(currentPages[currentPages.length - 1]?.route || window.location.pathname);
};
const indexMenus = (items, parents = [], breadcrumb = []) =>
	items.map((item) => {
		const children = Array.isArray(item.children) ? item.children : [];
		const labels = [...breadcrumb, item.name];
		const url = item.url === '/' ? '/' + pagesJson.pages[0].path : item.url;
		menuIndex.set(item._id, { url, parents, breadcrumb: labels, isLeaf: item.menu_type === MENU_TYPE.PAGE });
		return { ...item, url, children: indexMenus(children, [...parents, item._id], labels) };
	});
const syncRoute = async () => {
	const route = currentRoute();
	const match = [...menuIndex].find(([, item]) => item.isLeaf && item.url && normalizeRoute(item.url) === route);
	activeKey.value = match?.[0] || '';
	openedKeys.value = match?.[1].parents || [];
	store.breadcrumbMenu = match?.[1].breadcrumb || [];
	await nextTick();
	if (!store.isCollapsed) openedKeys.value.forEach((key) => menuRef.value?.open(key));
};
// 应用路由通过 pushState/replaceState 跳转时不会触发 hashchange/popstate。
// 监听响应式路由，覆盖工作台入口、带查询参数跳转以及同页参数变化。
watch(
	() => instance.proxy.$route?.fullPath,
	() => syncRoute(),
	{ flush: 'post' }
);
const getCurrentMenus = async (preserveMenus = false) => {
	const id = ++requestId;
	loading.value = loading.value || !preserveMenus || !menus.value.length;
	loadError.value = '';
	try {
		const result = await loadNavigation();
		if (result.errCode) throw result;
		if (id !== requestId) return;
		menuIndex.clear();
		menus.value = indexMenus(result.data || []);
		await syncRoute();
	} catch (error) {
		if (id !== requestId) return;
		menus.value = [];
		menuIndex.clear();
		loadError.value = describeRequestError(error, '菜单加载失败，请重试').message;
		console.error('菜单加载失败', error);
	} finally {
		if (id === requestId) loading.value = false;
	}
};
const onMenuItemClick = (key) => {
	const item = menuIndex.get(key);
	if (!item?.url) return;
	uni.redirectTo({
		url: '/' + item.url.replace(/^\//, ''),
		success: syncRoute,
		fail: () => {
			// Element Plus 会先更新内部选中项；失败时恢复为当前页面。
			menuRef.value?.updateActiveIndex(activeKey.value);
			uni.showToast({ title: '页面打开失败，请重试', icon: 'none' });
		}
	});
};
watch(
	[() => store.isLogin, currentDelegationId, () => store.menuVersion],
	([isLogin, delegationId], [wasLoggedIn, previousDelegationId] = []) => {
		if (isLogin) {
			getCurrentMenus(wasLoggedIn && delegationId === previousDelegationId);
		} else {
			requestId++;
			menus.value = [];
			menuIndex.clear();
			activeKey.value = '';
			openedKeys.value = [];
			store.breadcrumbMenu = [];
			loading.value = false;
			loadError.value = false;
		}
	},
	{ immediate: true }
);
watch(
	() => store.isCollapsed,
	() => syncRoute()
);
onMounted(() => {
	syncSidebarWidth();
	window.addEventListener('hashchange', syncRoute);
	window.addEventListener('popstate', syncRoute);
	if (!store.isLogin) store.isLogin = Boolean(uniCloud.getCurrentUserInfo().uid);
});
onBeforeUnmount(() => {
	requestId++;
	window.removeEventListener('hashchange', syncRoute);
	window.removeEventListener('popstate', syncRoute);
});
</script>

<style scoped>
/* 侧栏展开时允许主区域收窄，并保持侧栏宽度。 */
:global(uni-main) {
	min-width: 0;
}
:global(uni-left-window) {
	flex-shrink: 0;
}
.admin-sidebar {
	display: flex;
	flex-direction: column;
	height: calc(100vh - var(--top-window-height, 56px));
	height: calc(100dvh - var(--top-window-height, 56px));
	position: fixed;
	box-sizing: border-box;
	background: var(--el-bg-color);
	border-right: 1px solid var(--el-border-color-light);
	overflow: hidden;
}
.sidebar-scrollbar {
	flex: 1;
	min-height: 0;
}
.sidebar-menu {
	border-right: 0;
	padding: 16px 8px;
}
/* 折叠后子菜单挂载到侧栏之外，悬浮层需应用同一套菜单样式。 */
.sidebar-menu,
:global(.admin-sidebar-menu-popup.el-menu--popup-container) {
	--el-menu-item-height: 44px;
	--el-menu-sub-item-height: 40px;
	--el-menu-base-level-padding: 14px;
	--el-menu-level-padding: 20px;
	--el-menu-hover-bg-color: var(--el-fill-color-light);
	--el-menu-text-color: var(--el-text-color-regular);
}
:global(.admin-sidebar-menu-popup.el-menu--popup-container > .el-menu--popup) {
	padding: 8px;
}
:global(.admin-sidebar-menu-popup.el-menu--popup-container .el-menu-item) {
	height: var(--el-menu-sub-item-height);
	line-height: var(--el-menu-sub-item-height);
}
:global(.admin-sidebar-menu-popup.el-menu--popup-container > .el-menu--popup > :last-child),
:global(.admin-sidebar-menu-popup.el-menu--popup-container > .el-menu--popup > :last-child > .el-sub-menu__title) {
	margin-bottom: 0;
}
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title),
:global(.admin-sidebar-menu-popup.el-menu--popup-container .el-menu-item),
:global(.admin-sidebar-menu-popup.el-menu--popup-container .el-sub-menu__title) {
	margin-bottom: 4px;
	border-radius: 6px;
}
.sidebar-menu :deep(.el-icon),
:global(.admin-sidebar-menu-popup.el-menu--popup-container .el-icon) {
	font-size: 19px;
	margin-right: 10px;
	flex-shrink: 0;
}
.sidebar-menu :deep(.el-sub-menu__icon-arrow),
:global(.admin-sidebar-menu-popup.el-menu--popup-container .el-sub-menu__icon-arrow) {
	font-size: 12px;
	margin-right: 0;
}
.sidebar-menu :deep(.el-menu-item.is-active),
:global(.admin-sidebar-menu-popup.el-menu--popup-container .el-menu-item.is-active) {
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
	font-weight: 500;
}
.sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title),
:global(.admin-sidebar-menu-popup.el-menu--popup-container .el-sub-menu.is-active > .el-sub-menu__title) {
	color: var(--el-color-primary);
}
.sidebar-menu :deep(.el-menu-item:focus-visible),
.sidebar-menu :deep(.el-sub-menu__title:focus-visible),
:global(.admin-sidebar-menu-popup.el-menu--popup-container .el-menu-item:focus-visible),
:global(.admin-sidebar-menu-popup.el-menu--popup-container .el-sub-menu__title:focus-visible) {
	outline: 2px solid var(--el-color-primary);
	outline-offset: -2px;
}
.is-collapsed .sidebar-menu {
	width: 63px;
	padding: 16px 8px;
	box-sizing: border-box;
	--el-menu-base-level-padding: 12px;
}
.is-collapsed .sidebar-menu :deep(.el-icon) {
	margin-right: 0;
}
.is-collapsed .sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
	background: var(--el-color-primary-light-9);
}
.sidebar-footer {
	flex-shrink: 0;
	margin: 0 16px;
	padding: 18px 0;
}
.version-info {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	white-space: nowrap;
	color: var(--el-text-color-placeholder);
	font-size: 14px;
	line-height: 20px;
}
.version-info .el-icon,
.version-info .version-label {
	font-size: inherit;
	line-height: inherit;
}
.sidebar-state {
	padding: 24px 12px;
	display: flex;
	align-items: center;
	flex-direction: column;
	gap: 10px;
	color: var(--el-text-color-secondary);
}
.state-icon {
	font-size: 22px;
}
.state-description {
	font-size: 13px;
}
.is-collapsed .sidebar-state {
	padding: 24px 8px;
}
</style>
