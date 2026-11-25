<template>
	<ucs-admin-layout title="工作台" mode="card">
		<div class="workspace" aria-labelledby="workspace-title">
			<h1 id="workspace-title">常用入口</h1>
			<el-skeleton v-if="loading" :rows="3" animated />
			<el-alert v-else-if="error" :title="error" type="error" :closable="false" show-icon>
				<el-button size="small" @click="load">重试</el-button>
			</el-alert>
			<p v-else-if="!links.length" class="workspace-empty">当前暂无可用的管理入口。</p>
			<div v-else class="workspace-links">
				<a v-for="link in links" :key="link.menu_id" :href="'#' + link.route" @click.prevent="open(link.route)">
					{{ link.name }}
					<el-icon aria-hidden="true"><ArrowRight /></el-icon>
				</a>
			</div>
		</div>
	</ucs-admin-layout>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElAlert, ElButton, ElIcon, ElSkeleton } from 'element-plus';
import { ArrowRight } from '@element-plus/icons-vue';
import 'element-plus/es/components/alert/style/css.mjs';
import UcsAdminLayout from '../../../uni_modules/ucs-design-admin/components/ucs-admin-layout/ucs-admin-layout.vue';
import { loadNavigation, normalizeMenuRoute } from '../../../uni_modules/ucs-design-admin/common/navigation.js';
import store from '../../../uni_modules/ucs-design-admin/common/store.js';

const home = '/pages/needLogin/index/index';
const links = ref([]), loading = ref(true), error = ref('');
let requestId = 0;
function pages(tree) {
	return tree.flatMap(item => item.menu_type === 1 && item.url?.startsWith('/')
		? [{ ...item, route: normalizeMenuRoute(item.url, home) }]
		: pages(item.children || []));
}
async function load() {
	const id = ++requestId;
	loading.value = true;
	error.value = '';
	links.value = [];
	try {
		const result = await loadNavigation();
		if (id === requestId) links.value = pages(result.data || [])
			.filter(item => item.route !== home && item.route !== '/pages/noLogin/test/test');
	} catch (e) {
		if (id === requestId) error.value = e?.errMsg || '管理入口加载失败';
	} finally {
		if (id === requestId) loading.value = false;
	}
}
function open(url) { uni.redirectTo({ url }); }
watch(() => store.menuVersion, load, { immediate: true });
</script>

<style scoped>
.workspace { max-width: 960px; margin: 0 auto; padding: 12px 0; }
.workspace h1 { margin: 0 0 20px; font-size: 20px; line-height: 28px; }
.workspace-empty { color: var(--el-text-color-secondary); }
.workspace-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: 12px; }
.workspace-links a {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	min-width: 0;
	padding: 14px 16px;
	border: 1px solid var(--el-border-color);
	border-radius: 8px;
	color: var(--el-text-color-primary);
	text-decoration: none;
}
.workspace-links a:hover, .workspace-links a:focus-visible {
	background: var(--el-color-primary-light-9);
	border-color: var(--el-color-primary);
	color: var(--el-color-primary);
}
</style>
