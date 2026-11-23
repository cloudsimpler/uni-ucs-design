const {createDictionaryAdmin}=require('./dictionary-admin');

const actions = {
  installDictionaryManagement: 'install',
  listDictionaryTypes: 'types',
  listDictionaryItems: 'items',
  saveDictionaryType: 'saveType',
  saveDictionaryItem: 'saveItem',
  deleteDictionaryItem: 'removeItem',
  deleteDictionaryType: 'removeType',
  getDictionaryOptions: 'options'
};

module.exports = Object.fromEntries(Object.entries(actions).map(([name, action]) => [name, function (params) {
  return createDictionaryAdmin({
    db: this.adminDb,
    uid: this.authInfo.uid,
    appId: this.getUniversalClientInfo().appId
  })[action](params);
}]));
