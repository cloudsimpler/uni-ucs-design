<template>
	<el-dialog
		:model-value="true"
		:title="`版本管理 · ${app.name}`"
		width="1180px"
		align-center
		append-to-body
		class="version-panel"
		modal-class="version-overlay"
		:close-on-click-modal="false"
		:show-close="!busy"
		:close-on-press-escape="!busy"
		@close="$emit('close')"
	>
		<div class="version-toolbar">
			<el-tabs v-model="activePlatform" type="card" class="version-platforms" @tab-change="changePlatform">
				<el-tab-pane
					v-for="platform in platforms"
					:key="platform"
					:name="platform"
					:label="platformLabel(platform)"
					:disabled="busy || editor"
				/>
			</el-tabs>
			<div class="version-toolbar-actions">
				<el-button v-if="auth.create" type="primary" :icon="Plus" :disabled="busy || loading" @click="edit()">
					新增版本
				</el-button>
				<el-button :icon="Refresh" :loading="loading" :disabled="busy" aria-label="刷新版本" @click="load" />
			</div>
		</div>
		<el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
		<el-table
			v-loading="loading"
			:data="rows"
			row-key="_id"
			class="version-table"
		>
			<template #empty>
				<el-empty :image-size="100" :description="error ? '加载失败，请刷新重试' : `暂无 ${platformLabel(activePlatform)} 版本，请新增版本`" />
			</template>
			<el-table-column prop="version" label="版本号" width="110" align="center" />
			<el-table-column label="包类型" width="120" align="center">
				<template #default="{ row }">{{ row.type === 'wgt' ? 'WGT 资源包' : '原生安装包' }}</template>
			</el-table-column>
			<el-table-column prop="contents" label="更新内容" min-width="240" header-align="center" show-overflow-tooltip>
				<template #default="{ row }">{{ row.contents || '—' }}</template>
			</el-table-column>
			<el-table-column label="发布状态" width="100" align="center">
				<template #default="{ row }">
					<el-tag :type="row.stable_publish ? 'success' : 'info'">
						{{ row.stable_publish ? '已发布' : '未发布' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="强制更新" width="100" align="center">
				<template #default="{ row }">
					<el-tag :type="row.is_mandatory ? 'warning' : 'info'" size="small">
						{{ row.is_mandatory ? '开启' : '关闭' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="静默更新" width="100" align="center">
				<template #default="{ row }">
					<el-tag v-if="row.type === 'wgt'" :type="row.is_silently ? 'success' : 'info'" size="small">
						{{ row.is_silently ? '开启' : '关闭' }}
					</el-tag>
					<span v-else class="hint">不适用</span>
				</template>
			</el-table-column>
			<el-table-column label="上传时间" width="170" align="center">
				<template #default="{ row }">{{ formatTime(row.create_date) }}</template>
			</el-table-column>
			<el-table-column label="操作" width="230" fixed="right" align="center">
				<template #default="{ row }">
					<div class="version-actions">
						<el-button
							v-if="row.stable_publish || auth.update"
							size="small"
							type="primary"
							plain
							:disabled="busy"
							@click="row.stable_publish ? showDetail(row) : edit(row)"
						>
							{{ row.stable_publish ? '详情' : '编辑' }}
						</el-button>
						<el-button
							v-if="auth.publish"
							size="small"
							:type="row.stable_publish ? 'warning' : 'success'"
							plain
							:disabled="busy"
							@click="publish(row)"
						>
							{{ row.stable_publish ? '下线' : '发布' }}
						</el-button>
						<el-button
							v-if="auth.delete"
							size="small"
							type="danger"
							plain
							:disabled="busy || row.stable_publish"
							@click="remove(row)"
						>
							删除
						</el-button>
						<span v-if="!row.stable_publish && !auth.update && !auth.publish && !auth.delete" class="hint">只读</span>
					</div>
				</template>
			</el-table-column>
		</el-table>
		<div class="version-pagination">
			<el-pagination
				:current-page="page"
				:page-size="pageSize"
                :page-sizes="[20, 40, 60, 80, 100]"
                @update:page-size="changePageSize"
				:total="total"
				:disabled="loading || busy"
				@update:current-page="changePage"
				layout="total, sizes, prev, pager, next"
			/>
		</div>
	</el-dialog>
	<el-dialog
		v-if="detail"
		:model-value="true"
		:title="`版本详情 · ${detail.version}`"
		width="680px"
		align-center
		append-to-body
		class="version-editor version-detail"
		modal-class="version-overlay"
		:close-on-click-modal="false"
		@close="detail = null"
	>
		<el-descriptions :column="1" :label-style="{ width: '110px' }">
			<el-descriptions-item label="应用">{{ app.name }}</el-descriptions-item>
			<el-descriptions-item label="发布平台">
				{{ detail.platform?.map(platformLabel).join(' / ') || detail.uni_platform || '—' }}
			</el-descriptions-item>
			<el-descriptions-item label="版本号">{{ detail.version }}</el-descriptions-item>
			<el-descriptions-item label="包类型">
				{{ detail.type === 'wgt' ? 'WGT 资源包' : '原生安装包' }}
			</el-descriptions-item>
			<el-descriptions-item label="发布状态">
				<el-tag :type="detail.stable_publish ? 'success' : 'info'" size="small">
					{{ detail.stable_publish ? '已发布' : '未发布' }}
				</el-tag>
			</el-descriptions-item>
			<el-descriptions-item label="更新内容">
				<span class="version-detail-text">{{ detail.contents || '—' }}</span>
			</el-descriptions-item>
			<el-descriptions-item
				:label="detail.type === 'wgt' || detail.platform?.includes('Android') ? '下载链接' : '应用商店链接'"
			>
				<span class="version-detail-text">{{ detail.downloadUrl || detail.url || '—' }}</span>
			</el-descriptions-item>
			<el-descriptions-item v-if="detail.type === 'wgt'" label="最低原生版本">
				{{ detail.min_uni_version || '—' }}
			</el-descriptions-item>
			<el-descriptions-item label="强制更新">{{ detail.is_mandatory ? '开启' : '关闭' }}</el-descriptions-item>
			<el-descriptions-item label="静默更新">
				{{ detail.type === 'wgt' ? (detail.is_silently ? '开启' : '关闭') : '不适用' }}
			</el-descriptions-item>
			<el-descriptions-item label="上传时间">{{ formatTime(detail.create_date) }}</el-descriptions-item>
		</el-descriptions>
	</el-dialog>
	<el-dialog
		v-model="editor"
		:title="`${form._id ? '编辑版本' : '新增版本'} · ${platformLabel(form.platform)}`"
		width="680px"
		align-center
		append-to-body
		destroy-on-close
		class="version-editor admin-form-dialog"
		modal-class="version-overlay"
		:close-on-click-modal="false"
		:show-close="!busy"
		:close-on-press-escape="!busy"
	>
		<el-alert v-if="saveError" :title="saveError" type="error" show-icon :closable="false" class="version-error" />
		<el-form ref="formRef" :model="form" :rules="rules" label-width="110px" :disabled="busy" @submit.prevent="save">
			<el-form-item label="应用">{{ app.name }}</el-form-item>
			<el-form-item label="包类型" prop="type">
				<div class="version-field">
					<el-radio-group v-model="form.type" :disabled="busy || !!form._id" @change="changePackage">
						<el-radio value="native_app">原生安装包</el-radio>
						<el-radio value="wgt" :disabled="!supportsWgt">WGT 资源包</el-radio>
					</el-radio-group>
					<span v-if="!supportsWgt" class="hint">当前应用平台暂不提供 WGT 更新。</span>
				</div>
			</el-form-item>
			<el-form-item label="版本号" prop="version">
				<el-input v-model.trim="form.version" :disabled="busy || !!form._id" placeholder="例如 1.0.0" maxlength="40" />
			</el-form-item>
			<el-form-item label="更新内容" prop="contents">
				<el-input
					v-model="form.contents"
					type="textarea"
					:rows="4"
					maxlength="10000"
					placeholder="描述本次新增功能、改进或修复"
				/>
			</el-form-item>
			<el-form-item :label="urlLabel" prop="url">
				<div class="version-field">
					<el-input
						:model-value="form.url_source === 'upload' ? packageUrl || form.url : form.url"
						@update:model-value="form.url = $event.trim()"
						:disabled="busy || form.url_source === 'upload'"
						placeholder="https://"
						maxlength="2048"
					/>
					<el-upload
						v-if="canUpload"
						ref="uploadRef"
						:accept="form.type === 'wgt' ? '.wgt' : '.apk'"
						:show-file-list="false"
						:disabled="busy"
						:before-upload="beforeUpload"
						:http-request="uploadPackage"
						:on-success="clearUpload"
						:on-error="uploadFailed"
					>
						<el-button type="primary" plain :loading="uploading" :disabled="busy">
							{{ uploading ? '上传中' : form.url ? '更换安装包' : '上传安装包' }}
						</el-button>
					</el-upload>
					<el-progress v-if="uploading" :percentage="progress" style="width: 100%" />
					<span v-if="uploadError" class="upload-error">{{ uploadError }}</span>
					<span class="hint">
						{{
							form.url_source === 'upload'
								? '下载地址由上传自动生成，更换安装包后自动更新。'
								: canUpload
								? '可上传安装包或填写 HTTPS 下载链接，上传后请核对版本号与包内版本一致。'
								: '填写对应平台应用商店的 HTTPS 链接。'
						}}
					</span>
				</div>
			</el-form-item>
			<el-form-item v-if="form.type === 'wgt'" label="最低原生版本" prop="min_uni_version">
				<el-input v-model.trim="form.min_uni_version" placeholder="例如 1.0.0" maxlength="40" />
			</el-form-item>
			<el-form-item label="强制更新">
				<el-switch v-model="form.is_mandatory" :disabled="busy || form.is_silently" />
			</el-form-item>
			<el-form-item v-if="form.type === 'wgt'" label="静默更新">
				<el-switch v-model="form.is_silently" :disabled="busy || form.is_mandatory" />
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button :disabled="busy" @click="editor = false">取消</el-button>
			<el-button type="primary" :loading="saving" :disabled="uploading" @click="save">保存</el-button>
		</template>
	</el-dialog>
</template>

<script setup>
import { importTenantAdmin } from '../../../common/tenant-session.js';
import '../../../common/form-dialog.css';
import { ElAlert, ElButton, ElDescriptions, ElDescriptionsItem, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElPagination, ElProgress, ElRadio, ElRadioGroup, ElSwitch, ElTabPane, ElTable, ElTableColumn, ElTabs, ElTag, ElUpload, vLoading } from 'element-plus';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/descriptions/style/css.mjs';
import 'element-plus/es/components/descriptions-item/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/pagination/style/css.mjs';
import 'element-plus/es/components/progress/style/css.mjs';
import 'element-plus/es/components/radio/style/css.mjs';
import 'element-plus/es/components/radio-group/style/css.mjs';
import 'element-plus/es/components/switch/style/css.mjs';
import 'element-plus/es/components/tab-pane/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/table-column/style/css.mjs';
import 'element-plus/es/components/tabs/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/upload/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import 'element-plus/es/components/message-box/style/css.mjs';

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import { isCloudFile, resolveFileUrl } from '../../../common/storage.js';
const props = defineProps({ app: { type: Object, required: true } });
defineEmits(['close']);
const api = importTenantAdmin();
const rows = ref([]),
	page = ref(1),
    pageSize = ref(20),
	loading = ref(false),
	error = ref('');
const auth = reactive({ create: false, update: false, delete: false, publish: false });
const editor = ref(false),
	detail = ref(null),
	formRef = ref(),
	saving = ref(false),
	acting = ref(false),
	saveError = ref('');
const uploading = ref(false),
	progress = ref(0),
	uploadError = ref(''),
	uploadRef = ref();
const busy = computed(() => saving.value || uploading.value || acting.value);
const platforms = ['Android', 'iOS', 'Harmony'];
const activePlatform = ref('Android');
const total = ref(0);
function changePlatform() {
	page.value = 1;
	load();
}
function changePageSize(value) {
 if (pageSize.value === value) return;
 pageSize.value = value; page.value = 1; load();
}
function changePage(value) {
	if (page.value === value) return;
	page.value = value;
	load();
}
const platformLabel = (platform) => (platform === 'Harmony' ? 'HarmonyOS' : platform);
const empty = () => ({
	_id: '',
	platform: activePlatform.value,
	type: 'native_app',
	version: '',
	contents: '',
	url: '',
	url_source: 'manual',
	min_uni_version: '',
	is_mandatory: false,
	is_silently: false
});
const form = reactive(empty());
const packageUrl = ref('');
const supportsWgt = computed(
	() => form.platform !== 'Harmony' && !(props.app.app_type === 1 && form.platform === 'Android')
);
const canUpload = computed(() => form.type === 'wgt' || form.platform === 'Android');
const urlLabel = computed(() => (canUpload.value ? '下载链接' : '应用商店链接'));
const required = (message) => [{ required: true, whitespace: true, message, trigger: 'blur' }];
const versionRule = [
	{
		required: true,
		pattern: /^\d{1,8}(\.\d{1,8}){0,3}$/,
		message: '请输入最多四段数字版本号，例如 1.0.0',
		trigger: 'blur'
	}
];
const rules = {
	type: required('请选择包类型'),
	version: versionRule,
	min_uni_version: versionRule,
	contents: required('请输入更新内容'),
	url: [{ validator: (_rule, value, callback) => {
		const valid = /^https:\/\/[^\s<>]+$/i.test(value || '') || (form.url_source === 'upload' && isCloudFile(value));
		callback(valid ? undefined : new Error('请上传安装包或填写 HTTPS 链接'));
	}, trigger: 'blur' }]
};
const message = (e) => e?.errMsg || e?.message || '操作失败，请重试';
let request = 0,
	disposed = false;
async function call(name, params = {}) {
	const result = await api[name]({ ...params, appid: props.app.appid });
	if (result.errCode) throw result;
	return result;
}
async function load() {
	const id = ++request;
	loading.value = true;
	error.value = '';
	try {
		const result = await call('listAppVersions', { platform: activePlatform.value, current: page.value, size: pageSize.value });
		if (id !== request) return;
		rows.value = result.data || [];
		Object.assign(auth, result.auth);
		page.value = result.pagination.current;
		total.value = result.pagination.count;
	} catch (e) {
		if (id === request) {
			error.value = message(e);
			rows.value = [];
			total.value = 0;
			Object.assign(auth, { create: false, update: false, delete: false, publish: false });
		}
	} finally {
		if (id === request) loading.value = false;
	}
}
function formatTime(value) {
	if (!value) return '—';
	const d = new Date(value);
	return Number.isNaN(d.getTime())
		? '—'
		: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d
				.toTimeString()
				.slice(0, 8)}`;
}
async function showDetail(row) {
	const current = { ...row, platform: row.platform ? [...row.platform] : [] };
	detail.value = current;
	try {
		const url = await resolveFileUrl(row.url, uniCloud);
		if (detail.value?._id === current._id) detail.value.downloadUrl = url;
	} catch (e) { ElMessage.error(message(e)); }
}
async function edit(row) {
	if (
		row &&
		(row.platform?.length !== 1 || !platforms.includes(row.platform[0]) || !['native_app', 'wgt'].includes(row.type))
	) {
		ElMessage.warning('此历史版本的多平台或包类型配置暂不支持编辑，请新增对应平台版本');
		return;
	}
	Object.assign(form, empty());
	packageUrl.value = '';
	if (row)
		for (const key of Object.keys(empty()))
			if (row[key] != null) form[key] = key === 'platform' ? row.platform[0] : row[key];
	saveError.value = '';
	uploadError.value = '';
	editor.value = true;
	await nextTick();
	formRef.value?.clearValidate();
	if (row?.url_source === 'upload') {
		try {
			const url = await resolveFileUrl(row.url, uniCloud);
			if (editor.value && form._id === row._id && form.url === row.url) packageUrl.value = url;
		} catch (e) { uploadError.value = message(e); }
	}
}
function changePackage() {
	if (!supportsWgt.value) form.type = 'native_app';
	form.url = '';
	packageUrl.value = '';
	form.url_source = 'manual';
	form.min_uni_version = '';
	form.is_silently = false;
	uploadError.value = '';
}
async function save() {
	if (busy.value || !(await formRef.value.validate().catch(() => false))) return;
	saving.value = true;
	saveError.value = '';
	try {
		await call('saveAppVersion', { ...form, platform: [form.platform] });
		editor.value = false;
		ElMessage.success('版本已保存，发布后生效');
		await load();
	} catch (e) {
		saveError.value = message(e);
	} finally {
		saving.value = false;
	}
}
async function publish(row) {
	if (busy.value) return;
	acting.value = true;
	try {
		await ElMessageBox.confirm(
			row.stable_publish
				? `确定下线版本 ${row.version} 吗？`
				: `确定发布 ${row.platform?.map(platformLabel).join(' / ')} 版本 ${
						row.version
				  } 吗？请确认安装包与版本资料一致。`,
			row.stable_publish ? '下线版本' : '发布版本',
			{ type: 'warning', confirmButtonText: row.stable_publish ? '下线' : '发布', cancelButtonText: '取消' }
		);
		await call('publishAppVersion', { _id: row._id, published: !row.stable_publish });
		ElMessage.success(row.stable_publish ? '版本已下线' : '版本已发布');
		await load();
	} catch (e) {
		if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e));
	} finally {
		acting.value = false;
	}
}
async function remove(row) {
	if (busy.value) return;
	acting.value = true;
	try {
		await ElMessageBox.confirm(`确定删除版本 ${row.version} 的记录吗？`, '删除版本', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		});
		await call('deleteAppVersion', { _id: row._id });
		ElMessage.success('版本已删除');
		await load();
	} catch (e) {
		if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e));
	} finally {
		acting.value = false;
	}
}
function beforeUpload(file) {
	uploadError.value = '';
	if (busy.value) return false;
	const ext = form.type === 'wgt' ? '.wgt' : '.apk';
	if (!file.size || !file.name.toLowerCase().endsWith(ext)) {
		uploadError.value = `请选择有效的 ${ext} 文件`;
		return false;
	}
	return true;
}
const clearUpload = () => uploadRef.value?.clearFiles();
const uploadFailed = (e) => {
	clearUpload();
	uploadError.value = message(e);
};
async function uploadPackage({ file, onProgress }) {
	uploading.value = true;
	progress.value = 0;
	const filePath = URL.createObjectURL(file);
	try {
		const ext = form.type === 'wgt' ? 'wgt' : 'apk';
		const result = await uniCloud.uploadFile({
			filePath,
			cloudPath: `app-packages/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
			cloudPathAsRealPath: true,
			fileType: 'other',
			onUploadProgress: ({ loaded, total }) => {
				progress.value = total ? Math.min(99, Math.round((loaded * 100) / total)) : 0;
				onProgress({ percent: progress.value });
			}
		});
		// Keep cloud:// file IDs in records; resolve access URLs only for presentation/download.
		if (!/^https:\/\/[^\s<>]+$/i.test(result.fileID || '') && !isCloudFile(result.fileID))
			throw new Error('上传未返回有效的文件地址，请重试');
		if (!disposed) {
			form.url = result.fileID;
			form.url_source = 'upload';
			packageUrl.value = '';
			try { packageUrl.value = await resolveFileUrl(result.fileID, uniCloud); }
			catch (e) { uploadError.value = message(e); }
			progress.value = 100;
		}
		return result;
	} finally {
		URL.revokeObjectURL(filePath);
		uploading.value = false;
	}
}
onMounted(load);
onBeforeUnmount(() => {
	request++;
	disposed = true;
});
</script>

