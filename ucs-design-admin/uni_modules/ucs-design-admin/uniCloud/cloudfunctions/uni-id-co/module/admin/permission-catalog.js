const { DICTIONARY, MENU_MANAGEMENT, permissions: tenantPermissions } = require('./tenant-catalog');
const { USER_DELEGATION_PERMISSION } = require('./user-delegation');
const groups = [
 ['system_departments', 'UCSDB_DEPARTMENT', '部门', ['READ', 'CREATE', 'UPDATE', 'DELETE']],
 [DICTIONARY, 'UCSDB_DICT', '系统字典', ['READ', 'CREATE', 'UPDATE', 'DELETE']],
	['system_assets', 'UCSDB_ASSETS', '素材', ['READ', 'CREATE', 'UPDATE', 'DELETE']],
	['system_customers', 'UNI_ID_CUSTOMERS', '社区用户', ['READ', 'UPDATE']],
	['system_apps', 'UCSDB_APP_LIST', '应用', ['READ', 'CREATE', 'UPDATE', 'DELETE']],
	['system_apps', 'UCSDB_APP_VERSIONS', '应用版本', ['READ', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH']],
	['system_users', 'UNI_ID_USERS', '系统用户', ['READ', 'CREATE', 'UPDATE']],
	['system_roles', 'UNI_ID_ROLES', '角色', ['READ', 'CREATE', 'UPDATE', 'DELETE']],
	[MENU_MANAGEMENT, 'UNI_ID_PERMISSIONS', '权限', ['READ', 'CREATE', 'UPDATE', 'DELETE']],
	[MENU_MANAGEMENT, 'UCSDB_ADMIN_MENUS', '菜单', ['READ', 'CREATE', 'UPDATE', 'DELETE']]
];
const names = { READ: '查看', CREATE: '新增', UPDATE: '编辑', DELETE: '删除', PUBLISH: '发布/下线' };
module.exports = [
	...tenantPermissions,
	{ menu_id: 'system_users', permission_id: 'DELETE_UNI_ID_USERS', permission_name: '删除系统用户', sort: 7 },
	...groups.flatMap(([menu_id, suffix, name, actions]) =>
		actions.map((action, index) => ({
			menu_id,
			permission_id: `${action}_${suffix}`,
			permission_name: names[action] + name,
			sort: index + 1 + (['UNI_ID_PERMISSIONS', 'UCSDB_APP_VERSIONS'].includes(suffix) ? 4 : 0)
		}))
	),
	{ menu_id: 'system_customers', permission_id: 'UPDATE_CUSTOMER_STATUS', permission_name: '禁用/恢复社区用户', sort: 3 },
	{ menu_id: 'system_customers', permission_id: 'READ_CUSTOMER_LOG', permission_name: '查看社区用户登录日志', sort: 4 },
	{ menu_id: 'system_users', permission_id: USER_DELEGATION_PERMISSION, permission_name: '用户代管', sort: 8 },
];
