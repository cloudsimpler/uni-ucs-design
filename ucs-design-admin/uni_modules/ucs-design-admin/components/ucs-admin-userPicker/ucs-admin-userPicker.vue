<template>
 <el-dialog v-model="dialogVisible" :title="title" width="1040px" align-center append-to-body class="admin-form-dialog" :close-on-click-modal="false">
  <el-form inline class="manager-search" @submit.prevent="queryManagers"><el-form-item><el-input v-model="managerKeyword" :prefix-icon="Search" placeholder="昵称、账号、手机号" maxlength="80" clearable @clear="queryManagers" /></el-form-item><el-form-item><el-button type="primary" native-type="submit" :loading="managerLoading">查询</el-button><el-button @click="resetManagers">重置</el-button></el-form-item></el-form>
  <el-alert v-if="managerError" :title="managerError" type="error" :closable="false" />
  <el-table :data="managers" v-loading="managerLoading" row-key="_id" height="340px" class="manager-table" :row-class-name="rowClass" @row-click="selectManager">
   <template #empty><el-empty :image-size="70" :description="managerError ? '加载失败，请重试' : '暂无符合条件的系统用户'" /></template>
   <el-table-column label="选择" width="70" align="center"><template #default="{ row }"><span @click.stop><el-checkbox v-if="multiple" :model-value="isSelected(row)" :disabled="isDisabled(row) || managerLoading" :aria-label="'选择' + managerLabel(row)" @change="selectManager(row)" /><el-radio v-else :model-value="selected[0]?._id || ''" :value="row._id" :disabled="isDisabled(row) || managerLoading" :aria-label="'选择' + managerLabel(row)" @change="selectManager(row)"><span /></el-radio></span></template></el-table-column>
   <el-table-column label="账号" min-width="140" show-overflow-tooltip><template #default="{ row }">{{ row.username || '—' }}</template></el-table-column>
   <el-table-column label="昵称" min-width="120" show-overflow-tooltip><template #default="{ row }">{{ row.nickname || '—' }}</template></el-table-column>
   <el-table-column label="性别" width="75" align="center"><template #default="{ row }">{{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '—' }}</template></el-table-column>
   <el-table-column label="部门" min-width="140" show-overflow-tooltip><template #default="{ row }">{{ row.department_names?.join('、') || '—' }}</template></el-table-column>
   <el-table-column label="角色" min-width="170"><template #default="{ row }"><div v-if="row.role_names?.length" class="manager-roles"><el-tag v-for="(name, index) in row.role_names" :key="index" size="small">{{ name }}</el-tag></div><span v-else>未分配</span></template></el-table-column>
   <el-table-column label="手机号" min-width="140"><template #default="{ row }">{{ row.mobile || '—' }}</template></el-table-column>
  </el-table>
  <div class="manager-pagination"><el-pagination size="small" background :current-page="managerPage" :page-size="managerSize" :page-sizes="[20,40,60,80,100]" :total="managerTotal" :pager-count="5" layout="total, sizes, prev, pager, next" :disabled="managerLoading" @update:current-page="changeManagerPage" @update:page-size="changeManagerSize" /></div>
  <template #footer><span class="manager-selected">{{ selected.length ? (multiple ? '已选择 ' + selected.length + ' 人' : '已选择：' + managerLabel(selected[0])) : '请选择系统用户' }}</span><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :disabled="!selected.length || selected.some(isDisabled) || managerLoading || !!managerError" @click="confirmManager">确认选择</el-button></template>
 </el-dialog>
