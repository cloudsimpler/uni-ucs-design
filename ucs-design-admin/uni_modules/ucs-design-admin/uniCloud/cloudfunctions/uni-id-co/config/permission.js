// 各接口权限配置，未配置接口表示允许任何用户访问（包括未登录用户）
module.exports = {
  installDepartmentManagement: { auth: true },
  listDepartments: { auth: true },
  searchDepartmentManagers: { auth: true },
  saveDepartment: { auth: true },
  deleteDepartment: { auth: true },
  installDictionaryManagement: { auth: true },
  listDictionaryTypes: { auth: true },
  listDictionaryItems: { auth: true },
  saveDictionaryType: { auth: true },
  saveDictionaryItem: { auth: true },
  deleteDictionaryItem: { auth: true },
  deleteDictionaryType: { auth: true },
  getDictionaryOptions: { auth: true },

  installAssetManagement: { auth: true },
  listAssets: { auth: true },
  listAssetReferences: { auth: true },
  listAssetGroups: { auth: true },
  saveAssetGroup: { auth: true },
  deleteAssetGroup: { auth: true },
  prepareAssetUpload: { auth: true },
  completeAssetUpload: { auth: true },
  cancelAssetUpload: { auth: true },
  updateAsset: { auth: true },
  deleteAsset: { auth: true },
  deleteAssets: { auth: true },

  getAccountCapabilities: { auth: true },
  getCurrentUserProfile: { auth: true },
  listCustomers: { auth: true }, getCustomerOptions: { auth: true }, getCustomerDetail: { auth: true },
  updateCustomer: { auth: true }, setCustomerStatus: { auth: true },
  deleteUser: { auth: true },
  listDevelopers: { auth: true }, getDeveloperOptions: { auth: true }, getDeveloperDetail: { auth: true },
  addDeveloper: { auth: true }, updateDeveloper: { auth: true },
  deleteDeveloper: { auth: true },
  resetDeveloperPassword: { auth: true },
  resetUserPassword: { auth: true },
  listAppVersions: { auth: true }, saveAppVersion: { auth: true }, publishAppVersion: { auth: true }, deleteAppVersion: { auth: true },
  listApps: { auth: true }, saveApp: { auth: true }, deleteApp: { auth: true },
  listPermissions: { auth: true }, listRoles: { auth: true },
  getRoleAuthorization: { auth: true },
  savePermission: { auth: true }, saveRole: { auth: true },
  deletePermission: { auth: true }, deleteRole: { auth: true },
  initializeMenuPermissions: { auth: true },
  listMenus: { auth: true },
  getCurrentMenus: { auth: true },
  createMenu: { auth: true },
  updateMenu: { auth: true },
  deleteMenu: { auth: true },
  getUserDetail: { auth: true },
  // 管理接口
  listUsers: { auth: true },
  getUserOptions: { auth: true },
  addUser: {
    // auth: true // 已登录用户方可操作，配置角色或权限时此项可不写
    auth: true // 具体操作权限在管理接口内实时校验。
    // permission: [] // 允许进行此操作的权限，包含任一权限均可操作。
    // 权限角色均配置时，用户拥有任一权限或任一角色均可操作
  },
  updateUser: {
    auth: true
  },
  authorizeAppLogin: {
    auth: true
  },
  removeAuthorizedApp: {
    auth: true
  },
  setAuthorizedApp: {
    auth: true
  },

  // 用户接口
  closeAccount: {
    auth: true
  },
  updatePwd: {
    auth: true
  },
  logout: {
    auth: true
  },
  bindMobileBySms: {
    auth: true
  },
  bindMobileByUniverify: {
    auth: true
  },
  bindMobileByMpWeixin: {
    auth: true
  },
  bindAlipay: {
    auth: true
  },
  bindApple: {
    auth: true
  },
  bindQQ: {
    auth: true
  },
  bindWeixin: {
    auth: true
  },
  acceptInvite: {
    auth: true
  },
  getInvitedUser: {
    auth: true
  },
  setPushCid: {
    auth: true
  },
  getAccountInfo: {
    auth: true
  },
  unbindWeixin: {
    auth: true
  },
  unbindAlipay: {
    auth: true
  },
  unbindQQ: {
    auth: true
  },
  unbindApple: {
    auth: true
  },
  setPwd: {
    auth: true
  },
  getFrvCertifyId: {
    auth: true
  },
  getFrvAuthResult: {
    auth: true
  },
  getRealNameInfo: {
    auth: true
  }
}
