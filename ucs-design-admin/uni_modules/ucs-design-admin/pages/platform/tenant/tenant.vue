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
				<el-table-column label="到期日期" min-width="140" align="center">
					<template #default="{ row }">{{ expiryDate(row) || '长期有效' }}</template>
				</el-table-column>
				<el-table-column label="状态" min-width="100" align="center">
					<template #default="{ row }">
						<el-tag v-if="!row.enabled" type="info">停用</el-tag>
						<el-tag v-else-if="isExpired(row)" type="warning">已到期</el-tag>
						<el-tag v-else type="success">启用</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" :width="auth.update ? 320 : 260" align="center">
					<template #default="{ row }">
						<template v-if="row.type === 'platform'">
							<el-tag class="platform-tag" size="small" type="info">系统平台</el-tag>
							<el-button v-if="auth.update" size="small" plain :disabled="busy" @click="openEdit(row)">编辑</el-button>
						</template>
						<el-tag v-else-if="row._id === currentTenantId" size="small" type="info">当前租户</el-tag>
						<template v-else-if="row.type === 'enterprise'">
							<el-button v-if="auth.update" size="small" plain :disabled="busy" @click="openEdit(row)">编辑</el-button>
							<el-button v-if="auth.update" size="small" plain type="primary" :disabled="busy" @click="openAssign(row)">分配产品包</el-button>
							<el-button v-if="auth.update" size="small" plain :type="row.enabled ? 'danger' : 'success'" :disabled="busy" @click="toggle(row)">{{ row.enabled ? '停用' : '启用' }}</el-button>
							<el-button v-if="auth.enter" size="small" plain type="primary" :disabled="busy || !row.enabled || isExpired(row) || !packageIds(row).length" @click="enter(row)">进入代管</el-button>
						</template>
						<span v-else>—</span>
					</template>
				</el-table-column>
			</el-table>
		</div>
	</ucs-admin-layout>
	<el-dialog v-model="editor" class="admin-form-dialog platform-editor" :title="editingPlatform ? '编辑系统平台' : editorTitles[editorMode]" width="560px" align-center append-to-body
		:close-on-click-modal="false" :show-close="!busy && !logoUploading" :close-on-press-escape="!busy && !logoUploading">
		<el-form id="platform-tenant-form" label-position="right" label-width="96px" :disabled="busy || logoUploading" @submit.prevent="save">
			<el-form-item v-if="editorMode === 'assign'" label="产品包">
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
				<template v-if="editorMode === 'create'">
					<el-form-item label="租户号" required><el-input v-model.trim="form.tenant_no" maxlength="5" inputmode="numeric" placeholder="请输入五位数字租户号" /></el-form-item>
					<el-form-item label="企业名称" required><el-input v-model.trim="form.name" maxlength="80" placeholder="请输入企业名称" /></el-form-item>
				</template>
				<template v-else>
					<el-form-item label="租户号">{{ selected?.tenant_no }}</el-form-item>
					<el-form-item label="租户名称" required><el-input v-model.trim="form.name" maxlength="80" placeholder="请输入租户名称" /></el-form-item>
				</template>
				<el-form-item label="系统名称">
					<el-input v-model.trim="form.system_name" maxlength="50" show-word-limit :placeholder="editingPlatform ? '留空使用内置系统名称' : '留空使用平台默认名称'" />
				</el-form-item>
				<el-form-item label="系统 Logo">
					<ucs-admin-image-upload v-if="editor" v-model="form.system_logo" label="Logo" directory="tenant-logos" :disabled="busy"
						@uploading-change="logoUploading = $event" @error="editorError = $event" />
				</el-form-item>
				<el-form-item label="主题色">
					<el-popover v-if="editor" placement="bottom-start" trigger="click" width="max-content"
						:popper-style="{ padding: 0 }" :disabled="busy || logoUploading">
						<template #reference>
						<el-button aria-label="选择租户主题色">
								<span class="theme-selection">
									<span class="theme-swatch" :style="{ backgroundColor: themePickerColor }" aria-hidden="true" />
									<span>{{ themeLabel }}</span>
								</span>
							</el-button>
						</template>
						<el-color-picker-panel v-model="themePickerColor" color-format="hex" :predefine="predefinedThemeColors"
							:border="false" :disabled="busy || logoUploading">
							<template #footer>
								<el-button link :disabled="!form.theme_color || busy || logoUploading" @click="form.theme_color = ''">
									{{ editingPlatform ? '恢复内置默认' : '恢复平台默认' }}
								</el-button>
							</template>
						</el-color-picker-panel>
					</el-popover>
				</el-form-item>
				<el-form-item v-if="!editingPlatform" label="到期日期">
					<el-date-picker v-model="form.expires_on" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" placeholder="长期有效" clearable />
					<div class="expiry-hint">留空表示长期有效，所选日期当天仍可使用（北京时间）。</div>
				</el-form-item>
			</template>
			<el-alert v-if="editorError" :title="editorError" type="error" :closable="false" />
		</el-form>
		<template #footer>
			<el-button :disabled="busy || logoUploading" @click="editor = false">取消</el-button>
			<el-button type="primary" native-type="submit" form="platform-tenant-form" :loading="busy" :disabled="logoUploading || (editorMode === 'assign' && !packagesReady)">{{ editorMode === 'create' ? '开通' : '保存' }}</el-button>
		</template>
	</el-dialog>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElAlert, ElButton, ElColorPickerPanel, ElDatePicker, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElOption, ElPopover, ElSelect, ElTable, ElTableColumn, ElTag, vLoading } from 'element-plus';
