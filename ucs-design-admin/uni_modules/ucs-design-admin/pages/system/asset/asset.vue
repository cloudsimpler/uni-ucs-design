<template>
 <ucs-admin-layout title="素材管理" mode="card" :padding="false" class="asset-layout">
  <template #header>
   <div class="search-bar">
    <el-input v-model="keyword" :prefix-icon="Search" placeholder="搜索素材名称" clearable @keyup.enter="search" @clear="search" />
    <el-button type="primary" :loading="loading" @click="search">查询</el-button>
   </div>
  </template>
  <template #button>
   <el-button v-if="auth.delete" type="danger" plain :loading="deleting" :disabled="busy || loading || !selectedIds.length" @click="removeSelected">批量删除{{ selectedIds.length ? `（${selectedIds.length}）` : '' }}</el-button>
   <el-button :icon="Refresh" :loading="loading" :disabled="busy" aria-label="刷新素材" @click="refresh" />
  </template>
  <div class="asset-workspace">
   <aside class="groups">
    <div class="group-heading"><strong>素材分组</strong><el-button v-if="auth.update" class="group-add" text :icon="Plus" title="新增分组" aria-label="新增分组" @click="editGroup()" /></div>
    <div class="group-list" aria-label="素材分组">
     <div class="group-row" :class="{active: groupId === null && !type}"><el-button text class="group-item" :aria-pressed="groupId === null && !type" :aria-expanded="typesExpanded" aria-controls="asset-type-list" @click="toggleTypes"><el-icon><Grid /></el-icon><span class="group-name">全部素材</span><el-icon class="group-chevron"><ArrowDown v-if="typesExpanded" /><ArrowRight v-else /></el-icon></el-button></div>
     <div v-show="typesExpanded" id="asset-type-list" class="group-list group-type-list">
     <div v-for="(label, key) in types" :key="key" class="group-row" :class="{active: groupId === null && type === key}">
      <el-button text class="group-item" :aria-pressed="groupId === null && type === key" @click="selectType(key)"><el-icon><component :is="fileIcons[key]" /></el-icon><span class="group-name">{{ label }}</span></el-button>
     </div>
     </div>
    </div>
    <div class="group-section-heading"><span>自定义分组</span><span v-if="!groupsLoading && !groupsError" class="group-count">{{ groups.length }}</span></div>
    <div class="group-list">
     <div v-for="item in groups" :key="item._id" class="group-row has-actions" :class="{active: groupId === item._id, 'has-two-actions': auth.create}">
      <el-button text class="group-item" :aria-pressed="groupId === item._id" :title="item.name" @click="selectGroup(item._id)"><el-icon><Folder /></el-icon><span class="group-name">{{ item.name }}</span></el-button>
      <div class="group-actions">
       <el-button v-if="auth.create" class="group-upload" text :icon="Upload" :disabled="busy" :title="'上传到' + item.name" :aria-label="'上传到' + item.name" @click="openUpload(item._id)" />
      <el-dropdown class="group-more" trigger="click" @command="command => handleGroupCommand(command, item)">
       <el-button class="group-more-button" text :icon="MoreFilled" :aria-label="'管理分组 ' + item.name" /><template #dropdown><el-dropdown-menu><el-dropdown-item command="info">分组信息</el-dropdown-item><el-dropdown-item v-if="auth.update" command="edit">重命名</el-dropdown-item><el-dropdown-item v-if="auth.update" command="delete">删除分组</el-dropdown-item></el-dropdown-menu></template>
      </el-dropdown>
      </div>
     </div>
     <div v-if="groupsLoading && !groups.length" class="group-empty" role="status">正在加载分组…</div>
     <div v-else-if="groupsError" class="group-empty" role="alert">{{ groupsError }}</div>
     <div v-else-if="!groups.length" class="group-empty">暂无自定义分组</div>
    </div>
   </aside>
   <main class="asset-main">
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-alert v-if="deleteReport" :title="deleteReport" type="warning" show-icon @close="deleteReport = ''" />
    <div v-if="auth.delete && rows.length" class="selection-bar">
     <el-checkbox :model-value="selectedIds.length === rows.length" :indeterminate="selectedIds.length > 0 && selectedIds.length < rows.length" :disabled="busy || loading" @change="selectAll">全选当前页</el-checkbox>
     <span>已选择 {{ selectedIds.length }} 项</span>
     <el-button v-if="selectedIds.length" text :disabled="busy || loading" @click="selectedIds = []">取消选择</el-button>
    </div>
    <div v-loading="loading" element-loading-text="正在加载素材…" class="asset-scroll">
     <el-empty v-if="!loading && !rows.length" :description="error ? '素材加载失败，请点击刷新重试' : '暂无符合条件的素材'" />
     <div v-else class="asset-grid">
      <article v-for="row in rows" :key="row._id" class="asset-card" :class="{'is-selected': selectedIds.includes(row._id)}">
       <el-checkbox v-if="auth.delete" class="asset-check" :model-value="selectedIds.includes(row._id)" :disabled="busy || loading" :aria-label="'选择素材 ' + row.name" @change="checked => selectAsset(row._id, checked)" />
       <button class="asset-cover" :aria-label="'预览 ' + row.name" @click="preview(row)">
        <img v-if="row.type === 'image' && urls[row.file_id]" :src="urls[row.file_id]" :alt="row.name" loading="lazy" />
        <img v-else-if="row.type === 'video' && urls[row.cover_file_id]" :src="urls[row.cover_file_id]" :alt="row.name + '封面'" loading="lazy" />
        <el-icon v-else :size="42"><component :is="fileIcons[row.type] || Document" /></el-icon>
        <span class="file-kind">{{ types[row.type] }}</span>
       </button>
       <div class="asset-info"><strong :title="row.name">{{ row.name }}</strong><span>{{ sizeLabel(row.size) }} · {{ dateLabel(row.create_date) }}<template v-if="row.creator_name"> · {{ row.creator_name }}</template></span></div>
       <div class="asset-actions"><el-button size="small" text type="primary" @click="preview(row)">详情</el-button><el-button size="small" text type="primary" @click="showReferences(row)">使用记录</el-button><el-button v-if="auth.update" size="small" text type="warning" :disabled="busy" @click="edit(row)">编辑</el-button><el-button v-if="auth.delete" size="small" text type="danger" :disabled="busy" @click="remove(row)">删除</el-button></div>
      </article>
     </div>
    </div>
    <div class="asset-pagination"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[20,40,60,80,100]" layout="total, sizes, prev, pager, next" background @current-change="load" @size-change="search" /></div>
   </main>
  </div>
 </ucs-admin-layout>
 <el-dialog v-model="groupInfoVisible" title="分组信息" width="520px" align-center class="asset-dialog">
  <el-descriptions v-if="groupInfo" :column="1" border class="group-info">
   <el-descriptions-item label="分组名称">{{ groupInfo.name }}</el-descriptions-item>
   <el-descriptions-item label="分组 ID"><span class="group-id">{{ groupInfo._id }}</span></el-descriptions-item>
   <el-descriptions-item label="创建时间">{{ groupInfo.create_date != null ? dateLabel(groupInfo.create_date, true) : '—' }}</el-descriptions-item>
  </el-descriptions>
  <template #footer><el-button type="primary" :disabled="!groupInfo?._id" @click="copyGroupId">复制分组 ID</el-button></template>
 </el-dialog>
 <el-dialog v-model="uploadVisible" title="上传素材" width="600px" align-center :close-on-click-modal="!uploading" :close-on-press-escape="!uploading" :show-close="!uploading" class="asset-dialog">
  <div class="upload-destination"><el-icon><Folder /></el-icon><span>上传到：<strong>{{ groups.find(item => item._id === uploadGroup)?.name || '当前分组' }}</strong></span></div>
  <el-upload ref="uploadRef" drag multiple :auto-upload="false" :limit="20" :disabled="uploading" :accept="uploadAccept" :on-change="fileChanged" :on-remove="fileChanged" :on-exceed="() => ElMessage.warning('每批最多选择 20 个文件')">
   <el-icon :size="36"><UploadFilled /></el-icon><div class="upload-copy">拖拽文件至此，或<span>点击选择</span></div><template #tip><div class="upload-tip">支持 JPG、PNG、WebP、GIF、MP4、WebM、MP3、WAV、PDF、TXT、DOCX、XLSX、PPTX，单个文件不超过 200 MB。</div></template>
  </el-upload>
  <div v-if="uploading" class="upload-tip">{{ uploadStage }}</div>
  <el-progress v-if="uploading" :percentage="progress" />
  <el-alert v-if="uploadError" :title="uploadError" type="error" :closable="false" class="upload-error" />
  <template #footer><el-button :disabled="uploading" @click="uploadVisible = false">关闭</el-button><el-button type="primary" :loading="uploading" :disabled="!files.length" @click="upload">开始上传</el-button></template>
 </el-dialog>
 <el-dialog v-model="editVisible" title="编辑素材" width="560px" align-center :close-on-click-modal="false" class="asset-dialog asset-edit-dialog admin-form-dialog">
  <el-form class="asset-edit-form" label-position="right" label-width="100px" @submit.prevent="save"><el-form-item label="素材名称" required><el-input v-model="form.name" placeholder="请输入素材名称" maxlength="200" /></el-form-item><el-form-item label="素材分组" required><el-select v-model="form.group_id" placeholder="请选择素材分组" no-data-text="暂无分组，请先新增分组"><el-option v-for="item in groups" :key="item._id" :label="item.name" :value="item._id" /></el-select></el-form-item></el-form>
  <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
 </el-dialog>
 <el-dialog v-model="previewVisible" title="素材详情" width="760px" align-center class="asset-dialog" @closed="selected = null">
  <template v-if="selected">
   <div class="preview-content"><img v-if="selected.type === 'image'" :src="urls[selected.file_id]" :alt="selected.name" /><video v-else-if="selected.type === 'video'" :src="urls[selected.file_id]" :poster="urls[selected.cover_file_id]" controls /><audio v-else-if="selected.type === 'audio'" :src="urls[selected.file_id]" controls /><el-icon v-else :size="64"><Document /></el-icon></div>
   <el-descriptions :column="1" border class="asset-detail-info"><el-descriptions-item label="fileID"><div class="file-id-row"><span class="file-id-value">{{ selected.file_id }}</span><el-button link type="primary" @click="copyId(selected)">复制</el-button></div></el-descriptions-item><el-descriptions-item label="素材名称">{{ selected.name }}</el-descriptions-item><el-descriptions-item label="文件类型">{{ selected.ext.toUpperCase() }}</el-descriptions-item><el-descriptions-item label="文件大小">{{ sizeLabel(selected.size) }}</el-descriptions-item><el-descriptions-item v-if="selected.type === 'image' && resolution(selected)" label="分辨率">{{ resolution(selected) }}</el-descriptions-item><el-descriptions-item label="所属分组">{{ groups.find(item => item._id === selected.group_id)?.name || types[selected.type] }}</el-descriptions-item><el-descriptions-item v-if="selected.creator_name" label="上传人">{{ selected.creator_name }}</el-descriptions-item><el-descriptions-item label="上传时间">{{ dateLabel(selected.create_date, true) }}</el-descriptions-item></el-descriptions>

  </template>
  <template #footer><el-button :loading="copyingAddress" :disabled="!selected" @click="copyAddress(selected)">复制临时地址</el-button><el-button type="primary" :loading="downloading" @click="downloadFile(selected)">下载文件</el-button></template>
 </el-dialog>
 <el-dialog v-model="referencesVisible" title="使用记录" width="760px" align-center class="asset-dialog" @closed="referenceAsset = null">
   <section class="asset-references">
    <p class="reference-name">{{ referenceAsset?.name }}</p>
    <p class="reference-note">仅显示已登记的引用；暂无记录不代表素材未被使用。</p>
    <div v-loading="referencesLoading" element-loading-text="正在查询使用记录…" class="reference-table">
     <el-alert v-if="referencesError" :title="referencesError" type="error" :closable="false"><el-button link type="primary" @click="loadReferences">重试</el-button></el-alert>
     <el-table v-else :data="references" empty-text="暂无已登记的使用记录">
      <el-table-column prop="business_type" label="业务类型" width="120" />
      <el-table-column prop="business_id" label="业务记录 ID" min-width="170" show-overflow-tooltip />
      <el-table-column prop="field" label="使用字段" min-width="120" show-overflow-tooltip />
      <el-table-column label="登记时间" min-width="170"><template #default="{ row }">{{ row.create_date ? dateLabel(row.create_date, true) : '—' }}</template></el-table-column>
     </el-table>
    </div>
    <el-pagination v-if="referencesTotal > 0" v-model:current-page="referencesPage" :page-size="referencesPageSize" :page-sizes="[20,40,60,80,100]" :total="referencesTotal" layout="total, sizes, prev, pager, next" @update:page-size="changeReferencesPageSize" :disabled="referencesLoading" @current-change="loadReferences" />
   </section>
  <template #footer><el-button @click="referencesVisible = false">关闭</el-button></template>
 </el-dialog>
