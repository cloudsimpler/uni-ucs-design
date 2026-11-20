const { accessContext, fail } = require('./admin-access');
const { createFields, updateFields } = require('../../lib/utils/record-metadata');
const table = 'ucsdb-app-list';
const suffix = 'OPENDB_APP_LIST';
const fields = ['appid', 'name', 'app_type', 'icon_url', 'description'];
const publicApp = (row) => Object.fromEntries(['_id', ...fields, 'create_date'].map((key) => [key, row[key]]));

function createAppAdmin({ db, uid, appId }) {
	const ctx = accessContext({ db, uid, appId });
	const authorize = async (action) => {
		const auth = await ctx.actor();
		if (action === 'read') ctx.requireRead(auth, suffix);
		else ctx.requirePermission(auth, `${action.toUpperCase()}_${suffix}`);
		return auth;
	};
	const find = async (id) => {
		if (typeof id !== 'string' || !id || id.length > 100) fail('应用 ID 不正确');
		const { data } = await db.collection(table).doc(id).get();
		const row = Array.isArray(data) ? data[0] : data;
		if (!row) fail('应用不存在或已被删除', 'APP_ADMIN_NOT_FOUND');
		return row;
	};
	const validate = async (params, old) => {
		const value = { appid: '', name: '', app_type: 0, icon_url: '', description: '', ...old };
		for (const key of fields) if (params[key] !== undefined) value[key] = params[key];
		for (const [key, max] of Object.entries({ appid: 100, name: 80, icon_url: 2048, description: 500 })) {
			if (typeof value[key] !== 'string' || value[key].length > max) fail('应用资料格式或长度不正确');
			value[key] = value[key].trim();
		}
		if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(value.appid))
			fail('请输入有效的 AppID，仅支持字母、数字、下划线、点和短横线');
		if (!value.name) fail('请输入应用名称');
		if (![0, 1].includes(value.app_type)) fail('请选择应用类型：uni-app 或 uni-app x');
		if (old && value.appid !== old.appid) fail('AppID 创建后不可修改');
		if (old && value.app_type !== (old.app_type ?? 0)) fail('应用类型创建后不可修改');
		if (value.icon_url && !/^(https?:\/\/|cloud:\/\/)[^\s<>]+$/i.test(value.icon_url)) fail('请上传有效的应用图标');
		const { data } = await db.collection(table).where({ appid: value.appid }).limit(2).get();
		if (data.some((row) => row._id !== old?._id)) fail('AppID 已存在');
		return Object.fromEntries(fields.map((key) => [key, value[key]]));
	};
	const referenced = async (name, where) => {
		const { data } = await db.collection(name).where(where).field({ _id: true }).limit(1).get();
		return data.length > 0;
	};
	return {
		async list() {
			const auth = await authorize('read');
			const rows = await ctx.all(table);
			return {
				errCode: 0,
				data: rows
					.map(publicApp)
					.sort((a, b) => (b.create_date || 0) - (a.create_date || 0) || a.appid.localeCompare(b.appid)),
				auth: { ...ctx.capabilities(auth, suffix), versions: ctx.can(auth, 'READ_OPENDB_APP_VERSIONS') },
				currentAppId: appId
			};
		},
		async save(params = {}) {
			if (!params || typeof params !== 'object' || Array.isArray(params)) fail('应用参数不正确');
			const auth = await authorize(params._id ? 'update' : 'create');
			const old = params._id ? await find(params._id) : null;
			const value = await validate(params, old);
			try {
				if (old) {
					const result = await db.collection(table).doc(old._id).update({ ...value, ...updateFields(auth) });
					if (result.updated === 0) await find(old._id);
					return { errCode: 0, id: old._id };
				}
				const { id } = await db.collection(table).add({ ...value, ...createFields(auth) });
				return { errCode: 0, id };
			} catch (error) {
				if (/duplicate|E11000/i.test(error.message || error.errMsg || '')) fail('AppID 已存在');
				throw error;
			}
		},
		async remove(params = {}) {
			await authorize('delete');
			const old = await find(params?._id);
			if (old.appid === appId) fail('不能删除当前后台应用');
			if (await referenced('uni-id-users', { dcloud_appid: old.appid }))
				fail('有用户已授权此应用，请先调整用户的应用授权');
			if (await referenced('ucsdb-app-versions', { appid: old.appid })) fail('应用存在版本记录，不能删除');
			const result = await db.collection(table).doc(old._id).remove();
			if (result.deleted === 0) fail('应用已被删除，请刷新列表');
			return { errCode: 0 };
		}
	};
}
module.exports = { createAppAdmin };
