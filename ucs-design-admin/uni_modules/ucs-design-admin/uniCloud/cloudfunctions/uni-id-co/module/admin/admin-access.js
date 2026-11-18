const fail = (errMsg, errCode = 'ADMIN_ACCESS_INVALID') => {
	throw { errCode, errMsg };
};
const { accountTypeOf, hasManagementIdentity, hasAccountType } = require('./account-types');
function accessContext({ db, uid, appId }) {
	const all = async (table, where = {}) => {
		const rows = [];
		for (let skip = 0; skip < 5000; skip += 100) {
			const { data } = await db.collection(table).where(where).orderBy('_id', 'asc').skip(skip).limit(100).get();
			rows.push(...data);
			if (data.length < 100) return rows;
		}
		fail('数据超过 5000 条，请联系管理员整理');
	};
	const actor = async () => {
		if (!uid) fail('请先登录', 'ADMIN_ACCESS_UNAUTHORIZED');
		const { data } = await db.collection('uni-id-users').doc(uid).get();
		const user = Array.isArray(data) ? data[0] : data;
		const apps = user?.dcloud_appid;
		if (
			!user || !hasManagementIdentity(user) ||
			(user.status || 0) !== 0 ||
			(apps != null && (!Array.isArray(apps) || (!apps.includes('*') && !apps.includes(appId))))
		)
			fail('当前账号已停用或无权登录此应用', 'ADMIN_ACCESS_FORBIDDEN');
		const isAdmin = (user.role || []).includes('admin');
		const roles = !isAdmin && user.role?.length ? await all('uni-id-roles', { role_id: db.command.in(user.role) }) : [];
		const permissions = [...new Set(roles.flatMap((role) => role.permission || []))];
		const menuIds = [...new Set(roles.flatMap((role) => role.menu_ids || []))];
		return { uid, isAdmin, permissions, menuIds, apps, role: user.role || [] };
	};
	const can = (auth, id) => auth.isAdmin || auth.permissions.includes(id);
	const requirePermission = (auth, id) => {
		if (!can(auth, id)) fail('没有此项操作权限', 'ADMIN_ACCESS_FORBIDDEN');
	};
	const capabilities = (auth, suffix) =>
		Object.fromEntries(
			['read', 'create', 'update', 'delete'].map((key) => [key, can(auth, `${key.toUpperCase()}_${suffix}`)])
		);
	const requireRead = (auth, suffix) => {
		if (!Object.values(capabilities(auth, suffix)).some(Boolean)) fail('没有查询权限', 'ADMIN_ACCESS_FORBIDDEN');
	};
	return { all, actor, can, requirePermission, capabilities, requireRead };
}
module.exports = { accessContext, fail };
