const { accessContext, fail } = require('./admin-access');
const { createHash } = require('crypto');
const table = 'opendb-app-versions';
const suffix = 'OPENDB_APP_VERSIONS';
const urlSource = (row) =>
	row.url_source || (/\/app-packages\/\d+-[a-z0-9]+\.(apk|wgt)(?:\?|$)/i.test(row.url || '') ? 'upload' : 'manual');
const versionPattern = /^\d{1,8}(\.\d{1,8}){0,3}$/;
const normalizeVersion = (value) => {
	if (typeof value !== 'string' || !versionPattern.test(value)) fail('版本号须为最多四段数字，例如 1.0.0');
	const parts = value.split('.').map(Number);
	while (parts.length > 1 && parts[parts.length - 1] === 0) parts.pop();
	return parts;
};
const compareVersion = (a, b) => {
	const x = normalizeVersion(a),
		y = normalizeVersion(b);
	for (let i = 0; i < Math.max(x.length, y.length); i++)
		if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
	return 0;
};
function createVersionAdmin({ db, uid, appId }) {
	const ctx = accessContext({ db, uid, appId });
	const authorize = async (action) => {
		const auth = await ctx.actor();
		ctx.requirePermission(auth, `${action}_${suffix}`);
		return auth;
	};
	const app = async (appid) => {
		if (typeof appid !== 'string' || !appid || appid.length > 100) fail('请选择应用');
		const { data } = await db.collection('opendb-app-list').where({ appid }).limit(1).get();
		if (!data.length) fail('应用不存在或已被删除');
		return data[0];
	};
	const find = async (appid, id) => {
		if (typeof id !== 'string' || !id || id.length > 100) fail('版本 ID 不正确');
		const { data } = await db.collection(table).where({ _id: id, appid }).get();
		if (!data.length) fail('版本不存在或不属于此应用');
		return data[0];
	};
	const validate = (params, application) => {
		const value = {};
		for (const [key, max] of Object.entries({
			version: 40,
			contents: 10000,
			url: 2048,
			min_uni_version: 40
		})) {
			const text = params[key] ?? '';
			if (typeof text !== 'string' || text.length > max) fail('版本资料格式或长度不正确');
			value[key] = text.trim();
		}
		normalizeVersion(value.version);
		value.title = `发现新版本 ${value.version}`;
		if (!value.contents) fail('请填写更新内容');
		value.url_source = urlSource(params);
		if (!['manual', 'upload'].includes(value.url_source)) fail('下载链接来源不正确');
		const validUrl = value.url_source === 'upload' ? /^(https:\/\/|cloud:\/\/)[^\s<>]+$/i : /^https:\/\/[^\s<>]+$/i;
		if (!validUrl.test(value.url)) fail('请上传安装包或填写有效的 HTTPS 链接');
		if (!['native_app', 'wgt'].includes(params.type)) fail('请选择安装包类型');
		if (
			!Array.isArray(params.platform) ||
			params.platform.length !== 1 ||
			!['Android', 'iOS', 'Harmony'].includes(params.platform[0])
		)
			fail('每条版本请选择一个发布平台');
		value.type = params.type;
		value.platform = [...params.platform];
		value.uni_platform = params.platform[0].toLowerCase();
		for (const key of ['is_mandatory', 'is_silently']) {
			if (params[key] !== undefined && typeof params[key] !== 'boolean') fail('更新策略格式不正确');
			value[key] = params[key] || false;
		}
		if (value.type === 'wgt') {
			if (value.platform[0] === 'Harmony' || (application.app_type === 1 && value.platform[0] === 'Android'))
				fail('此应用平台暂不支持 WGT 资源包');
			normalizeVersion(value.min_uni_version);
		} else {
			value.min_uni_version = '';
			value.is_silently = false;
		}
		if (value.is_silently && value.is_mandatory) fail('静默更新和强制更新不能同时开启');
		return value;
	};
	const checkDuplicate = async (appid, value, id) => {
		const rows = await ctx.all(table, { appid, type: value.type });
		if (
			rows.some(
				(row) =>
					row._id !== id &&
					row.platform?.some((p) => value.platform.includes(p)) &&
					versionPattern.test(row.version) &&
					compareVersion(row.version, value.version) === 0
			)
		)
			fail('该平台和包类型下版本号已存在');
		return rows;
	};
	return {
		async list(params = {}) {
			if (!params || typeof params !== 'object' || Array.isArray(params)) fail('查询参数不正确');
			const { current = 1, size = 20, platform = 'Android' } = params;
			if (!Number.isInteger(current) || current < 1 || current > 100000 || !Number.isInteger(size) || size < 1 || size > 100)
				fail('分页参数不正确');
			if (!['Android', 'iOS', 'Harmony'].includes(platform)) fail('请选择有效的发布平台');
			const auth = await authorize('READ');
			await app(params.appid);
			// Older records without a platform array use uni_platform.
			const where = db.command.and([{ appid: params.appid }, db.command.or([
				{ platform },
				db.command.and([{ platform: db.command.in([null, []]) }, { uni_platform: platform.toLowerCase() }])
			])]);
			const collection = db.collection(table);
			const { total: count } = await collection.where(where).count();
			const page = Math.min(current, Math.max(1, Math.ceil(count / size)));
			const { data: rows } = await collection.where(where).orderBy('create_date', 'desc').orderBy('_id', 'asc')
				.skip((page - 1) * size).limit(size).get();
			return {
				errCode: 0,
				data: rows.map((row) => ({ ...row, url_source: urlSource(row) })),
				pagination: { current: page, size, count },
				auth: { ...ctx.capabilities(auth, suffix), publish: ctx.can(auth, `PUBLISH_${suffix}`) }
			};
		},
		async save(params = {}) {
			await authorize(params._id ? 'UPDATE' : 'CREATE');
			const application = await app(params.appid);
			const old = params._id ? await find(params.appid, params._id) : null;
			if (old?.stable_publish) fail('请先下线版本再编辑');
			const value = validate(
				{ ...params, url_source: params.url_source ?? (old ? urlSource(old) : undefined) },
				application
			);
			if (old && urlSource(old) === 'upload' && value.url_source !== 'upload')
				fail('上传生成的下载地址请通过更换安装包更新');
			if (
				old &&
				(compareVersion(old.version, value.version) !== 0 ||
					old.type !== value.type ||
					JSON.stringify(old.platform) !== JSON.stringify(value.platform))
			)
				fail('版本号、平台和包类型创建后不可修改，请新增版本');
			await checkDuplicate(params.appid, value, old?._id);
			if (old) {
				const result = await db
					.collection(table)
					.where({ _id: old._id, appid: params.appid, stable_publish: db.command.neq(true) })
					.update({ ...value, name: application.name });
				if (!result.updated) {
					const current = await find(params.appid, old._id);
					if (current.stable_publish) fail('版本已发布，请刷新后重试');
				}
				return { errCode: 0, id: old._id };
			}
			const id = createHash('sha256')
				.update(JSON.stringify([params.appid, value.type, value.platform[0], normalizeVersion(value.version)]))
				.digest('hex')
				.slice(0, 24);
			try {
				await db.collection(table).add({
					...value,
					_id: id,
					appid: params.appid,
					name: application.name,
					stable_publish: false,
					create_env: 'upgrade-center',
					create_date: Date.now()
				});
			} catch (e) {
				if (/duplicate|E11000/i.test(e.message || e.errMsg || '')) fail('该平台和包类型下版本号已存在');
				throw e;
			}
			return { errCode: 0, id };
		},
		async publish(params = {}) {
			await authorize('PUBLISH');
			const application = await app(params.appid);
			const old = await find(params.appid, params._id);
			if (typeof params.published !== 'boolean') fail('发布状态不正确');
			if (params.published) {
				const value = validate(old, application);
				const rows = await checkDuplicate(params.appid, value, old._id);
				if (
					rows.some(
						(row) =>
							row._id !== old._id &&
							row.stable_publish &&
							row.platform?.some((p) => value.platform.includes(p)) &&
							versionPattern.test(row.version) &&
							compareVersion(row.version, value.version) >= 0
					)
				)
					fail('发布版本必须高于该平台同类型的线上版本');
				// Match the reviewed payload so a concurrent edit cannot publish unvalidated data.
				const reviewed = Object.fromEntries(
					['_id', 'appid', 'url', 'version', 'title', 'contents', 'min_uni_version', 'is_mandatory', 'is_silently']
						.filter((key) => old[key] !== undefined)
						.map((key) => [key, old[key]])
				);
				const result = await db.collection(table).where(reviewed).update({ stable_publish: true });
				if (!result.updated && !(await find(params.appid, old._id)).stable_publish)
					fail('版本已变更，请刷新后重新发布');
			} else {
				await db.collection(table).where({ _id: old._id, appid: params.appid }).update({ stable_publish: false });
			}
			return { errCode: 0 };
		},
		async remove(params = {}) {
			await authorize('DELETE');
			await app(params.appid);
			const old = await find(params.appid, params._id);
			if (old.stable_publish) fail('请先下线版本再删除');
			const result = await db
				.collection(table)
				.where({ _id: old._id, appid: params.appid, stable_publish: db.command.neq(true) })
				.remove();
			if (!result.deleted) fail('版本状态已变化，请刷新后重试');
			return { errCode: 0 };
		}
	};
}
module.exports = { createVersionAdmin, compareVersion };
