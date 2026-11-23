<template>
	<div ref="layoutRef" class="admin-layout" :class="{ 'admin-layout--table': mode === 'table' }">
		<ucs-admin-delegation v-if="store.delegation" class="layout-delegation" />
		<div v-if="accessLoading" class="layout-access-state"><el-skeleton :rows="5" animated /></div>
		<el-result v-else-if="!pageAllowed" :icon="accessError && accessErrorKind === 'request' ? 'error' : 'warning'" :title="accessErrorKind === 'session' ? '登录已失效' : accessErrorKind === 'permission' ? '无权访问' : accessError ? '菜单权限加载失败' : '暂无此页面的访问权限'" :sub-title="accessError || '请联系管理员分配菜单权限'">
			<template #extra>
				<el-button v-if="accessError" @click="checkPageAccess(true)">重试</el-button>
				<el-button v-else-if="firstAllowedRoute" type="primary" @click="goToAllowedPage">前往可访问页面</el-button>
			</template>
		</el-result>
		<template v-else>
		<div class="layout-header" :class="{ 'layout-header--custom': $slots.header }">
			<div v-if="$slots.header" class="layout-header-main">
				<slot name="header" />
			</div>
			<text v-else class="layout-title">{{ title || store.breadcrumbMenu[store.breadcrumbMenu.length - 1] || '首页' }}</text>
			<div v-if="$slots.button" class="layout-actions">
				<slot name="button" />
			</div>
		</div>

		<div v-if="mode === 'table'" class="layout-panel layout-table">
			<div class="layout-table-body">
				<slot />
			</div>
			<div class="layout-pagination">
				<el-pagination
					background
					:page-sizes="pageSizes"
					:page-size="paginationOptions.size"
					:current-page="paginationOptions.current"
					:total="paginationOptions.count"
					:pager-count="5"
					layout="total, sizes, prev, pager, next, jumper"
					@update:current-page="onPageChange"
					@update:page-size="onPageSizeChange"
				/>
			</div>
		</div>
		<div v-else-if="mode === 'card'" class="layout-panel layout-card" :class="{ 'layout-card--padded': padding }">
			<slot />
		</div>
		<div v-else class="layout-content">
			<slot />
		</div>
		</template>
	</div>
</template>

