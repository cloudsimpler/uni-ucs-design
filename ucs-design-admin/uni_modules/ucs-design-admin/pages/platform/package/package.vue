<template>
	<ucs-admin-layout title="租户产品包" mode="table" :pagination="pagination" @change="changePage">
		<template #header>
			<el-form class="platform-search" inline @submit.prevent="search">
				<el-form-item>
					<el-input v-model="keyword" :prefix-icon="Search" aria-label="产品包名称" placeholder="产品包名称" clearable @clear="search" />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
					<el-button @click="reset">重置</el-button>
				</el-form-item>
			</el-form>
		</template>
		<template #button>
			<el-button v-if="auth.create" type="primary" @click="open()">新增产品包</el-button>
			<el-button :icon="Refresh" :loading="loading" aria-label="刷新产品包" @click="load" />
		</template>
		<div v-loading="loading" class="platform-table">
			<el-alert v-if="error" :title="error" type="error" :closable="false" />
			<el-table :data="pageRows" row-key="_id" height="100%">
				<template #empty><el-empty :image-size="100" :description="error ? '产品包加载失败，请刷新重试' : '暂无符合条件的产品包'" /></template>
				<el-table-column prop="name" label="产品包名称" min-width="180" show-overflow-tooltip />
				<el-table-column prop="remark" label="备注" min-width="260" show-overflow-tooltip>
					<template #default="{ row }">{{ row.remark || '—' }}</template>
				</el-table-column>
				<el-table-column label="操作" width="200" align="center">
					<template #default="{ row }">
						<template v-if="auth.update">
							<el-button size="small" plain type="warning" @click="open(row, true)">菜单权限</el-button>
							<el-button size="small" plain type="primary" @click="open(row)">编辑</el-button>
						</template>
						<span v-else>—</span>
					</template>
				</el-table-column>
			</el-table>
		</div>
	</ucs-admin-layout>
	<el-dialog v-model="editor" class="admin-form-dialog platform-editor" :title="editingPermissions ? '菜单权限 · ' + draft.name : draft._id ? '编辑产品包' : '新增产品包'" :width="editingPermissions ? '640px' : '560px'" align-center append-to-body
		:close-on-click-modal="false" :show-close="!saving" :close-on-press-escape="!saving">
		<el-form id="platform-package-form" label-position="top" :disabled="saving" @submit.prevent="save">
			<template v-if="!editingPermissions">
				<el-form-item label="产品包名称" required><el-input v-model.trim="draft.name" maxlength="80" placeholder="请输入产品包名称" /></el-form-item>
				<el-form-item label="备注">
					<el-input v-model="draft.remark" type="textarea" :rows="2" maxlength="500" placeholder="请输入备注" />
				</el-form-item>
			</template>
			<template v-else>
				<el-alert title="勾选页面即包含该页面当前和以后新增的全部操作权限。员工的具体权限由角色分配。" type="info" :closable="false" />
				<el-tree
					:key="treeVersion"
					:data="permissionTree"
					:props="{ label: 'name' }"
					node-key="key"
					class="package-menu-tree"
					aria-label="可分配页面和操作权限"
					empty-text="暂无可分配页面"
					:default-expanded-keys="directoryKeys"
					:expand-on-click-node="false"
				>
					<template #default="{ data }">
						<el-checkbox
							v-if="data.menu_type !== undefined"
							:model-value="isChecked(data)"
							:indeterminate="data.menu_type === MENU_TYPE.DIRECTORY && !isChecked(data) && data.keys.some(key => checkedKeys.has(key))"
							:disabled="saving"
							@click.stop
							@change="toggleNode(data, $event)"
						>{{ data.name }}</el-checkbox>
						<span v-else class="package-permission-label">{{ data.name }}</span>
					</template>
				</el-tree>
			</template>
			<el-alert v-if="editorError" :title="editorError" type="error" :closable="false" />
		</el-form>
		<template #footer>
			<el-button :disabled="saving" @click="editor = false">取消</el-button>
			<el-button type="primary" native-type="submit" form="platform-package-form" :loading="saving">保存</el-button>
		</template>
	</el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElAlert, ElButton, ElCheckbox, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElTable, ElTableColumn, ElTree, vLoading } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import 'element-plus/es/components/tree/style/css.mjs';
