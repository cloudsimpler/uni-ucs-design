const crypto = require('crypto');
const { accessContext, fail } = require('./admin-access');
const { actorName, createFields, updateFields } = require('../../lib/utils/record-metadata');
const ASSETS = 'ucsdb-assets', GROUPS = 'ucsdb-asset-groups', REFERENCES = 'ucsdb-asset-references';
const formats = {
 jpg: ['image', 'image/jpeg'], jpeg: ['image', 'image/jpeg'], png: ['image', 'image/png'], webp: ['image', 'image/webp'], gif: ['image', 'image/gif'],
 mp4: ['video', 'video/mp4'], webm: ['video', 'video/webm'], mp3: ['audio', 'audio/mpeg'], wav: ['audio', 'audio/wav'],
 pdf: ['document', 'application/pdf'], txt: ['document', 'text/plain'],
 docx: ['document', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
 xlsx: ['document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
 pptx: ['document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
};
const text = (value, max = 100) => {
 if (typeof value !== 'string' || value.length > max) fail('参数格式不正确');
 return value.trim();
};
const one = result => Array.isArray(result.data) ? result.data[0] : result.data;
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function createAssetAdmin({ db, uid, appId, storage }) {
 const ctx = accessContext({ db, uid, appId });
 const authorize = async action => {
  const auth = await ctx.actor();
  if (action === 'read') ctx.requireRead(auth, 'UCSDB_ASSETS');
  else ctx.requirePermission(auth, `${action.toUpperCase()}_UCSDB_ASSETS`);
  return auth;
 };
 const find = async (table, id) => {
  if (!text(id)) fail('缺少记录 ID');
  const row = one(await db.collection(table).doc(id).get());
  if (!row) fail('记录不存在，请刷新后重试');
  return row;
 };
 const group = async id => { if (id) await find(GROUPS, id); return id || ''; };
 const removeOne = async (_id) => {
   const row = await find(ASSETS, _id);
   if (row.state !== 'ready') fail('素材暂不可删除');
   const checks = [
    [REFERENCES, { asset_id: _id }], ['ucsdb-app-list', { icon_url: row.file_id }],
    ['ucsdb-admin-menus', { app_icon: row.file_id }], ['uni-id-users', { 'avatar_file.url': row.file_id }],
    ['uni-id-users', { avatar: row.file_id }]
   ];
   for (const [table, where] of checks) if (one(await db.collection(table).where(where).field({ _id: true }).limit(1).get())) fail('素材正在使用中，请先解除引用');
   const result = await storage.deleteFile({ fileList: [row.file_id, row.cover_file_id].filter(Boolean) });
   if (result?.errCode || result?.fileList?.some(item => item.code && item.code !== 'SUCCESS' || item.errCode)) fail('云端文件删除失败，请重试');
   await db.collection(ASSETS).doc(_id).remove(); return { errCode: 0 };
 };
 return {
  async install() {
   const auth = await ctx.actor();
   if (!auth.isAdmin) fail('仅超级管理员可安装素材菜单', 'ADMIN_ACCESS_FORBIDDEN');
   const menus = db.collection('ucsdb-admin-menus');
   const parent = one(await menus.where({ menu_id: 'system' }).limit(1).get());
   if (!parent || parent.menu_type !== 0) fail('请先建立系统管理目录');
   let changed = false;
   const insertMissing = async (table, key, record) => {
    if (one(await db.collection(table).where({ [key]: record[key] }).limit(1).get())) return;
    try { await db.collection(table).add({ ...record, ...createFields(auth) }); changed = true; }
    catch (error) {
     // 同时打开多个窗口时，唯一索引使安装保持幂等；其他错误继续上抛。
     if (!one(await db.collection(table).where({ [key]: record[key] }).limit(1).get())) throw error;
    }
   };
   for (const permission of require('./permission-catalog').filter(item => item.menu_id === 'system_assets')) {
    await insertMissing('uni-id-permissions', 'permission_id', { ...permission });
   }
   await insertMissing('ucsdb-admin-menus', 'menu_id', {
    menu_id: 'system_assets', name: '素材管理', parent_id: 'system', menu_type: 1, feature_scope: 'product',
    client_type: ['pc'], url: '/uni_modules/ucs-design-admin/pages/system/asset/asset', icon: 'Folder',
    app_url: '', app_icon: '', sort: 26, enable: true
   });
   return { errCode: 0, changed };
  },
  async list({ keyword = '', group_id, type = '', page = 1, pageSize = 20 } = {}) {
   const auth = await authorize('read');
   page = Math.max(1, Math.min(10000, Math.trunc(Number(page)) || 1));
   pageSize = [20, 40, 60, 80, 100].includes(Number(pageSize)) ? Number(pageSize) : 20;
   const where = { state: 'ready' };
   if (keyword) where.name = new RegExp(escapeRegex(text(keyword)), 'i');
   if (group_id !== undefined && group_id !== null) where.group_id = text(group_id);
   if (type) { if (!['image','video','audio','document'].includes(type)) fail('素材类型不正确'); where.type = type; }
   const query = () => db.collection(ASSETS).where(where);
   const { total } = await query().count();
   page = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
   const { data } = await query().orderBy('create_date', 'desc').orderBy('_id', 'asc').skip((page - 1) * pageSize).limit(pageSize).get();
   // Only resolve uploaders on this page, with one projected query.
   for (const row of data) {
    row.create_id ??= row.creator_id;
    row.create_name ??= row.creator_name;
   }
   const creatorIds = [...new Set(data.filter(row => !row.create_name).map(row => row.create_id).filter(Boolean))];
   const creators = creatorIds.length ? (await db.collection('uni-id-users')
    .where({ _id: db.command.in(creatorIds) }).field({ _id: true, nickname: true, username: true })
    .limit(creatorIds.length).get()).data : [];
   const creatorNames = new Map(creators.map(user => [user._id, actorName(user)]));
   for (const row of data) row.create_name ||= creatorNames.get(row.create_id) || '';
   return { errCode: 0, data, total, page, pageSize, auth: ctx.capabilities(auth, 'UCSDB_ASSETS') };
  },
  async references({ _id, page = 1, pageSize = 20 } = {}) {
   await authorize('read'); await find(ASSETS, _id);
   page = Math.max(1, Math.min(10000, Math.trunc(Number(page)) || 1));
   pageSize = [20, 40, 60, 80, 100].includes(Number(pageSize)) ? Number(pageSize) : 20;
   const query = () => db.collection(REFERENCES).where({ asset_id: _id });
   const { total } = await query().count();
   page = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
   const { data } = await query().field({ _id: true, business_type: true, business_id: true, field: true, create_date: true })
    .orderBy('create_date', 'desc').orderBy('_id', 'asc').skip((page - 1) * pageSize).limit(pageSize).get();
   return { errCode: 0, data, total, page, pageSize };
  },
  async groups() { await authorize('read'); return { errCode: 0, data: await ctx.all(GROUPS) }; },
  async saveGroup({ _id, name } = {}) {
   const auth = await authorize('update'); name = text(name, 40); if (!name) fail('请输入分组名称');
   if (_id) await find(GROUPS, _id);
   const duplicate = one(await db.collection(GROUPS).where({ name }).limit(1).get());
   if (duplicate && duplicate._id !== _id) fail('分组名称已存在');
   if (_id) await db.collection(GROUPS).doc(_id).update({ name, ...updateFields(auth) });
   else { const result = await db.collection(GROUPS).add({ name, ...createFields(auth) }); _id = result.id; }
   return { errCode: 0, id: _id };
  },
  async deleteGroup({ _id } = {}) {
   await authorize('update'); await find(GROUPS, _id);
   // 上传中的记录也占用分组，不能只检查已完成素材。
   const used = one(await db.collection(ASSETS).where({ group_id: _id }).limit(1).get());
   if (used) fail('分组内还有素材或上传记录，请先移出素材');
   await db.collection(GROUPS).doc(_id).remove(); return { errCode: 0 };
  },
  async prepare({ name, size, group_id = '' } = {}) {
   const auth = await authorize('create'); name = text(name, 200);
   const ext = name.split('.').pop().toLowerCase(), format = formats[ext];
   if (!format) fail('不支持此文件格式');
   if (!Number.isSafeInteger(size) || size <= 0 || size > 200 * 1024 * 1024) fail('文件大小需在 0 至 200 MB 之间');
   await group(group_id);
   const directory = auth.tenant?.type === 'enterprise' ? `tenant-assets/${auth.tenant.tenant_no}` : 'assets';
   if (auth.tenant?.type === 'enterprise' && process.env.UCS_TENANT_ASSETS_PRIVATE !== 'true')
    fail('服务空间尚未启用租户私有素材存储');
   const cloud_path = `${directory}/${crypto.randomBytes(24).toString('hex')}.${ext}`;
   const { id } = await db.collection(ASSETS).add({ name, size, group_id, type: format[0], mime: format[1], ext, cloud_path,
    file_id: '', state: 'uploading', ...createFields(auth) });
   return { errCode: 0, id, cloudPath: cloud_path, type: format[0], ...(format[0] === 'video' ? { coverPath: cloud_path + '.cover.jpg' } : {}) };
  },
  async complete({ _id, file_id, cover_file_id = '', width, height } = {}) {
   const auth = await authorize('create'); const row = await find(ASSETS, _id);
   if ((row.create_id ?? row.creator_id) !== uid) fail('上传记录已失效');
   if (row.state === 'ready' && row.file_id === file_id && (row.cover_file_id || '') === cover_file_id) return { errCode: 0 };
   if (row.state !== 'uploading') fail('上传记录已失效');
   file_id = text(file_id, 2048);
   // 不接受任意外部地址；文件必须匹配服务端为本次上传分配的随机路径。
   if (!/^(cloud|https?):\/\/[^\s<>?#]+$/i.test(file_id) || !file_id.endsWith('/' + row.cloud_path)) fail('上传文件地址与记录不匹配');
   cover_file_id = text(cover_file_id, 2048);
   if (cover_file_id && (row.type !== 'video' || !/^(cloud|https?):\/\/[^\s<>?#]+$/i.test(cover_file_id) || !cover_file_id.endsWith('/' + row.cloud_path + '.cover.jpg'))) fail('视频封面地址与上传记录不匹配');
   const dimensions = {};
   if (width !== undefined || height !== undefined) {
    if (row.type !== 'image' || ![width, height].every(value => Number.isSafeInteger(value) && value > 0 && value <= 1000000)) fail('图片分辨率格式不正确');
    Object.assign(dimensions, { width, height });
   }
   await group(row.group_id);
   await db.collection(ASSETS).doc(_id).update({ file_id, cover_file_id, ...dimensions, state: 'ready', ...updateFields(auth) });
   return { errCode: 0 };
  },
  async cancel({ _id } = {}) {
   await authorize('create'); const row = await find(ASSETS, _id);
   if ((row.create_id ?? row.creator_id) !== uid || row.state !== 'uploading') fail('不能取消该上传');
   await db.collection(ASSETS).doc(_id).remove(); return { errCode: 0 };
  },
  async save({ _id, name, group_id } = {}) {
   const auth = await authorize('update'); const row = await find(ASSETS, _id);
   if (row.state !== 'ready') fail('素材暂不可编辑');
   name = text(name, 200); if (!name) fail('请输入素材名称');
   if (typeof group_id !== 'string' || !group_id.trim()) fail('请选择已有的素材分组');
   await group(group_id);
   await db.collection(ASSETS).doc(_id).update({ name, group_id, ...updateFields(auth) });
   return { errCode: 0 };
  },
  async remove({ _id } = {}) { await authorize('delete'); return removeOne(_id); },
  async removeBatch({ ids } = {}) {
   await authorize('delete');
   if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some(id => typeof id !== 'string' || !id.trim() || id.length > 100)) fail('请选择 1 至 100 个有效素材');
   const pending = [...new Set(ids)], deleted = [], failed = [];
   let cursor = 0;
   await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
    while (cursor < pending.length) {
     const id = pending[cursor++];
     try { await removeOne(id); deleted.push(id); }
     catch (error) { failed.push({ id, errMsg: error.errMsg || error.message || '删除失败，请重试' }); }
    }
   }));
   return { errCode: 0, deleted, failed };
  }
 };
}
module.exports = { createAssetAdmin, formats };