</template>

<script setup>
import '../../../common/form-dialog.css';
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { ElAlert, ElButton, ElCheckbox, ElDescriptions, ElDescriptionsItem, ElDialog, ElDropdown, ElDropdownItem, ElDropdownMenu, ElEmpty, ElForm, ElFormItem, ElIcon, ElInput, ElMessage, ElMessageBox, ElOption, ElPagination, ElProgress, ElSelect, ElTable, ElTableColumn, ElUpload, vLoading } from 'element-plus';
import 'element-plus/es/components/checkbox/style/css.mjs';
import { ArrowDown, ArrowRight, Document, Folder, Grid, Headset, MoreFilled, Picture, Plus, Refresh, Search, Upload, UploadFilled, VideoPlay } from '@element-plus/icons-vue';
import { resolveFileUrls } from '../../../common/storage.js';
import { createVideoCover } from '../../../common/video-cover.js';
import store from '../../../common/store.js';
import { loadNavigation } from '../../../common/navigation.js';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/descriptions/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/dropdown/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/icon/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import 'element-plus/es/components/message-box/style/css.mjs';
import 'element-plus/es/components/pagination/style/css.mjs';
import 'element-plus/es/components/progress/style/css.mjs';
import 'element-plus/es/components/select/style/css.mjs';
import 'element-plus/es/components/upload/style/css.mjs';
const api = uniCloud.importObject('uni-id-co', { customUI: true });
const types = { image: '图片', video: '视频', audio: '音频', document: '文档' };
const fileIcons = { image: Picture, video: VideoPlay, audio: Headset, document: Document };
const typeExtensions = { image: ['jpg','jpeg','png','webp','gif'], video: ['mp4','webm'], audio: ['mp3','wav'], document: ['pdf','txt','docx','xlsx','pptx'] };
const uploadAccept = Object.values(typeExtensions).flat().map(ext => '.' + ext).join(',');
const rows = ref([]), groups = ref([]), urls = ref({}), loading = ref(true), error = ref('');
const groupsLoading = ref(true), groupsError = ref('');
const selectedIds = ref([]), deleteReport = ref('');
const keyword = ref(''), type = ref(''), groupId = ref(null), page = ref(1), pageSize = ref(20), total = ref(0);
const typesExpanded = ref(false);
const auth = reactive({ create: false, update: false, delete: false });
const saving = ref(false), uploading = ref(false), deleting = ref(false), busy = computed(() => saving.value || uploading.value || deleting.value);
const uploadVisible = ref(false), uploadGroup = ref(''), files = ref([]), uploadRef = ref(), progress = ref(0), uploadError = ref(''), uploadStage = ref('');
const editVisible = ref(false), form = reactive({ _id: '', name: '', group_id: '' });
const previewVisible = ref(false), selected = ref(null);
const referencesVisible = ref(false), referenceAsset = ref(null);
const references = ref([]), referencesLoading = ref(false), referencesError = ref('');
const referencesPageSize = ref(20);
const referencesPage = ref(1), referencesTotal = ref(0);
let referenceSequence = 0;
const downloading = ref(false);
const copyingAddress = ref(false);
const groupInfoVisible = ref(false), groupInfo = ref(null);
const message = e => e?.errMsg || e?.message || '操作失败，请重试';
const call = async (method, params) => { const result = await api[method](params); if (result.errCode) throw result; return result; };
const sizeLabel = bytes => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
function resolution(row) {
 return row.width > 0 && row.height > 0 ? `${row.width} × ${row.height} px` : '';
}
const dateLabel = (time, full = false) => new Date(time).toLocaleString('zh-CN', full ? {} : { year: 'numeric', month: '2-digit', day: '2-digit' });
let sequence = 0;
async function load() {
 const current = ++sequence; loading.value = true; error.value = '';
 selectedIds.value = [];
 try {
  const result = await call('listAssets', { keyword: keyword.value.trim(), type: type.value, group_id: groupId.value, page: page.value, pageSize: pageSize.value });
  if (current !== sequence) return;
  rows.value = result.data; total.value = result.total; page.value = result.page; Object.assign(auth, result.auth);
  const resolved = await resolveFileUrls(result.data.flatMap(row => [row.file_id, row.cover_file_id].filter(Boolean)), uniCloud);
  if (current === sequence) urls.value = Object.fromEntries(resolved);
 } catch (e) { if (current === sequence) { error.value = message(e); rows.value = []; total.value = 0; } }
 finally { if (current === sequence) loading.value = false; }
}
async function loadGroups() {
 groupsLoading.value = true; groupsError.value = '';
 try { groups.value = (await call('listAssetGroups')).data.sort((a,b) => a.name.localeCompare(b.name, 'zh-CN')); }
 catch (e) { groupsError.value = message(e); throw e; }
 finally { groupsLoading.value = false; }
}
async function refresh() { await Promise.all([load(), loadGroups().catch(() => {})]); }
function search() { page.value = 1; load(); }
function selectGroup(id) { groupId.value = id; type.value = ''; search(); }
function toggleTypes() {
 typesExpanded.value = !typesExpanded.value;
 if (groupId.value !== null || type.value) selectGroup(null);
}
function selectType(key) { groupId.value = null; type.value = key; search(); }
function handleGroupCommand(command, row) {
 if (command === 'info') { groupInfo.value = { ...row }; groupInfoVisible.value = true; }
 else if (command === 'edit' && auth.update) editGroup(row);
 else if (command === 'delete' && auth.update) removeGroup(row);
}
async function copyGroupId() {
 if (!groupInfo.value?._id) return;
 try { await uni.setClipboardData({ data: groupInfo.value._id, showToast: false }); ElMessage.success('分组 ID 已复制'); }
 catch (e) { ElMessage.error(message(e)); }
}
async function editGroup(row) {
 try {
  const { value } = await ElMessageBox.prompt('请输入分组名称', row ? '重命名分组' : '新增分组', { inputValue: row?.name || '', inputValidator: value => !!value?.trim() && value.trim().length <= 40 || '请输入 1 至 40 个字', confirmButtonText: '保存', cancelButtonText: '取消' });
  await call('saveAssetGroup', { _id: row?._id, name: value.trim() }); await loadGroups(); ElMessage.success('分组已保存');
 } catch (e) { if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e)); }
}
async function removeGroup(row) {
 try { await ElMessageBox.confirm(`确定删除分组“${row.name}”？分组必须为空。`, '删除分组', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); await call('deleteAssetGroup', { _id: row._id }); if (groupId.value === row._id) groupId.value = null; await refresh(); ElMessage.success('分组已删除'); }
 catch (e) { if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e)); }
}
function fileChanged(file, list) { files.value = list; }
function openUpload(id) {
 if (busy.value || !auth.create || !groups.value.some(item => item._id === id)) return;
 if (uploadGroup.value !== id && files.value.some(file => file.assetTicket)) {
  ElMessage.warning('请先在原分组完成待重试的上传');
  uploadVisible.value = true;
  return;
 }
 if (uploadGroup.value !== id) { uploadRef.value?.clearFiles(); files.value = []; }
 uploadGroup.value = id;
 uploadError.value = '';
 uploadVisible.value = true;
}
async function upload() {
 if (uploading.value || !files.value.length) return;
 uploading.value = true; uploadError.value = ''; progress.value = 0;
 const pending = [...files.value]; let succeeded = 0;
 const coverWarnings = [];
 for (let index = 0; index < pending.length; index++) {
  const file = pending[index].raw; let ticket = pending[index].assetTicket, uploaded = pending[index].assetUploaded, filePath;
  try {
   if (!ticket) ticket = pending[index].assetTicket = await call('prepareAssetUpload', { name: file.name, size: file.size, group_id: uploadGroup.value });
   if (!uploaded) {
   uploadStage.value = `正在上传：${file.name}`;
   filePath = URL.createObjectURL(file);
   if (ticket.type === 'image') {
    try { const info = await uni.getImageInfo({ src: filePath }); pending[index].dimensions = { width: info.width, height: info.height }; }
    catch { /* 尺寸读取失败不阻止上传，也不在后续浏览时补读。 */ }
   }
   uploaded = pending[index].assetUploaded = await uniCloud.uploadFile({ filePath, cloudPath: ticket.cloudPath, cloudPathAsRealPath: true,
    fileType: ticket.type === 'document' ? 'other' : ticket.type,
    onUploadProgress: ({ loaded, total: bytes }) => { progress.value = Math.min(99, Math.round((index + (bytes ? loaded / bytes : 0)) / pending.length * 100)); } });
   }
   if (ticket.type === 'video' && !pending[index].coverAttempted) {
    uploadStage.value = `正在生成视频封面：${file.name}`;
    let coverUrl;
    try {
     if (!ticket.coverPath) throw new Error('请更新云对象后重试');
     const blob = await createVideoCover(file);
     coverUrl = URL.createObjectURL(blob);
     const cover = await uniCloud.uploadFile({ filePath: coverUrl, cloudPath: ticket.coverPath, cloudPathAsRealPath: true, fileType: 'image' });
     if (!cover.fileID) throw new Error('封面上传未返回文件标识');
     pending[index].coverFileId = cover.fileID;
    } catch (e) { pending[index].coverWarning = `${file.name}：${message(e)}`; }
    finally { if (coverUrl) URL.revokeObjectURL(coverUrl); pending[index].coverAttempted = true; }
   }
   if (pending[index].coverWarning) coverWarnings.push(pending[index].coverWarning);
   uploadStage.value = `正在保存：${file.name}`;
   await call('completeAssetUpload', { _id: ticket.id, file_id: uploaded.fileID, cover_file_id: pending[index].coverFileId || '', ...(pending[index].dimensions || {}) }); succeeded++;
   uploadRef.value?.handleRemove(pending[index]);
  } catch (e) {
   // 完成请求结果不确定时保留文件，避免删除已经入库的素材；允许管理员核查后清理。
   if (ticket && !uploaded) { await call('cancelAssetUpload', { _id: ticket.id }).catch(() => {}); pending[index].assetTicket = null; }
   uploadError.value += `${file.name}：${message(e)}${uploaded ? '（文件已上传，请刷新检查后再重试）' : ''}；`;
  } finally { if (filePath) URL.revokeObjectURL(filePath); }
 }
 uploading.value = false; progress.value = 100; uploadStage.value = '';
 if (succeeded) { ElMessage.success(`已上传 ${succeeded} 个素材`); await load(); }
 if (coverWarnings.length) uploadError.value += `视频上传已保留，但部分封面未生成：${coverWarnings.join('；')}`;
 if (!uploadError.value) uploadVisible.value = false;
}
function edit(row) { Object.assign(form, { _id: row._id, name: row.name, group_id: row.group_id }); editVisible.value = true; }
async function save() {
 if (saving.value) return;
 if (!form.name.trim()) return ElMessage.warning('请输入素材名称');
 if (!groups.value.some(item => item._id === form.group_id)) return ElMessage.warning('请选择已有的素材分组');
 saving.value = true;
 try { await call('updateAsset', { ...form }); editVisible.value = false; ElMessage.success('素材已更新'); await load(); }
 catch (e) { ElMessage.error(message(e)); } finally { saving.value = false; }
}
async function remove(row) {
 try { await ElMessageBox.confirm(`确定删除“${row.name}”？云端文件也会删除，无法恢复。`, '删除素材', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); deleting.value = true; await call('deleteAsset', { _id: row._id }); ElMessage.success('素材已删除'); await load(); }
 catch (e) { if (e !== 'cancel' && e !== 'close') ElMessage.error(message(e)); } finally { deleting.value = false; }
}
async function preview(row) {
 selected.value = row; previewVisible.value = true;
}
async function showReferences(row) {
 referenceAsset.value = row; referencesVisible.value = true;
 references.value = []; referencesPage.value = 1; referencesTotal.value = 0;
 await loadReferences();
}
function changeReferencesPageSize(value) {
 referencesPageSize.value = value; referencesPage.value = 1; loadReferences();
}
async function loadReferences() {
 const id = referenceAsset.value?._id;
 if (!id) return;
 const request = ++referenceSequence;
 referencesLoading.value = true; referencesError.value = '';
 try {
  const result = await call('listAssetReferences', { _id: id, page: referencesPage.value, pageSize: referencesPageSize.value });
  if (request !== referenceSequence || referenceAsset.value?._id !== id) return;
  references.value = result.data || []; referencesTotal.value = result.total; referencesPage.value = result.page;
 } catch (e) {
  if (request === referenceSequence && referenceAsset.value?._id === id) referencesError.value = message(e);
 } finally { if (request === referenceSequence) referencesLoading.value = false; }
}
async function address(row) { const value = (await resolveFileUrls([row.file_id], uniCloud)).get(row.file_id); if (!value) throw new Error('文件地址获取失败，请重试'); return value; }
async function copyAddress(row) {
 if (!row || copyingAddress.value) return;
 copyingAddress.value = true;
 try { await uni.setClipboardData({ data: await address(row) }); ElMessage.success('地址已复制，临时地址到期后需重新获取'); }
 catch (e) { ElMessage.error(message(e)); }
 finally { copyingAddress.value = false; }
}
async function copyId(row) {
 if (!row) return;
 try { await uni.setClipboardData({ data: row.file_id }); ElMessage.success('fileID 已复制'); }
 catch (e) { ElMessage.error(message(e)); }
}
async function downloadFile(row) {
 if (!row || downloading.value) return;
 downloading.value = true;
 let objectUrl;
 let link;
 try {
  const response = await fetch(await address(row));
  if (!response.ok) throw new Error('文件下载失败，请重试');
  objectUrl = URL.createObjectURL(await response.blob());
  link = document.createElement('a');
  link.href = objectUrl;
  const name = (row.name || '文件').replace(/[\\/:*?"<>|]/g, '_');
  const ext = row.ext || '';
  link.download = ext && !name.toLowerCase().endsWith('.' + ext.toLowerCase()) ? `${name}.${ext}` : name;
  document.body.appendChild(link);
  link.click();
  ElMessage.success('已开始下载');
 } catch (e) { ElMessage.error(message(e)); }
 finally {
  if (link) link.remove();
  // Allow the browser to consume the blob before releasing it.
  if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  downloading.value = false;
 }
}
function hasAssetMenu(menus) {
 return menus.some(item => item.menu_id === 'system_asset' || hasAssetMenu(item.children || []));
}
function selectAsset(id, checked) {
 if (busy.value || loading.value) return;
 selectedIds.value = checked ? [...new Set([...selectedIds.value, id])] : selectedIds.value.filter(value => value !== id);
}
function selectAll(checked) {
 if (busy.value || loading.value) return;
 selectedIds.value = checked ? rows.value.map(row => row._id) : [];
}
async function removeSelected() {
 if (busy.value || loading.value || !selectedIds.value.length) return;
 const ids = [...selectedIds.value], names = new Map(rows.value.map(row => [row._id, row.name]));
 deleting.value = true;
 try {
  await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个素材？对应云端文件和视频封面也会删除，无法恢复。正在使用的素材将保留。`, '批量删除素材', { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' });
  deleteReport.value = '';
  const result = await call('deleteAssets', { ids });
  if (result.deleted.length) ElMessage.success(`已删除 ${result.deleted.length} 个素材`);
  if (result.failed.length) deleteReport.value = `${result.failed.length} 个素材未删除：` + result.failed.map(item => `${names.get(item.id) || item.id}（${item.errMsg}）`).join('；');
  await load();
  const remaining = new Set(result.failed.map(item => item.id));
  selectedIds.value = rows.value.filter(row => remaining.has(row._id)).map(row => row._id);
 } catch (e) { if (e !== 'cancel' && e !== 'close') { ElMessage.error(message(e)); await load(); } }
 finally { deleting.value = false; }
}
async function ensureAssetMenu() {
 if (!uniCloud.getCurrentUserInfo().role?.includes('admin')) return;
 try {
  // 复用布局已请求的导航；正常进入页面不再安装菜单或使全局导航失效。
  const navigation = await loadNavigation();
  if (hasAssetMenu(navigation.data || [])) return;
  const result = await call('installAssetManagement');
  if (result.changed) store.menuVersion++;
 } catch (e) { ElMessage.error(`素材菜单检查失败：${message(e)}`); }
}
onMounted(() => { refresh(); ensureAssetMenu(); });
onBeforeUnmount(() => { sequence++; });
</script>

<style scoped>
.asset-layout { height: calc(100dvh - var(--top-window-height, 56px)); min-height: 0; }
.asset-layout :deep(.layout-card) { display: flex; min-height: 0; overflow: hidden; }
.search-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.search-bar .el-input { width: 240px; }
.search-bar .el-select { width: 130px; }
.asset-workspace { display: flex; flex: 1; min-width: 0; min-height: 0; }
.groups { width: 208px; flex-shrink: 0; padding: 20px 12px; border-right: 1px solid var(--el-border-color-light); overflow-y: auto; box-sizing: border-box; }
.group-heading { display: flex; align-items: center; justify-content: space-between; min-height: 28px; margin: 0 4px 16px 12px; font-size: 14px; }
.group-heading strong { font-weight: 600; }
.group-add.el-button { width: 28px; height: 28px; padding: 0; color: var(--el-text-color-secondary); }
.group-list { display: flex; flex-direction: column; gap: 6px; }
.group-row { position: relative; width: 100%; border-radius: 6px; color: var(--el-text-color-regular); }
.group-row:hover, .group-row:focus-within { background: var(--el-fill-color-light); }
.group-row.active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.group-row.active::before { content: ''; position: absolute; left: 0; top: 13px; bottom: 13px; width: 3px; border-radius: 2px; background: var(--el-color-primary); }
.group-item.el-button { display: flex; justify-content: flex-start; width: 100%; min-width: 0; height: 42px; margin: 0; padding: 0 12px; border: 0; border-radius: 6px; background: transparent; color: inherit; font-size: 14px; font-weight: 400; text-align: left; }
.group-item :deep(> span) { display: flex; align-items: center; gap: 10px; width: 100%; min-width: 0; }
.group-item .el-icon { flex-shrink: 0; font-size: 16px; }
.group-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 22px; }
.group-info :deep(.el-descriptions__content) { overflow-wrap: anywhere; }
.asset-detail-info :deep(.el-descriptions__table) { table-layout: fixed; }
.asset-detail-info :deep(.el-descriptions__label) { width: 110px; }
.file-id-row { display: flex; align-items: center; gap: 12px; min-width: 0; }
.file-id-value { flex: 1; min-width: 0; overflow-wrap: anywhere; font-family: ui-monospace, Consolas, monospace; user-select: text; }
.file-id-row .el-button { flex-shrink: 0; }
.group-id { font-family: ui-monospace, Consolas, monospace; user-select: text; }
.group-chevron { margin-left: auto; font-size: 12px !important; }
.group-type-list { padding-left: 16px; }
.group-row.active .group-item { font-weight: 500; }
.group-item:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
.has-actions .group-item { padding-right: 42px; }
.has-two-actions .group-item { padding-right: 72px; }
.group-actions { position: absolute; right: 6px; top: 7px; display: flex; align-items: center; gap: 2px; }
.group-more { display: flex; }
.group-upload.el-button { width: 28px; height: 28px; padding: 0; margin: 0; color: var(--el-color-primary); }
.group-more-button.el-button { width: 28px; height: 28px; padding: 0; margin: 0; color: var(--el-text-color-placeholder); }
.group-row:hover .group-more-button, .group-row:focus-within .group-more-button { color: var(--el-text-color-regular); }
.group-row.active .group-more-button { color: var(--el-color-primary); }
.group-section-heading { display: flex; align-items: center; justify-content: space-between; margin: 18px 12px 10px; padding-top: 16px; border-top: 1px solid var(--el-border-color-lighter); color: var(--el-text-color-secondary); font-size: 12px; }
.group-count { font-variant-numeric: tabular-nums; }
.group-empty { padding: 10px 12px; color: var(--el-text-color-placeholder); font-size: 12px; }
.asset-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.asset-scroll { flex: 1; min-height: 180px; overflow-y: auto; padding: 20px; }
.asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; }
.asset-card { position: relative; border: 1px solid var(--el-border-color-light); border-radius: 8px; overflow: hidden; background: var(--el-bg-color); }
.asset-card.is-selected { border-color: var(--el-color-primary); box-shadow: 0 0 0 1px var(--el-color-primary); }
.asset-check { position: absolute; top: 8px; left: 8px; z-index: 1; height: 26px; padding: 0 6px; margin: 0; border-radius: 4px; background: var(--el-bg-color); }
.selection-bar { display: flex; align-items: center; flex-shrink: 0; gap: 16px; padding: 8px 20px; border-bottom: 1px solid var(--el-border-color-lighter); font-size: 13px; color: var(--el-text-color-secondary); }
.asset-cover { width: 100%; height: 154px; border: 0; background: var(--el-fill-color-light); position: relative; display: flex; align-items: center; justify-content: center; color: var(--el-text-color-placeholder); cursor: pointer; }
.asset-cover img { width: 100%; height: 100%; object-fit: contain; }
.file-kind { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,.5); color: white; padding: 2px 6px; font-size: 11px; border-radius: 3px; }
.asset-info { padding: 12px 12px 6px; display: flex; flex-direction: column; gap: 7px; }
.asset-info strong { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.asset-info span { font-size: 12px; color: var(--el-text-color-secondary); }
.asset-actions { display: flex; padding: 4px 6px 8px; flex-wrap: wrap; }
.asset-actions .el-button { padding: 6px; margin: 0; }
.asset-pagination { display: flex; justify-content: flex-end; padding: 16px 20px; border-top: 1px solid var(--el-border-color-light); overflow-x: auto; }
.upload-destination { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 12px; border-radius: 6px; background: var(--el-fill-color-light); color: var(--el-text-color-regular); font-size: 14px; overflow-wrap: anywhere; }
.upload-destination strong { font-weight: 500; color: var(--el-text-color-primary); }
.upload-copy { margin-top: 12px; }
.upload-copy span { color: var(--el-color-primary); }
.upload-tip { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.7; margin: 8px 0 16px; }
.upload-error { margin-top: 12px; }
.asset-references { min-width: 0; }
.reference-name { margin: 0 0 12px; font-size: 14px; overflow-wrap: anywhere; }
.reference-note { margin: 0 0 12px; color: var(--el-text-color-secondary); font-size: 12px; }
.reference-table { min-height: 100px; }
.asset-references .el-pagination { margin-top: 12px; justify-content: flex-end; }
.preview-content { display: flex; justify-content: center; align-items: center; min-height: 160px; margin-bottom: 20px; background: var(--el-fill-color-light); padding: 12px; }
.preview-content img, .preview-content video { max-width: 100%; max-height: 45vh; object-fit: contain; }
:global(.asset-dialog) { max-width: calc(100vw - 32px); max-height: calc(100dvh - 40px); display: flex; flex-direction: column; }
:global(.asset-dialog .el-dialog__body) { overflow-y: auto; min-height: 0; }
.asset-edit-form :deep(.el-form-item) { margin-bottom: 24px; }
.asset-edit-form :deep(.el-form-item:last-child) { margin-bottom: 0; }
.asset-edit-form :deep(.el-select) { width: 100%; }
.asset-edit-form :deep(.el-input__wrapper), .asset-edit-form :deep(.el-select__wrapper) { min-height: 40px; box-sizing: border-box; }
@media (max-width: 900px) { .groups { width: 176px; padding: 16px 8px; } .asset-scroll { padding: 12px; } .asset-grid { gap: 12px; } }
</style>