<script setup>
import { ElButton, ElPagination, ElResult, ElSkeleton } from 'element-plus';
import UcsAdminDelegation from '../ucs-admin-delegation/ucs-admin-delegation.vue';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/pagination/style/css.mjs';
import 'element-plus/es/components/result/style/css.mjs';
import 'element-plus/es/components/skeleton/style/css.mjs';

	import { nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	import store from '../../common/store.js';
	import pagesJson from '@/pages.json';
	import { loadNavigation, normalizeMenuRoute, allowedMenuRoutes } from '../../common/navigation.js';
	import { describeRequestError } from '../../common/session-errors.js';
	const accessLoading = ref(true), pageAllowed = ref(false), accessError = ref(''), accessErrorKind = ref(''), firstAllowedRoute = ref('');
	const goToAllowedPage = () => uni.redirectTo({ url: firstAllowedRoute.value });
	let accessRequestId = 0;
	async function checkPageAccess(force = false, preserveAllowedPage = false) {
		const id = ++accessRequestId;
		// 窗口重新显示时复查权限，但不要卸载已授权页面和其中打开的弹窗。
		const keepContent = preserveAllowedPage && pageAllowed.value && !accessLoading.value;
		if (!keepContent) {
			accessLoading.value = true;
			pageAllowed.value = false;
		}
		accessError.value = '';
		accessErrorKind.value = '';
		try {
			const result = await loadNavigation(force);
			if (id !== accessRequestId) return;
			const home = pagesJson.pages[0].path;
			const pages = getCurrentPages();
			const route = normalizeMenuRoute(pages[pages.length - 1]?.route || '', home);
			const routes = allowedMenuRoutes(result.data || [], home);
			firstAllowedRoute.value = routes[0] || '';
			pageAllowed.value = result.isAdmin || routes.includes(route);
		} catch (error) {
			if (id === accessRequestId) {
				pageAllowed.value = false;
				const failure = describeRequestError(error, '菜单权限加载失败，请重试');
				accessError.value = failure.message;
				accessErrorKind.value = failure.kind;
			}
		} finally {
			if (id === accessRequestId) accessLoading.value = false;
		}
	}
	watch(() => [store.isLogin, store.menuVersion], () => checkPageAccess(), { immediate: true });
	onShow(() => checkPageAccess(false, true));
	onBeforeUnmount(() => { accessRequestId++; });

	const emit = defineEmits(['change']);
	const props = defineProps({
		mode: { type: String, default: '' },
		title: { type: String, default: '' },
		padding: { type: Boolean, default: true },
		total: { type: Number, default: 0 },
		pageSizes: { type: Array, default: () => [20, 40, 60, 80, 100] },
		pagination: { type: Object, default: () => ({ current: 1, size: 20 }) }
	});

	const layoutRef = ref(null);
	const paginationOptions = reactive({ current: 1, size: 20, count: 0 });
	watch(
		() => [props.pagination.current, props.pagination.size, props.pagination.count, props.total],
		([current, size, count, total]) => {
			Object.assign(paginationOptions, {
				current: current ?? 1,
				size: size ?? 20,
				count: count ?? total
			});
		},
		{ immediate: true }
	);

	// 仅滚动当前布局内的表格，避免影响其他页面或弹窗中的表格。
	const scrollToTop = () => {
		const root = layoutRef.value?.$el || layoutRef.value;
		const scroller = root?.querySelector('.layout-table-body .el-table__body-wrapper .el-scrollbar__wrap');
		if (scroller) scroller.scrollTop = 0;
	};

	let changePending = false;
	let resettingPage = false;
	const notifyPaginationChange = () => {
		if (changePending) return;
		changePending = true;
		// 修改每页条数可能同时触发页码校正，合并为一次完整的分页通知。
		nextTick(() => {
			changePending = false;
			resettingPage = false;
			emit('change', { ...paginationOptions });
			scrollToTop();
		});
	};
	const onPageChange = (current) => {
		if (resettingPage || current === paginationOptions.current) return;
		paginationOptions.current = current;
		notifyPaginationChange();
	};
	const onPageSizeChange = (size) => {
		if (size === paginationOptions.size) return;
		resettingPage = true;
		paginationOptions.size = size;
		paginationOptions.current = 1;
		notifyPaginationChange();
	};
</script>

<style scoped>
	.layout-delegation {
		justify-content: space-between;
		flex-shrink: 0;
		padding: 6px 12px;
		background: var(--el-bg-color);
		border-bottom: 1px solid var(--el-border-color-light);
	}
	:global(uni-layout.uni-app--showtopwindow .layout-delegation) {
		display: none;
	}
	.layout-access-state { padding: 32px 16px; }
	.admin-layout :deep(table) {
		user-select: text;
	}
	.admin-layout {
		--admin-table-header-height: 44px;
		--admin-table-row-height: 64px;
		--admin-table-cell-padding: 8px 0;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: calc(100vh - var(--top-window-height, 56px));
		padding: 16px 0 0 16px;
		box-sizing: border-box;
		background: var(--el-fill-color-light);
		color: var(--el-text-color-primary);
	}
	.admin-layout--table {
		height: calc(100vh - var(--top-window-height, 56px));
		height: calc(100dvh - var(--top-window-height, 56px));
		min-height: 0;
	}
	.layout-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		flex-shrink: 0;
		min-height: 64px;
		gap: 12px 16px;
		padding: 16px;
		box-sizing: border-box;
		background: var(--el-bg-color);
		margin-top: 0;
		border-top: 1px solid var(--el-border-color-light);
		border-left: 1px solid var(--el-border-color-light);
		border-right: 1px solid var(--el-border-color-light);
	}
	.layout-title {
		min-width: 0;
		font-size: 16px;
		font-weight: 600;
		line-height: 24px;
		overflow-wrap: anywhere;
	}
	.layout-header--custom { align-items: center; }
	.layout-header-main { flex: 1 1 max-content; min-width: 0; max-width: 100%; }
	.layout-header-main:empty { display: none; }
	.layout-header-main > :deep(.el-form.el-form--inline) {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}
	.layout-header-main > :deep(.el-form--inline > .el-form-item) { margin: 0; }
	.layout-header-main > :deep(.el-form--inline .el-button + .el-button) { margin-left: 8px; }
	.layout-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		min-width: 0;
		margin-left: auto;
		gap: 8px;
		flex-wrap: wrap;
	}
	.layout-panel {
		min-width: 0;
		background: var(--el-bg-color);
		border: 1px solid var(--el-border-color-light);
		box-sizing: border-box;
	}
	.layout-card, .layout-content { flex: 1; min-width: 0; }
	.layout-card--padded { padding: 20px; }
	.layout-table {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
	.layout-table-body {
		flex: 1;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}
	/* unicloud-db 渲染为一层 view，使其向表格传递可用高度。 */
	.layout-table-body :deep(> uni-view),
	.layout-table-body :deep(> view) { height: 100%; min-height: 0; }
	.layout-table-body :deep(.el-table) {
		--el-table-header-bg-color: var(--el-fill-color-light);
		--el-table-header-text-color: var(--el-text-color-regular);
		--el-table-border-color: var(--el-border-color-lighter);
	}
	.layout-table-body :deep(.el-table th.el-table__cell) { height: var(--admin-table-header-height); padding: 8px 0; font-weight: 500; }
	.layout-table-body :deep(.el-table td.el-table__cell) { height: var(--admin-table-row-height); padding: var(--admin-table-cell-padding); box-sizing: border-box; }
	.layout-pagination {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-shrink: 0;
		min-height: 64px;
		padding: 16px;
		box-sizing: border-box;
		border-top: 1px solid var(--el-border-color-lighter);
		overflow-x: auto;
	}
	.layout-pagination :deep(.el-pagination) { margin-left: auto; }
	.layout-actions :deep(.el-button + .el-button) { margin-left: 0; }
	@media (max-width: 1100px) {
		.admin-layout { padding: 12px 0 0 12px; }
		.layout-header { padding: 12px; gap: 12px; }
	}
	@media (max-width: 600px) {
		.admin-layout { padding: 8px 0 0 8px; }
		.layout-pagination { padding: 12px 8px; }
	}
	:global(uni-layout:not(.uni-app--showleftwindow):not(.uni-app--showtopwindow) .admin-layout) {
		padding: 0;
	}
</style>
