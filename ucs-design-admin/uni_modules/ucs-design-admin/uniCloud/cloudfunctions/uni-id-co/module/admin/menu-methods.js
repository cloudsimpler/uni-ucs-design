const { createMenuAdmin } = require('./menu-admin');
module.exports = Object.fromEntries(
	Object.entries({
		listMenus: 'list',
		getCurrentMenus: 'current',
		createMenu: 'create',
		updateMenu: 'update',
		deleteMenu: 'remove'
	}).map(([name, action]) => [
		name,
		function (params) {
			return createMenuAdmin({
				db: this.adminDb,
				loginScope: this.loginAdminScope,
				uid: this.authInfo.uid,
				appId: this.getUniversalClientInfo().appId
			})[action](params);
		}
	])
);
