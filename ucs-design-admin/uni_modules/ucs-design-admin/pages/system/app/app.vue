<template>
	<ucs-admin-layout title="应用管理" mode="card" :padding="false" class="app-layout">
		<template #header>
			<el-form inline class="app-search" @submit.prevent="search">
				<el-form-item>
					<el-input v-model="keyword" :prefix-icon="Search" aria-label="应用名称或 AppID" clearable placeholder="应用名称或 AppID" maxlength="100" @clear="search" />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
					<el-button @click="reset">重置</el-button>
				</el-form-item>
			</el-form>
		</template>
		<template #button>
			<el-button v-if="auth.create" type="primary" :disabled="loading || busy" @click="edit()">
				新增应用
			</el-button>
			<el-button :icon="Refresh" :loading="loading" :disabled="busy" aria-label="刷新应用" @click="load" />
		</template>
		<el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
		<el-table
			v-loading="loading"
			:data="pageRows"
			row-key="_id"
			class="app-table"
			height="100%"
		>
			<template #empty>
				<el-empty :image-size="100" :description="error ? '加载失败，请刷新重试' : '暂无符合条件的应用'" />
			</template>
			<el-table-column label="图标" width="90" align="center">
				<template #default="{ row }">
					<el-avatar shape="square" :size="36" :src="previews[row.icon_url]">
						<el-icon><Grid /></el-icon>
					</el-avatar>
				</template>
			</el-table-column>
			<el-table-column label="应用名称" min-width="190" align="center">
				<template #default="{ row }">
					<div class="app-name">
						<span>{{ row.name }}</span>
						<el-tag v-if="row.appid === currentAppId" size="small">当前应用</el-tag>
					</div>
				</template>
			</el-table-column>
			<el-table-column prop="appid" label="AppID" min-width="210" align="center" show-overflow-tooltip />
			<el-table-column label="应用类型" width="130" align="center">
				<template #default="{ row }">{{ row.app_type === 1 ? 'uni-app x' : 'uni-app' }}</template>
			</el-table-column>
			<el-table-column label="描述" min-width="230" align="center" show-overflow-tooltip>
				<template #default="{ row }">{{ row.description || '—' }}</template>
			</el-table-column>
			<el-table-column label="操作" width="270" align="center" fixed="right">
				<template #default="{ row }">
					<div class="app-actions">
						<el-button
							v-if="auth.update"
							type="primary"
							plain
							size="small"
							:disabled="loading || busy"
							@click="edit(row)"
						>
							编辑
						</el-button>
						<el-button
							v-if="auth.versions"
							type="success"
							plain
							size="small"
							:disabled="loading || busy"
							@click="versionApp = row"
						>
							版本管理
						</el-button>
						<el-button
							v-if="auth.delete"
							type="danger"
							plain
							size="small"
							:disabled="loading || busy || row.appid === currentAppId"
							@click="remove(row)"
						>
							删除
						</el-button>
						<span v-if="!auth.update && !auth.delete && !auth.versions" class="hint">只读</span>
					</div>
				</template>
			</el-table-column>
		</el-table>
		<div class="app-pagination">
			<el-pagination
				v-model:current-page="page"
				v-model:page-size="pageSize"
				:total="filtered.length"
				:page-sizes="[20, 40, 60, 80, 100]"
				layout="total, sizes, prev, pager, next"
				@size-change="page = 1"
			/>
		</div>
	</ucs-admin-layout>
	<VersionPanel v-if="versionApp" :app="versionApp" @close="versionApp = null" />
	<el-dialog
		v-model="visible"
		:title="form._id ? '编辑应用' : '新增应用'"
		width="600px"
		align-center
		append-to-body
		destroy-on-close
		class="app-editor admin-form-dialog"
		modal-class="app-editor-overlay"
		:close-on-click-modal="false"
		:close-on-press-escape="!saving && !uploading"
		:show-close="!saving && !uploading"
	>
		<el-alert v-if="saveError" :title="saveError" type="error" show-icon :closable="false" class="save-error" />
		<el-form
			ref="formRef"
			:model="form"
			:rules="rules"
			label-position="right"
			label-width="100px"
			:disabled="saving || uploading"
			@submit.prevent="save"
		>
			<el-form-item label="应用图标">
				<div class="icon-field">
					<el-upload
						ref="uploadRef"
						class="app-uploader"
						accept="image/jpeg,image/png,image/webp"
						:show-file-list="false"
						:disabled="saving || uploading"
						:before-upload="beforeUpload"
						:http-request="uploadIcon"
						:on-success="clearUpload"
						:on-error="uploadFailed"
					>
						<div class="icon-trigger" :aria-label="form.icon_url ? '更换图标' : '上传图标'" :aria-busy="uploading">
							<el-image v-if="form.icon_url" :src="iconPreview" fit="contain" class="icon-preview">
								<template #error><span class="hint">预览不可用</span></template>
							</el-image>
							<div v-else class="icon-placeholder">
								<el-icon :size="24"><Plus /></el-icon>
								<text>上传图标</text>
							</div>
							<div v-if="uploading" class="icon-mask">
								<el-icon class="is-loading"><Loading /></el-icon>
								<text>上传中</text>
							</div>
							<div v-else-if="form.icon_url" class="icon-replace">更换图标</div>
						</div>
					</el-upload>
					<text class="hint">支持 JPG、PNG、WebP，保存应用后生效。</text>
					<text v-if="uploadError" class="upload-error">{{ uploadError }}</text>
				</div>
			</el-form-item>
			<el-form-item label="应用名称" prop="name">
				<el-input v-model.trim="form.name" maxlength="80" placeholder="请输入应用名称" />
			</el-form-item>
			<el-form-item label="AppID" prop="appid">
				<div class="field">
					<el-input
						v-model.trim="form.appid"
						:disabled="!!form._id"
						maxlength="100"
						placeholder="填写项目实际使用的 AppID"
					/>
					<text class="hint">与项目 manifest.json 中的 AppID 一致，创建后不可修改。</text>
				</div>
			</el-form-item>
			<el-form-item label="应用类型" prop="app_type">
				<el-radio-group v-model="form.app_type" :disabled="!!form._id">
					<el-radio :value="0">uni-app</el-radio>
					<el-radio :value="1">uni-app x</el-radio>
				</el-radio-group>
			</el-form-item>
			<el-form-item label="应用描述" prop="description">
				<el-input
					v-model="form.description"
					type="textarea"
					:rows="3"
					maxlength="500"
					show-word-limit
					placeholder="可填写应用用途"
				/>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button :disabled="saving || uploading" @click="visible = false">取消</el-button>
			<el-button type="primary" :loading="saving" :disabled="uploading" @click="save">保存</el-button>
		</template>
	</el-dialog>
