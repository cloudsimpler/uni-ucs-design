import { resolveFileUrls } from './storage.js';
const imageTypes = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function uploadAvatarImage(file, { storage, checkImage, onProgress = () => {} }) {
	const ext = imageTypes[file?.type];
	if (!ext) throw new Error('请选择 JPG、PNG 或 WebP 图片');
	if (!file.size) throw new Error('请选择非空图片');
	await checkImage(file.path);
	const result = await storage.uploadFile({
		filePath: file.path,
		cloudPath: `user-avatar/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
		cloudPathAsRealPath: true,
		fileType: 'image',
		onUploadProgress: ({ loaded, total }) => onProgress(total ? Math.min(99, Math.round((loaded * 100) / total)) : 0)
	});
	if (!/^(https?:\/\/|cloud:\/\/)[^\s]+$/i.test(result.fileID || ''))
		throw new Error('上传未返回有效的图片地址，请重试');
	const [user] = await resolveUserAvatars([{ avatar: result.fileID }], storage);
	if (!user.avatarPreview) throw new Error('图片已上传，但预览地址获取失败，请重试');
	onProgress(100);
	return user;
}

// Store permanent file IDs; resolve cloud:// IDs again when reading users.
export async function resolveUserAvatars(users, storage) {
	const urls = await resolveFileUrls(users.map(user => user.avatar), storage);
	return users.map((user) => ({
		...user,
		avatarPreview: /^https?:\/\//i.test(user.avatar || '') ? user.avatar : urls.get(user.avatar) || ''
	}));
}
