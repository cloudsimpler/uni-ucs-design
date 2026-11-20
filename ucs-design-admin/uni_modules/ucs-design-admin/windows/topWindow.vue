<template>
	<div class="admin-header">
		<div class="header-brand" :class="{ 'is-collapsed': store.isCollapsed }" :style="{ width: sidebarWidth }">
			<image class="brand-logo" src="/uni_modules/ucs-design-admin/static/logo.svg" />
			<text v-if="!store.isCollapsed" class="brand-name" :title="manifestJson.name">{{ manifestJson.name }}</text>
		</div>
		<div class="header-navigation">
			<el-button class="header-icon" text :aria-label="store.isCollapsed ? '展开菜单' : '收起菜单'" :aria-expanded="!store.isCollapsed" @click="onCollapsed">
				<el-icon><Expand v-if="store.isCollapsed" /><Fold v-else /></el-icon>
			</el-button>
			<el-breadcrumb class="header-breadcrumb">
				<el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">{{ item }}</el-breadcrumb-item>
			</el-breadcrumb>
		</div>
		<div class="header-tools">
			<el-tooltip :content="isDark ? '切换浅色模式' : '切换深色模式'" placement="bottom">
				<el-button class="header-icon" text :aria-label="isDark ? '切换浅色模式' : '切换深色模式'" @click="onDarkMode">
					<el-icon><Sunny v-if="isDark" /><Moon v-else /></el-icon>
				</el-button>
			</el-tooltip>
			<el-tooltip :content="isFullScreen ? '退出全屏' : '进入全屏'" placement="bottom">
				<el-button class="header-icon" text :aria-label="isFullScreen ? '退出全屏' : '进入全屏'" @click="onFullscreen">
					<el-icon><ScaleToOriginal v-if="isFullScreen" /><FullScreen v-else /></el-icon>
				</el-button>
			</el-tooltip>
			<div class="tools-divider" />
			<el-dropdown trigger="click" @command="onUserSelect">
				<button type="button" class="account-trigger" aria-label="账号菜单" :disabled="isLoggingOut">
					<el-avatar :size="32" :src="account.avatarPreview" class="account-avatar"><el-icon><User /></el-icon></el-avatar>
					<span class="account-info">
						<span class="account-name" :title="accountError || displayName">{{ isLoggingOut ? '正在退出…' : displayName }}</span>
						<span v-if="account.username" class="account-username" :title="account.username">{{ account.username }}</span>
					</span>
					<el-icon class="account-arrow"><ArrowDown /></el-icon>
				</button>
				<template #dropdown>
					<el-dropdown-menu>
						<el-dropdown-item v-if="accountError" command="reload-profile">重新加载用户资料</el-dropdown-item>
						<el-dropdown-item command="logout" :icon="SwitchButton" :disabled="isLoggingOut">退出登录</el-dropdown-item>
					</el-dropdown-menu>
				</template>
			</el-dropdown>
		</div>
	</div>
</template>