</template>

<script setup>
import { importTenantAdmin } from '../../../common/tenant-session.js';
import '../../../common/form-dialog.css';
import { ElAlert, ElAvatar, ElButton, ElDialog, ElEmpty, ElForm, ElFormItem, ElIcon, ElImage, ElInput, ElPagination, ElRadio, ElRadioGroup, ElTable, ElTableColumn, ElTag, ElUpload, vLoading } from 'element-plus';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/avatar/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/icon/style/css.mjs';
import 'element-plus/es/components/image/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/pagination/style/css.mjs';
import 'element-plus/es/components/radio/style/css.mjs';
import 'element-plus/es/components/radio-group/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/table-column/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/upload/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import 'element-plus/es/components/message-box/style/css.mjs';

import VersionPanel from './version-panel.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Grid, Plus, Refresh, Search, Loading } from '@element-plus/icons-vue';
const api = importTenantAdmin();
const versionApp = ref(null);
const rows = ref([]),
	loading = ref(false),
	error = ref(''),
	currentAppId = ref('');
const auth = reactive({ create: false, update: false, delete: false });
const keyword = ref(''),
	appliedKeyword = ref(''),
	page = ref(1),
	pageSize = ref(20);
const visible = ref(false),
	saving = ref(false),
	deleting = ref(false),
	saveError = ref(''),
	formRef = ref();