import { menuTree, MENU_TYPE } from '../../../common/menu.js';
import { importTenantAdmin } from '../../../common/tenant-session.js';
import '../platform-management.css';
import { usePlatformList } from '../use-platform-list.js';

const api = importTenantAdmin();
const rows = ref([]), menus = ref([]), permissions = ref([]), auth = ref({});
const { keyword, pagination, pageRows, search, reset, changePage } = usePlatformList(rows, (row, query) => row.name.toLowerCase().includes(query));
const loading = ref(false), saving = ref(false), editor = ref(false);
const editingPermissions = ref(false);
const error = ref(''), editorError = ref('');
const draft = reactive({ _id: '', name: '', remark: '' });
const treeVersion = ref(0);
const checkedKeys = ref(new Set());
const menuKey = id => 'menu:' + id;
const permissionKey = id => 'permission:' + id;
const directoryKeys = computed(() => menus.value.filter(menu => menu.menu_type === MENU_TYPE.DIRECTORY)
	.map(menu => menuKey(menu.menu_id)));
const permissionTree = computed(() => {
	const byMenu = new Map();
	const orderedPermissions = [...permissions.value].sort((a, b) =>
		(a.sort || 0) - (b.sort || 0) || a.permission_id.localeCompare(b.permission_id)
	);
	for (const row of orderedPermissions) {
		if (!byMenu.has(row.menu_id)) byMenu.set(row.menu_id, []);
		const key = permissionKey(row.permission_id);
		byMenu.get(row.menu_id).push({ key, name: row.permission_name });
	}
	const visit = nodes => nodes.map(node => {
		const key = menuKey(node.menu_id);
		const isPage = node.menu_type === MENU_TYPE.PAGE;
		const children = isPage ? byMenu.get(node.menu_id) || [] : visit(node.children);
		return { ...node, key, children, keys: isPage ? [key] : children.flatMap(child => child.keys) };
	});
	return visit(menuTree(menus.value));
});
const isChecked = node => node.menu_type === MENU_TYPE.DIRECTORY
	? node.keys.length > 0 && node.keys.every(key => checkedKeys.value.has(key))
	: checkedKeys.value.has(node.key);

function toggleNode(node, checked) {
	const next = new Set(checkedKeys.value);
	for (const key of node.keys) {
		if (checked) next.add(key);
		else next.delete(key);
	}
	checkedKeys.value = next;
}
const message = e => e?.errMsg || e?.message || '操作失败，请重试';

async function load() {
	loading.value = true;
	error.value = '';
	try {
		const result = await api.listProductPackages();
		if (result.errCode) throw result;
		rows.value = result.data;
		menus.value = result.menus;
		permissions.value = result.permissions;
		auth.value = result.auth;
	} catch (e) { error.value = message(e); }
	finally { loading.value = false; }
}

function open(row, permissionsOnly = false) {
	editingPermissions.value = permissionsOnly;
	Object.assign(draft, {
		_id: row?._id || '', name: row?.name || '', remark: row?.remark || ''
	});
	if (permissionsOnly) {
		const selectedMenus = new Set(row.menu_ids || []);
		checkedKeys.value = new Set(menus.value
			.filter(menu => menu.menu_type === MENU_TYPE.PAGE && selectedMenus.has(menu.menu_id))
			.map(menu => menuKey(menu.menu_id)));
		treeVersion.value++;
	}
	editorError.value = '';
	editor.value = true;
}

async function save() {
	if (saving.value) return;
	saving.value = true;
	editorError.value = '';
	try {
		const { _id, name, remark } = draft;
		let fields = { _id, name, remark };
		if (editingPermissions.value) {
			const menu_ids = menus.value.filter(node => node.menu_type === MENU_TYPE.PAGE && checkedKeys.value.has(menuKey(node.menu_id)))
				.map(node => node.menu_id);
			fields = { _id, menu_ids };
		}
		const result = await api.saveProductPackage(fields);
		if (result.errCode) throw result;
		editor.value = false;
		await load();
	} catch (e) { editorError.value = message(e); }
	finally { saving.value = false; }
}

onMounted(load);
</script>