<script setup>
import { ElAvatar, ElBreadcrumb, ElBreadcrumbItem, ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon, ElTooltip } from 'element-plus';
import 'element-plus/es/components/avatar/style/css.mjs';
import 'element-plus/es/components/breadcrumb/style/css.mjs';
import 'element-plus/es/components/breadcrumb-item/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/dropdown/style/css.mjs';
import 'element-plus/es/components/dropdown-item/style/css.mjs';
import 'element-plus/es/components/dropdown-menu/style/css.mjs';
import 'element-plus/es/components/icon/style/css.mjs';
import 'element-plus/es/components/tooltip/style/css.mjs';

	import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
	import { ArrowDown, ArrowRight, Expand, Fold, User, SwitchButton, FullScreen, ScaleToOriginal, Moon, Sunny } from '@element-plus/icons-vue';
	import pagesJson from '@/pages.json';
	import manifestJson from '@/manifest.json';
	import store from '../common/store.js';
	import { sidebarWidth } from '../common/window-layout.js';
	import { resolveUserAvatars } from '../common/avatar.js';
	import { withSessionHandling, describeRequestError } from '../common/session-errors.js';

	const account = ref({});
	const accountLoading = ref(false);
	const accountError = ref('');
	const displayName = computed(() => account.value.nickname || account.value.username || (accountLoading.value ? '加载中…' : accountError.value ? '资料加载失败' : '当前用户'));
	let accountRequest = 0;
	const loadAccount = async () => {
		const isLogin = store.isLogin;
		const request = ++accountRequest;
		accountError.value = '';
		const uid = isLogin ? uniCloud.getCurrentUserInfo().uid : '';
		if (!uid) {
			account.value = {};
			accountLoading.value = false;
			return;
		}
		accountLoading.value = true;
		if (account.value._id !== uid) account.value = {};
		try {
			const response = await withSessionHandling(() => uniCloud.importObject('uni-id-co', { customUI: true }).getCurrentUserProfile());
			const user = response.data;
			if (request !== accountRequest) return;
			account.value = user || {};
			if (user) {
				const [resolved] = await resolveUserAvatars([user], uniCloud);
				if (request === accountRequest) account.value = resolved;
			}
		} catch (error) {
			if (request === accountRequest) accountError.value = describeRequestError(error, '用户资料加载失败，请重试').message;
			console.warn('当前用户资料加载失败', error);
		} finally {
			if (request === accountRequest) accountLoading.value = false;
		}
	};
	watch(() => [store.isLogin, store.userInfoVersion], loadAccount, { immediate: true });

	const breadcrumbs = computed(() => store.breadcrumbMenu.length ? store.breadcrumbMenu : ['首页']);
	const onCollapsed = () => {
		store.isCollapsed = !store.isCollapsed;
	};
	const isDark = ref(document.documentElement.classList.contains('dark'));
	const onDarkMode = () => {
		isDark.value = document.documentElement.classList.toggle('dark');
	};
	const isFullScreen = ref(false);
	const syncFullscreen = () => {
		isFullScreen.value = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
	};
	const onFullscreen = async () => {
		try {
			if (document.fullscreenElement || document.webkitFullscreenElement) {
				const exit = document.exitFullscreen || document.webkitExitFullscreen;
				await exit.call(document);
			} else {
				const element = document.documentElement;
				const request = element.requestFullscreen || element.webkitRequestFullscreen;
				if (!request) throw new Error('Fullscreen is unavailable');
				await request.call(element);
			}
			syncFullscreen();
		} catch {
			uni.showToast({ title: '暂时无法切换全屏，请重试', icon: 'none' });
		}
	};
	onMounted(() => {
		syncFullscreen();
		document.addEventListener('fullscreenchange', syncFullscreen);
		document.addEventListener('webkitfullscreenchange', syncFullscreen);
	});
	onBeforeUnmount(() => {
		accountRequest++;
		document.removeEventListener('fullscreenchange', syncFullscreen);
		document.removeEventListener('webkitfullscreenchange', syncFullscreen);
	});
	const isLoggingOut = ref(false);
	const onUserSelect = async (command) => {
		if (command === 'reload-profile' && !accountLoading.value) return loadAccount();
		if (command !== 'logout' || isLoggingOut.value) return;
		isLoggingOut.value = true;
		try {
			const currentPages = getCurrentPages();
			const route = currentPages[currentPages.length - 1]?.route || pagesJson.pages[0].path;
			const uniIdCo = uniCloud.importObject('uni-id-co', { errorOptions: { type: 'toast' } });
			await withSessionHandling(() => uniIdCo.logout());
			store.isLogin = false;
			uni.reLaunch({ url: '/uni_modules/ucs-design-admin/pages/login/login?uniIdRedirectUrl=' + encodeURIComponent('/' + route.replace(/^\//, '')) });
		} catch (error) {
			console.error('退出登录失败', error);
		} finally {
			isLoggingOut.value = false;
		}
	};
</script>

<style scoped>
	.admin-header { display: flex; align-items: center; height: 100%; box-sizing: border-box; background: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-light); color: var(--el-text-color-primary); }
	.header-brand { height: 100%; flex-shrink: 0; display: flex; align-items: center; gap: 10px; padding: 0 16px; box-sizing: border-box; overflow: hidden; }
	.header-brand.is-collapsed { padding: 0 16px; }
	.brand-logo { width: 32px; height: 32px; flex-shrink: 0; }
	.brand-name { min-width: 0; font-size: 16px; font-weight: 600; letter-spacing: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.header-navigation { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; padding-left: 16px; }
	.header-breadcrumb { min-width: 0; overflow: hidden; white-space: nowrap; line-height: 20px; }
	.header-breadcrumb :deep(.el-breadcrumb__inner) { font-weight: 400; }
	.header-tools { display: flex; align-items: center; gap: 4px; padding: 0 20px 0 16px; flex-shrink: 0; }
	.header-icon.el-button { width: 36px; height: 36px; padding: 0; margin: 0; border-radius: var(--el-border-radius-base); font-size: 19px; color: var(--el-text-color-regular); }
	.header-icon.el-button:hover { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
	.tools-divider { height: 22px; width: 1px; background: var(--el-border-color-lighter); margin: 0 12px; }
	.account-trigger { display: flex; align-items: center; gap: 10px; height: 42px; margin: 0; padding: 0 6px; background: transparent; border: 0; border-radius: var(--el-border-radius-base); color: var(--el-text-color-regular); font: inherit; cursor: pointer; }
	.account-trigger::after { border: 0; }
	.account-trigger:hover { background: var(--el-fill-color-light); }
	.account-trigger:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
	.account-avatar { color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-size: 18px; }
	.account-info { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; max-width: 160px; gap: 2px; text-align: left; }
	.account-name, .account-username { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.account-name { font-size: 14px; font-weight: 500; line-height: 18px; }
	.account-username { font-size: 12px; line-height: 16px; color: var(--el-text-color-secondary); }
	.account-arrow { font-size: 12px; color: var(--el-text-color-secondary); }
	@media (max-width: 900px) {
		.header-navigation { gap: 10px; padding-left: 10px; }
		.header-tools { padding-right: 12px; padding-left: 8px; }
		.account-info, .tools-divider { display: none; }
	}
</style>
