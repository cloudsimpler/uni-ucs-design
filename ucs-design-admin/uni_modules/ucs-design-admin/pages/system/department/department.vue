<template>
 <ucs-admin-layout class="department-layout" title="部门管理" mode="card" :padding="false">
  <template #header><el-form inline class="department-search" @submit.prevent="search">
   <el-form-item><el-input v-model="keyword" :prefix-icon="Search" placeholder="部门名称或编码" clearable @clear="search" /></el-form-item>
   <el-form-item><el-select v-model="status" placeholder="全部状态" clearable><el-option label="启用" value="enabled" /><el-option label="停用" value="disabled" /></el-select></el-form-item>
   <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
  </el-form></template>
  <template #button><el-button v-if="auth.create" type="primary" @click="edit()">新增部门</el-button><el-button :icon="Refresh" :loading="loading" aria-label="刷新部门" @click="load" /></template>
  <div class="department-content">
   <el-alert v-if="error" :title="error" type="error" :closable="false" />
   <el-table class="department-table" v-loading="loading" :data="filteredTree" row-key="_id" height="100%" default-expand-all>
    <template #empty><el-empty :image-size="100" :description="error ? '加载失败，请重试' : '暂无符合条件的部门'" /></template>
    <el-table-column prop="name" label="部门名称" min-width="220" />
    <el-table-column prop="code" label="部门编码" min-width="150"><template #default="{ row }">{{ row.code || '—' }}</template></el-table-column>
    <el-table-column label="负责人" min-width="130"><template #default="{ row }">{{ row.manager_name || '—' }}</template></el-table-column>
    <el-table-column prop="sort" label="排序" width="80" align="center" />
    <el-table-column label="状态" width="130" align="center"><template #default="{ row }"><el-tag :type="row.effective_enabled ? 'success' : 'info'">{{ row.effective_enabled ? '启用' : row.enabled ? '上级已停用' : '停用' }}</el-tag></template></el-table-column>
    <el-table-column label="操作" width="250" align="center" fixed="right"><template #default="{ row }">
     <el-button v-if="auth.create" size="small" plain type="success" :disabled="!row.effective_enabled || !!deleting" @click="edit(null, row._id)">新增下级</el-button>
     <el-button v-if="auth.update" size="small" plain type="primary" :disabled="!!deleting" @click="edit(row)">编辑</el-button>
     <el-button v-if="auth.delete" size="small" plain type="danger" :loading="deleting === row._id" :disabled="!!deleting && deleting !== row._id" @click="remove(row)">删除</el-button>
    </template></el-table-column>
   </el-table>
   <div class="department-footer">共 {{ rows.length }} 个部门</div>
  </div>
 </ucs-admin-layout>
 <el-dialog v-model="visible" :title="form._id ? '编辑部门' : '新增部门'" width="600px" align-center class="admin-form-dialog" :close-on-click-modal="false" :close-on-press-escape="!saving" :show-close="!saving">
  <el-form label-position="right" label-width="110px" :disabled="saving" class="department-form" @submit.prevent="save">
   <el-form-item label="上级部门"><el-tree-select v-model="form.parent_id" :data="parentTree" node-key="_id" :props="{ label: 'name', value: '_id', children: 'children', disabled: 'disabled' }" check-strictly clearable placeholder="不选则为顶级部门" /></el-form-item>
   <el-form-item label="部门名称" required><el-input v-model="form.name" maxlength="50" placeholder="请输入部门名称" /></el-form-item>
   <el-form-item label="部门编码" required><el-input v-model="form.code" :disabled="codeLocked" maxlength="80" placeholder="请输入部门编码" /></el-form-item>
   <el-form-item label="负责人"><div class="manager-field"><el-input :model-value="managerName" readonly placeholder="请选择负责人" /><el-button :disabled="saving" @click="openManagerPicker">{{ form.manager_uid ? '更换' : '选择' }}</el-button><el-button v-if="form.manager_uid" :disabled="saving" @click="clearManager">清除</el-button></div></el-form-item>
   <el-form-item label="排序"><el-input-number v-model="form.sort" controls-position="right" :min="0" :max="999999" :precision="0" class="department-sort" /></el-form-item>
   <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
   <el-form-item label="说明"><el-input v-model="form.description" type="textarea" :rows="3" maxlength="300" show-word-limit placeholder="请输入部门说明" /></el-form-item>
  </el-form>
  <template #footer><el-button :disabled="saving" @click="visible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
 </el-dialog>
 <ucs-admin-userPicker v-model="form.manager_uid" v-model:visible="managerVisible" title="选择部门负责人" :selected-users="selectedManagerUsers" :fetch-users="fetchManagers" @confirm="onManagerConfirm" />
