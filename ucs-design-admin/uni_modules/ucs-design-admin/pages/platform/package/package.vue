<template>
	<ucs-admin-layout title="产品包管理" mode="table" :pagination="pagination" @change="changePage">
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
			<el-button v-if="auth.create" type="primary" :icon="Plus" @click="open()">新增产品包</el-button>
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
				<el-alert title="所选页面的操作权限将纳入产品包，员工的具体权限由角色分配。" type="info" :closable="false" />
				<el-tree
					:key="treeVersion"
					ref="treeRef"
					:data="permissionTree"
					:props="treeProps"
					:default-checked-keys="draft.menu_ids"
					node-key="menu_id"
					class="package-menu-tree"
					aria-label="可分配页面"
					empty-text="暂无可分配页面"
					show-checkbox
					default-expand-all
					:expand-on-click-node="false"
				/>
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
import { ElAlert, ElButton, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElTable, ElTableColumn, ElTree, vLoading } from 'element-plus';
import { Plus, Refresh, Search } from '@element-plus/icons-vue';
import 'element-plus/es/components/tree/style/css.mjs';
import { menuTree, MENU_TYPE } from '../../../common/menu.js';
import { importTenantAdmin } from '../../../common/tenant-session.js';
import '../platform-management.css';
import { usePlatformList } from '../use-platform-list.js';

const api = importTenantAdmin();
const rows = ref([]), menus = ref([]), auth = ref({});
const { keyword, pagination, pageRows, search, reset, changePage } = usePlatformList(rows, (row, query) => row.name.toLowerCase().includes(query));
const loading = ref(false), saving = ref(false), editor = ref(false);
const editingPermissions = ref(false);
const error = ref(''), editorError = ref('');
const draft = reactive({ _id: '', name: '', remark: '', menu_ids: [] });
const treeRef = ref(), treeVersion = ref(0);
const permissionTree = computed(() => menuTree(menus.value));
const treeProps = { label: 'name', disabled: () => saving.value };
const message = e => e?.errMsg || e?.message || '操作失败，请重试';

async function load() {
	loading.value = true;
	error.value = '';
	try {
		const result = await api.listProductPackages();
		if (result.errCode) throw result;
		rows.value = result.data;
		menus.value = result.menus;
		auth.value = result.auth;
	} catch (e) { error.value = message(e); }
	finally { loading.value = false; }
}

function open(row, permissionsOnly = false) {
	editingPermissions.value = permissionsOnly;
	Object.assign(draft, {
		_id: row?._id || '', name: row?.name || '', remark: row?.remark || '',
		menu_ids: (row?.menu_ids || []).filter(id => menus.value.some(menu => menu.menu_id === id && menu.menu_type === MENU_TYPE.PAGE))
	});
	if (permissionsOnly) treeVersion.value++;
	editorError.value = '';
	editor.value = true;
}

async function save() {
	if (saving.value || (editingPermissions.value && !treeRef.value)) return;
	saving.value = true;
	editorError.value = '';
	try {
		const { _id, name, remark } = draft;
		const fields = editingPermissions.value ? {
			_id, menu_ids: treeRef.value.getCheckedNodes().filter(node => node.menu_type === MENU_TYPE.PAGE).map(node => node.menu_id)
		} : { _id, name, remark };
		const result = await api.saveProductPackage(fields);
		if (result.errCode) throw result;
		editor.value = false;
		await load();
	} catch (e) { editorError.value = message(e); }
	finally { saving.value = false; }
}

onMounted(load);
</script>
