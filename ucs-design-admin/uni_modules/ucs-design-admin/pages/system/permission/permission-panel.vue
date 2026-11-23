<template>
	<div class="permission-panel" :class="{ 'permission-panel--fill': fill }">
		<div class="permission-toolbar">
			<el-input v-model="keyword" placeholder="权限名称或标识" aria-label="搜索权限" clearable class="keyword" />
			<el-tree-select
				v-if="props.menuId === '*'"
				aria-label="筛选所属菜单"
				v-model="selectedMenu"
				:data="filterMenus"
				node-key="menu_id"
				:props="treeProps"
				:empty-values="[null, undefined]"
				check-strictly
				filterable
				:render-after-expand="false"
				class="menu-filter"
			/>
			<el-button v-if="auth.create" type="primary" :disabled="loading || saving" @click="edit()">
				新增权限
			</el-button>
			<el-button
				v-if="
					auth.isAdmin &&
					builtinMenus.includes(selectedMenu) &&
					menus.some((menu) => menu.menu_id === selectedMenu && menu.menu_type === MENU_TYPE.PAGE)
				"
				:disabled="loading || saving"
				@click="initialize"
			>
				初始化菜单权限
			</el-button>
			<el-button :icon="Refresh" :loading="loading" :disabled="saving" aria-label="刷新权限" @click="load" />
		</div>
		<el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
		<el-table
			v-loading="loading"
			:data="filtered"
			row-key="_id"
			:height="fill ? '100%' : undefined"
			:max-height="fill ? undefined : 540"
		>
			<template #empty>
				<el-empty :image-size="100" :description="error ? '加载失败，请刷新重试' : '暂无权限，请新增或初始化菜单权限'" />
			</template>
			<el-table-column prop="permission_name" label="权限名称" min-width="150" align="center" />
			<el-table-column prop="permission_id" label="权限标识" min-width="260" align="center" show-overflow-tooltip />
			<el-table-column label="所属菜单" min-width="140" align="center">
				<template #default="{ row }">{{ menuName(row.menu_id) }}</template>
			</el-table-column>
			<el-table-column label="排序" width="70" align="center">
				<template #default="{ row }">{{ row.sort || 0 }}</template>
			</el-table-column>
			<el-table-column prop="comment" label="描述" min-width="160" align="center" show-overflow-tooltip />
			<el-table-column label="操作" width="150" align="center" fixed="right">
				<template #default="{ row }">
					<div class="actions">
						<el-button
							v-if="auth.update"
							type="primary"
							plain
							size="small"
							:disabled="saving || loading"
							@click="edit(row)"
						>
							编辑
						</el-button>
						<el-button
							v-if="auth.delete"
							type="danger"
							plain
							size="small"
							:disabled="saving || loading"
							@click="remove(row)"
						>
							删除
						</el-button>
						<span v-if="!auth.update && !auth.delete">只读</span>
					</div>
				</template>
			</el-table-column>
		</el-table>
		<div class="panel-note">每条操作权限必须归属页面，目录只用于分组。调整权限归属不会改变角色授权。</div>
	</div>
	<el-dialog
		v-model="visible"
		:title="form._id ? '编辑权限' : '新增权限'"
		width="580px"
		align-center
		append-to-body
		destroy-on-close
		class="permission-editor admin-form-dialog"
		modal-class="permission-editor-overlay"
		:close-on-click-modal="false"
		:show-close="!saving"
		:close-on-press-escape="!saving"
	>
		<el-alert v-if="saveError" :title="saveError" type="error" :closable="false" show-icon class="save-error" />
		<el-form
			ref="formRef"
			:model="form"
			:rules="rules"
			label-width="100px"
			label-position="right"
			:disabled="saving"
			@submit.prevent="save"
		>
			<el-form-item label="权限名称" prop="permission_name">
				<el-input v-model="form.permission_name" maxlength="80" placeholder="例如：编辑用户" />
			</el-form-item>
			<el-form-item label="权限标识" prop="permission_id">
				<div class="field">
					<el-input
						v-model="form.permission_id"
						:disabled="!!form._id"
						maxlength="100"
						placeholder="例如：UPDATE_UNI_ID_USERS"
					/>
					<text class="hint">需与按钮、接口校验使用的权限标识一致，创建后不可修改。</text>
				</div>
			</el-form-item>
			<el-form-item label="所属页面" prop="menu_id">
				<el-tree-select
					v-model="form.menu_id"
					:data="editMenus"
					node-key="menu_id"
					:props="treeProps"
					:empty-values="[null, undefined]"
					check-strictly
					filterable
					:render-after-expand="false"
				/>
			</el-form-item>
			<el-form-item label="排序">
				<el-input-number v-model="form.sort" :min="0" :max="999999" :precision="0" controls-position="right" />
			</el-form-item>
			<el-form-item label="描述">
				<el-input v-model="form.comment" type="textarea" :rows="3" maxlength="500" show-word-limit />
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button :disabled="saving" @click="visible = false">取消</el-button>
			<el-button type="primary" :loading="saving" @click="save">保存</el-button>
		</template>
	</el-dialog>
