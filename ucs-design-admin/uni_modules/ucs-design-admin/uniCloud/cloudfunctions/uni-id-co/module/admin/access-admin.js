const { accessContext, fail } = require('./admin-access');
const catalog = require('./permission-catalog');
const MENU_TYPE = require('./menu-types');
const tables = { permission: 'uni-id-permissions', role: 'uni-id-roles' };
const suffixes = { permission: 'UNI_ID_PERMISSIONS', role: 'UNI_ID_ROLES' };
const text = (value, label, max, required = false) => {
	if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(`${label}格式不正确`);
	return value.trim();
};
const { createFields, updateFields } = require('../../lib/utils/record-metadata');

function createAccessAdmin(context) {
	const { db, uid } = context;
	const { all, actor, can, capabilities, requireRead, requirePermission } = accessContext(context);
	const find = (rows, id) => {
		const row = rows.find((item) => item._id === id);
		if (!row) fail('记录不存在，请刷新列表');
		return row;
	};
	const grantable = (auth, ids) => {
		if (!auth.isAdmin && ids.some((id) => !auth.permissions.includes(id)))
			fail('不能维护超出本人权限范围的角色', 'ADMIN_ACCESS_FORBIDDEN');
	};
	const grantableMenus = (auth, ids) => {
		if (!auth.isAdmin && ids.some((id) => !auth.menuIds.includes(id)))
			fail('不能维护超出本人菜单范围的角色', 'ADMIN_ACCESS_FORBIDDEN');
	};
	const list = async (kind, params = {}) => {
		if (!params || typeof params !== 'object' || Array.isArray(params)) fail('查询参数不正确');
		const menuId = params.menu_id === undefined ? undefined : text(params.menu_id, '菜单标识', 100, true);
		const auth = await actor();
		requireRead(auth, suffixes[kind]);
		if (kind === 'role') return {
			errCode: 0, data: await all(tables.role),
			auth: { ...capabilities(auth, suffixes.role), isAdmin: auth.isAdmin, permission: auth.permissions, menu_ids: auth.menuIds }
		};
		const [rows, menus] = await Promise.all([
			all(tables[kind], menuId === undefined ? {} : { menu_id: menuId }),
			all('ucsdb-admin-menus')
		]);
		return {
			errCode: 0,
			data: rows,
			menus,
			auth: { ...capabilities(auth, suffixes[kind]), isAdmin: auth.isAdmin, permission: auth.permissions, menu_ids: auth.menuIds }
		};
	};
	const save = async (kind, params = {}) => {
		const auth = await actor();
		requirePermission(auth, `${params._id ? 'UPDATE' : 'CREATE'}_${suffixes[kind]}`);
		const rows = await all(tables[kind]);
		const old = params._id ? find(rows, params._id) : null;
		const key = `${kind}_id`,
			label = kind === 'role' ? '角色' : '权限';
		const id = text(kind === 'role' ? params[key] ?? old?.[key] : params[key], label + '标识', 100, true);
		if (!/^[A-Za-z0-9][A-Za-z0-9_:-]*$/.test(id)) fail('标识仅支持字母、数字、下划线、冒号和短横线');
		if (old && old[key] !== id) fail('标识创建后不可修改');
		if (kind === 'role' && id === 'admin') fail('超级管理员为系统内置角色，不可维护');
		if (rows.some((row) => row[key] === id && row._id !== old?._id)) fail(label + '标识已存在');
		const value = {
			[key]: id,
			[`${kind}_name`]: text(
				kind === 'role' ? params.role_name ?? old?.role_name : params[`${kind}_name`],
				label + '名称',
				80,
				true
			),
			comment: text(params.comment ?? (kind === 'role' ? old?.comment : '') ?? '', '描述', 500)
		};
		if (kind === 'permission') {
			value.menu_id = text(params.menu_id ?? '', '所属页面', 100, true);
			value.sort = params.sort ?? 0;
			if (!Number.isInteger(value.sort) || value.sort < 0 || value.sort > 999999) fail('排序必须是 0 到 999999 的整数');
			if (value.menu_id) {
				const menu = (await all('ucsdb-admin-menus')).find((menu) => menu.menu_id === value.menu_id);
				if (!menu) fail('所属菜单不存在');
				if (menu.menu_type !== MENU_TYPE.PAGE) fail('操作权限只能归属页面，不能归属目录');
			}
		} else {
			const selected = params.permission !== undefined ? params.permission : old?.permission ?? [];
			if (
				!Array.isArray(selected) ||
				selected.length > 5000 ||
				selected.some((id) => typeof id !== 'string' || !id || id.length > 100)
			)
				fail('角色权限格式不正确');
			value.permission = [...new Set(selected)];
			if (params.permission !== undefined) {
				const available = new Set((await all('uni-id-permissions')).map((row) => row.permission_id));
				if (value.permission.some((id) => !available.has(id))) fail('所选权限已被删除，请刷新后重新选择');
			}
			grantable(auth, [...(old?.permission || []), ...value.permission]);
			const menuIds = params.menu_ids !== undefined ? params.menu_ids : old?.menu_ids ?? [];
			if (!Array.isArray(menuIds) || menuIds.length > 5000 || menuIds.some(id => typeof id !== 'string' || !id || id.length > 100))
				fail('角色菜单格式不正确');
			value.menu_ids = [...new Set(menuIds)];
			grantableMenus(auth, [...(old?.menu_ids || []), ...value.menu_ids]);
			if (params.menu_ids !== undefined) {
				const [menus, permissions] = await Promise.all([all('ucsdb-admin-menus'), all('uni-id-permissions')]);
				const pages = new Set(menus.filter(menu => menu.menu_type === MENU_TYPE.PAGE).map(menu => menu.menu_id));
				if (value.menu_ids.some(id => !pages.has(id))) fail('所选页面不存在或已改为目录，请刷新后重新选择');
				if (permissions.some(item => value.permission.includes(item.permission_id) && item.menu_id && !value.menu_ids.includes(item.menu_id)))
					fail('操作权限必须同时选择所属页面');
			}
		}
		let resultId = old?._id;
		if (old) await db.collection(tables[kind]).doc(old._id).update({ ...value, ...updateFields(auth) });
		else {
			try {
				resultId = (await db.collection(tables[kind]).add({ ...value, ...createFields(auth) })).id;
			} catch (e) {
				if (/duplicate|E11000/i.test(e.message || e.errMsg || '')) fail(label + '标识已存在');
				throw e;
			}
		}
		const authorizationChanged = kind === 'role' && Boolean(old) && ['permission', 'menu_ids'].some(key =>
			JSON.stringify([...(old[key] || [])].sort()) !== JSON.stringify([...(value[key] || [])].sort()));
		let requireLogin = false;
		if (
			authorizationChanged
		) {
			// Expire existing tokens so both uni-id and JQL pick up revoked permissions.
			await db.collection('uni-id-users').where({ role: id }).update({ token: [] });
			requireLogin = auth.role.includes(id);
		}
		return {
			errCode: 0,
			id: resultId,
			requireLogin,
			sessionsInvalidated: authorizationChanged
		};
	};
	const remove = async (kind, params = {}) => {
		const auth = await actor();
		requirePermission(auth, `DELETE_${suffixes[kind]}`);
		const old = find(await all(tables[kind]), params._id);
		if (kind === 'role') {
			if (old.role_id === 'admin') fail('超级管理员不可删除');
			grantable(auth, old.permission || []);
			grantableMenus(auth, old.menu_ids || []);
			if ((await all('uni-id-users', { role: old.role_id })).length) fail('角色已分配给用户，请先解除绑定');
		} else {
			const roles = await all('uni-id-roles', { permission: old.permission_id });
			if (roles.length) fail('权限仍被角色引用，请先解除引用');
		}
		await db.collection(tables[kind]).doc(old._id).remove();
		return { errCode: 0 };
	};
	return {
		async getRoleAuthorization() {
			const auth = await actor();
			requireRead(auth, suffixes.role);
			const [menus, permissions] = await Promise.all([all('ucsdb-admin-menus'), all('uni-id-permissions')]);
			return {
				errCode: 0, menus, permissions,
				auth: { ...capabilities(auth, suffixes.role), isAdmin: auth.isAdmin, permission: auth.permissions, menu_ids: auth.menuIds }
			};
		},
		listPermissions: (params) => list('permission', params),
		listRoles: () => list('role'),
		savePermission: (params) => save('permission', params),
		saveRole: (params) => save('role', params),
		deletePermission: (params) => remove('permission', params),
		deleteRole: (params) => remove('role', params),
		async initializeMenuPermissions({ menu_id } = {}) {
			const auth = await actor();
			if (!auth.isAdmin) fail('仅超级管理员可初始化系统菜单权限', 'ADMIN_ACCESS_FORBIDDEN');
			const items = catalog.filter((item) => item.menu_id === menu_id);
			if (!items.length) fail('此菜单没有预设权限，请手动新增');
			const menu = (await all('ucsdb-admin-menus')).find((row) => row.menu_id === menu_id);
			if (!menu) fail('菜单不存在');
			if (menu.menu_type !== MENU_TYPE.PAGE) fail('目录不能初始化操作权限，请选择页面');
			const permissions = await all('uni-id-permissions');
			let created = 0;
			for (const item of items) {
				const old = permissions.find((row) => row.permission_id === item.permission_id);
				if (!old) {
					await db.collection('uni-id-permissions').add({ ...item, comment: '', ...createFields(auth) });
					created++;
				} else if (!old.menu_id)
					await db
						.collection('uni-id-permissions')
						.doc(old._id)
						.update({ menu_id, sort: old.sort ?? item.sort, ...updateFields(auth) });
			}
			return { errCode: 0, created };
		}
	};
}
module.exports = { createAccessAdmin };