<style scoped>
.version-toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	margin-bottom: 16px;
}
.version-platforms {
	flex: 1;
	min-width: 0;
}
.version-platforms :deep(.el-tabs__header) {
	margin: 0;
}
.version-toolbar-actions {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
}
.hint {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	line-height: 1.6;
	overflow-wrap: anywhere;
}
.version-actions {
	display: flex;
	justify-content: center;
	gap: 6px;
}
.version-toolbar-actions :deep(.el-button + .el-button),
.version-actions :deep(.el-button + .el-button) {
	margin-left: 0;
}
.version-table {
	--el-table-header-bg-color: var(--el-fill-color-light);
}
.version-table :deep(th.el-table__cell) {
	height: 48px;
	font-weight: 500;
}
.version-table :deep(td.el-table__cell) {
	padding: 12px 0;
}
.version-pagination {
	display: flex;
	justify-content: flex-end;
	padding-top: 16px;
}
.version-field {
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
	min-width: 0;
	align-items: flex-start;
}
.upload-error {
	font-size: 12px;
	color: var(--el-color-danger);
}
.version-error {
	margin-bottom: 16px;
}
.version-detail-text {
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
.version-detail :deep(.el-descriptions__table) {
	table-layout: fixed;
}
.version-detail :deep(.el-descriptions__cell) {
	vertical-align: top;
}
:global(.version-overlay .el-overlay-dialog) {
	overflow: hidden;
}
:global(.version-panel),
:global(.version-editor) {
	display: flex;
	flex-direction: column;
	max-width: calc(100vw - 32px);
	max-height: calc(100dvh - 32px);
	margin: 0;
	padding: 0;
	overflow: hidden;
	border-radius: 8px;
}
:global(.version-panel > .el-dialog__header),
:global(.version-editor > .el-dialog__header),
:global(.version-editor > .el-dialog__footer) {
	padding: 16px 24px;
	margin: 0;
	flex-shrink: 0;
	border-bottom: 1px solid var(--el-border-color-lighter);
}
:global(.version-panel > .el-dialog__body),
:global(.version-editor > .el-dialog__body) {
	padding: 20px 24px;
	min-width: 0;
	min-height: 0;
	overflow-y: auto;
	overscroll-behavior: contain;
}
:global(.version-editor > .el-dialog__footer) {
	border-top: 1px solid var(--el-border-color-lighter);
	border-bottom: 0;
}
</style>
