<template>
 <ucs-admin-layout title="系统字典" mode="table" :pagination="{ current: page, size, count: filtered.length }" :page-sizes="sizes" @change="changePagination">
  <template #header><el-form class="dict-search" inline @submit.prevent="search"><el-form-item><el-input v-model="keyword" :prefix-icon="Search" placeholder="字典名称或编码" aria-label="字典名称或编码" clearable @clear="search" /></el-form-item><el-form-item><el-button type="primary" :loading="loading" native-type="submit">查询</el-button><el-button @click="keyword = ''; search()">重置</el-button></el-form-item></el-form></template>
  <template #button><el-button v-if="auth.create" type="primary" :icon="Plus" @click="editType()">新增字典</el-button><el-button :icon="Refresh" :loading="loading" aria-label="刷新字典" @click="loadTypes" /></template>
  <div class="dict-content">
  <el-alert v-if="error" :title="error" type="error" :closable="false" />
  <el-table v-loading="loading" :data="pageRows" row-key="_id" height="100%" class="dict-table">
   <template #empty><el-empty :image-size="100" :description="error ? '字典加载失败，请刷新重试' : '暂无符合条件的字典'" /></template>
   <el-table-column type="index" label="序号" width="75" align="center" :index="i => (page - 1) * size + i + 1" />
   <el-table-column prop="name" label="字典名称" min-width="150" /><el-table-column prop="code" label="字典编码" min-width="170" />
   <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
   <el-table-column prop="sort" label="排序" width="80" align="center" />
   <el-table-column label="状态" width="100" align="center"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag></template></el-table-column>
   <el-table-column label="操作" width="240" fixed="right" align="center"><template #default="{ row }"><el-button v-if="auth.update" size="small" plain type="primary" @click="editType(row)">编辑</el-button><el-button size="small" plain type="success" @click="openItems(row)">字典项</el-button><el-button v-if="auth.delete" size="small" plain type="danger" :loading="deletingTypeId === row._id" :disabled="!!deletingTypeId && deletingTypeId !== row._id" @click="deleteType(row)">删除</el-button></template></el-table-column>
  </el-table>
  </div>
 </ucs-admin-layout>
 <el-dialog v-model="itemsVisible" :title="'字典项 · ' + (active?.name || '')" width="960px" align-center class="dict-dialog dict-items-dialog">
  <div class="dict-toolbar">
   <div class="dict-context"><span>字典编码</span><code>{{ active?.code }}</code></div>
   <div class="dict-item-actions">
    <el-button v-if="auth.create" type="primary" :icon="Plus" :disabled="!active?.enabled || itemsLoading" @click="editItem()">新增字典项</el-button>
    <el-button :icon="Refresh" :loading="itemsLoading" aria-label="刷新字典项" @click="loadItems" />
   </div>
  </div>
  <el-alert v-if="!active?.enabled" title="该字典已停用，业务页面不再提供新增选择。" type="info" :closable="false" />
  <el-alert v-if="itemsError" :title="itemsError" type="error" :closable="false" />
  <div class="dict-items-table">
   <el-table v-loading="itemsLoading" :data="items" row-key="_id" height="100%">
    <template #empty><el-empty :image-size="80" :description="itemsError ? '加载失败，请点击刷新重试' : '暂无字典项'" /></template>
    <el-table-column type="index" label="序号" width="65" align="center" :index="i => (itemPage - 1) * itemSize + i + 1" />
    <el-table-column prop="label" label="名称" min-width="160" show-overflow-tooltip />
    <el-table-column prop="value" label="存储值" min-width="150" show-overflow-tooltip />
    <el-table-column label="颜色" width="130"><template #default="{ row }"><span v-if="row.color" class="dict-color"><i class="color-dot" :style="{backgroundColor: row.color}" />{{ row.color }}</span><span v-else>—</span></template></el-table-column>
    <el-table-column prop="sort" label="排序" width="80" align="center" />
    <el-table-column label="状态" width="90" align="center"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '停用' }}</el-tag></template></el-table-column>
    <el-table-column v-if="auth.update || auth.delete" label="操作" width="160" align="center" fixed="right"><template #default="{ row }"><el-button v-if="auth.update" size="small" plain type="primary" :disabled="!!deletingId" @click="editItem(row)">编辑</el-button><el-button v-if="auth.delete" size="small" plain type="danger" :loading="deletingId === row._id" :disabled="!!deletingId && deletingId !== row._id" @click="deleteItem(row)">删除</el-button></template></el-table-column>
   </el-table>
  </div>
  <div class="dict-pagination"><el-pagination background :current-page="itemPage" :page-size="itemSize" :page-sizes="sizes" :total="itemTotal" :pager-count="5" layout="total, sizes, prev, pager, next" :disabled="itemsLoading" @update:current-page="changeItemPage" @update:page-size="changeItemSize" /></div>
  <p class="dict-note">停用后保留历史显示；修改存储值或删除字典项不会同步修改已有业务数据。</p>
 </el-dialog>
 <el-dialog v-model="editorVisible" :title="(form._id ? '编辑' : '新增') + (editingItem ? '字典项' : '字典')" width="560px" align-center class="dict-dialog dict-editor-dialog admin-form-dialog" :close-on-click-modal="false" :show-close="!saving" :close-on-press-escape="!saving">
  <el-form class="dict-editor-form" label-position="right" label-width="110px" :disabled="saving" @submit.prevent="save">
   <el-form-item :label="editingItem ? '名称' : '字典名称'" required><el-input v-model="form.name" maxlength="50" :placeholder="editingItem ? '请输入名称（key）' : '请输入名称'" /></el-form-item>
   <el-form-item :label="editingItem ? '存储值' : '字典编码'" required><el-input v-model="form.code" :disabled="!!form._id && !editingItem" :maxlength="editingItem ? 100 : 80" :placeholder="editingItem ? '请输入存储值（value）' : '请输入字典编码'" /></el-form-item>
   <el-form-item v-if="!editingItem" label="说明"><el-input v-model="form.description" type="textarea" maxlength="300" :rows="2" placeholder="请输入字典用途" /></el-form-item>
   <el-form-item v-else label="标签颜色"><div class="dict-color-field"><el-color-picker v-model="form.color" color-format="hex" :show-alpha="false" :predefine="presetColors" aria-label="选择标签颜色" /><span class="dict-color-value">{{ form.color || '未设置颜色' }}</span></div></el-form-item>
   <el-form-item label="排序"><el-input-number v-model="form.sort" class="dict-sort-input" controls-position="right" :min="0" :max="999999" :precision="0" /></el-form-item>
   <el-form-item label="启用"><div class="dict-switch-field"><el-switch v-model="form.enabled" /><span>{{ form.enabled ? '已启用' : '已停用' }}</span></div></el-form-item>
  </el-form>
  <template #footer><el-button :disabled="saving" @click="editorVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
 </el-dialog>
