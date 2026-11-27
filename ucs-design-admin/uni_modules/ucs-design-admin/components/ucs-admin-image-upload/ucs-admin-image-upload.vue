<template>
	<div class="image-upload-field">
		<div class="image-upload-card" :class="{ 'has-image': modelValue, 'show-remove': showRemove, 'is-disabled': uploadDisabled }"
			:aria-busy="uploading" @pointerenter="onPointerEnter" @pointerleave="showRemove = false">
			<el-upload ref="uploadRef" class="image-picker" :accept="acceptedImageTypes.join(',')" :limit="1"
				:show-file-list="false" :disabled="uploadDisabled" :before-upload="beforeUpload"
				:http-request="upload" :on-success="clearFiles" :on-error="uploadFailed">
				<template v-if="modelValue">
					<span class="visually-hidden">上传新的{{ label }}</span>
					<el-image v-if="previewUrl" :src="previewUrl" alt="" :fit="fit" class="preview-image">
						<template #placeholder><span class="preview-state">加载中</span></template>
						<template #error><span class="preview-state">预览不可用</span></template>
					</el-image>
					<span v-else class="preview-state">{{ previewUrl === undefined ? '加载中' : '预览不可用' }}</span>
				</template>
				<span v-else class="picker-label">
					<el-icon aria-hidden="true"><Plus /></el-icon>
					<span>上传{{ label }}</span>
				</span>
			</el-upload>
			<div v-if="uploading" class="upload-progress" role="status">
				<el-icon class="is-loading" aria-hidden="true"><Loading /></el-icon>
				<span class="visually-hidden">上传中</span>
			</div>
			<button v-if="modelValue && !uploading" class="remove-image" type="button" :aria-label="`移除${label}`"
				:title="`移除${label}`" :disabled="disabled" @click="remove">
				<el-icon aria-hidden="true"><Delete /></el-icon>
			</button>
		</div>
		<span class="image-upload-hint">支持 JPG、PNG、WebP{{ maxSizeMb == null ? '。' : `，最大 ${maxSizeMb} MB。` }}</span>
	</div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { ElIcon, ElImage, ElUpload } from 'element-plus';
import { Delete, Loading, Plus } from '@element-plus/icons-vue';
import 'element-plus/es/components/icon/style/css.mjs';
import 'element-plus/es/components/image/style/css.mjs';
import 'element-plus/es/components/upload/style/css.mjs';
import { uploadAvatarImage } from '../../common/avatar.js';
import { resolveFileUrls } from '../../common/storage.js';

const props = defineProps({
	modelValue: { type: String, default: '' },
	label: { type: String, default: '图片' },
	directory: { type: String, required: true },
	maxSizeMb: { type: Number, default: 2 },
	fit: { type: String, default: 'contain' },
	initialPreview: { type: String, default: '' },
	disabled: Boolean
});
const emit = defineEmits(['update:modelValue', 'uploading-change', 'error']);
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const uploadRef = ref();
const preview = shallowRef(props.modelValue && props.initialPreview
	? { file: props.modelValue, url: props.initialPreview }
	: null);
const previewUrl = computed(() => preview.value?.file === props.modelValue ? preview.value?.url : undefined);
const uploading = ref(false);
const uploadDisabled = computed(() => props.disabled || uploading.value);
const showRemove = ref(false);
let modelRevision = 0;
let disposed = false;

watch(() => props.modelValue, async (file, _previous, onCleanup) => {
	modelRevision++;
	if (file === preview.value?.file) return;
	preview.value = null;
	if (!file) return;
	let active = true;
	onCleanup(() => { active = false; });
	const urls = await resolveFileUrls([file], uniCloud);
	if (active) preview.value = { file, url: urls.get(file) || '' };
}, { immediate: true, flush: 'sync' });

function onPointerEnter(event) {
	if (!uploadDisabled.value && event.pointerType !== 'touch') showRemove.value = true;
}

function beforeUpload(file) {
	if (uploadDisabled.value) return false;
	emit('error', '');
	if (!acceptedImageTypes.includes(file.type) || !file.size) {
		emit('error', '请选择有效的 JPG、PNG 或 WebP 图片');
		return false;
	}
	if (props.maxSizeMb == null || file.size <= props.maxSizeMb * 1024 * 1024) return true;
	emit('error', `${props.label}不能超过 ${props.maxSizeMb} MB`);
	return false;
}

