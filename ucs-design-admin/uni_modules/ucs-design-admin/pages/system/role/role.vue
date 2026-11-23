<template>
	<ucs-admin-layout class="role-layout" title="角色管理" mode="card" :padding="false">
		<template #header>
			<el-form class="role-search" @submit.prevent="search">
				<el-input
					v-model="keyword"
					:prefix-icon="Search"
					placeholder="角色名称或角色标识"
					aria-label="角色名称或角色标识"
					maxlength="100"
					clearable
					@clear="resetSearch"
				/>
				<el-button type="primary" native-type="submit">查询</el-button>
				<el-button @click="resetSearch">重置</el-button>
			</el-form>
		</template>
		<template #button>
			<el-button v-if="auth.create" type="primary" :disabled="saving || loading" @click="edit()">
				新增角色
			</el-button>
			<el-button :icon="Refresh" :loading="loading" :disabled="saving" aria-label="刷新角色" @click="load" />
		</template>
		<el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
		<el-table
			class="role-table"
            height="100%"
			v-loading="loading"
			:data="filteredRows"
			row-key="role_id"
		>
			<template #empty>
				<el-empty :image-size="100" :description="error ? '加载失败，请刷新重试' : appliedKeyword ? '暂无符合条件的角色' : '暂无角色'" />
			</template>
			<el-table-column type="index" label="序号" width="64" align="center" />
			<el-table-column prop="role_name" label="角色名称" min-width="180" align="center" />
			<el-table-column prop="role_id" label="角色标识" min-width="180" align="center" show-overflow-tooltip />
			<el-table-column label="授权权限" min-width="140" align="center">
				<template #default="{ row }">
					<el-tag :type="row.role_id === 'admin' ? 'warning' : 'primary'">
						{{ row.role_id === 'admin' ? '全部权限' : (row.permission?.length || 0) + ' 项权限' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column prop="comment" label="描述" min-width="220" align="center" show-overflow-tooltip />
			<el-table-column label="操作" width="250" align="center" fixed="right">
				<template #default="{ row }">
					<div class="role-actions">
						<span v-if="row.role_id === 'admin'" class="muted">系统内置</span>
						<template v-else>
							<el-button
								v-if="auth.update"
								type="primary"
								plain
								size="small"
								:disabled="saving || loading || !manageable(row)"
								@click="edit(row)"
							>
								编辑
							</el-button>
							<el-button type="warning" plain size="small" :disabled="saving || loading" @click="editPermissions(row)">
								菜单权限
							</el-button>
							<el-button
								v-if="auth.delete"
								type="danger"
								plain
								size="small"
								:disabled="saving || loading || !manageable(row)"
								@click="remove(row)"
							>
								删除
							</el-button>
							<el-button v-if="!auth.update" plain size="small" :disabled="saving || loading" @click="edit(row, true)">
								查看
							</el-button>
						</template>
					</div>
				</template>
			</el-table-column>
		</el-table>
	</ucs-admin-layout>
	<el-dialog
		v-model="visible"
		:title="
			permissionMode ? `菜单权限 · ${form.role_name}` : readOnly ? '查看角色' : form._id ? '编辑角色' : '新增角色'
		"
		:width="permissionMode ? '760px' : '580px'"
		align-center
		append-to-body
		destroy-on-close
		class="role-editor admin-form-dialog"
		modal-class="role-editor-overlay"
		:close-on-click-modal="false"
		:show-close="!saving"
		:close-on-press-escape="!saving"
	>
		<el-alert v-if="saveError" :title="saveError" type="error" show-icon :closable="false" class="save-error" />
		<el-form
			ref="formRef"
			:model="form"
			:rules="rules"
			:disabled="saving || readOnly"
			label-width="100px"
			label-position="right"
			@submit.prevent="save"
		>
			<template v-if="!permissionMode">
				<el-form-item label="角色名称" prop="role_name">
					<el-input v-model="form.role_name" maxlength="80" />
				</el-form-item>
				<el-form-item label="角色标识" prop="role_id">
					<el-input v-model="form.role_id" maxlength="100" :disabled="!!form._id" placeholder="创建后不可修改" />
				</el-form-item>
				<el-form-item label="描述">
					<el-input v-model="form.comment" type="textarea" :rows="2" maxlength="500" show-word-limit />
				</el-form-item>
			</template>
			<el-form-item v-else label-width="0">
				<div class="permission-field">
					<text class="hint">
						勾选目录或页面仅授予页面访问；操作权限需单独勾选。取消页面会同时取消其操作权限。
					</text>
					<el-tree
						v-loading="treeLoading"
						element-loading-text="加载中…"
						:aria-busy="treeLoading"
						:key="treeVersion"
						ref="treeRef"
						:data="permissionTree"
						node-key="key"
						:props="{ label: 'label', children: 'children', disabled: nodeDisabled }"
						show-checkbox
						check-strictly
						:expand-on-click-node="false"
						:empty-text="treeLoading ? '' : treeError ? '加载失败，请重试' : '暂无菜单，请先在菜单管理中添加'"
						class="authorization-tree"
						@check="onAuthorizationCheck"
					>
						<template #default="{ data }">
							<span class="tree-node">
								<span>{{ data.label }}</span>
								<small v-if="data.permission_id">{{ data.permission_id }}</small>
							</span>
						</template>
					</el-tree>
					<el-button v-if="treeError" :disabled="treeLoading" @click="loadAuthorization">加载失败，点击重试</el-button>
				</div>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button :disabled="saving" @click="visible = false">{{ readOnly ? '关闭' : '取消' }}</el-button>
			<el-button v-if="!readOnly" type="primary" :loading="saving" :disabled="treeLoading || !!treeError" @click="save">保存</el-button>
		</template>
	</el-dialog>
</template>
<script setup>
import { importTenantAdmin } from '../../../common/tenant-session.js';
import '../../../common/form-dialog.css';
import { ElAlert, ElButton, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElTable, ElTableColumn, ElTag, ElTree, vLoading } from 'element-plus';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/table-column/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/tree/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import 'element-plus/es/components/message-box/style/css.mjs';

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import { menuTree } from '../../../common/menu.js';
import store from '../../../common/store.js';
function authorizationTree(menus, permissions, auth = { isAdmin: true, permission: [] }) {
	const grouped = new Map();
	const menuIds = new Set(menus.map((menu) => menu.menu_id));
	for (const permission of [...permissions].sort(
		(a, b) => (a.sort || 0) - (b.sort || 0) || a.permission_id.localeCompare(b.permission_id)
	)) {
		const id = menuIds.has(permission.menu_id) ? permission.menu_id : '';
		if (!grouped.has(id)) grouped.set(id, []);
		grouped.get(id).push({
			key: 'permission:' + permission.permission_id,
			label: permission.permission_name,
			permission_id: permission.permission_id,
			isLeaf: true,
			ownerMenu: id,
			disabled: !auth.isAdmin && (!auth.permission?.includes(permission.permission_id) || (id && !auth.menu_ids?.includes(id)))
		});
	}
	const visit = (nodes) =>
		nodes
			.map((menu) => ({
				key: 'menu:' + menu.menu_id,
				menu_id: menu.menu_id,
				isPage: menu.menu_type === 1,
				label: menu.name,
				disabled: menu.menu_type === 1 && !auth.isAdmin && !auth.menu_ids?.includes(menu.menu_id),
				children: [...visit(menu.children), ...(grouped.get(menu.menu_id) || [])]
			}));
	const result = visit(menuTree(menus));
	if (grouped.has(''))
		result.push({ key: 'group:invalid', label: '归属异常权限（需修正所属页面）', children: grouped.get('') });
	return result;
}
const permissionKeys = (keys) =>
	keys.filter((key) => key.startsWith('permission:')).map((key) => key.slice('permission:'.length));

const api = importTenantAdmin();
const rows = ref([]),
	menus = ref([]),
	permissions = ref([]),
	auth = ref({}),
	loading = ref(false),
	saving = ref(false),
	error = ref(''),
	saveError = ref(''),
	visible = ref(false),
	readOnly = ref(false),
	permissionMode = ref(false),
	formRef = ref(),
	treeRef = ref();
const keyword = ref('');
const appliedKeyword = ref('');
const filteredRows = computed(() => {
	const query = appliedKeyword.value;
	if (!query) return rows.value;
	return rows.value.filter((row) =>
		[row.role_name, row.role_id].some((value) => value?.toLowerCase().includes(query))
	);
});
function search() {
	appliedKeyword.value = keyword.value.trim().toLowerCase();
}
function resetSearch() {
	keyword.value = '';
	search();
}
const empty = () => ({ _id: '', role_id: '', role_name: '', comment: '', menu_ids: [], permission: [] });
const form = reactive(empty());
const manageable = (row) =>
	auth.value.isAdmin || ((row.permission || []).every((id) => auth.value.permission?.includes(id)) && (row.menu_ids || []).every(id => auth.value.menu_ids?.includes(id)));
const missingPermissions = ref([]);
const treeVersion = ref(0), treeLoading = ref(false), treeError = ref('');
let treeEpoch = 0;
const permissionTree = computed(() => {
	const tree = authorizationTree(menus.value, permissions.value, auth.value);
	const missing = missingPermissions.value;
	if (missing.length)
		tree.push({
			key: 'group:missing',
			label: '失效权限（请取消勾选）',
			children: missing.map((id) => ({ key: 'permission:' + id, label: id, permission_id: id }))
		});
	return tree;
});
const nodeDisabled = (node) => saving.value || treeLoading.value || readOnly.value || node.disabled;
const rules = {
	role_name: [{ required: true, whitespace: true, message: '请输入角色名称', trigger: 'blur' }],
	role_id: [
		{ required: true, pattern: /^[A-Za-z0-9][A-Za-z0-9_:-]*$/, message: '请输入有效的角色标识', trigger: 'blur' }
	]
};
const message = (e) => e?.errMsg || e?.message || '操作失败，请重试';
const call = async (name, params) => {
	const result = await api[name](params);
	if (result.errCode) throw result;
	return result;
};
let version = 0;
async function load() {
	const id = ++version;
	loading.value = true;
	error.value = '';
	try {
		const result = await call('listRoles');
		if (id !== version) return;
		rows.value = [
			{ role_id: 'admin', role_name: '超级管理员', comment: '拥有全部权限，系统内置角色' },
			...result.data.filter((row) => row.role_id !== 'admin')
		];
		auth.value = result.auth;
	} catch (e) {
		if (id === version) {
			error.value = message(e);
			rows.value = [];
			auth.value = {};
		}
	} finally {
		if (id === version) loading.value = false;
	}
}
async function edit(row, viewOnly = false, permissionsOnly = false) {
	permissionMode.value = permissionsOnly;
	treeEpoch++;
	treeVersion.value++;
	menus.value = [];
	permissions.value = [];
	missingPermissions.value = [];
	treeLoading.value = permissionsOnly;
	treeError.value = '';
	readOnly.value = viewOnly;
	Object.assign(form, empty(), row ? { ...row, menu_ids: [...(row.menu_ids || [])], permission: [...(row.permission || [])] } : {});
	saveError.value = '';
	visible.value = true;
	if (permissionsOnly) loadAuthorization();
	await nextTick();
	formRef.value?.clearValidate();
	refreshTreeChecks();
}
function editPermissions(row) {
	return edit(row, !auth.value.update || !manageable(row), true);
}
watch(visible, value => { if (!value) treeEpoch++; });
function mergeAuthorization(result) {
	menus.value = result.menus;
	permissions.value = result.permissions;
	// Older grants can contain actions without their newly introduced page selection.
	// Normalize the editor draft using the same action-to-page linkage as a manual check.
	const menuIds = new Set(form.menu_ids), permissionIds = new Set(form.permission);
	for (const permission of permissions.value) {
		if (!permissionIds.has(permission.permission_id)) continue;
		const menu = menus.value.find(item => item.menu_id === permission.menu_id && item.menu_type === 1);
		if (!menu || (!auth.value.isAdmin && !auth.value.menu_ids?.includes(menu.menu_id))) continue;
		menuIds.add(menu.menu_id);
	}
	form.menu_ids = [...menuIds];
	form.permission = [...permissionIds];
}
function findAuthorizationNode(key, nodes = permissionTree.value) {
	for (const node of nodes) {
		if (node.key === key) return node;
		const child = findAuthorizationNode(key, node.children || []);
		if (child) return child;
	}
}
async function loadAuthorization() {
	const epoch = ++treeEpoch;
	treeLoading.value = true;
	treeError.value = '';
	try {
		const result = await call('getRoleAuthorization');
		if (epoch !== treeEpoch || !visible.value) return;
		auth.value = result.auth;
		readOnly.value = !auth.value.update || !manageable(form);
		mergeAuthorization(result);
		missingPermissions.value = form.permission.filter(id => !permissions.value.some(item => item.permission_id === id));
		treeVersion.value++;
		await nextTick();
		if (epoch === treeEpoch) refreshTreeChecks();
	} catch (e) {
		if (epoch === treeEpoch) treeError.value = message(e);
	} finally {
		if (epoch === treeEpoch) treeLoading.value = false;
	}
}
function onAuthorizationCheck(node, state) {
	if (saving.value || treeLoading.value || readOnly.value) { refreshTreeChecks(); return; }
	syncPermissions(findAuthorizationNode(node.key) || node, state);
}
function refreshTreeChecks() {
	if (!treeRef.value) return;
	treeRef.value.setCheckedKeys([...form.menu_ids.map(id => 'menu:' + id), ...form.permission.map(id => 'permission:' + id)]);
	const visit = node => {
		if (node.disabled) return { total: 0, selected: 0 };
		if (node.permission_id) return { total: 1, selected: Number(form.permission.includes(node.permission_id)) };
		const children = (node.children || []).map(visit);
		const total = node.isPage ? 1 : children.reduce((sum, child) => sum + child.total, 0);
		const selected = node.isPage ? Number(form.menu_ids.includes(node.menu_id)) : children.reduce((sum, child) => sum + child.selected, 0);
		const treeNode = treeRef.value.getNode(node.key);
		if (treeNode) {
			treeNode.checked = total > 0 && selected === total;
			treeNode.indeterminate = selected > 0 && !treeNode.checked;
		}
		return { total, selected };
	};
	permissionTree.value.forEach(visit);
}
function syncPermissions(node, state) {
	const selected = state.checkedKeys.includes(node.key);
	const menuIds = new Set(form.menu_ids), permissionIds = new Set(form.permission);
	const selectPage = (id, checked) => {
		const menu = menus.value.find(item => item.menu_id === id);
		if (!menu) return;
		if (checked) menuIds.add(id);
		else {
			menuIds.delete(id);
			permissions.value.filter(item => item.menu_id === id).forEach(item => permissionIds.delete(item.permission_id));
		}
	};
	const toggle = data => {
		if (data.disabled) return;
		if (data.isPage) {
			selectPage(data.menu_id, selected);
		}
		else if (data.permission_id) {
			if (selected) {
				permissionIds.add(data.permission_id);
				if (data.ownerMenu) selectPage(data.ownerMenu, true);
			} else {
				permissionIds.delete(data.permission_id);
			}
		} else (data.children || []).filter(child => !child.permission_id).forEach(toggle);
	};
	toggle(node);
	form.menu_ids = [...menuIds];
	form.permission = [...permissionIds];
	refreshTreeChecks();
}
async function save() {
	if (saving.value || readOnly.value || treeLoading.value || treeError.value || !(await formRef.value.validate().catch(() => false))) return;
	saving.value = true;
	saveError.value = '';
	try {
		const payload = permissionMode.value
			? { _id: form._id, menu_ids: [...form.menu_ids], permission: [...form.permission] }
			: { _id: form._id, role_id: form.role_id, role_name: form.role_name, comment: form.comment || '' };
		const result = await call('saveRole', payload);
		visible.value = false;
		store.menuVersion++;
		if (result.requireLogin) {
			store.isLogin = false;
			uni.removeStorageSync('uni_id_token');
			uni.removeStorageSync('uni_id_token_expired');
			ElMessage.success('角色权限已更新，请重新登录');
			uni.reLaunch({ url: '/uni_modules/ucs-design-admin/pages/login/login' });
			return;
		}
		ElMessage.success(result.sessionsInvalidated ? '角色已保存，受影响用户需重新登录' : '角色已保存');
		await load();
	} catch (e) {
		saveError.value = message(e);
	} finally {
		saving.value = false;
	}
}
async function remove(row) {
	if (saving.value) return;
	saving.value = true;
	try {
		await ElMessageBox.confirm(`确定删除角色“${row.role_name}”吗？已分配给用户的角色无法删除。`, '删除角色', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		});
		await call('deleteRole', { _id: row._id });
		ElMessage.success('角色已删除');
		await load();
	} catch (e) {
		if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e));
	} finally {
		saving.value = false;
	}
}
onMounted(load);
onBeforeUnmount(() => {
	version++;
	treeEpoch++;
});
</script>
<style scoped>
.role-layout { height: calc(100dvh - var(--top-window-height, 56px)); min-height: 0; }
.role-layout :deep(.layout-card) { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.role-search { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; max-width: 100%; }
.role-search :deep(.el-input) { width: 240px; max-width: 100%; }
.role-search :deep(.el-button + .el-button) { margin-left: 0; }
.role-table { flex: 1; min-height: 0; }

.role-table {
	--el-table-header-bg-color: var(--el-fill-color-light);
	--el-table-header-text-color: var(--el-text-color-regular);
	--el-table-border-color: var(--el-border-color-lighter);
}
.role-table :deep(th.el-table__cell) {
	height: var(--admin-table-header-height, 44px);
	padding: 8px 0;
	font-weight: 500;
}
.role-table :deep(td.el-table__cell) {
	height: var(--admin-table-row-height, 64px);
	padding: var(--admin-table-cell-padding, 10px 0);
	box-sizing: border-box;
}
.role-actions {
	display: flex;
	justify-content: center;
	gap: 6px;
}
.role-actions :deep(.el-button + .el-button) {
	margin-left: 0;
}
.muted,
.hint {
	color: var(--el-text-color-secondary);
	font-size: 12px;
}
.hint {
	line-height: 1.7;
}
.permission-field {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
.authorization-tree {
	min-height: 120px;
	border: 1px solid var(--el-border-color-light);
	border-radius: 4px;
	padding: 10px;
	max-height: 330px;
	overflow: auto;
}
.tree-node {
	display: flex;
	align-items: center;
	gap: 12px;
}
.tree-node small {
	color: var(--el-text-color-secondary);
}
.authorization-tree :deep(.el-tree-node__content) {
	min-height: 32px;
}
:global(.role-editor .authorization-tree .el-tree-node__content > .el-checkbox) {
	margin-right: 8px;
	flex-shrink: 0;
}
.save-error {
	margin-bottom: 16px;
}
:global(.role-editor-overlay .el-overlay-dialog) {
	overflow: hidden;
}
:global(.role-editor) {
	max-width: calc(100vw - 32px);
	max-height: calc(100dvh - 48px);
	display: flex;
	flex-direction: column;
	margin: 0;
}
:global(.role-editor .el-dialog__body) {
	overflow-y: auto;
	min-height: 0;
	overscroll-behavior: contain;
}
</style>
