const { actorName, createFields, updateFields } = require('../../lib/utils/record-metadata');
const { PLATFORM_TENANT_ID } = require('../../lib/utils/platform-tenant');
const { classifyPages, isPageScope } = require('./menu-scope');
const { defaultPlatformPageIds } = require('./tenant-catalog');
const fail = (errMsg, errCode = 'MENU_ADMIN_INVALID') => {
	throw { errCode, errMsg };
};
const table = 'ucsdb-admin-menus';
const MENU_TYPE = require('./menu-types');
const { accountTypeOf, hasManagementIdentity, hasAccountType } = require('./account-types');
const actions = ['read', 'create', 'update', 'delete'];
const permissionFor = (action) => `${action.toUpperCase()}_OPENDB_ADMIN_MENUS`;
const sortMenus = (rows) => rows.sort((a, b) => (a.sort || 0) - (b.sort || 0) || a.menu_id.localeCompare(b.menu_id));
// Existing menus predate terminal configuration and belong to PC only.
const clientsFor = (row) =>
	row.client_type === undefined ? ['pc'] : Array.isArray(row.client_type) ? row.client_type : [];
const fields = [
	'menu_id',
	'menu_type',
	'feature_scope',
	'name',
	'parent_id',
	'client_type',
	'url',
	'icon',
	'app_url',
	'app_icon',
	'sort',
	'enable'
];

// Build only rooted, accessible branches; invalid historical cycles/orphans never recurse.
function visibleTree(rows, auth, clientType = 'pc') {
	if (!['pc', 'app'].includes(clientType)) fail('显示端只能是 pc 或 app');
	const children = new Map();
	for (const row of sortMenus([...rows])) {
		const parent = row.parent_id || '';
		if (!children.has(parent)) children.set(parent, []);
		children.get(parent).push(row);
	}
	const visit = (parent, seen = new Set()) =>
		(children.get(parent) || []).flatMap((row) => {
			if (seen.has(row.menu_id) || row.enable === false || !clientsFor(row).includes(clientType)) return [];
			const url = clientType === 'app' ? row.app_url : row.url;
			let branch = [];
			if (row.menu_type === MENU_TYPE.DIRECTORY) {
				if (row.url || row.app_url) return [];
				branch = visit(row.menu_id, new Set([...seen, row.menu_id]));
				if (!branch.length) return [];
			} else if (row.menu_type === MENU_TYPE.PAGE) {
				if (!auth.isAdmin && !auth.menuIds?.includes(row.menu_id)) return [];
				if (!url || children.has(row.menu_id)) return [];
			} else return [];
			return [
				{
					_id: row._id,
					menu_id: row.menu_id,
					menu_type: row.menu_type,
					name: row.name,
					client_type: clientsFor(row),
					icon: clientType === 'app' ? row.app_icon || '' : row.icon,
					url,
					children: branch
				}
			];
		});
	return visit('');
}