</template>
<script setup>
import { importTenantAdmin } from '../../../common/tenant-session.js';
import '../../../common/form-dialog.css';
import UcsAdminUserPicker from '../../../components/ucs-admin-userPicker/ucs-admin-userPicker.vue';
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { ElAlert, ElButton, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage, ElMessageBox, ElOption, ElSelect, ElSwitch, ElTable, ElTableColumn, ElTag, ElTreeSelect, vLoading } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';
import { withSessionHandling } from '../../../common/session-errors.js';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/input-number/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import 'element-plus/es/components/message-box/style/css.mjs';
import 'element-plus/es/components/option/style/css.mjs';
import 'element-plus/es/components/select/style/css.mjs';
import 'element-plus/es/components/switch/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/tree-select/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
const api = importTenantAdmin();
const rows = ref([]), loading = ref(true), error = ref(''), keyword = ref(''), status = ref(''), applied = reactive({ keyword: '', status: '' });
const auth = reactive({ create: false, update: false, delete: false }), visible = ref(false), saving = ref(false), deleting = ref(''), form = reactive({});
const codeLocked = ref(false), managerName = ref(''), managerVisible = ref(false);
let request = 0;
const message = e => e?.errMsg || e?.message || '操作失败，请重试';
async function call(name, params) { return withSessionHandling(async () => { const result = await api[name](params); if (result.errCode) throw result; return result; }); }
function tree(data) {
 const nodes = new Map(data.map(row => [row._id, { ...row, children: [] }])), roots = [];
 for (const node of nodes.values()) {
  let parent = nodes.get(node.parent_id), current = parent; const seen = new Set([node._id]);
  while (current && !seen.has(current._id)) { seen.add(current._id); current = nodes.get(current.parent_id); }
  if (current) parent = null;
  if (parent) parent.children.push(node); else roots.push(node);
 }
 const sort = nodes => nodes.sort((a,b) => (a.sort || 0) - (b.sort || 0) || a.name.localeCompare(b.name)).map(node => ({ ...node, children: sort(node.children) }));
 return sort(roots);
}
const filteredTree = computed(() => {
 const filter = nodes => nodes.flatMap(node => {
  const children = filter(node.children), match = (!applied.keyword || [node.name, node.code || ''].some(text => text.toLowerCase().includes(applied.keyword))) && (!applied.status || node.effective_enabled === (applied.status === 'enabled'));
  return match || children.length ? [{ ...node, children }] : [];
 });
 return filter(tree(rows.value));
});
const parentTree = computed(() => {
 const blocked = new Set(form._id ? [form._id] : []);
 let changed = true; while(changed) { changed = false; for (const row of rows.value) if (blocked.has(row.parent_id) && !blocked.has(row._id)) { blocked.add(row._id); changed = true; } }
 return tree(rows.value.map(row => ({ ...row, disabled: blocked.has(row._id) || !row.effective_enabled })));
});
async function load() {
 const id = ++request; loading.value = true; error.value = '';
 try { const result = await call('listDepartments'); if (id !== request) return; rows.value = result.data; Object.assign(auth, result.auth); }
 catch(e) { if(id === request) error.value = message(e); }
 finally { if(id === request) loading.value = false; }
}
function search() { applied.keyword = keyword.value.trim().toLowerCase(); applied.status = status.value || ''; load(); }
function reset() { keyword.value = ''; status.value = ''; search(); }
function edit(row, parent = '') {
 Object.assign(form, { _id: row?._id || '', name: row?.name || '', code: row?.code || '', parent_id: row?.parent_id || parent, manager_uid: row?.manager_uid || '', sort: row?.sort || 0, enabled: row?.enabled !== false, description: row?.description || '' });
 codeLocked.value = !!row?.code; managerName.value = row?.manager_name || (row?.manager_uid ? '原负责人（请核实）' : ''); visible.value = true;
}
const selectedManagerUsers = computed(() => form.manager_uid ? [{ _id: form.manager_uid, nickname: managerName.value }] : []);
const fetchManagers = params => call('searchDepartmentManagers', params);
function openManagerPicker() { managerVisible.value = true; }
function clearManager() { form.manager_uid = ''; managerName.value = ''; }
function onManagerConfirm(user) { managerName.value = user.nickname || user.username || user._id; }
async function save() {
 if(saving.value) return; if(!form.name.trim()) return ElMessage.warning('请输入部门名称'); if(!form.code.trim()) return ElMessage.warning('请输入部门编码'); saving.value = true;
 try { await call('saveDepartment', { ...form, parent_id: form.parent_id || '', manager_uid: form.manager_uid || '' }); ElMessage.success('保存成功'); visible.value = false; await load(); }
 catch(e) { ElMessage.error(message(e)); } finally { saving.value = false; }
}
async function remove(row) {
 if(deleting.value) return; deleting.value = row._id;
 try { await ElMessageBox.confirm(`确定删除部门“${row.name}”？有下级部门或关联用户时需先迁移。`, '删除部门', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); await call('deleteDepartment', { _id: row._id }); ElMessage.success('删除成功'); await load(); }
 catch(e) { if(e !== 'cancel' && e !== 'close') ElMessage.error(message(e)); } finally { deleting.value = ''; }
}
onMounted(load); onBeforeUnmount(() => { request++; });
</script>
<style scoped>
.manager-field{display:flex;align-items:center;gap:8px;width:100%;}.manager-field .el-input{flex:1;min-width:0;}.manager-field .el-button + .el-button{margin-left:0;}
.department-layout{height:calc(100vh - var(--top-window-height,56px));height:calc(100dvh - var(--top-window-height,56px));min-height:0;overflow:hidden;}
.department-layout :deep(.layout-card){display:flex;min-height:0;overflow:hidden;}
.department-table{width:100%;--el-table-header-bg-color:var(--el-fill-color-light);--el-table-header-text-color:var(--el-text-color-regular);}
.department-table :deep(th.el-table__cell){height:var(--admin-table-header-height,44px);padding:8px 0;font-weight:500;}
.department-table :deep(td.el-table__cell){height:var(--admin-table-row-height,64px);padding:var(--admin-table-cell-padding,8px 0);box-sizing:border-box;}

.department-search :deep(.el-input){width:240px;}.department-search :deep(.el-select){width:140px;}
.department-content{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden;}.department-content :deep(.el-table){flex:1;min-height:0;}.department-content :deep(.el-button + .el-button){margin-left:6px;}.department-footer{flex-shrink:0;min-height:64px;box-sizing:border-box;display:flex;align-items:center;justify-content:flex-end;padding:18px 24px;border-top:1px solid var(--el-border-color-lighter);text-align:right;color:var(--el-text-color-secondary);font-size:14px;}
.department-form :deep(.el-form-item){align-items:center;}.department-form :deep(.el-form-item__label){height:auto;line-height:22px;align-items:center;}.department-form :deep(.el-tree-select){width:100%;}.department-sort{width:120px;}
</style>