import 'element-plus/es/components/color-picker-panel/style/css.mjs';
import 'element-plus/es/components/date-picker/style/css.mjs';
import 'element-plus/es/components/popover/style/css.mjs';
import { Refresh, Search } from '@element-plus/icons-vue';
import UcsAdminImageUpload from '../../../components/ucs-admin-image-upload/ucs-admin-image-upload.vue';
import '../platform-management.css';
import { allowedMenuRoutes, loadNavigation } from '../../../common/navigation.js';
import { exitDelegation, importTenantAdmin, setDelegation } from '../../../common/tenant-session.js';
import { defaultTenantThemeColor, normalizeTenantThemeColor, tenantThemeOptions } from '../../../common/tenant-theme.js';
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
const editorMode = ref('create');
const editingPlatform = computed(() => editorMode.value === 'edit' && selected.value?.type === 'platform');
const editorTitles = { create: '开通企业租户', edit: '编辑租户', assign: '分配产品包' };
const form = reactive({ tenant_no: '', name: '', product_package_ids: [], expires_on: '', system_name: '', system_logo: '', theme_color: '' });
const platformThemeColor = ref('');
const predefinedThemeColors = tenantThemeOptions.map(option => option.value);
const themePickerColor = computed({
	get: () => form.theme_color || (!editingPlatform.value && platformThemeColor.value) || defaultTenantThemeColor,
	set: value => { form.theme_color = normalizeTenantThemeColor(value); }
});
const themeLabel = computed(() =>
	tenantThemeOptions.find(option => option.value === form.theme_color)?.label || form.theme_color ||
	(editingPlatform.value ? '内置默认' : '平台默认')
);
const logoUploading = ref(false);
const now = ref(Date.now());
let clock;
const hasExpiry = row => row.type === 'enterprise' && Number.isFinite(row.expires_at);
const isExpired = row => hasExpiry(row) && row.expires_at <= now.value;
const expiryDate = row => hasExpiry(row) ? new Date(row.expires_at + 8 * 3600000 - 1).toISOString().slice(0, 10) : '';
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
		platformThemeColor.value = normalizeTenantThemeColor(result.platform_theme_color);
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
	editorMode.value = 'create';
	selected.value = null;
	Object.assign(form, { tenant_no: '', name: '', expires_on: '', system_name: '', system_logo: '', theme_color: '' });
	editorError.value = '';
	editor.value = true;
}

function openEdit(row) {
	editorMode.value = 'edit';
	selected.value = row;
	Object.assign(form, {
		name: row.name, expires_on: expiryDate(row), system_name: row.system_name || '', system_logo: row.system_logo || '',
		theme_color: normalizeTenantThemeColor(row.theme_color)
	});
	editorError.value = '';
	editor.value = true;
}

function openAssign(row) {
	editorMode.value = 'assign';
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
	if (editorMode.value !== 'assign' || !editor.value) return;
	const id = ++packageRequest;
	packagesLoading.value = true;
	editorError.value = '';
	try {
		const result = resultOf(await api.getProductPackageOptions({ _id: selected.value._id, keyword: packageKeyword, current }));
		if (id !== packageRequest || !editor.value || editorMode.value !== 'assign') return;
		const available = new Map([...packages.value, ...result.selected, ...result.data].map(item => [item._id, item]));
		const visible = new Set([...form.product_package_ids, ...result.data.map(item => item._id)]);
		packages.value = [...visible].map(id => available.get(id)).filter(Boolean);
		Object.assign(packagePage, result.pagination);
		packagesReady.value = true;
	} catch (e) {
		if (id === packageRequest && editorMode.value === 'assign' && editor.value) editorError.value = message(e);
	} finally {
		if (id === packageRequest) packagesLoading.value = false;
	}
}

function searchPackages(value) {
	packageKeyword = value.trim();
	return loadPackages();
}

async function save() {
	if (busy.value || logoUploading.value || (editorMode.value === 'assign' && !packagesReady.value)) return;
	busy.value = true;
	editorError.value = '';
	try {
		const expires_on = form.expires_on || null;
		const { system_name, system_logo, theme_color } = form;
		if (editorMode.value === 'edit') {
			const _id = selected.value._id;
			const isPlatform = editingPlatform.value;
			const result = resultOf(await api.updateTenant({ _id, name: form.name, ...(!isPlatform ? { expires_on } : {}), system_name, system_logo, theme_color }));
			rows.value = rows.value.map(row => row._id === _id ? {
				...row, name: result.name, ...(!isPlatform ? { expires_at: result.expires_at } : {}), system_name: result.system_name,
				system_logo: result.system_logo, theme_color: result.theme_color
			} : row);
			now.value = Date.now();
			editor.value = false;
			if (isPlatform) {
				platformThemeColor.value = result.theme_color;
				store.tenantBrandVersion++;
			}
			ElMessage.success(isPlatform ? '系统平台已更新' : '租户已更新');
			return;
		}
		if (editorMode.value === 'assign') {
			resultOf(await api.assignTenantPackage({ _id: selected.value._id, product_package_ids: form.product_package_ids }));
		} else {
			resultOf(await api.createTenant({ tenant_no: form.tenant_no, name: form.name, expires_on, system_name, system_logo, theme_color }));
		}
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

onMounted(() => {
	void load();
	clock = setInterval(() => { now.value = Date.now(); }, 30000);
});
onUnmounted(() => clearInterval(clock));
</script>

<style scoped>
.platform-tag + .el-button { margin-left: 8px; }
.theme-selection {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}
.theme-swatch {
	width: 16px;
	height: 16px;
	border: 1px solid var(--el-border-color);
	border-radius: 4px;
}
.expiry-hint {
	width: 100%;
	margin-top: 8px;
	color: var(--el-text-color-secondary);
	font-size: 12px;
	line-height: 1.5;
}
</style>
