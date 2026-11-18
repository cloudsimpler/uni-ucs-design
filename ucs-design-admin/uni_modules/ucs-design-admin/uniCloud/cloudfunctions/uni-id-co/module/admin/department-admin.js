const { accessContext, fail } = require('./admin-access');
const { hasManagementIdentity } = require('./account-types');
const TABLE = 'opendb-department', SUFFIX = 'OPENDB_DEPARTMENT';
const one = result => Array.isArray(result.data) ? result.data[0] : result.data;
function effectiveEnabled(rows, id) {
 const byId = new Map(rows.map(row => [row._id, row])), seen = new Set();
 while (id) {
  const row = byId.get(id);
  if (!row || seen.has(id) || row.enabled === false) return false;
  seen.add(id); id = row.parent_id;
 }
 return true;
}
function createDepartmentAdmin({ db, uid, appId }) {
 const ctx = accessContext({ db, uid, appId });
 const authorize = async action => { const auth = await ctx.actor(); action === 'read' ? ctx.requireRead(auth, SUFFIX) : ctx.requirePermission(auth, `${action.toUpperCase()}_${SUFFIX}`); return auth; };
 const text = (value, max = 100) => { if (typeof value !== 'string' || value.length > max) fail('字段格式或长度不正确'); return value.trim(); };
 return {
  async install() {
   const auth = await ctx.actor(); if (!auth.isAdmin) fail('仅超级管理员可安装部门管理');
   if (!one(await db.collection('opendb-admin-menus').where({ menu_id: 'system_management' }).limit(1).get())) fail('请先建立系统管理目录');
   let changed = false;
   const ensure = async (table, key, data) => {
    const query = () => db.collection(table).where({ [key]: data[key] }).limit(1).get();
    if (one(await query())) return;
    try { await db.collection(table).add(data); changed = true; } catch (e) { if (!one(await query())) throw e; }
   };
   for (const row of require('./permission-catalog').filter(row => row.menu_id === 'system_department')) await ensure('uni-id-permissions', 'permission_id', row);
   await ensure('opendb-admin-menus', 'menu_id', { menu_id: 'system_department', name: '部门管理', icon: 'OfficeBuilding', url: '/uni_modules/ucs-design-admin/pages/system/department/department', parent_id: 'system_management', sort: 22, menu_type: 1, client_type: ['pc'], enable: true, app_url: '', app_icon: '' });
   return { errCode: 0, changed };
  },
  async list() {
   const auth = await authorize('read');
   const rows = await ctx.all(TABLE);
   const ids = [...new Set(rows.map(row => row.manager_uid).filter(Boolean))];
   const managers = ids.length ? await ctx.all('uni-id-users', { _id: db.command.in(ids) }) : [];
   return { errCode: 0, auth: ctx.capabilities(auth, SUFFIX), data: rows.map(row => ({ ...row, enabled: row.enabled !== false, effective_enabled: effectiveEnabled(rows, row._id), manager_name: (() => { const user = managers.find(user => user._id === row.manager_uid); return user ? user.real_name || user.nickname || user.username || '' : ''; })() })) };
  },
  async managers({ keyword = '', current = 1, size = 20 } = {}) {
   const auth = await authorize('read');
   if (!ctx.can(auth, 'CREATE_' + SUFFIX) && !ctx.can(auth, 'UPDATE_' + SUFFIX)) fail('没有编辑部门权限');
   keyword = text(keyword, 80);
   if (!Number.isInteger(current) || current < 1 || current > 100000 || ![20,40,60,80,100].includes(size)) fail('分页参数不正确');
   const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
   const filters = [
    db.command.or([{ status: 0 }, { status: db.command.exists(false) }]),
    db.command.or([{ account_type: 0 }, { account_type: db.command.exists(false) }])
   ];
   if (keyword) filters.push(db.command.or([{ real_name: regex }, { username: new RegExp(regex.source) }, { mobile: regex }]));
   const query = () => db.collection('uni-id-users').where(db.command.and(filters));
   const { total } = await query().count();
   current = Math.min(current, Math.max(1, Math.ceil(total / size)));
   const { data } = await query().field({ _id: true, real_name: true, nickname: true, username: true, gender: true, role: true, mobile: true, department_id: true }).orderBy('_id', 'asc').skip((current - 1) * size).limit(size).get();
   const roleIds = [...new Set(data.flatMap(user => user.role || []))].filter(id => id !== 'admin');
   const roles = roleIds.length ? await ctx.all('uni-id-roles', { role_id: db.command.in(roleIds) }) : [];
   const names = new Map(roles.map(role => [role.role_id, role.role_name || role.role_id]));
   names.set('admin', '超级管理员');
   const departmentIds = [...new Set(data.flatMap(user => user.department_id || []))];
   const departments = departmentIds.length ? await ctx.all(TABLE, { _id: db.command.in(departmentIds) }) : [];
   const departmentNames = new Map(departments.map(department => [department._id, department.name]));
   return { errCode: 0, data: data.map(user => ({ ...user, department_names: (user.department_id || []).map(id => departmentNames.get(id)).filter(Boolean), role_names: (user.role || []).map(id => names.get(id) || id) })), total, current };
  },
  async save(params = {}) {
   await authorize(params._id ? 'update' : 'create');
   const rows = await ctx.all(TABLE), old = params._id ? rows.find(row => row._id === params._id) : null;
   if (params._id && !old) fail('部门不存在，请刷新');
   const name = text(params.name, 50), parent_id = text(params.parent_id || ''), code = text(params.code || '', 80), manager_uid = text(params.manager_uid || '');
   if (!name) fail('请输入部门名称');
   if (!code) fail('请输入部门编码');
   if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(code)) fail('编码须以字母开头，仅含字母、数字、下划线或短横线');
   if (old?.code && code !== old.code) fail('部门编码创建后不可修改');
   if (typeof params.enabled !== 'boolean' || !Number.isInteger(params.sort) || params.sort < 0 || params.sort > 999999) fail('状态或排序不正确');
   const description = text(params.description || '', 300);
   let id = parent_id, level = 1; const visited = new Set(old ? [old._id] : []);
   while (id) {
    if (visited.has(id)) fail('上级部门不能是自身或下级部门');
    visited.add(id); const parent = rows.find(row => row._id === id);
    if (!parent) fail('上级部门不存在');
    if ((!old || parent_id !== (old.parent_id || '')) && parent.enabled === false) fail('不能移入已停用的部门');
    id = parent.parent_id; level++;
   }
   if (rows.some(row => row._id !== old?._id && (row.parent_id || '') === parent_id && row.name === name)) fail('同级部门名称已存在');
   if (code && rows.some(row => row._id !== old?._id && row.code === code)) fail('部门编码已存在');
   if (manager_uid) {
    const user = one(await db.collection('uni-id-users').doc(manager_uid).get());
    if (!user || !hasManagementIdentity(user) || (user.status || 0) !== 0) fail('负责人必须是正常状态的系统用户');
   }
   const data = { name, parent_id, code, manager_uid, level, sort: params.sort, enabled: params.enabled, description, update_date: Date.now() };
   if (old) {
    await db.collection(TABLE).doc(old._id).update(data);
    // Recalculate descendant levels after reparenting; relations remain based on parent_id.
    const updateChildren = async (parent, depth, seen = new Set()) => {
     if (seen.has(parent)) return; seen.add(parent);
     for (const child of rows.filter(row => row.parent_id === parent)) { await db.collection(TABLE).doc(child._id).update({ level: depth + 1 }); await updateChildren(child._id, depth + 1, seen); }
    };
    await updateChildren(old._id, level);
   } else await db.collection(TABLE).add({ ...data, create_date: Date.now() });
   return { errCode: 0 };
  },
  async remove({ _id } = {}) {
   await authorize('delete'); _id = text(_id);
   if (!one(await db.collection(TABLE).doc(_id).get())) fail('部门不存在');
   if (one(await db.collection(TABLE).where({ parent_id: _id }).limit(1).get())) fail('此部门有下级部门，请先迁移或删除下级');
   if (one(await db.collection('uni-id-users').where({ department_id: _id }).limit(1).get())) fail('此部门有关联用户，请先调整人员归属');
   await db.collection(TABLE).doc(_id).remove(); return { errCode: 0 };
  }
 };
}
module.exports = { createDepartmentAdmin, effectiveEnabled };
