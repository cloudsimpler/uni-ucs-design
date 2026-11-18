const { accessContext, fail } = require('./admin-access');
const TYPES = 'ucsdb-dict-types', ITEMS = 'ucsdb-dict-items', SUFFIX = 'UCSDB_DICT';
const one = result => Array.isArray(result.data) ? result.data[0] : result.data;
function createDictionaryAdmin({db, uid, appId}) {
 const ctx = accessContext({db,uid,appId});
 const authorize = async action => { const auth=await ctx.actor(); action==='read' ? ctx.requireRead(auth,SUFFIX) : ctx.requirePermission(auth,`${action.toUpperCase()}_${SUFFIX}`); return auth; };
 const str = (value,max=100) => { if(typeof value!=='string'||!value.trim()||value.length>max) fail('请填写有效的名称或标识'); return value.trim(); };
 const find = async (table,id) => { const row=one(await db.collection(table).doc(str(id)).get()); if(!row) fail('记录不存在，请刷新'); return row; };
 const fields = params => {
  if(typeof params.enabled!=='boolean'||!Number.isInteger(params.sort)||params.sort<0||params.sort>999999) fail('启用状态或排序不正确');
  return {enabled:params.enabled,sort:params.sort,update_date:Date.now()};
 };
 return {
  async install() {
   const auth=await ctx.actor(); if(!auth.isAdmin) fail('仅超级管理员可安装字典菜单');
   const parent=one(await db.collection('opendb-admin-menus').where({menu_id:'system_management'}).limit(1).get());
   if(!parent) fail('请先建立系统管理目录');
   let changed=false;
   const ensure=async(table,key,data)=>{
    if(one(await db.collection(table).where({[key]:data[key]}).limit(1).get())) return;
    try { await db.collection(table).add(data); changed=true; } catch(e) { if(!one(await db.collection(table).where({[key]:data[key]}).limit(1).get())) throw e; }
   };
   for(const row of require('./permission-catalog').filter(x=>x.menu_id==='system_dictionary')) await ensure('uni-id-permissions','permission_id',row);
   await ensure('opendb-admin-menus','menu_id',{menu_id:'system_dictionary',name:'数据字典',icon:'Collection',url:'/uni_modules/ucs-design-admin/pages/system/dictionary/dictionary',parent_id:'system_management',sort:27,menu_type:1,client_type:['pc'],enable:true,app_url:'',app_icon:''});
   return {errCode:0,changed};
  },
  async types() { const auth=await authorize('read'); if(auth.isAdmin) { const permission=require('./permission-catalog').find(x=>x.permission_id==='DELETE_UCSDB_DICT'); const table=db.collection('uni-id-permissions'); if(!one(await table.where({permission_id:permission.permission_id}).limit(1).get())) { try { await table.add(permission); } catch(e) { if(!one(await table.where({permission_id:permission.permission_id}).limit(1).get())) throw e; } } } const data=await ctx.all(TYPES); data.sort((a,b)=>a.sort-b.sort||a.code.localeCompare(b.code)); return {errCode:0,data,auth:ctx.capabilities(auth,SUFFIX)}; },
  async items({dict_id,keyword='',current=1,size=20}={}) {
   await authorize('read'); await find(TYPES,dict_id);
   if(![20,40,60,80,100].includes(size)||!Number.isInteger(current)||current<1||current>100000) fail('分页参数不正确');
   if(typeof keyword!=='string'||keyword.length>100) fail('关键词不正确');
   const where={dict_id}; if(keyword.trim()) where.label=new RegExp(keyword.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
   const query=()=>db.collection(ITEMS).where(where); const {total}=await query().count(); current=Math.min(current,Math.max(1,Math.ceil(total/size)));
   const {data}=await query().orderBy('sort','asc').orderBy('_id','asc').skip((current-1)*size).limit(size).get();
   return {errCode:0,data,total,current};
  },
  async saveType(params={}) {
   await authorize(params._id?'update':'create'); const data={...fields(params),name:str(params.name,50)};
   if(typeof params.description!=='string'||params.description.length>300) fail('说明最多300字'); data.description=params.description.trim();
   if(params._id) { const old=await find(TYPES,params._id); if(params.code!==old.code) fail('字典编码不可修改'); await db.collection(TYPES).doc(old._id).update(data); }
   else { data.code=str(params.code,80); if(!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.code)) fail('编码须以字母开头，仅含字母、数字、下划线');
    if(one(await db.collection(TYPES).where({code:data.code}).limit(1).get())) fail('字典编码已存在');
    await db.collection(TYPES).add({...data,create_date:Date.now()}); }
   return {errCode:0};
  },
  async saveItem(params={}) {
   await authorize(params._id?'update':'create'); const type=await find(TYPES,params.dict_id);
   const data={...fields(params),label:str(params.label,100),value:str(params.value,100),color:params.color||''};
   if(!/^$|^#[0-9a-fA-F]{6}$/.test(data.color)) fail('颜色须为六位十六进制色值');
   const old=params._id ? await find(ITEMS,params._id) : null;
   if(old && old.dict_id!==type._id) fail('所属字典不可修改');
   if(!old && !type.enabled) fail('请先启用字典类型');
   const duplicate=one(await db.collection(ITEMS).where({dict_id:type._id,value:data.value}).limit(1).get());
   if(duplicate && duplicate._id!==old?._id) fail('此字典内的存储值已存在');
   if(old) await db.collection(ITEMS).doc(old._id).update(data);
   else await db.collection(ITEMS).add({...data,dict_id:type._id,create_date:Date.now()});
   return {errCode:0};
  },
  async removeType({_id}={}) {
   await authorize('delete');
   const type=await find(TYPES,_id);
   if(one(await db.collection(ITEMS).where({dict_id:type._id}).limit(1).get())) fail('此字典包含字典项，请先清空字典项再删除');
   await db.collection(TYPES).doc(type._id).remove();
   return {errCode:0};
  },
  async removeItem({_id}={}) {
   await authorize('delete');
   const item=await find(ITEMS,_id);
   await db.collection(ITEMS).doc(item._id).remove();
   return {errCode:0};
  },
  // Business consumers load dictionaries once per page; disabled entries remain available for historical labels.
  async options({codes=[]}={}) {
   await ctx.actor(); if(!Array.isArray(codes)||!codes.length||codes.length>20||codes.some(x=>typeof x!=='string'||!x||x.length>80)) fail('字典编码参数不正确');
   const types=await ctx.all(TYPES,{code:db.command.in([...new Set(codes)])});
   const items=types.length?await ctx.all(ITEMS,{dict_id:db.command.in(types.map(x=>x._id))}):[];
   const data={}; for(const code of codes) data[code]=[];
   for(const type of types) data[type.code]=items.filter(x=>x.dict_id===type._id).sort((a,b)=>a.sort-b.sort).map(x=>({label:x.label,value:x.value,color:x.color||'',enabled:type.enabled&&x.enabled}));
   return {errCode:0,data};
  }
 };
}
module.exports={createDictionaryAdmin};
