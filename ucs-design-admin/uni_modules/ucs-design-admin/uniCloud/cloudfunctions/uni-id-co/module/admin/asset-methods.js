const { createAssetAdmin } = require('./asset-admin');
module.exports = Object.fromEntries(Object.entries({
 installAssetManagement: 'install',
 listAssetReferences: 'references', listAssets: 'list', listAssetGroups: 'groups', saveAssetGroup: 'saveGroup', deleteAssetGroup: 'deleteGroup',
 prepareAssetUpload: 'prepare', completeAssetUpload: 'complete', cancelAssetUpload: 'cancel', updateAsset: 'save', deleteAsset: 'remove', deleteAssets: 'removeBatch'
}).map(([name, action]) => [name, function(params) {
 return createAssetAdmin({ db: this.adminDb, uid: this.authInfo.uid,
  appId: this.getUniversalClientInfo().appId, storage: uniCloud })[action](params);
}]));