const uploading = ref(false),
	uploadError = ref(''),
	uploadRef = ref(),
	iconPreview = ref(''),
	previews = ref({});
const emptyForm = () => ({ _id: '', appid: '', name: '', app_type: 0, icon_url: '', description: '' });
const form = reactive(emptyForm());
const busy = computed(() => saving.value || deleting.value || uploading.value);
const filtered = computed(() =>
	rows.value.filter((row) =>
		[row.name, row.appid].some((value) => (value || '').toLowerCase().includes(appliedKeyword.value))
	)
);
const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
const rules = {
	name: [{ required: true, whitespace: true, message: '请输入应用名称', trigger: 'blur' }],
	appid: [
		{ required: true, message: '请输入 AppID', trigger: 'blur' },
		{ pattern: /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/, message: '仅支持字母、数字、下划线、点和短横线', trigger: 'blur' }
	],
	app_type: [{ required: true, type: 'enum', enum: [0, 1], message: '请选择应用类型', trigger: 'change' }]
};
const message = (error) => error?.errMsg || error?.message || '操作失败，请稍后重试';
const call = async (method, params) => {
	const result = await api[method](params);
	if (result.errCode) throw result;
	return result;
};
let requestId = 0,
	editorSession = 0;
async function imageUrls(ids) {
	const urls = Object.fromEntries(ids.filter((id) => /^https?:\/\//i.test(id || '')).map((id) => [id, id]));
	const cloudIds = [...new Set(ids.filter((id) => /^cloud:\/\//i.test(id || '')))];
	if (cloudIds.length) {
		try {
			const result = await uniCloud.getTempFileURL({ fileList: cloudIds });
			for (const item of result.fileList || []) if (item.tempFileURL) urls[item.fileID] = item.tempFileURL;
		} catch {
			/* 图标加载失败时仍可管理应用资料。 */
		}
	}
	return urls;
}
async function load() {
	const id = ++requestId;
	loading.value = true;
	error.value = '';
	try {
		const result = await call('listApps');
		if (id !== requestId) return;
		rows.value = result.data || [];
		Object.assign(auth, result.auth);
		currentAppId.value = result.currentAppId;
		page.value = Math.min(page.value, Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
		const urls = await imageUrls(rows.value.map((row) => row.icon_url));
		if (id === requestId) previews.value = urls;
	} catch (e) {
		if (id === requestId) {
			error.value = message(e);
			rows.value = [];
			Object.assign(auth, { create: false, update: false, delete: false });
		}
	} finally {
		if (id === requestId) loading.value = false;
	}
}
function search() {
	appliedKeyword.value = keyword.value.trim().toLowerCase();
	page.value = 1;
}
function reset() {
	keyword.value = '';
	search();
}
async function edit(row) {
	const session = ++editorSession;
	Object.assign(form, emptyForm());
	if (row) for (const key of Object.keys(emptyForm())) if (row[key] != null) form[key] = row[key];
	iconPreview.value = previews.value[form.icon_url] || '';
	saveError.value = '';
	uploadError.value = '';
	visible.value = true;
	await nextTick();
	if (session === editorSession) formRef.value?.clearValidate();
}
const clearUpload = () => uploadRef.value?.clearFiles();
const uploadFailed = (e) => {
	clearUpload();
	uploadError.value = message(e);
};
function beforeUpload(file) {
	if (busy.value || !visible.value) return false;
	uploadError.value = '';
	if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size) {
		uploadError.value = '请选择有效的 JPG、PNG 或 WebP 图片';
		return false;
	}
	return true;
}
async function uploadIcon({ file, onProgress }) {
	const session = editorSession;
	uploading.value = true;
	const filePath = URL.createObjectURL(file);
	try {
		await uni.getImageInfo({ src: filePath });
		const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
		const result = await uniCloud.uploadFile({
			filePath,
			cloudPath: `app-icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
			cloudPathAsRealPath: true,
			fileType: 'image',
			onUploadProgress: ({ loaded, total }) =>
				onProgress({ percent: total ? Math.min(99, Math.round((loaded * 100) / total)) : 0 })
		});
		if (!/^(https?:\/\/|cloud:\/\/)[^\s<>]+$/i.test(result.fileID || '')) throw new Error('上传未返回有效的图片地址');
		const urls = await imageUrls([result.fileID]);
		if (!urls[result.fileID]) throw new Error('图标已上传，但预览加载失败，请重试');
		if (session === editorSession && visible.value) {
			form.icon_url = result.fileID;
			iconPreview.value = urls[result.fileID];
		}
		return result;
	} finally {
		URL.revokeObjectURL(filePath);
		uploading.value = false;
	}
}
async function save() {
	if (busy.value || !(await formRef.value.validate().catch(() => false))) return;
	saving.value = true;
	saveError.value = '';
	try {
		await call('saveApp', { ...form });
		visible.value = false;
		ElMessage.success(form._id ? '应用已更新' : '应用已创建');
		await load();
	} catch (e) {
		saveError.value = message(e);
	} finally {
		saving.value = false;
	}
}
async function remove(row) {
	if (busy.value) return;
	deleting.value = true;
	try {
		await ElMessageBox.confirm(`确定删除应用“${row.name}”吗？`, '删除应用', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		});
		await call('deleteApp', { _id: row._id });
		ElMessage.success('应用已删除');
		await load();
	} catch (e) {
		if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e));
	} finally {
		deleting.value = false;
	}
}
onMounted(load);
onBeforeUnmount(() => {
	requestId++;
	editorSession++;
});
</script>

<style scoped>
.app-layout {
	height: calc(100dvh - var(--top-window-height, 56px));
	min-height: 0;
}
.app-layout :deep(.layout-card) {
	display: flex;
	flex-direction: column;
	min-height: 0;
	overflow: hidden;
}
.app-search :deep(.el-input) {
	width: 240px;
}
.app-table {
	flex: 1;
	min-height: 0;
	--el-table-header-bg-color: var(--el-fill-color-light);
}
.app-name,
.app-actions {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-wrap: wrap;
	gap: 6px;
}
.app-actions :deep(.el-button + .el-button) {
	margin-left: 0;
}
.app-pagination {
	display: flex;
	justify-content: flex-end;
	padding: 16px;
	border-top: 1px solid var(--el-border-color-lighter);
	overflow-x: auto;
}
.field,
.icon-field {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	width: 100%;
	min-width: 0;
}
.hint {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	line-height: 1.6;
}
.upload-error {
	font-size: 12px;
	color: var(--el-color-danger);
}
.save-error {
	margin-bottom: 16px;
}
.app-uploader :deep(.el-upload) {
	border: 1px dashed var(--el-border-color);
	border-radius: 6px;
	overflow: hidden;
}
.app-uploader :deep(.el-upload:hover),
.app-uploader :deep(.el-upload:focus-visible) {
	border-color: var(--el-color-primary);
}
.icon-trigger {
	position: relative;
	width: 96px;
	height: 96px;
	line-height: 1.5;
}
.icon-preview {
	width: 100%;
	height: 100%;
	display: block;
}
.icon-placeholder,
.icon-mask {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	height: 100%;
	font-size: 12px;
}
.icon-placeholder {
	color: var(--el-text-color-secondary);
}
.icon-replace,
.icon-mask {
	position: absolute;
	inset: auto 0 0;
	background: var(--el-overlay-color-light);
	color: #fff;
	font-size: 12px;
	text-align: center;
}
.icon-replace {
	padding: 4px 0;
}
.icon-mask {
	inset: 0;
}
:global(.app-editor-overlay .el-overlay-dialog) {
	overflow: hidden;
}
</style>
