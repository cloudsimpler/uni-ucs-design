<template>
	<el-dialog
		v-model="visible"
		class="user-detail-dialog"
		modal-class="user-detail-overlay"
		width="84vw"
		align-center
		:fullscreen="fullscreen"
		:show-close="false"
		:close-on-click-modal="false"
		destroy-on-close
		append-to-body
	>
		<template #header="{ titleId }">
			<div class="detail-dialog-heading">
				<span :id="titleId">{{ accountLabel }}详情</span>
				<div class="detail-window-actions">
					<el-button
						text
						:icon="fullscreen ? ScaleToOriginal : FullScreen"
						:aria-label="fullscreen ? '退出全屏' : '全屏查看'"
						@click="fullscreen = !fullscreen"
					/>
					<el-button text :icon="Close" :aria-label="'关闭' + accountLabel + '详情'" @click="visible = false" />
				</div>
			</div>
		</template>
		<el-skeleton v-if="loading && !user" :rows="12" animated />
		<el-result v-else-if="error" icon="error" :title="accountLabel + '详情加载失败'" :sub-title="error">
			<template #extra><el-button type="primary" @click="reload">重新加载</el-button></template>
		</el-result>
		<div v-else-if="user" v-loading="loading" class="detail-content">
			<div class="detail-toolbar">
				<el-button :icon="Refresh" :loading="loading" :aria-label="'刷新' + accountLabel + '详情'" @click="reload" />
				<template v-if="editable">
					<el-button type="primary" :disabled="busy" @click="emit('edit', user)">编辑{{ accountLabel }}</el-button>
					<el-button v-if="!customer && result.auth?.assignRoles && !user.is_root" type="primary" :disabled="busy" @click="emit('edit-roles', user)">绑定角色</el-button>
				</template>
				<el-button v-if="canResetPassword" type="warning" :disabled="busy || isSelf" @click="emit('reset-password', user)">重置密码</el-button>
			</div>
			<div class="detail-summary">
				<div class="detail-profile">
					<el-avatar :size="132" :src="avatarUrl" :icon="UserFilled" />
					<div class="detail-profile-info">
						<div class="detail-user-heading">
						<h2>{{ user.nickname || user.username || '未设置' + nameLabel }}</h2>
							<el-tag :type="status.type" size="small">{{ status.label }}</el-tag>
						</div>
						<dl class="detail-facts">
							<div>
								<dt>用户名：</dt>
								<dd>
									{{ user.username || '—' }}
									<el-button
										v-if="user.username"
										link
										:icon="CopyDocument"
										aria-label="复制用户名"
										@click="copy(user.username)"
									/>
								</dd>
							</div>
							<div>
								<dt>UID：</dt>
								<dd>
									{{ user.user_no || '—' }}
									<el-button v-if="user.user_no" link :icon="CopyDocument" aria-label="复制UID" @click="copy(user.user_no)" />
								</dd>
							</div>
							<div>
								<dt>{{ nameLabel }}：</dt>
								<dd>{{ user.nickname || '—' }}</dd>
							</div>
							<div>
								<dt>账号身份：</dt>
								<dd class="detail-tags">
									<el-tag v-for="type in user.account_type" :key="type" size="small">{{ ['系统用户', '社区用户'][type] }}</el-tag>
								</dd>
							</div>
							<div v-if="!customer">
								<dt>用户角色：</dt>
								<dd class="detail-tags">
									<el-tag v-for="role in user.roleDetails" :key="role.role_id" size="small">
										{{ role.role_name }}
									</el-tag>
									<span v-if="!user.roleDetails?.length">未分配</span>
								</dd>
							</div>
							<div>
								<dt>用户标签：</dt>
								<dd class="detail-tags">
									<el-tag v-for="id in user.tags" :key="id" size="small">{{ tagName(id) }}</el-tag>
									<span v-if="!user.tags?.length" class="detail-muted">暂无标签</span>
								</dd>
							</div>
						</dl>
					</div>
				</div>
				<dl class="detail-facts detail-summary-section">
					<div>
						<dt>所属应用：</dt>
						<dd>{{ appNames }}</dd>
					</div>
					<div>
						<dt>邀请码：</dt>
						<dd>{{ user.my_invite_code || '—' }}</dd>
					</div>
					<div>
						<dt>邀请人 ID：</dt>
						<dd>{{ user.inviter_uid?.[0] || '—' }}</dd>
					</div>
					<div>
						<dt>受邀时间：</dt>
						<dd>{{ date(user.invite_time) }}</dd>
					</div>
				</dl>
			</div>
			<el-tabs v-model="activeTab" class="detail-tabs">
				<el-tab-pane label="基础信息" name="base">
					<div class="detail-base-grid">
						<div class="detail-card">
							<h3>基本信息</h3>
							<dl class="detail-facts detail-facts-grid">
								<div v-for="item in basicFacts" :key="item.label">
									<dt>{{ item.label }}</dt>
									<dd>{{ item.value }}</dd>
								</div>
							</dl>
						</div>
						<div class="detail-card detail-bindings">
							<h3>第三方账号</h3>
							<dl class="detail-facts">
								<div v-for="item in user.bindings" :key="item.name">
									<dt>
										<el-icon><Connection /></el-icon>
										{{ item.name }}：
									</dt>
									<dd>
										<el-tag :type="item.bound ? 'success' : 'info'" size="small">
											{{ item.bound ? '已绑定' : '未绑定' }}
										</el-tag>
									</dd>
								</div>
							</dl>
						</div>
						<div class="detail-card">
							<h3>注册信息</h3>
							<dl class="detail-facts detail-facts-grid">
								<div v-for="item in registrationFacts" :key="item.label">
									<dt>{{ item.label }}</dt>
									<dd>{{ item.value }}</dd>
								</div>
							</dl>
						</div>
					</div>
				</el-tab-pane>
				<el-tab-pane label="实名认证" name="realname">
					<div class="detail-card">
						<h3>实名认证</h3>
						<dl class="detail-facts">
							<div>
								<dt>认证状态</dt>
								<dd>
									<el-tag :type="user.realname.status === 2 ? 'success' : 'info'">
										{{ ['未认证', '等待认证', '认证通过', '认证失败'][user.realname.status] || '未知状态' }}
									</el-tag>
								</dd>
							</div>
							<div>
								<dt>认证类型</dt>
								<dd>{{ user.realname.type === 0 ? '个人用户' : user.realname.type === 1 ? '企业用户' : '—' }}</dd>
							</div>
							<div>
								<dt>认证时间</dt>
								<dd>{{ date(user.realname.date) }}</dd>
							</div>
						</dl>
					</div>
				</el-tab-pane>
				<el-tab-pane label="注册环境" name="environment">
					<div class="detail-card">
						<h3>注册与登录信息</h3>
						<dl class="detail-facts detail-facts-grid">
							<div v-for="item in registrationFacts" :key="item.label">
								<dt>{{ item.label }}</dt>
								<dd>{{ item.value }}</dd>
							</div>
							<div>
								<dt>允许登录应用</dt>
								<dd>{{ appNames }}</dd>
							</div>
						</dl>
					</div>
				</el-tab-pane>
				<el-tab-pane v-if="!customer" label="角色与权限" name="roles">
					<el-empty v-if="!user.roleDetails?.length" :image-size="100" description="暂未分配角色" />
					<div v-for="role in user.roleDetails" :key="role.role_id" class="detail-card detail-role-card">
						<h3>
							{{ role.role_name }}
							<el-tag size="small" type="info">{{ role.role_id }}</el-tag>
						</h3>
						<el-alert v-if="role.allPermissions" title="超级管理员拥有全部管理权限" type="success" :closable="false" />
						<el-alert v-else-if="role.missing" title="此角色已不存在，请重新分配" type="warning" :closable="false" />
						<div v-else class="detail-tags">
							<el-tag v-for="permission in role.permission" :key="permission" type="info">{{ permission }}</el-tag>
							<span v-if="!role.permission?.length" class="detail-muted">该角色未配置权限</span>
						</div>
					</div>
				</el-tab-pane>
				<el-tab-pane label="登录日志" name="logs">
					<el-alert v-if="!result.logsAllowed" title="暂无查看登录日志的权限" type="info" :closable="false" />
					<el-alert v-else-if="result.logsError" :title="result.logsError" type="error" :closable="false" />
					<div v-else class="detail-card">
						<h3>最近 20 条登录日志</h3>
						<el-table :data="result.logs" max-height="420">
							<template #empty>
								<el-empty :image-size="100" description="暂无登录日志" />
							</template>
							<el-table-column label="时间" min-width="170">
								<template #default="{ row }">{{ date(row.create_date) }}</template>
							</el-table-column>
							<el-table-column label="操作" min-width="110">
								<template #default="{ row }">{{ logTypes[row.type] || row.type || '—' }}</template>
							</el-table-column>
							<el-table-column prop="ip" label="IP" min-width="140" />
							<el-table-column label="结果" width="100">
								<template #default="{ row }">
									<el-tag :type="row.state === 1 ? 'success' : 'danger'">
										{{ row.state === 1 ? '成功' : '失败' }}
									</el-tag>
								</template>
							</el-table-column>
							<el-table-column prop="appid" label="应用 ID" min-width="180" show-overflow-tooltip />
						</el-table>
					</div>
				</el-tab-pane>
			</el-tabs>
		</div>
	</el-dialog>