</template>
<script setup>
import { importTenantAdmin } from '../../../common/tenant-session.js';
import '../../../common/form-dialog.css';
import { ElAlert, ElButton, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElInputNumber, ElTable, ElTableColumn, ElTreeSelect, vLoading } from 'element-plus';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/input-number/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/table-column/style/css.mjs';
import 'element-plus/es/components/tree-select/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import 'element-plus/es/components/message-box/style/css.mjs';

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import store from '../../../common/store.js';
import { MENU_TYPE, menuTree } from '../../../common/menu.js';
const props = defineProps({ menuId: { type: String, default: '*' }, fill: { type: Boolean, default: false } });
const emit = defineEmits(['change']);
const api = importTenantAdmin();
const rows = ref([]),
	menus = ref([]),
	auth = ref({}),
	loading = ref(false),
	saving = ref(false),
	error = ref(''),
	saveError = ref(''),
	keyword = ref(''),
	selectedMenu = ref(props.menuId),
	visible = ref(false),
	formRef = ref();
const empty = () => ({ _id: '', permission_id: '', permission_name: '', menu_id: '', sort: 0, comment: '' });
const form = reactive(empty());
const treeProps = { label: 'name', children: 'children', value: 'menu_id', disabled: 'disabled' };
const editMenus = computed(() => {
	const visit = (nodes) =>
		nodes.map((menu) => ({ ...menu, disabled: menu.menu_type !== MENU_TYPE.PAGE, children: visit(menu.children) }));
	return visit(menuTree(menus.value));
});
const filterMenus = computed(() => [{ menu_id: '*', name: '全部权限' }, ...menuTree(menus.value)]);
const builtinMenus = ['system_customer', 'system_developer', 'system_user', 'system_role', 'platform_menu', 'system_app'];
const menuName = (id) => menus.value.find((menu) => menu.menu_id === id)?.name || '归属异常，请编辑修正';
const filtered = computed(() =>
	rows.value
		.filter(
			(row) =>
				(selectedMenu.value === '*' || (row.menu_id || '') === selectedMenu.value) &&
				(!keyword.value.trim() ||
					[row.permission_name, row.permission_id].some((value) =>
						(value || '').toLowerCase().includes(keyword.value.trim().toLowerCase())
					))
		)
		.sort((a, b) => (a.sort || 0) - (b.sort || 0) || a.permission_id.localeCompare(b.permission_id))
);
const rules = {
	menu_id: [{ required: true, message: '请选择所属页面', trigger: 'change' }],
	permission_name: [{ required: true, whitespace: true, message: '请输入权限名称', trigger: 'blur' }],
	permission_id: [
		{ required: true, pattern: /^[A-Za-z0-9][A-Za-z0-9_:-]*$/, message: '请输入有效的权限标识', trigger: 'blur' }
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
		const result = await call('listPermissions', selectedMenu.value === '*' ? {} : { menu_id: selectedMenu.value });
		if (id !== version) return;
		rows.value = result.data;
		menus.value = result.menus;
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
async function changed() {
	store.menuVersion++;
	emit('change');
	await load();
}
async function edit(row) {
	Object.assign(
		form,
		empty(),
		row
			? { ...row, menu_id: row.menu_id || '', sort: row.sort ?? 0, comment: row.comment || '' }
			: {
					menu_id: menus.value.some((menu) => menu.menu_id === selectedMenu.value && menu.menu_type === MENU_TYPE.PAGE)
						? selectedMenu.value
						: ''
			  }
	);
	saveError.value = '';
	visible.value = true;
	await nextTick();
	formRef.value?.clearValidate();
}
async function save() {
	if (saving.value || !(await formRef.value.validate().catch(() => false))) return;
	saving.value = true;
	saveError.value = '';
	try {
		await call('savePermission', { ...form });
		visible.value = false;
		ElMessage.success('权限已保存');
		await changed();
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
		await ElMessageBox.confirm(
			`确定删除权限“${row.permission_name}”吗？仍被角色引用的权限无法删除。`,
			'删除权限',
			{ type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
		);
		await call('deletePermission', { _id: row._id });
		ElMessage.success('权限已删除');
		await changed();
	} catch (e) {
		if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e));
	} finally {
		saving.value = false;
	}
}
async function initialize() {
	if (saving.value) return;
	saving.value = true;
	try {
		await ElMessageBox.confirm(
			'补齐此系统菜单的常用操作权限，将未归属的同名权限挂到此菜单。已有角色授权保持不变。',
			'初始化菜单权限',
			{ confirmButtonText: '初始化', cancelButtonText: '取消', type: 'info' }
		);
		const result = await call('initializeMenuPermissions', { menu_id: selectedMenu.value });
		ElMessage.success(`初始化完成，新增 ${result.created} 项权限`);
		await changed();
	} catch (e) {
		if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e));
	} finally {
		saving.value = false;
	}
}
watch(
	() => props.menuId,
	(value) => {
		selectedMenu.value = value;
		keyword.value = '';
	}
);
watch(selectedMenu, load);
onMounted(load);
onBeforeUnmount(() => {
	version++;
});
</script>
<style scoped>
.permission-panel :deep(table) {
	user-select: text;
}
.permission-panel--fill {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	min-width: 0;
}
.permission-panel--fill > .el-table {
	flex: 1;
	min-height: 0;
}
.permission-toolbar,
.panel-note {
	flex-shrink: 0;
}
.permission-toolbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 16px;
}
.permission-toolbar .keyword {
	width: 220px;
}
.permission-toolbar .menu-filter {
	width: 200px;
}
.permission-toolbar :deep(.el-button + .el-button),
.actions :deep(.el-button + .el-button) {
	margin-left: 0;
}
.actions {
	display: flex;
	justify-content: center;
	gap: 6px;
}
.panel-note,
.hint {
	color: var(--el-text-color-secondary);
	font-size: 12px;
	line-height: 1.7;
}
.panel-note {
	padding-top: 14px;
}
.field {
	display: flex;
	flex-direction: column;
	gap: 6px;
	width: 100%;
}
.save-error {
	margin-bottom: 16px;
}
:global(.permission-editor-overlay .el-overlay-dialog) {
	overflow: hidden;
}
:global(.permission-editor) {
	display: flex;
	flex-direction: column;
	max-width: calc(100vw - 32px);
	max-height: calc(100dvh - 48px);
	margin: 0;
}
:global(.permission-editor .el-dialog__body) {
	min-height: 0;
	overflow-y: auto;
	overscroll-behavior: contain;
}
:global(.permission-editor .el-select) {
	width: 100%;
}
</style>
