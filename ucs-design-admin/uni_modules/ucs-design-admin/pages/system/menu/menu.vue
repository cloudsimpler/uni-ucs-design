<template>
	<ucs-admin-layout class="menu-layout" title="菜单管理" mode="card" :padding="false">
		<template #header>
			<el-form inline class="menu-search" @submit.prevent="search">
				<el-form-item>
					<el-input
						v-model="filters.keyword"
						:prefix-icon="Search"
						aria-label="菜单名称或菜单标识"
						placeholder="菜单名称或菜单标识"
						clearable
						maxlength="100"
						@clear="search"
					/>
				</el-form-item>
				<el-form-item>
					<el-select v-model="filters.enable" :empty-values="[null, undefined]" placeholder="全部状态" @change="search">
						<el-option label="全部状态" value="" />
						<el-option label="启用" :value="true" />
						<el-option label="停用" :value="false" />
					</el-select>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
					<el-button @click="reset">重置</el-button>
				</el-form-item>
			</el-form>
		</template>
		<template #button>
			<el-button v-if="auth.create" type="primary" :icon="Plus" :disabled="loading || busy" @click="openEditor()">
				新增菜单
			</el-button>
			<el-button :icon="Refresh" :loading="loading" :disabled="busy" aria-label="刷新菜单" @click="load" />
		</template>
		<div class="menu-content">
			<el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
			<el-alert
				v-if="hasInvalidType"
				title="部分菜单尚未设置有效类型，请编辑并选择目录或页面后保存。"
				type="warning"
				show-icon
				:closable="false"
			/>
			<el-table
				:key="tableKey"
				v-loading="loading"
				:data="rootRows"
				row-key="_id"
				:default-expand-all="isSearching"
				:tree-props="{ children: 'children' }"
				height="100%"
				class="menu-table"
			>
				<template #empty>
					<el-empty :image-size="100" :description="error ? '菜单加载失败，请点击刷新重试' : '暂无菜单'" />
				</template>
				<el-table-column label="菜单名称" min-width="220" header-align="center">
					<template #default="{ row }">
						<span class="menu-name">
							<el-icon><AdminIcon :name="row.icon" :fallback="isDirectory(row) ? 'Folder' : 'Document'" /></el-icon>
							<span>{{ row.name }}</span>
							<el-tag v-if="row.parentError" size="small" type="danger">上级异常</el-tag>
						</span>
					</template>
				</el-table-column>
				<el-table-column prop="menu_id" label="菜单标识" min-width="170" align="center" show-overflow-tooltip />
				<el-table-column label="类型" width="90" align="center">
					<template #default="{ row }">
						<el-tag
							:type="isDirectory(row) ? 'warning' : row.menu_type === MENU_TYPE.PAGE ? 'primary' : 'danger'"
							size="small"
						>
							{{ MENU_TYPE_OPTIONS.find((item) => item.value === row.menu_type)?.text || '未设置' }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="显示端" width="140" align="center">
					<template #default="{ row }">
						<div class="client-tags">
							<el-tag
								v-for="client in menuClients(row)"
								:key="client"
								size="small"
								:type="client === 'pc' ? 'primary' : 'success'"
							>
								{{ client === 'pc' ? 'PC' : 'App' }}
							</el-tag>
						</div>
					</template>
				</el-table-column>
				<el-table-column prop="sort" label="排序" width="80" align="center" />
				<el-table-column label="状态" width="110" align="center">
					<template #default="{ row }">
						<el-switch
							:model-value="row.enable !== false"
							:disabled="!auth.update || busy || loading"
							:loading="pendingId === row._id"
							:aria-label="`${row.name}启用状态`"
							@change="(value) => setEnabled(row, value)"
						/>
					</template>
				</el-table-column>
				<el-table-column label="操作" :width="auth.managePermissions ? 300 : 240" align="center" fixed="right">
					<template #default="{ row }">
						<div class="menu-actions">
							<el-button
								v-if="auth.managePermissions && row.menu_type === MENU_TYPE.PAGE"
								type="warning"
								plain
								size="small"
								:disabled="busy || loading"
								@click="openPermissions(row)"
							>
								权限
							</el-button>
							<el-button
								v-if="auth.update"
								type="primary"
								plain
								size="small"
								:disabled="busy || loading"
								@click="openEditor(row)"
							>
								编辑
							</el-button>
							<el-button
								v-if="auth.create && isDirectory(row)"
								type="success"
								plain
								size="small"
								:disabled="busy || loading || row.parentError"
								@click="openEditor(null, row.menu_id)"
							>
								新增下级
							</el-button>
							<el-button
								v-if="auth.delete"
								type="danger"
								plain
								size="small"
								:disabled="
									busy || loading || hasChildren(row) || permissions.some((item) => item.menu_id === row.menu_id)
								"
								@click="remove(row)"
							>
								删除
							</el-button>
							<span v-if="!auth.create && !auth.update && !auth.delete" class="muted">只读</span>
						</div>
					</template>
				</el-table-column>
			</el-table>
			<div class="menu-note">
				排序值越小越靠前；停用目录会隐藏其下级菜单。删除菜单前，需先处理其下级菜单和所属权限。
			</div>
		</div>
	</ucs-admin-layout>
	<el-dialog
		v-model="permissionVisible"
		:title="permissionTitle + ' · 操作权限'"
		width="1100px"
		align-center
		append-to-body
		destroy-on-close
		class="menu-permissions-dialog"
		:close-on-click-modal="false"
	>
		<PermissionPanel :menu-id="permissionMenuId" @change="load" />
	</el-dialog>
	<el-dialog
		v-model="editorVisible"
		:title="editing ? '编辑菜单' : '新增菜单'"
		width="620px"
		align-center
		append-to-body
		destroy-on-close
		class="menu-editor admin-form-dialog"
		modal-class="menu-editor-overlay"
		:close-on-click-modal="false"
		:close-on-press-escape="!saving && !iconUploading"
		:show-close="!saving && !iconUploading"
	>
		<el-alert v-if="saveError" :title="saveError" type="error" show-icon :closable="false" class="save-error" />
		<el-form
			ref="formRef"
			:model="form"
			:rules="rules"
			label-position="right"
			label-width="100px"
			v-loading="editorLoading"
			:disabled="saving || iconUploading || editorLoading"
			@submit.prevent="save"
		>
			<el-form-item label="菜单名称" prop="name">
				<el-input v-model="form.name" placeholder="请输入菜单名称" maxlength="50" show-word-limit />
			</el-form-item>
			<el-form-item label="菜单类型" prop="menu_type">
				<div class="field">
					<el-radio-group v-model="form.menu_type" @change="changeType">
						<el-radio-button
							v-for="item in MENU_TYPE_OPTIONS"
							:key="item.value"
							:value="item.value"
							:disabled="
								editing &&
								(item.value === MENU_TYPE.PAGE
									? hasChildren(form)
									: permissions.some((permission) => permission.menu_id === form.menu_id))
							"
						>
							{{ item.text }}
						</el-radio-button>
					</el-radio-group>
					<text v-if="editing && hasChildren(form)" class="hint">有下级菜单的目录不能改为页面。</text>
					<text v-if="editing && permissions.some((item) => item.menu_id === form.menu_id)" class="hint">
						已有操作权限，请先移至其他页面，再改为目录。
					</text>
					<text v-if="form.menu_type === MENU_TYPE.DIRECTORY" class="hint">
						目录仅组织下级菜单，不配置路径和权限；有可见的下级页面时才显示。
					</text>
					<text v-if="form.menu_type === MENU_TYPE.DIRECTORY && originalUrl" class="hint">
						保存后将清空原页面路径。
					</text>
				</div>
			</el-form-item>
			<el-form-item label="菜单标识" prop="menu_id">
				<div class="field">
					<el-input v-model="form.menu_id" :disabled="editing" placeholder="如 system_user" maxlength="100" />
					<text class="hint">唯一标识，创建后不可修改。</text>
				</div>
			</el-form-item>
			<el-form-item label="显示端" prop="client_type">
				<el-checkbox-group v-model="form.client_type">
					<el-checkbox v-for="item in MENU_CLIENT_OPTIONS" :key="item.value" :value="item.value">
						{{ item.text }}
					</el-checkbox>
				</el-checkbox-group>
			</el-form-item>
			<el-form-item label="上级菜单" prop="parent_id">
				<el-tree-select
					class="menu-parent-select"
					v-model="form.parent_id"
					:empty-values="[null, undefined]"
					placeholder="顶级菜单"
					:data="parentOptions"
					:props="{ label: 'name', value: 'menu_id', children: 'children', disabled: 'disabled' }"
					node-key="menu_id"
					check-strictly
					default-expand-all
					filterable
					:render-after-expand="false"
				/>
			</el-form-item>
			<el-form-item v-if="form.client_type.includes('pc')" label="PC端图标" prop="icon">
				<el-select v-model="form.icon" placeholder="选择图标" filterable clearable @visible-change="showIconOptions">
					<template #prefix>
						<el-icon v-if="icons[form.icon]"><component :is="icons[form.icon]" /></el-icon>
					</template>
					<el-option v-for="name in iconNames" :key="name" :label="name" :value="name">
						<span class="icon-option">
							<el-icon><component :is="icons[name]" /></el-icon>
							{{ name }}
						</span>
					</el-option>
				</el-select>
			</el-form-item>
			<el-form-item
				v-if="form.menu_type === MENU_TYPE.PAGE && form.client_type.includes('pc')"
				label="PC端路径"
				prop="url"
				required
			>
				<div class="field">
					<el-select
						v-model="form.url"
						placeholder="请选择或输入页面路径"
						filterable
						allow-create
						default-first-option
						clearable
					>
						<el-option
							v-for="page in pageOptions"
							:key="page.path"
							:value="page.path"
							:label="`${page.title}（${page.path}）`"
						/>
					</el-select>
					<text class="hint">选择已注册页面或填写以 / 开头的站内路径。</text>
				</div>
			</el-form-item>
			<el-form-item v-if="form.client_type.includes('app')" label="App端图标">
				<div class="field">
					<div class="app-icon-upload">
						<el-upload
							class="app-icon-uploader"
							ref="appIconUploadRef"
							accept="image/jpeg,image/png,image/webp"
							:show-file-list="false"
							:disabled="saving || iconUploading"
							:before-upload="beforeAppIconUpload"
							:http-request="uploadAppIcon"
							:on-success="clearIconUploadFiles"
							:on-error="iconUploadFailed"
						>
							<div
								class="app-icon-trigger"
								:class="{ 'is-uploading': iconUploading }"
								:aria-label="form.app_icon ? '更换图标' : '上传图标'"
								:aria-busy="iconUploading"
							>
								<el-image v-if="form.app_icon" :src="appIconPreview" fit="contain" class="app-icon-preview">
									<template #error><span class="hint">预览不可用</span></template>
								</el-image>
								<div v-else class="app-icon-placeholder">
									<el-icon :size="24"><Plus /></el-icon>
									<text>上传图标</text>
								</div>
								<div v-if="iconUploading" class="app-icon-mask">
									<el-icon class="is-loading"><Loading /></el-icon>
									<text>上传中</text>
								</div>
								<div v-else-if="form.app_icon" class="app-icon-replace">更换图标</div>
							</div>
						</el-upload>
					</div>
					<text class="hint">支持 JPG、PNG、WebP，保存菜单后生效。</text>
				</div>
			</el-form-item>
			<el-form-item
				v-if="form.menu_type === MENU_TYPE.PAGE && form.client_type.includes('app')"
				label="App端路径"
				prop="app_url"
				required
			>
				<el-input v-model="form.app_url" placeholder="如 /pages/system/user/user" maxlength="500" />
			</el-form-item>
			<el-form-item label="排序" prop="sort">
				<el-input-number v-model="form.sort" :min="0" :max="999999" :precision="0" controls-position="right" />
			</el-form-item>
			<el-form-item label="启用状态">
				<el-switch v-model="form.enable" inline-prompt active-text="启用" inactive-text="停用" />
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button :disabled="saving || iconUploading" @click="editorVisible = false">取消</el-button>
			<el-button type="primary" :loading="saving" :disabled="iconUploading || editorLoading || !editorReady" @click="save">保存</el-button>
		</template>
	</el-dialog>
</template>

<script setup>
import '../../../common/form-dialog.css';
import { ElAlert, ElButton, ElCheckbox, ElCheckboxGroup, ElDialog, ElEmpty, ElForm, ElFormItem, ElIcon, ElImage, ElInput, ElInputNumber, ElOption, ElRadioButton, ElRadioGroup, ElSelect, ElSwitch, ElTable, ElTableColumn, ElTag, ElTreeSelect, ElUpload, vLoading } from 'element-plus';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/checkbox/style/css.mjs';
import 'element-plus/es/components/checkbox-group/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/icon/style/css.mjs';
import 'element-plus/es/components/image/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/input-number/style/css.mjs';
import 'element-plus/es/components/option/style/css.mjs';
import 'element-plus/es/components/radio-button/style/css.mjs';
import 'element-plus/es/components/radio-group/style/css.mjs';
import 'element-plus/es/components/select/style/css.mjs';
import 'element-plus/es/components/switch/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/table-column/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/tree-select/style/css.mjs';
import 'element-plus/es/components/upload/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import 'element-plus/es/components/message-box/style/css.mjs';

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import AdminIcon from '../../../components/ucs-admin-icon/ucs-admin-icon.vue';
import { availableIcons as icons, loadIcons } from '../../../common/icons.js';
import { Plus, Refresh, Search, Loading } from '@element-plus/icons-vue';
import pagesJson from '@/pages.json';
import store from '../../../common/store.js';
import {
	MENU_TYPE,
	MENU_TYPE_OPTIONS,
	MENU_CLIENT_OPTIONS,
	menuClients,
	menuTree,
	filterTree,
	descendantIds
} from '../../../common/menu.js';
import PermissionPanel from '../permission/permission-panel.vue';
const permissionVisible = ref(false),
	permissionMenuId = ref(''),
	permissionTitle = ref('');
const openPermissions = (row) => {
	permissionMenuId.value = row.menu_id;
	permissionTitle.value = row.name;
	permissionVisible.value = true;
};

const api = uniCloud.importObject('uni-id-co', { customUI: true });
const rows = ref([]),
	permissions = ref([]),
	loading = ref(false),
	error = ref('');
const auth = reactive({ create: false, update: false, delete: false, managePermissions: false });
const filters = reactive({ keyword: '', enable: '' }),
	applied = reactive({ keyword: '', enable: '' });
const tableKey = ref(0);
const isSearching = computed(() => Boolean(applied.keyword.trim()) || applied.enable !== '');
const editorLoading = ref(false), editorReady = ref(false);
const editorVisible = ref(false),
	editing = ref(false),
	saving = ref(false),
	pendingId = ref(''),
	saveError = ref(''),
	formRef = ref();
const busy = computed(() => saving.value || editorLoading.value || Boolean(pendingId.value));
const originalUrl = ref('');
const emptyForm = () => ({
	_id: '',
	name: '',
	menu_id: '',
	menu_type: MENU_TYPE.DIRECTORY,
	parent_id: '',
	icon: '',
	url: '',
	client_type: ['pc'],
	app_url: '',
	app_icon: '',
	sort: 0,
	enable: true
});
const form = reactive(emptyForm());
const iconUploading = ref(false),
	appIconPreview = ref('');
let editorSession = 0;
async function resolveAppIcon(fileID) {
	if (/^https?:\/\//i.test(fileID || '')) return fileID;
	if (!/^cloud:\/\//i.test(fileID || '')) return '';
	try {
		const result = await uniCloud.getTempFileURL({ fileList: [fileID] });
		return result.fileList?.find((item) => item.fileID === fileID)?.tempFileURL || '';
	} catch {
		return '';
	}
}
const appIconUploadRef = ref();
let localIconUrl = '';
function releaseLocalIcon() {
	if (localIconUrl) URL.revokeObjectURL(localIconUrl);
	localIconUrl = '';
}
function clearIconUploadFiles() {
	appIconUploadRef.value?.clearFiles();
}
function iconUploadFailed(error) {
	clearIconUploadFiles();
	ElMessage.error(message(error));
}
function beforeAppIconUpload(file) {
	if (saving.value || iconUploading.value || !editorVisible.value) return false;
	if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size) {
		ElMessage.error('请选择有效的 JPG、PNG 或 WebP 图片');
		return false;
	}
	return true;
}
async function uploadAppIcon({ file, onProgress }) {
	const session = editorSession;
	iconUploading.value = true;
	const filePath = URL.createObjectURL(file);
	let retained = false;
	try {
		const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
		await uni.getImageInfo({ src: filePath });
		const result = await uniCloud.uploadFile({
			filePath,
			cloudPath: `menu-icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
			cloudPathAsRealPath: true,
			fileType: 'image',
			onUploadProgress: ({ loaded, total }) =>
				onProgress({ percent: total ? Math.min(99, Math.round((loaded * 100) / total)) : 0 })
		});
		if (!/^(https?:\/\/|cloud:\/\/)[^\s<>]+$/i.test(result.fileID || '')) throw new Error('上传未返回有效的图片地址');
		const preview = await resolveAppIcon(result.fileID);
		if (session === editorSession && editorVisible.value) {
			releaseLocalIcon();
			form.app_icon = result.fileID;
			appIconPreview.value = preview || filePath;
			if (!preview) {
				localIconUrl = filePath;
				retained = true;
			}
		}
		return result;
	} finally {
		if (!retained) URL.revokeObjectURL(filePath);
		iconUploading.value = false;
	}
}
const tree = computed(() => menuTree(rows.value));
const rootRows = computed(() => filterTree(tree.value, applied.keyword, applied.enable));
const hasInvalidType = computed(() =>
	rows.value.some((row) => !MENU_TYPE_OPTIONS.some((item) => item.value === row.menu_type))
);
const hasChildren = (row) => rows.value.some((item) => item.parent_id === row.menu_id);
const isDirectory = (row) => row.menu_type === MENU_TYPE.DIRECTORY;
const iconNames = computed(() => Object.keys(icons.value).sort());
async function showIconOptions(visible) {
	if (visible) await loadIcons().catch(() => ElMessage.error('图标加载失败，请重新打开选择器'));
}
const parentOptions = computed(() => {
	const disabled = descendantIds(rows.value, editing.value ? form.menu_id : '');
	const visit = (items, invalidAncestor = false) =>
		items.map((row) => ({
			...row,
			disabled:
				invalidAncestor ||
				disabled.has(row.menu_id) ||
				row.parentError ||
				!isDirectory(row) ||
				form.client_type.some((client) => !menuClients(row).includes(client)),
			children: visit(row.children, invalidAncestor || Boolean(row.parentError) || !isDirectory(row))
		}));
	return [{ menu_id: '', name: '顶级菜单', children: visit(tree.value) }];
});
const pageOptions = [
	{ path: '/', title: '首页' },
	...pagesJson.pages.map((page) => ({ path: '/' + page.path, title: page.style?.navigationBarTitleText || page.path })),
	...(pagesJson.subPackages || []).flatMap((group) =>
		group.pages.map((page) => ({
			path: '/' + group.root + '/' + page.path,
			title: page.style?.navigationBarTitleText || page.path
		}))
	)
].filter((page) => !page.path.includes('/pages/login/'));
const rules = {
	client_type: [{ type: 'array', required: true, min: 1, message: '至少选择一个显示端', trigger: 'change' }],
	app_url: [
		{
			validator: (_rule, value, callback) =>
				callback(
					form.menu_type === MENU_TYPE.PAGE && form.client_type.includes('app') && !value?.trim()
						? new Error('请输入 App端页面路径')
						: undefined
				),
			trigger: 'blur'
		}
	],
	menu_type: [
		{
			type: 'enum',
			enum: [MENU_TYPE.DIRECTORY, MENU_TYPE.PAGE],
			required: true,
			message: '请选择菜单类型',
			trigger: 'change'
		}
	],
	url: [
		{
			validator: (_rule, value, callback) =>
				callback(
					form.menu_type === MENU_TYPE.PAGE && form.client_type.includes('pc') && !value?.trim()
						? new Error('请选择或输入页面路径')
						: undefined
				),
			trigger: 'change'
		}
	],
	name: [{ required: true, whitespace: true, message: '请输入菜单名称', trigger: 'blur' }],
	menu_id: [
		{ required: true, message: '请输入菜单标识', trigger: 'blur' },
		{ pattern: /^[A-Za-z0-9][A-Za-z0-9_-]*$/, message: '仅支持字母、数字、下划线和短横线', trigger: 'blur' }
	],
	sort: [
		{ required: true, type: 'number', min: 0, max: 999999, message: '请输入 0 到 999999 的排序值', trigger: 'change' }
	]
};
const message = (e) => e?.errMsg || e?.message || '操作失败，请稍后重试';
const check = (result) => {
	if (result.errCode) throw result;
	return result;
};
let requestId = 0;
async function load() {
	const id = ++requestId;
	loading.value = true;
	error.value = '';
	rows.value = [];
	permissions.value = [];
	tableKey.value++;
	try {
		const result = check(await api.listMenus({ includePermissions: false }));
		if (id !== requestId) return;
		rows.value = result.data || [];
		permissions.value = result.permissions || [];
		Object.assign(auth, result.auth);
	} catch (e) {
		if (id !== requestId) return;
		error.value = message(e);
		rows.value = [];
		Object.assign(auth, { create: false, update: false, delete: false, managePermissions: false });
	} finally {
		if (id === requestId) loading.value = false;
	}
}
function search() {
	Object.assign(applied, filters);
	tableKey.value++;
}
function reset() {
	Object.assign(filters, { keyword: '', enable: '' });
	search();
}
async function openEditor(row, parent = '') {
	const session = ++editorSession;
	releaseLocalIcon();
	appIconPreview.value = '';
	editing.value = Boolean(row);
	originalUrl.value = row?.url || '';
	Object.assign(
		form,
		emptyForm(),
		row
			? {
					...row,
					client_type: [...menuClients(row)],
					menu_type: MENU_TYPE_OPTIONS.some((item) => item.value === row.menu_type) ? row.menu_type : null,
					enable: row.enable !== false
			  }
			: {
					parent_id: parent,
					client_type: [...menuClients(rows.value.find((item) => item.menu_id === parent) || {})],
					sort: Math.min(
						999999,
						Math.max(
							0,
							...rows.value.filter((item) => (item.parent_id || '') === parent).map((item) => item.sort || 0)
						) + 1
					)
			  }
	);
	if (form.menu_type === MENU_TYPE.DIRECTORY) {
		form.url = '';
		form.app_url = '';
	}
	saveError.value = '';
	editorReady.value = false;
	editorLoading.value = true;
	editorVisible.value = true;
	await nextTick();
	formRef.value?.clearValidate();
	try {
		const result = check(await api.listMenus({ includeMenus: false }));
		if (session !== editorSession) return;
		permissions.value = result.permissions || [];
		Object.assign(auth, result.auth);
		editorReady.value = true;
		if (!row) form.sort = Math.min(999999, Math.max(0, ...rows.value
			.filter((item) => (item.parent_id || '') === parent).map((item) => item.sort || 0)) + 1);
	} catch (e) {
		if (session === editorSession) saveError.value = message(e);
	} finally {
		if (session === editorSession) editorLoading.value = false;
	}
	const icon = form.app_icon;
	const preview = await resolveAppIcon(icon);
	if (session === editorSession && form.app_icon === icon) appIconPreview.value = preview;
}
function changeType(value) {
	if (value === MENU_TYPE.DIRECTORY) {
		form.url = '';
		form.app_url = '';
	}
	formRef.value?.clearValidate('url');
}
async function changed() {
	store.menuVersion++;
	await load();
}
async function save() {
	if (saving.value || iconUploading.value || editorLoading.value || !editorReady.value || !(await formRef.value.validate().catch(() => false))) return;
	saving.value = true;
	saveError.value = '';
	try {
		const payload = Object.fromEntries(Object.keys(emptyForm()).map((key) => [key, form[key]]));
		check(await (editing.value ? api.updateMenu(payload) : api.createMenu(payload)));
		editorVisible.value = false;
		ElMessage.success(editing.value ? '菜单已更新' : '菜单已创建');
		await changed();
	} catch (e) {
		saveError.value = message(e);
	} finally {
		saving.value = false;
	}
}
async function setEnabled(row, enable) {
	if (busy.value) return;
	pendingId.value = row._id;
	try {
		if (!enable && hasChildren(row))
			await ElMessageBox.confirm(`停用“${row.name}”后，其下级菜单也将从左侧导航隐藏。`, '停用目录', {
				confirmButtonText: '停用',
				cancelButtonText: '取消',
				type: 'warning'
			});
		check(await api.updateMenu({ _id: row._id, enable }));
		ElMessage.success(enable ? '菜单已启用' : '菜单已停用');
		await changed();
	} catch (e) {
		if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e));
	} finally {
		pendingId.value = '';
	}
}
async function remove(row) {
	if (busy.value) return;
	pendingId.value = row._id;
	try {
		await ElMessageBox.confirm(`确定删除菜单“${row.name}”吗？删除后无法恢复。`, '删除菜单', {
			confirmButtonText: '删除',
			cancelButtonText: '取消',
			type: 'warning'
		});
		check(await api.deleteMenu({ _id: row._id }));
		ElMessage.success('菜单已删除');
		await changed();
	} catch (e) {
		if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e));
	} finally {
		pendingId.value = '';
	}
}
onMounted(load);
onBeforeUnmount(() => {
	releaseLocalIcon();
	requestId++;
	editorSession++;
});
</script>

<style scoped>
.client-tags,
.app-icon-upload {
	display: flex;
	align-items: center;
	gap: 8px;
}
.client-tags {
	justify-content: center;
}
.app-icon-uploader :deep(.el-upload) {
	border: 1px dashed var(--el-border-color);
	border-radius: 6px;
	overflow: hidden;
	transition: border-color 0.2s;
}
.app-icon-uploader :deep(.el-upload:hover),
.app-icon-uploader :deep(.el-upload:focus-visible) {
	border-color: var(--el-color-primary);
}
.app-icon-trigger {
	position: relative;
	width: 96px;
	height: 96px;
	line-height: 1.5;
}
.app-icon-preview {
	width: 100%;
	height: 100%;
	display: block;
}
.app-icon-placeholder,
.app-icon-mask {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	height: 100%;
	font-size: 12px;
}
.app-icon-placeholder {
	color: var(--el-text-color-secondary);
}
.app-icon-replace,
.app-icon-mask {
	position: absolute;
	inset: auto 0 0;
	background: var(--el-overlay-color-light);
	color: #fff;
	font-size: 12px;
	text-align: center;
}
.app-icon-replace {
	padding: 4px 0;
}
.app-icon-mask {
	inset: 0;
}
.is-uploading {
	cursor: wait;
}
:global(.menu-permissions-dialog) {
	max-width: calc(100vw - 32px);
	max-height: calc(100dvh - 48px);
	display: flex;
	flex-direction: column;
	margin: 0;
}
:global(.menu-permissions-dialog .el-dialog__body) {
	overflow-y: auto;
	min-height: 0;
	overscroll-behavior: contain;
}
.menu-layout {
	height: calc(100dvh - var(--top-window-height, 56px));
	min-height: 0;
}
.menu-layout :deep(.layout-card) {
	display: flex;
	min-height: 0;
	overflow: hidden;
}
.menu-search {
	display: flex;
	flex-wrap: wrap;
	gap: 10px 14px;
}
.menu-search :deep(.el-form-item) {
	margin: 0;
}
.menu-search :deep(.el-input) {
	width: 230px;
}
.menu-search :deep(.el-select) {
	width: 130px;
}
.menu-content {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	min-width: 0;
}
.menu-table {
	flex: 1;
	min-height: 0;
	--el-table-header-bg-color: var(--el-fill-color-light);
}
.menu-table :deep(th.el-table__cell) {
	height: var(--admin-table-header-height, 44px);
	padding: 8px 0;
	font-weight: 500;
}
.menu-table :deep(td.el-table__cell) {
	height: var(--admin-table-row-height, 64px);
	padding: var(--admin-table-cell-padding, 10px 0);
	box-sizing: border-box;
}
.menu-name {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	vertical-align: middle;
}
.menu-name .el-icon {
	font-size: 18px;
}
.menu-actions {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	gap: 6px;
}
.menu-actions :deep(.el-button + .el-button) {
	margin-left: 0;
}
.muted,
.menu-note {
	color: var(--el-text-color-secondary);
	font-size: 12px;
}
.menu-note {
	padding: 12px 16px;
	line-height: 20px;
	border-top: 1px solid var(--el-border-color-lighter);
}
.field {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 6px;
}
.hint {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	line-height: 1.6;
}
.icon-option {
	display: flex;
	align-items: center;
	gap: 10px;
}
.save-error {
	margin-bottom: 18px;
}
:global(.menu-editor-overlay) {
	overflow: hidden;
}
:global(.menu-editor-overlay .el-overlay-dialog) {
	overflow: hidden;
}
:global(.menu-editor) {
	display: flex;
	flex-direction: column;
	max-width: calc(100vw - 32px);
	max-height: calc(100dvh - 48px);
	margin: 0;
}
:global(.menu-editor .el-dialog__body) {
	overflow-y: auto;
	min-height: 0;
	padding: 16px 12px 0 0;
	overscroll-behavior: contain;
}
:global(.menu-editor .el-dialog__header),
:global(.menu-editor .el-dialog__footer) {
	flex-shrink: 0;
}
:global(.menu-editor .el-select),
:global(.menu-editor .menu-parent-select) {
	width: 100%;
}
</style>