</template>

<script setup>
import { importTenantAdmin } from '../../../common/tenant-session.js';
import { ElAlert, ElAvatar, ElButton, ElDialog, ElEmpty, ElIcon, ElResult, ElSkeleton, ElTabPane, ElTable, ElTableColumn, ElTabs, ElTag, vLoading } from 'element-plus';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/avatar/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/icon/style/css.mjs';
import 'element-plus/es/components/result/style/css.mjs';
import 'element-plus/es/components/skeleton/style/css.mjs';
import 'element-plus/es/components/tab-pane/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/table-column/style/css.mjs';
import 'element-plus/es/components/tabs/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';

import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import {
	UserFilled,
	CopyDocument,
	FullScreen,
	ScaleToOriginal,
	Close,
	Refresh,
	Connection
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { resolveUserAvatars } from '../../../common/avatar.js';
const props = defineProps({
	modelValue: Boolean,
	customer: Boolean,
	uid: String,
	accountLabel: { type: String, default: '用户' },
	detailMethod: { type: String, default: 'getUserDetail' },
	options: { type: Object, default: () => ({ tags: [], apps: [] }) },
	busy: Boolean
});
const emit = defineEmits(['update:modelValue', 'edit', 'edit-roles', 'reset-password']);
const nameLabel = computed(() => !props.customer && props.detailMethod === 'getUserDetail' ? '姓名' : '昵称');
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) });
const result = ref({}),
	user = computed(() => result.value.data);
