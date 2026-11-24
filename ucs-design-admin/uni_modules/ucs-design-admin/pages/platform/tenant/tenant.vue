<template>
	<ucs-admin-layout title="租户管理" mode="table" :pagination="pagination" @change="changePage">
		<template #header>
			<el-form class="platform-search" inline @submit.prevent="search">
				<el-form-item>
					<el-input v-model="keyword" :prefix-icon="Search" aria-label="租户号或租户名称" placeholder="请输入租户号或租户名称" maxlength="80" clearable @clear="search" />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
					<el-button @click="reset">重置</el-button>
				</el-form-item>
			</el-form>
		</template>
		<template #button>
			<el-button v-if="auth.create" type="primary" :disabled="busy" @click="openCreate">开通租户</el-button>
			<el-button :icon="Refresh" :loading="loading" :disabled="busy" aria-label="刷新租户" @click="load" />
		</template>
		<div v-loading="loading" class="platform-table">
			<el-alert v-if="error" :title="error" type="error" :closable="false" />
			<el-table :data="rows" row-key="_id" height="100%">
				<template #empty><el-empty :image-size="100" :description="error ? '租户加载失败，请刷新重试' : '暂无符合条件的租户'" /></template>
				<el-table-column prop="tenant_no" label="租户号" min-width="120" align="center" />
				<el-table-column prop="name" label="租户名称" min-width="250" show-overflow-tooltip />
				<el-table-column label="状态" min-width="100" align="center">
					<template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag></template>
				</el-table-column>
				<el-table-column label="操作" width="260" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.type === 'platform'" size="small" type="info">系统平台</el-tag>
						<el-tag v-else-if="row._id === currentTenantId" size="small" type="info">当前租户</el-tag>
						<template v-else-if="row.type === 'enterprise'">
							<el-button v-if="auth.assign" size="small" plain type="primary" :disabled="busy" @click="openAssign(row)">分配产品包</el-button>
							<el-button v-if="auth.status" size="small" plain :type="row.enabled ? 'danger' : 'success'" :disabled="busy" @click="toggle(row)">{{ row.enabled ? '停用' : '启用' }}</el-button>
							<el-button v-if="auth.enter" size="small" plain type="primary" :disabled="busy || !row.enabled || !packageIds(row).length" @click="enter(row)">进入代管</el-button>
						</template>
						<span v-else>—</span>
					</template>
				</el-table-column>
			</el-table>
		</div>
	</ucs-admin-layout>
	<el-dialog v-model="editor" class="admin-form-dialog platform-editor" :title="selected ? '分配产品包' : '开通企业租户'" width="560px" align-center append-to-body
		:close-on-click-modal="false" :show-close="!busy" :close-on-press-escape="!busy">
		<el-form id="platform-tenant-form" label-position="right" label-width="96px" :disabled="busy" @submit.prevent="save">
			<el-form-item v-if="selected" label="产品包">
				<el-select v-model="form.product_package_ids" multiple filterable remote :remote-method="searchPackages"
					:disabled="!packagesReady" :loading="packagesLoading" placeholder="请选择或搜索产品包">
					<el-option v-for="item in packages" :key="item._id" :label="item.name" :value="item._id" />
					<template #footer>
						<el-button size="small" :disabled="packagesLoading || packagePage.current <= 1" @click="loadPackages(packagePage.current - 1)">上一页</el-button>
						<el-button size="small" :disabled="packagesLoading || packagePage.current * packagePage.size >= packagePage.count" @click="loadPackages(packagePage.current + 1)">下一页</el-button>
					</template>
				</el-select>
			</el-form-item>
			<template v-else>
				<el-form-item label="租户号" required><el-input v-model.trim="form.tenant_no" maxlength="5" inputmode="numeric" placeholder="请输入五位数字租户号" /></el-form-item>
				<el-form-item label="企业名称" required><el-input v-model.trim="form.name" maxlength="80" placeholder="请输入企业名称" /></el-form-item>
			</template>
			<el-alert v-if="editorError" :title="editorError" type="error" :closable="false" />
		</el-form>
		<template #footer>
			<el-button :disabled="busy" @click="editor = false">取消</el-button>
			<el-button type="primary" native-type="submit" form="platform-tenant-form" :loading="busy" :disabled="selected && !packagesReady">{{ selected ? '保存' : '开通' }}</el-button>
		</template>
	</el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElAlert, ElButton, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElOption, ElSelect, ElTable, ElTableColumn, ElTag, vLoading } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import '../platform-management.css';
import { allowedMenuRoutes, loadNavigation } from '../../../common/navigation.js';
import { exitDelegation, importTenantAdmin, setDelegation } from '../../../common/tenant-session.js';
import store from '../../../common/store.js';

