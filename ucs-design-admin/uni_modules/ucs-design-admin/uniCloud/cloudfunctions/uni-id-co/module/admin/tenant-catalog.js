const DIRECTORY = 'platform'
const TENANT_MENU = 'platform_tenants'
const retiredTenantPermissions = new Set(['ASSIGN_UCSDB_TENANT_PACKAGE', 'UPDATE_UCSDB_TENANT_STATUS', 'DELETE_UCSDB_TENANTS'])
const PACKAGE_MENU = 'platform_product_packages'
const MENU_MANAGEMENT = 'platform_menus'
const DICTIONARY = 'platform_dictionaries'
const legacyMenuNames = { [DIRECTORY]: '租户运营', [PACKAGE_MENU]: '产品包管理' }

const pageRoot = '/uni_modules/ucs-design-admin/pages/platform'
const menus = [
  { menu_id: DIRECTORY, name: '系统运维', menu_type: 0, parent_id: '', url: '', icon: 'OfficeBuilding', sort: 3 },
  { menu_id: TENANT_MENU, name: '租户管理', menu_type: 1, feature_scope: 'platform', parent_id: DIRECTORY, url: pageRoot + '/tenant/tenant', icon: 'OfficeBuilding', sort: 1 },
  { menu_id: PACKAGE_MENU, name: '租户产品包', menu_type: 1, feature_scope: 'platform', parent_id: DIRECTORY, url: pageRoot + '/package/package', icon: 'Box', sort: 2 },
  { menu_id: MENU_MANAGEMENT, name: '菜单管理', menu_type: 1, feature_scope: 'platform', parent_id: DIRECTORY, url: pageRoot + '/menu/menu', icon: 'Menu', sort: 3 }
].map(row => ({ ...row, ...(row.menu_type === 1 ? { client_type: ['pc'] } : {}), enable: true }))

const tenantRights = {
  read: 'READ_UCSDB_TENANTS',
  create: 'CREATE_UCSDB_TENANTS',
  update: 'UPDATE_UCSDB_TENANTS',
  enter: 'ENTER_UCSDB_TENANT_MANAGEMENT'
}
const packageRights = {
  read: 'READ_UCSDB_PRODUCT_PACKAGES',
  create: 'CREATE_UCSDB_PRODUCT_PACKAGES',
  update: 'UPDATE_UCSDB_PRODUCT_PACKAGES',
  delete: 'DELETE_UCSDB_PRODUCT_PACKAGES'
}
const permissions = [
  [TENANT_MENU, tenantRights.read, '查看租户'],
  [TENANT_MENU, tenantRights.create, '开通租户'],
  [TENANT_MENU, tenantRights.update, '编辑租户'],
  [TENANT_MENU, tenantRights.enter, '进入代管'],
  [PACKAGE_MENU, packageRights.read, '查看产品包'],
  [PACKAGE_MENU, packageRights.create, '新增产品包'],
  [PACKAGE_MENU, packageRights.update, '编辑产品包'],
  [PACKAGE_MENU, packageRights.delete, '删除产品包']
].map(([menu_id, permission_id, permission_name], index) => ({ menu_id, permission_id, permission_name, sort: index + 1 }))

module.exports = { DIRECTORY, TENANT_MENU, MENU_MANAGEMENT, DICTIONARY, menus, legacyMenuNames, permissions, tenantRights, packageRights, retiredTenantPermissions }