</template>
<script setup>
import '../../common/form-dialog.css';
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { ElAlert, ElButton, ElCheckbox, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElMessage, ElPagination, ElRadio, ElTable, ElTableColumn, ElTag, vLoading } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/checkbox/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import 'element-plus/es/components/pagination/style/css.mjs';
import 'element-plus/es/components/radio/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
const props = defineProps({
 modelValue: { type: [String, Array], default: '' },
 visible: { type: Boolean, default: false },
 title: { type: String, default: '选择系统用户' },
 multiple: { type: Boolean, default: false },
 limit: { type: Number, default: 0 },
 disabledIds: { type: Array, default: () => [] },
 selectedUsers: { type: Array, default: () => [] },
 fetchUsers: { type: Function, required: true }
});
const emit = defineEmits(['update:modelValue', 'update:visible', 'confirm']);
const dialogVisible = computed({ get: () => props.visible, set: value => emit('update:visible', value) });
const managers = ref([]), managerLoading = ref(false), managerError = ref(''), managerKeyword = ref(''), managerApplied = ref(''), managerPage = ref(1), managerSize = ref(20), managerTotal = ref(0), selected = ref([]);
let managerRequest = 0;
const managerLabel = user => user.nickname || user.username || user._id;
const isDisabled = row => props.disabledIds.includes(row._id);
const isSelected = row => selected.value.some(user => user._id === row._id);
const rowClass = ({ row }) => isDisabled(row) ? 'manager-row-disabled' : isSelected(row) ? 'manager-row-selected' : '';
function selectManager(row) {
 if(managerLoading.value || isDisabled(row)) return;
 if(!props.multiple) { selected.value = [{ ...row }]; return; }
 if(isSelected(row)) { selected.value = selected.value.filter(user => user._id !== row._id); return; }
 if(props.limit > 0 && selected.value.length >= props.limit) { ElMessage.warning(`最多选择 ${props.limit} 人`); return; }
 selected.value = [...selected.value, { ...row }];
}
function confirmManager() {
 if(!selected.value.length || selected.value.some(isDisabled) || managerLoading.value || managerError.value || (props.multiple && props.limit > 0 && selected.value.length > props.limit)) return;
 const users = selected.value.map(user => ({ ...user }));
 emit('update:modelValue', props.multiple ? users.map(user => user._id) : users[0]._id);
 emit('confirm', props.multiple ? users : users[0]);
 dialogVisible.value = false;
}
function queryManagers() { managerApplied.value = managerKeyword.value.trim(); managerPage.value = 1; loadManagers(); }
function resetManagers() { managerKeyword.value = ''; queryManagers(); }
function changeManagerPage(value) { if(value === managerPage.value) return; managerPage.value = value; loadManagers(); }
function changeManagerSize(value) { managerSize.value = value; managerPage.value = 1; loadManagers(); }
async function loadManagers() {
 const id = ++managerRequest; managerLoading.value = true; managerError.value = '';
 try {
  const result = await props.fetchUsers({ keyword: managerApplied.value, current: managerPage.value, size: managerSize.value });
  if(id !== managerRequest) return;
  if(result.errCode) throw result;
  managers.value = result.data; managerTotal.value = result.total; managerPage.value = result.current;
  selected.value = selected.value.map(user => ({ ...(result.data.find(row => row._id === user._id) || user) }));
 } catch(e) { if(id === managerRequest) { managerError.value = e?.errMsg || e?.message || '加载失败，请重试'; managers.value = []; managerTotal.value = 0; } }
 finally { if(id === managerRequest) managerLoading.value = false; }
}
watch(() => props.visible, visible => {
 managerRequest++;
 if(!visible) { managerLoading.value = false; return; }
 managerKeyword.value = ''; managerApplied.value = ''; managerPage.value = 1; managerSize.value = 20; managers.value = []; managerTotal.value = 0; managerError.value = '';
 const ids = [...new Set((Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]).filter(Boolean))];
 selected.value = (props.multiple ? ids : ids.slice(0, 1)).map(id => ({ ...(props.selectedUsers.find(user => user._id === id) || { _id: id }) }));
 loadManagers();
}, { immediate: true });
onBeforeUnmount(() => { managerRequest++; });
</script>
<style scoped>

.manager-table :deep(.el-table__row){cursor:pointer;}
.manager-table :deep(.manager-row-selected){--el-table-tr-bg-color:var(--el-color-primary-light-9);--el-table-row-hover-bg-color:var(--el-color-primary-light-9);}

.manager-roles{display:flex;flex-wrap:wrap;gap:6px;}.manager-pagination :deep(.el-pagination__sizes .el-select){width:128px;}
.manager-search{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;}.manager-search :deep(.el-form-item){margin:0;}.manager-search :deep(.el-input){width:260px;}.manager-table{--el-table-header-bg-color:var(--el-fill-color-light);}.manager-table :deep(.el-radio){margin:0;}.manager-table :deep(.el-radio__label){padding:0;}.manager-pagination{display:flex;justify-content:flex-end;overflow-x:auto;margin-top:20px;}.manager-selected{float:left;max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:32px;color:var(--el-text-color-secondary);font-size:13px;}

.manager-table :deep(.manager-row-disabled){cursor:not-allowed;color:var(--el-text-color-placeholder);}

</style>
