const DIRECTORY = 'tenant_operations'
const TENANT_MENU = 'platform_tenant'
const PACKAGE_MENU = 'platform_product_package'

const platformMenuIds = new Set([DIRECTORY, TENANT_MENU, PACKAGE_MENU, 'system_menu'])
const pageRoot = '/uni_modules/ucs-design-admin/pages/platform'
const menus = [
  { menu_id: DIRECTORY, name: '租户运营', menu_type: 0, feature_scope: 'platform', parent_id: '', url: '', icon: 'OfficeBuilding', sort: 3 },
  { menu_id: TENANT_MENU, name: '租户管理', menu_type: 1, parent_id: DIRECTORY, url: pageRoot + '/tenant/tenant', icon: 'OfficeBuilding', sort: 1 },
  { menu_id: PACKAGE_MENU, name: '产品包管理', menu_type: 1, parent_id: DIRECTORY, url: pageRoot + '/package/package', icon: 'Box', sort: 2 }
].map(row => ({ ...row, client_type: ['pc'], enable: true }))

const tenantRights = {
  read: 'READ_UCSDB_TENANTS',
  create: 'CREATE_UCSDB_TENANTS',
  assign: 'ASSIGN_UCSDB_TENANT_PACKAGE',
  status: 'UPDATE_UCSDB_TENANT_STATUS',
  enter: 'ENTER_UCSDB_TENANT_MANAGEMENT'
}
const packageRights = {
  read: 'READ_UCSDB_PRODUCT_PACKAGES',
  create: 'CREATE_UCSDB_PRODUCT_PACKAGES',
  update: 'UPDATE_UCSDB_PRODUCT_PACKAGES'
}
const permissions = [
  [TENANT_MENU, tenantRights.read, '查看租户'],
  [TENANT_MENU, tenantRights.create, '开通租户'],
  [TENANT_MENU, tenantRights.assign, '分配产品包'],
  [TENANT_MENU, tenantRights.status, '启停租户'],
  [TENANT_MENU, tenantRights.enter, '进入代管'],
  [PACKAGE_MENU, packageRights.read, '查看产品包'],
  [PACKAGE_MENU, packageRights.create, '新增产品包'],
  [PACKAGE_MENU, packageRights.update, '编辑产品包']
].map(([menu_id, permission_id, permission_name], index) => ({ menu_id, permission_id, permission_name, sort: index + 1 }))

module.exports = { menus, permissions, platformMenuIds, tenantRights, packageRights }