const api = importTenantAdmin();
const rows = ref([]), packages = ref([]), auth = ref({});
const packagesLoading = ref(false), packagesReady = ref(false);
const packagePage = reactive({ current: 1, size: 20, count: 0 });
let packageKeyword = '';
let packageRequest = 0;
const listedTenantId = ref('');
const currentTenantId = computed(() => store.delegation?.tenant._id || listedTenantId.value);
const keyword = ref('');
const pagination = reactive({ current: 1, size: 20, count: 0 });
let appliedKeyword = '';
let requestId = 0;
const loading = ref(false), busy = ref(false), editor = ref(false), selected = ref(null);
const error = ref(''), editorError = ref('');
const form = reactive({ tenant_no: '', name: '', product_package_ids: [] });
const packageIds = row => Array.isArray(row.product_package_ids) ? row.product_package_ids : [];
const userRoute = '/uni_modules/ucs-design-admin/pages/system/user/user';
const message = e => e?.errMsg || e?.message || '操作失败，请重试';
const resultOf = result => { if (result.errCode) throw result; return result; };

async function load({ current = pagination.current, size = pagination.size } = {}) {
	const id = ++requestId;
	loading.value = true;
	error.value = '';
	try {
		const result = resultOf(await api.listTenants({ keyword: appliedKeyword, current, size }));
		if (id !== requestId) return;
		rows.value = result.data;
		listedTenantId.value = result.currentTenantId;
		Object.assign(pagination, result.pagination);
		auth.value = result.auth;
	} catch (e) {
		if (id === requestId) error.value = message(e);
	} finally {
		if (id === requestId) loading.value = false;
	}
}

function search() {
	appliedKeyword = keyword.value.trim();
	return load({ current: 1 });
}

function reset() {
	keyword.value = '';
	return search();
}

function changePage({ current, size }) {
	return load({ current, size });
}

function openCreate() {
	selected.value = null;
	Object.assign(form, { tenant_no: '', name: '', product_package_ids: [] });
	editorError.value = '';
	editor.value = true;
}

function openAssign(row) {
	selected.value = row;
	form.product_package_ids = [...packageIds(row)];
	packages.value = [];
	packagesReady.value = false;
	packageKeyword = '';
	Object.assign(packagePage, { current: 1, count: 0 });
	editor.value = true;
	void loadPackages();
}

async function loadPackages(current = 1) {
	if (!selected.value || !editor.value) return;
	const id = ++packageRequest;
	packagesLoading.value = true;
	editorError.value = '';
	try {
		const result = resultOf(await api.getProductPackageOptions({ _id: selected.value._id, keyword: packageKeyword, current }));
		if (id !== packageRequest || !editor.value || !selected.value) return;
		const available = new Map([...packages.value, ...result.selected, ...result.data].map(item => [item._id, item]));
		const visible = new Set([...form.product_package_ids, ...result.data.map(item => item._id)]);
		packages.value = [...visible].map(id => available.get(id)).filter(Boolean);
		Object.assign(packagePage, result.pagination);
		packagesReady.value = true;
	} catch (e) {
		if (id === packageRequest && selected.value && editor.value) editorError.value = message(e);
	} finally {
		if (id === packageRequest) packagesLoading.value = false;
	}
}

function searchPackages(value) {
	packageKeyword = value.trim();
	return loadPackages();
}

async function save() {
	if (busy.value || (selected.value && !packagesReady.value)) return;
	busy.value = true;
	editorError.value = '';
	try {
		resultOf(selected.value
			? await api.assignTenantPackage({ _id: selected.value._id, product_package_ids: form.product_package_ids })
			: await api.createTenant({ tenant_no: form.tenant_no, name: form.name }));
		editor.value = false;
		await load();
	} catch (e) { editorError.value = message(e); }
	finally { busy.value = false; }
}

async function toggle(row) {
	if (busy.value) return;
	busy.value = true;
	try {
		if (row.enabled) await ElMessageBox.confirm('停用后，企业人员和代管人员将无法取得新的令牌。已签发令牌有效至原到期时间。', '停用租户', { type: 'warning' });
		resultOf(await api.setTenantStatus({ _id: row._id, enabled: !row.enabled }));
		await load();
	} catch (e) {
		if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e));
	} finally { busy.value = false; }
}

async function enter(row) {
	if (busy.value) return;
	busy.value = true;
	try {
		const delegation = resultOf(await api.enterTenantManagement({ _id: row._id }));
		setDelegation(delegation);
		try {
			const navigation = resultOf(await loadNavigation());
			const routes = allowedMenuRoutes(navigation.data, 'pages/needLogin/index/index');
			const url = routes.includes(userRoute) ? userRoute : routes[0];
			if (!url) throw new Error('该租户的产品包没有可访问的页面');
			uni.redirectTo({ url });
		} catch (e) {
			await exitDelegation();
			throw e;
		}
	} catch (e) { ElMessage.error(message(e)); }
	finally { busy.value = false; }
}

onMounted(load);
</script>
