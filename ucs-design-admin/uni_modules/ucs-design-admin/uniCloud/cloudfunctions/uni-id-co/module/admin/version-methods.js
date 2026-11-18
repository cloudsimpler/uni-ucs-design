const { createVersionAdmin } = require('./version-admin');
module.exports = Object.fromEntries(
	Object.entries({
		listAppVersions: 'list',
		saveAppVersion: 'save',
		publishAppVersion: 'publish',
		deleteAppVersion: 'remove'
	}).map(([name, action]) => [
		name,
		function (params) {
			return createVersionAdmin({
				db: uniCloud.database(),
				uid: this.authInfo.uid,
				appId: this.getUniversalClientInfo().appId
			})[action](params);
		}
	])
);