async function upload({ file, onProgress }) {
	const filePath = URL.createObjectURL(file);
	const revision = modelRevision;
	showRemove.value = false;
	uploading.value = true;
	emit('uploading-change', true);
	try {
		const result = await uploadAvatarImage({ path: filePath, type: file.type, size: file.size }, {
			storage: uniCloud,
			checkImage: src => uni.getImageInfo({ src }),
			onProgress: percent => onProgress({ percent }),
			directory: props.directory
		});
		if (!disposed && modelRevision === revision) {
			preview.value = { file: result.avatar, url: result.avatarPreview };
			emit('update:modelValue', result.avatar);
		}
	} catch (error) {
		if (!disposed && modelRevision === revision) throw error;
	} finally {
		URL.revokeObjectURL(filePath);
		uploading.value = false;
		if (!disposed) emit('uploading-change', false);
	}
}

function clearFiles() {
	uploadRef.value?.clearFiles();
}

function uploadFailed(error) {
	clearFiles();
	if (!disposed) emit('error', error?.errMsg || error?.message || '图片上传失败，请重试');
}

async function remove() {
	if (uploadDisabled.value || !props.modelValue) return;
	emit('error', '');
	emit('update:modelValue', '');
	await nextTick();
	uploadRef.value?.$el?.querySelector('[role="button"]')?.focus();
}

onBeforeUnmount(() => {
	disposed = true;
	if (uploading.value) emit('uploading-change', false);
});
</script>

<style scoped>
.image-upload-field {
	display: flex;
	width: 100%;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
}
.image-upload-card {
	position: relative;
	width: 112px;
	aspect-ratio: 1;
	box-sizing: border-box;
	overflow: hidden;
	border: 1px dashed var(--el-border-color);
	border-radius: 8px;
	background: var(--el-fill-color-lighter);
}
.image-upload-card.has-image {
	border-style: solid;
	background: var(--el-bg-color);
}
.image-upload-card:not(.is-disabled):hover,
.image-upload-card:not(.is-disabled):has(:focus-visible) {
	border-color: var(--el-color-primary);
}
.preview-image {
	display: block;
	width: 100%;
	height: 100%;
}
.preview-state {
	display: grid;
	height: 100%;
	place-items: center;
	color: var(--el-text-color-secondary);
	font-size: 12px;
}
.image-picker,
.image-picker :deep(.el-upload) {
	width: 100%;
	height: 100%;
}
.image-picker :deep(.el-upload) {
	display: flex;
	color: var(--el-text-color-secondary);
}
.picker-label {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 7px;
	font-size: 12px;
	line-height: 1.2;
}
.picker-label .el-icon {
	font-size: 22px;
}
.remove-image {
	position: absolute;
	top: 0;
	right: 0;
	display: grid;
	width: 28px;
	height: 28px;
	margin: 0;
	padding: 0;
	place-items: center;
	border: 0;
	border-radius: 0 0 0 8px;
	background: rgb(0 0 0 / 52%);
	color: #fff;
	font-size: 14px;
	line-height: 1;
	cursor: pointer;
	opacity: 0;
	pointer-events: none;
	transition: opacity 150ms ease, background-color 150ms ease;
}
.remove-image::after {
	border: 0;
}
@media (prefers-reduced-motion: reduce) {
	.remove-image {
		transition: none;
	}
}
.show-remove .remove-image,
.image-upload-card:has(:focus-visible) .remove-image {
	opacity: 1;
	pointer-events: auto;
}
@media (hover: none) {
	.remove-image {
		opacity: 1;
		pointer-events: auto;
	}
}
.image-upload-card:not(.has-image) .image-picker :deep(.el-upload:not(.is-disabled):hover) {
	color: var(--el-color-primary);
}
.remove-image:not(:disabled):hover {
	background: rgb(0 0 0 / 76%);
}
.image-picker :deep(.el-upload:focus-visible),
.remove-image:focus-visible {
	outline: 2px solid var(--el-color-primary);
	outline-offset: -2px;
}
.remove-image:disabled {
	cursor: not-allowed;
}
.upload-progress {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(0 0 0 / 32%);
	color: #fff;
	font-size: 22px;
}
.visually-hidden {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
.image-upload-hint {
	color: var(--el-text-color-secondary);
	font-size: 12px;
	line-height: 1.5;
}
</style>