</template>
<script setup>
import { importTenantAdmin } from '../../../common/tenant-session.js';
import '../../../common/form-dialog.css';
import {ref,reactive,computed,onMounted,onBeforeUnmount} from 'vue';
import {ElAlert,ElButton,ElColorPicker,ElDialog,ElEmpty,ElForm,ElFormItem,ElInput,ElInputNumber,ElMessage,ElMessageBox,ElPagination,ElSwitch,ElTable,ElTableColumn,ElTag,vLoading} from 'element-plus';
import {Search,Plus,Refresh} from '@element-plus/icons-vue';
import {withSessionHandling} from '../../../common/session-errors.js';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/color-picker/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/input-number/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import 'element-plus/es/components/message-box/style/css.mjs';
import 'element-plus/es/components/pagination/style/css.mjs';
import 'element-plus/es/components/switch/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';

const api=importTenantAdmin();
const sizes=[20,40,60,80,100];
const presetColors=['#409EFF','#67C23A','#E6A23C','#F56C6C','#909399','#8B5CF6','#14B8A6','#EC4899'];
const types=ref([]),loading=ref(true),error=ref(''),keyword=ref(''),applied=ref(''),page=ref(1),size=ref(20);
const auth=reactive({create:false,update:false,delete:false});
const filtered=computed(()=>types.value.filter(x=>!applied.value||[x.name,x.code].some(v=>v.toLowerCase().includes(applied.value))));
const pageRows=computed(()=>filtered.value.slice((page.value-1)*size.value,page.value*size.value));
const active=ref(null),itemsVisible=ref(false),items=ref([]),itemsLoading=ref(false),itemsError=ref(''),itemPage=ref(1),itemSize=ref(20),itemTotal=ref(0);
const editorVisible=ref(false),editingItem=ref(false),saving=ref(false),form=reactive({});
const deletingId=ref(''),deletingTypeId=ref('');
let listRequest=0,itemRequest=0;
const message=e=>e.errMsg||e.message||'操作失败，请重试';
async function call(name,params) {return withSessionHandling(async()=>{const result=await api[name](params);if(result.errCode)throw result;return result;});}
async function loadTypes() {
 const request=++listRequest;loading.value=true;error.value='';
 try {const result=await call('listDictionaryTypes');if(request!==listRequest)return;types.value=result.data;Object.assign(auth,result.auth);page.value=Math.min(page.value,Math.max(1,Math.ceil(filtered.value.length/size.value)));}
 catch(e){if(request===listRequest){error.value=message(e);types.value=[];}}
 finally{if(request===listRequest)loading.value=false;}
}
function changePagination(value){page.value=value.current;size.value=value.size;}
function search(){applied.value=keyword.value.trim().toLowerCase();page.value=1;loadTypes();}
function openItems(row){active.value=row;itemsVisible.value=true;itemPage.value=1;items.value=[];itemTotal.value=0;loadItems();}
async function loadItems(){
 if(!active.value)return;const request=++itemRequest;itemsLoading.value=true;itemsError.value='';
 try{const result=await call('listDictionaryItems',{dict_id:active.value._id,current:itemPage.value,size:itemSize.value});if(request!==itemRequest)return;items.value=result.data;itemTotal.value=result.total;itemPage.value=result.current;}
 catch(e){if(request===itemRequest){itemsError.value=message(e);items.value=[];itemTotal.value=0;}}
 finally{if(request===itemRequest)itemsLoading.value=false;}
}
function changeItemPage(value){if(value===itemPage.value)return;itemPage.value=value;loadItems();}
function changeItemSize(value){itemSize.value=value;itemPage.value=1;loadItems();}
function editType(row){editingItem.value=false;Object.assign(form,{_id:row?._id||'',name:row?.name||'',code:row?.code||'',description:row?.description||'',enabled:row?.enabled??true,sort:row?.sort||0,color:''});editorVisible.value=true;}
function editItem(row){editingItem.value=true;Object.assign(form,{_id:row?._id||'',name:row?.label||'',code:row?.value||'',description:'',enabled:row?.enabled??true,sort:row?.sort||0,color:row?.color||''});editorVisible.value=true;}
async function deleteType(row){
 if(deletingTypeId.value)return;
 deletingTypeId.value=row._id;
 try{
  await ElMessageBox.confirm(`确定删除字典“${row.name}”？删除后无法恢复，包含字典项时需先清空。`,'删除字典',{type:'warning',confirmButtonText:'删除',cancelButtonText:'取消'});
  await call('deleteDictionaryType',{_id:row._id});
  ElMessage.success('删除成功');
  await loadTypes();
 }catch(e){if(e!=='cancel' && e!=='close')ElMessage.error(message(e));}
 finally{deletingTypeId.value='';}
}
async function deleteItem(row){
 if(deletingId.value)return;
 deletingId.value=row._id;
 try{
  await ElMessageBox.confirm(`确定删除字典项“${row.label}”？已有业务数据中的存储值会保留。`,'删除字典项',{type:'warning',confirmButtonText:'删除',cancelButtonText:'取消'});
  await call('deleteDictionaryItem',{_id:row._id});
  ElMessage.success('删除成功');
  await loadItems();
 }catch(e){if(e!=='cancel' && e!=='close')ElMessage.error(message(e));}
 finally{deletingId.value='';}
}
async function save(){
 if(saving.value)return;if(!form.name.trim()||!form.code.trim())return ElMessage.warning('请填写名称和编码/存储值');
 saving.value=true;
 try{await call(editingItem.value?'saveDictionaryItem':'saveDictionaryType',editingItem.value?{...form,dict_id:active.value._id,label:form.name,value:form.code}:{...form});ElMessage.success('保存成功');editorVisible.value=false;await (editingItem.value?loadItems():loadTypes());}
 catch(e){ElMessage.error(message(e));}finally{saving.value=false;}
}
onMounted(loadTypes);onBeforeUnmount(()=>{listRequest++;itemRequest++;});
</script>
<style scoped>
.dict-search :deep(.el-input){width:240px;max-width:100%;}
.dict-content{height:100%;min-height:0;display:flex;flex-direction:column;}
.dict-content > .el-alert{flex-shrink:0;}
.dict-table{flex:1;min-height:0;width:100%;}
.dict-table :deep(.el-button + .el-button),
.dict-items-table :deep(.el-button + .el-button){margin-left:6px;}
@media(max-width:600px){.dict-search :deep(.el-input){width:200px;}}