const loading = ref(false),
	error = ref(''),
	fullscreen = ref(false),
	activeTab = ref('base');
const api = importTenantAdmin();
let requestId = 0;
const reload = async () => {
	const id = ++requestId;
	loading.value = true;
	error.value = '';
	try {
		const response = await api[props.detailMethod]({ uid: props.uid });
		if (!response.errCode) [response.data] = await resolveUserAvatars([response.data], uniCloud);
		if (id !== requestId || !props.modelValue) return;
		if (response.errCode) throw response;
		result.value = response;
	} catch (e) {
		if (id === requestId) error.value = e.errMsg || e.message || '请稍后重试';
	} finally {
		if (id === requestId) loading.value = false;
	}
};
watch(
	() => [props.modelValue, props.uid],
	([open]) => {
		requestId++;
		result.value = {};
		error.value = '';
		if (open) {
			activeTab.value = 'base';
			fullscreen.value = false;
			reload();
		}
	},
	{ immediate: true }
);
onBeforeUnmount(() => requestId++);
const updateAvatar = (uid, avatar) => {
	if (user.value?._id === uid) Object.assign(user.value, avatar);
};
defineExpose({ reload, updateAvatar });
const manageable = computed(() => result.value.auth?.isAdmin || !(user.value?.role || []).includes('admin'));
const editable = computed(() => result.value.auth?.update === true && manageable.value);
const canResetPassword = computed(() => result.value.auth?.resetPassword === true && manageable.value);
const isSelf = computed(() => user.value?._id === result.value.auth?.uid);
const avatarUrl = computed(() => user.value?.avatarPreview || '');
const status = computed(
	() =>
		[
			{ label: '正常', type: 'success' },
			{ label: '禁用', type: 'danger' },
			{ label: '待审核', type: 'warning' },
			{ label: '审核拒绝', type: 'danger' },
			{ label: '已注销', type: 'info' }
		][user.value?.status || 0] || { label: '未知', type: 'info' }
);
const date = (value) => (value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—');
const appNames = computed(() => {
	const apps = user.value?.dcloud_appid;
	if (apps == null || apps.includes('*')) return '全部应用';
	return apps.length
		? apps.map((id) => props.options.apps?.find((app) => app.appid === id)?.name || id).join('、')
		: '未授权任何应用';
});
const tagName = (id) => props.options.tags?.find((tag) => tag.tagid === id)?.name || id;
const basicFacts = computed(() => [
	{ label: '用户名', value: user.value?.username || '—' },
	{ label: '手机号码', value: user.value?.mobile || '—' },
	{ label: '性别', value: ['保密', '男', '女'][user.value?.gender || 0] || '保密' },
	{ label: '邮箱', value: user.value?.email || '—' },
	{ label: '用户状态', value: status.value.label },
	{
		label: '所属部门',
		value:
			user.value?.department_id
				?.map((id) => props.options.departments?.find((item) => item._id === id)?.name || id)
				.join('、') || '—'
	}
].filter(item => !props.customer || item.label !== '所属部门'));
const registrationFacts = computed(() => [
	{ label: '注册时间', value: date(user.value?.register_date) },
	{ label: '最后登录时间', value: date(user.value?.last_login_date) },
	{ label: '注册 IP', value: user.value?.register_ip || '—' },
	{ label: '最后登录 IP', value: user.value?.last_login_ip || '—' }
]);
const logTypes = {
	login: '登录',
	logout: '退出登录',
	register: '注册',
	'reset-pwd': '重置密码',
	'bind-mobile': '绑定手机',
	'bind-weixin': '绑定微信',
	'bind-qq': '绑定 QQ',
	'bind-apple': '绑定 Apple',
	'bind-alipay': '绑定支付宝'
};
const copy = (data) =>
	uni.setClipboardData({
		data: String(data),
		showToast: false,
		success: () => ElMessage.success('已复制'),
		fail: () => ElMessage.error('复制失败，请手动复制')
	});
</script>

<style scoped>
:global(.user-detail-dialog table) {
	user-select: text;
}
:global(.user-detail-overlay),
:global(.user-detail-overlay .el-overlay-dialog) {
	overflow: hidden;
}
:global(.user-detail-dialog) {
	box-sizing: border-box;
	max-width: min(1600px, calc(100vw - 32px));
	height: calc(100vh - 32px);
	height: calc(100dvh - 32px);
	max-height: calc(100dvh - 32px);
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	border-radius: 8px;
	overflow: hidden;
}
:global(.user-detail-dialog.is-fullscreen) {
	width: 100vw;
	max-width: none;
	height: 100vh;
	height: 100dvh;
	max-height: 100dvh;
	border-radius: 0;
}
:global(.user-detail-dialog > .el-dialog__header) {
	flex-shrink: 0;
	margin: 0;
	padding: 16px 24px;
	border-bottom: 1px solid var(--el-border-color-lighter);
}
:global(.user-detail-dialog > .el-dialog__body) {
	padding: 12px 24px 24px;
	flex: 1;
	min-height: 0;
	min-width: 0;
	overflow-y: auto;
	overscroll-behavior: contain;
}
@media (max-width: 900px) {
	:global(.user-detail-dialog:not(.is-fullscreen)) {
		width: calc(100vw - 32px) !important;
	}
}
</style>
<style scoped>
.detail-dialog-heading,
.detail-window-actions,
.detail-toolbar,
.detail-user-heading {
	display: flex;
	align-items: center;
}
.detail-dialog-heading {
	justify-content: space-between;
	font-size: 16px;
}
.detail-window-actions .el-button + .el-button {
	margin-left: 4px;
}
.detail-toolbar {
	justify-content: flex-end;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 28px;
}
.detail-toolbar .el-button {
	margin: 0;
}
.detail-summary {
	display: grid;
	grid-template-columns: 1.65fr 1fr;
	margin: 0 8px 22px;
}
.detail-profile {
	display: flex;
	align-items: flex-start;
	gap: 26px;
	padding: 0 24px 0 32px;
	min-width: 0;
}
.detail-profile .el-avatar {
	flex-shrink: 0;
	background: var(--el-color-info-light-5);
	color: white;
}
.detail-profile-info {
	flex: 1;
	min-width: 0;
}
.detail-user-heading {
	gap: 12px;
	flex-wrap: wrap;
	margin-bottom: 8px;
}
h2,
h3 {
	color: var(--el-text-color-primary);
	font-weight: 600;
	margin: 0;
}
h2 {
	font-size: 24px;
	line-height: 30px;
	overflow-wrap: anywhere;
}
h3 {
	font-size: 22px;
	line-height: 28px;
	margin-bottom: 18px;
}
.detail-facts {
	margin: 0;
	font-size: 16px;
}
.detail-facts > div {
	display: flex;
	align-items: flex-start;
	min-width: 0;
	gap: 10px;
	margin-bottom: 12px;
	line-height: 24px;
}
.detail-facts > div:last-child {
	margin-bottom: 0;
}
.detail-facts dt {
	color: var(--el-text-color-secondary);
	width: 96px;
	flex-shrink: 0;
}
.detail-facts dd {
	margin: 0;
	color: var(--el-text-color-regular);
	min-width: 0;
	overflow-wrap: anywhere;
}
.detail-facts dd .el-button,
.detail-facts dd > .el-tag {
	margin-left: 6px;
}
.detail-facts dt .el-icon {
	vertical-align: -2px;
	margin-right: 7px;
}
.detail-summary-section {
	padding: 0 24px;
	border-left: 1px solid var(--el-border-color-lighter);
}
.detail-summary-section dt {
	width: 130px;
}
.detail-tags {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px;
}
.detail-facts .detail-tags > .el-tag {
	margin-left: 0;
}
.detail-tabs :deep(.el-tabs__item) {
	font-size: 16px;
	height: 48px;
}
.detail-tabs :deep(.el-tabs__nav-wrap::after) {
	height: 1px;
}
.detail-base-grid {
	display: grid;
	grid-template-columns: 2fr 1fr;
	gap: 16px;
}
.detail-card {
	padding: 24px;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 10px;
	min-width: 0;
	background: var(--el-bg-color);
}
.detail-bindings {
	grid-column: 2;
	grid-row: 1 / 3;
}
.detail-bindings .detail-facts > div {
	margin-bottom: 22px;
}
.detail-facts-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 24px 20px;
}
.detail-facts-grid > div {
	margin-bottom: 0;
}
.detail-muted {
	color: var(--el-text-color-placeholder);
	font-size: 14px;
}
.detail-role-card {
	margin-bottom: 16px;
}
.detail-role-card h3 .el-tag {
	margin-left: 10px;
	vertical-align: middle;
}
@media (max-width: 1250px) {
	.detail-summary {
		grid-template-columns: 1fr;
		row-gap: 24px;
	}
	.detail-profile {
		grid-column: 1 / -1;
		padding-left: 0;
	}
	.detail-summary-section {
		border-left: 0;
		padding: 0;
	}
}
@media (max-width: 700px) {
	.detail-summary,
	.detail-base-grid,
	.detail-facts-grid {
		grid-template-columns: 1fr;
	}
	.detail-profile {
		gap: 14px;
		padding-right: 0;
	}
	.detail-profile .el-avatar {
		width: 64px;
		height: 64px;
	}
	.detail-bindings {
		grid-column: auto;
		grid-row: auto;
	}
	.detail-card {
		padding: 16px;
	}
	.detail-toolbar {
		margin-bottom: 20px;
	}
}
</style>
