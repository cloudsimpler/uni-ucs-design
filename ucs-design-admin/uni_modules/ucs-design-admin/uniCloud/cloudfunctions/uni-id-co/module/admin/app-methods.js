const { createAppAdmin } = require('./app-admin');
module.exports = Object.fromEntries(
	Object.entries({ listApps: 'list', saveApp: 'save', deleteApp: 'remove' }).map(([name, action]) => [
		name,
		function (params) {
			return createAppAdmin({
				db: uniCloud.database(),
				uid: this.authInfo.uid,
				appId: this.getUniversalClientInfo().appId
			})[action](params);
		}
	])
);
