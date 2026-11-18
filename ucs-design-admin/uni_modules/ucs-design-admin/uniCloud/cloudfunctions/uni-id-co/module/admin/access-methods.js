const { createAccessAdmin } = require('./access-admin');
module.exports = Object.fromEntries(
	[
		'listPermissions',
		'listRoles',
		'getRoleAuthorization',
		'savePermission',
		'saveRole',
		'deletePermission',
		'deleteRole',
		'initializeMenuPermissions'
	].map((name) => [
		name,
		function (params) {
			return createAccessAdmin({
				db: uniCloud.database(),
				uid: this.authInfo.uid,
				appId: this.getUniversalClientInfo().appId
			})[name](params);
		}
	])
);