.dict-pagination{padding:18px 0 0;display:flex;justify-content:flex-end;overflow-x:auto;}
.dict-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap;}
.dict-context{display:flex;align-items:center;gap:10px;min-width:0;color:var(--el-text-color-secondary);font-size:13px;}
.dict-context code{color:var(--el-text-color-regular);background:var(--el-fill-color-light);padding:5px 9px;border-radius:4px;overflow-wrap:anywhere;}
.dict-item-actions{display:flex;gap:8px;margin-left:auto;}.dict-item-actions .el-button + .el-button{margin-left:0;}
.dict-items-table{height:clamp(220px,40vh,400px);border:1px solid var(--el-border-color-lighter);border-radius:6px;overflow:hidden;}
.dict-items-table :deep(.el-table){--el-table-header-bg-color:var(--el-fill-color-light);--el-table-header-text-color:var(--el-text-color-regular);}
.dict-items-table :deep(th.el-table__cell){height:44px;font-weight:500;}
.dict-items-table :deep(td.el-table__cell){height:52px;}
.dict-color{display:inline-flex;align-items:center;font-size:12px;font-family:ui-monospace,Consolas,monospace;}
.dict-color-field{display:flex;align-items:center;gap:12px;}
.dict-color-value{font-size:13px;color:var(--el-text-color-secondary);}
:global(.dict-items-dialog .el-dialog__header){padding-bottom:20px;}

.dict-note{font-size:12px;color:var(--el-text-color-secondary);margin:12px 0;}
.color-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;}
:global(.dict-dialog){max-width:calc(100vw - 32px);max-height:calc(100dvh - 40px);padding:24px;display:flex;flex-direction:column;}
:global(.dict-dialog .el-dialog__body){overflow-y:auto;min-height:0;}
.dict-editor-form :deep(.el-form-item){align-items:center;}
.dict-editor-form :deep(.el-form-item__label){height:auto;line-height:22px;align-items:center;}
.dict-sort-input{width:120px;}
.dict-editor-form :deep(.dict-sort-input .el-input__wrapper){height:32px;min-height:32px;}
.dict-editor-form :deep(.dict-sort-input .el-input__inner){height:30px;line-height:30px;}
.dict-color-field{min-height:40px;}
.dict-switch-field{display:flex;align-items:center;gap:12px;min-height:40px;font-size:13px;color:var(--el-text-color-secondary);}
</style>