function createMenuAdmin({ db, uid, appId }) {
	const all = async (name, where = {}, projection) => {
		const rows = [];
		for (let offset = 0; offset < 5000; offset += 100) {
			let query = db.collection(name).where(where).orderBy('_id', 'asc').skip(offset).limit(100);
			if (projection) query = query.field(projection);
			const { data } = await query.get();
			rows.push(...data);
			if (data.length < 100) return rows;
		}
		fail('数据超过 5000 条，请联系管理员整理');
	};
	const authorize = async (action) => {
		if (db.tenantActor) {
			const scope = db.tenantActor;
			const rights = Object.fromEntries(actions.map(key => [key, scope.isAdmin || scope.permissions.includes(permissionFor(key))]));
			const managesPermissions = actions.some(key => scope.permissions.includes(key.toUpperCase() + '_UNI_ID_PERMISSIONS'));
			if (action === 'read' ? !Object.values(rights).some(Boolean) && !managesPermissions : action && !rights[action])
				fail('没有此项菜单管理权限', 'MENU_ADMIN_FORBIDDEN');
			return { ...scope, ...rights };
		}
		if (!uid) fail('请先登录', 'MENU_ADMIN_UNAUTHORIZED');
		const { data } = await db.collection('uni-id-users').doc(uid).get();
		const user = Array.isArray(data) ? data[0] : data;
		const apps = user?.dcloud_appid;
		if (
			!user || !hasManagementIdentity(user) ||
			(user.status || 0) !== 0 ||
			(apps != null && (!Array.isArray(apps) || (!apps.includes('*') && !apps.includes(appId))))
		)
			fail('当前账号已停用或无权登录此应用', 'MENU_ADMIN_FORBIDDEN');
		const tenantId = user.tenant_id ?? PLATFORM_TENANT_ID;
		const isAdmin = tenantId === PLATFORM_TENANT_ID && Array.isArray(user.role) && user.role.includes('admin');
		const roles = !isAdmin && user.role?.length ? await all('uni-id-roles', { tenant_id: tenantId, role_id: db.command.in(user.role) }) : [];
		const permissions = [...new Set(roles.flatMap((role) => role.permission || []))];
		const auth = {
			uid, name: actorName(user), isAdmin,
			menuIds: [...new Set(roles.flatMap((role) => role.menu_ids || []))],
			permissions,
			...Object.fromEntries(actions.map((key) => [key, isAdmin || permissions.includes(permissionFor(key))]))
		};
		const managesPermissions = actions.some((key) => permissions.includes(`${key.toUpperCase()}_UNI_ID_PERMISSIONS`));
		if (action === 'read' ? !actions.some((key) => auth[key]) && !managesPermissions : action && !auth[action])
			fail('没有此项菜单管理权限', 'MENU_ADMIN_FORBIDDEN');
		return auth;
	};
	const validate = async (params, rows, old) => {
		if (!params || typeof params !== 'object' || Array.isArray(params)) fail('菜单参数不正确');
		const value = {
			menu_id: '',
			name: '',
			parent_id: '',
			url: '',
			icon: '',
			app_url: '',
			app_icon: '',
			client_type: ['pc'],
			sort: 0,
			enable: true,
			...old
		};
		for (const key of fields) {
			if (params[key] !== undefined) value[key] = params[key];
		}
		for (const [key, max] of Object.entries({
			menu_id: 100,
			name: 50,
			parent_id: 100,
			url: 500,
			icon: 80,
			app_url: 500,
			app_icon: 2048
		})) {
			if (typeof value[key] !== 'string' || value[key].length > max) fail('菜单名称、标识或路径格式不正确');
			value[key] = value[key].trim();
		}
		if (!value.name) fail('请输入菜单名称');
		if (![MENU_TYPE.DIRECTORY, MENU_TYPE.PAGE].includes(value.menu_type)) fail('请选择菜单类型：0 目录、1 页面');
		if (value.menu_type === MENU_TYPE.PAGE) {
			if (params.feature_scope != null && params.feature_scope !== 'inherit' && !isPageScope(params.feature_scope))
				fail('请选择有效的功能归属');
			if (isPageScope(params.feature_scope)) value.feature_scope = params.feature_scope;
			else if (old?.menu_type === MENU_TYPE.PAGE)
				value.feature_scope = classifyPages(rows).platform.has(old.menu_id) ? 'platform' : 'product';
			else value.feature_scope = defaultPlatformPageIds.has(value.menu_id) ? 'platform' : 'product';
		} else if (old?.menu_type === MENU_TYPE.PAGE) {
			value.feature_scope = 'inherit';
		} else {
			delete value.feature_scope;
		}
		if (
			!Array.isArray(value.client_type) ||
			!value.client_type.length ||
			value.client_type.length > 2 ||
			value.client_type.some((client) => !['pc', 'app'].includes(client))
		)
			fail('请选择有效的显示端：PC 或 App');
		value.client_type = [...new Set(value.client_type)];
		if (value.menu_type === MENU_TYPE.DIRECTORY && (value.url || value.app_url))
			fail('目录不能配置页面路径，请清空路径');
		if (value.menu_type === MENU_TYPE.PAGE) {
			if (value.client_type.includes('pc') && !value.url) fail('PC 页面必须配置页面路径');
			if (value.client_type.includes('app') && !value.app_url) fail('App 页面必须配置页面路径');
			if (rows.some((row) => row.parent_id === value.menu_id)) fail('请先处理下级菜单，再将目录设为页面');
		}
		if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value.menu_id)) fail('菜单标识仅支持字母、数字、下划线和短横线');
		if (old && value.menu_id !== old.menu_id) fail('菜单标识创建后不可修改');
		if (rows.some((row) => row.menu_id === value.menu_id && row._id !== old?._id)) fail('菜单标识已存在');
		if (value.icon && !/^[A-Z][A-Za-z0-9]*$/.test(value.icon)) fail('请选择有效的 Element Plus 图标');
		for (const url of [value.url, value.app_url]) {
			if (url && (!/^\/(?!\/)[A-Za-z0-9_\-/]*(?:\?[^\s#<>]*)?$/.test(url) || url.includes('..') || url.includes('\\')))
				fail('页面路径必须是以 / 开头的站内路径');
		}
		if (value.app_icon && !/^(https?:\/\/|cloud:\/\/)[^\s<>]+$/i.test(value.app_icon))
			fail('App 图标必须是上传后的图片地址');
		if (!Number.isInteger(value.sort) || value.sort < 0 || value.sort > 999999) fail('排序必须是 0 到 999999 的整数');
		if (typeof value.enable !== 'boolean') fail('启用状态不正确');
		if (value.menu_type === MENU_TYPE.DIRECTORY) {
			if ((await all('uni-id-permissions', { menu_id: value.menu_id })).length)
				fail('此菜单下还有操作权限，请先移至其他页面，再设为目录');
		}
		const byId = new Map(rows.map((row) => [row.menu_id, row]));
		const seen = new Set([value.menu_id]);
		const ancestors = [];
		let parent = value.parent_id;
		while (parent) {
			if (seen.has(parent)) fail('上级菜单不能是自身或下级菜单');
			seen.add(parent);
			const row = byId.get(parent);
			if (!row) fail('上级菜单不存在，请重新选择');
			ancestors.push(row);
			parent = row.parent_id || '';
		}
		if (ancestors.some((row) => row.menu_type !== MENU_TYPE.DIRECTORY)) fail('上级菜单必须是已设置类型的目录');
		if (ancestors.some((row) => value.client_type.some((client) => !clientsFor(row).includes(client))))
			fail('子菜单的显示端必须包含在上级目录的显示端内');
		if (
			rows.some(
				(row) =>
					row.parent_id === value.menu_id && clientsFor(row).some((client) => !value.client_type.includes(client))
			)
		)
			fail('请先调整下级菜单的显示端，再取消目录的显示端');
		return Object.fromEntries(fields.filter((key) => Object.hasOwn(value, key)).map((key) => [key, value[key]]));
	};
	const find = (rows, id) => {
		if (typeof id !== 'string' || !id || id.length > 100) fail('菜单 ID 不正确');
		const old = rows.find((row) => row._id === id);
		if (!old) fail('菜单不存在或已被删除', 'MENU_ADMIN_NOT_FOUND');
		return old;
	};
	return {
		async list(params = {}) {
			const auth = await authorize('read');
			if (!params || typeof params !== 'object' || Array.isArray(params)) fail('菜单参数不正确');
			const { includeMenus = true, includePermissions = true } = params;
			if (typeof includeMenus !== 'boolean' || typeof includePermissions !== 'boolean') fail('查询选项不正确');
			const lazy = Object.hasOwn(params, 'parent_id');
			let rows, permissions;
			if (lazy) {
				if (typeof params.parent_id !== 'string' || params.parent_id.length > 100) fail('上级菜单标识不正确');
				const { keyword = '', enable = '' } = params;
				if (typeof keyword !== 'string' || keyword.length > 100) fail('搜索关键词不正确');
				if (!['', true, false].includes(enable)) fail('菜单状态不正确');
				const conditions = [];
				const text = keyword.trim();
				if (text) {
					const pattern = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
					conditions.push(db.command.or(['name', 'menu_id'].map((key) => ({ [key]: pattern }))));
				}
				if (enable !== '') conditions.push({ enable: enable ? db.command.neq(false) : false });
				// Search returns matching rows across levels; normal browsing only reads direct children.
				if (!text && enable === '') conditions.push({
					parent_id: params.parent_id || db.command.in(['', null])
				});
				rows = sortMenus(await all(table, conditions.length === 1 ? conditions[0] : db.command.and(conditions)));
				permissions = [];
				for (let offset = 0; offset < rows.length; offset += 100) {
					permissions.push(...await all('uni-id-permissions', {
						menu_id: db.command.in(rows.slice(offset, offset + 100).map((row) => row.menu_id))
					}));
				}
				// Existence probes use the parent_id index and fetch at most one ID, never a subtree.
				for (let offset = 0; offset < rows.length; offset += 20) {
					await Promise.all(rows.slice(offset, offset + 20).map(async (row) => {
						const { data } = await db.collection(table).where({ parent_id: row.menu_id }).field({ _id: true }).limit(1).get();
						row.hasChildren = data.length > 0;
					}));
				}
			} else {
				// Browsing loads the entire menu tree once; permission options are requested only by dialogs.
				[rows, permissions] = await Promise.all([
					includeMenus ? all(table, {}, Object.fromEntries(['_id', ...fields].map((key) => [key, true]))) : [],
					includePermissions ? all('uni-id-permissions', {}, { permission_id: true, permission_name: true, menu_id: true }) : []
				]);
			}
			const legacyPages = rows.some(row => row.menu_type === MENU_TYPE.PAGE && !isPageScope(row.feature_scope));
			if (legacyPages) {
				const { platform } = classifyPages(lazy ? await all(table) : rows);
				rows = rows.map(row => row.menu_type === MENU_TYPE.PAGE && !isPageScope(row.feature_scope)
					? { ...row, feature_scope: platform.has(row.menu_id) ? 'platform' : 'product' }
					: row);
			}
			return {
				errCode: 0,
				data: sortMenus(rows),
				auth: {
					...Object.fromEntries(actions.map((key) => [key, auth[key]])),
					managePermissions:
						auth.isAdmin || actions.some((key) => auth.permissions.includes(`${key.toUpperCase()}_UNI_ID_PERMISSIONS`))
				},
				permissions: permissions.map(({ permission_id, permission_name, menu_id }) => ({
					permission_id,
					permission_name,
					menu_id
				}))
			};
		},
		async current(params = {}) {
			const auth = await authorize();
			if (!params || typeof params !== 'object' || Array.isArray(params)) fail('菜单参数不正确');
			const rows = await all(table);
			const { product } = classifyPages(rows);
			const menuIds = auth.tenantId && auth.tenantId !== PLATFORM_TENANT_ID
				? (auth.menuIds || []).filter(id => product.has(id)) : auth.menuIds;
			return {
				errCode: 0,
				isAdmin: auth.isAdmin,
				data: visibleTree(rows, { ...auth, menuIds },
					params.client_type === undefined ? 'pc' : params.client_type)
			};
		},
		async create(params) {
			const auth = await authorize('create');
			const value = await validate(params, await all(table));
			try {
				const { id } = await db.collection(table).add({ ...value, ...createFields(auth) });
				return { errCode: 0, id };
			} catch (error) {
				if (/duplicate|E11000/i.test(error.message || error.errMsg || '')) fail('菜单标识已存在');
				throw error;
			}
		},
		async update(params = {}) {
			const auth = await authorize('update');
			const rows = await all(table);
			const old = find(rows, params._id);
			const value = await validate(params, rows, old);
			if (old.menu_type === MENU_TYPE.DIRECTORY && value.parent_id !== (old.parent_id || '')) {
				const before = classifyPages(rows).platform;
				const after = classifyPages(rows.map(row => row === old ? { ...row, parent_id: value.parent_id } : row)).platform;
				// Keep legacy pages in their current product packages when moving a directory.
				for (const row of rows) {
					if (row.menu_type !== MENU_TYPE.PAGE || isPageScope(row.feature_scope) ||
						before.has(row.menu_id) === after.has(row.menu_id)) continue;
					const storedScope = row.feature_scope === undefined ? db.command.exists(false) : row.feature_scope;
					await db.collection(table).where({ _id: row._id, feature_scope: storedScope })
						.update({ feature_scope: before.has(row.menu_id) ? 'platform' : 'product', ...updateFields(auth) });
				}
			}
			const result = await db.collection(table).doc(old._id).update({ ...value, ...updateFields(auth) });
			if (result.updated === 0) {
				// Some database adapters report zero modified rows for an unchanged form.
				const { data } = await db.collection(table).doc(old._id).get();
				if (!(Array.isArray(data) ? data[0] : data)) fail('菜单已被删除，请刷新列表');
			}
			return { errCode: 0 };
		},
		async remove(params = {}) {
			await authorize('delete');
			const rows = await all(table);
			const old = find(rows, params._id);
			if (rows.some((row) => row.parent_id === old.menu_id)) fail('请先删除或移动下级菜单');
			if ((await all('uni-id-permissions', { menu_id: old.menu_id })).length)
				fail('菜单下还有权限，请先调整权限归属或删除权限');
			if ((await all('uni-id-roles', { menu_ids: old.menu_id })).length)
				fail('菜单已授权给角色，请先在角色管理中取消授权');
			const result = await db.collection(table).doc(old._id).remove();
			if (result.deleted === 0) fail('菜单已被删除，请刷新列表');
			return { errCode: 0 };
		}
	};
}
module.exports = { createMenuAdmin, visibleTree };
