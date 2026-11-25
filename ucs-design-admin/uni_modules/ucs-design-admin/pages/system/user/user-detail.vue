<template>
	<el-dialog
		v-model="visible"
		:title="accountLabel + '详情'"
		class="admin-form-dialog"
		width="600px"
		align-center
		:close-on-click-modal="false"
		destroy-on-close
		append-to-body
	>
		<el-skeleton v-if="loading && !user" :rows="12" animated />
		<el-result v-else-if="error" icon="error" :title="accountLabel + '详情加载失败'" :sub-title="error">
			<template #extra><el-button type="primary" @click="reload">重新加载</el-button></template>
		</el-result>
		<div v-else-if="user" v-loading="loading" class="detail-content">
			<div class="detail-summary">
				<div class="detail-profile">
					<el-avatar :size="72" :src="avatarUrl" :icon="UserFilled" />
					<div class="detail-profile-info">
						<div class="detail-user-heading">
							<h2>{{ user.nickname || user.username || '未设置' + nameLabel }}</h2>
							<el-tag :type="status.type" size="small">{{ status.label }}</el-tag>
						</div>
						<dl class="detail-facts">
							<div>
								<dt>用户名：</dt>
								<dd>{{ user.username || '—' }}</dd>
							</div>
							<div>
								<dt>UID：</dt>
								<dd>{{ user.user_no || '—' }}</dd>
							</div>
							<div>
								<dt>账号身份：</dt>
								<dd class="detail-tags">
									<el-tag size="small">{{ ['系统用户', '社区用户'][user.account_type] }}</el-tag>
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
						<div class="detail-card">
							<h3>第三方账号</h3>
							<dl class="detail-facts detail-facts-grid">
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
						</dl>
					</div>
				</el-tab-pane>
			</el-tabs>
		</div>
	</el-dialog>
</template>

<script setup>
import { importTenantAdmin } from '../../../common/tenant-session.js';
import { ElAvatar, ElButton, ElDialog, ElIcon, ElResult, ElSkeleton, ElTabPane, ElTabs, ElTag, vLoading } from 'element-plus';
import 'element-plus/es/components/avatar/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import '../../../common/form-dialog.css';
import 'element-plus/es/components/icon/style/css.mjs';
import 'element-plus/es/components/result/style/css.mjs';
import 'element-plus/es/components/skeleton/style/css.mjs';
import 'element-plus/es/components/tab-pane/style/css.mjs';
import 'element-plus/es/components/tabs/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';

import { computed, getCurrentInstance, ref, watch, onBeforeUnmount } from 'vue';
import { UserFilled, Connection } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { resolveUserAvatars } from '../../../common/avatar.js';
const props = defineProps({
	modelValue: Boolean,
	customer: Boolean,
	uid: String,
	accountLabel: { type: String, default: '用户' },
	detailMethod: { type: String, default: 'getUserDetail' },
	options: { type: Object, default: () => ({ tags: [], apps: [] }) }
});
const emit = defineEmits(['update:modelValue']);
const nameLabel = computed(() => !props.customer && props.detailMethod === 'getUserDetail' ? '姓名' : '昵称');
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) });
const detailPage = getCurrentInstance()?.proxy;
watch(() => detailPage?.$route?.path, () => {
	if (visible.value) visible.value = false;
});
const result = ref({}),
	user = computed(() => result.value.data);
const loading = ref(false),
	error = ref(''),
	activeTab = ref('base');
const api = importTenantAdmin();
let requestId = 0;
const reload = async () => {
	const id = ++requestId;
	loading.value = true;
	error.value = '';
	try {
		const response = await api[props.detailMethod]({ uid: props.uid, view: 'profile' });
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
	{ label: '手机号码', value: user.value?.mobile || '—' },
	{ label: '性别', value: ['保密', '男', '女'][user.value?.gender || 0] || '保密' },
	{ label: '邮箱', value: user.value?.email || '—' },
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
	{ label: '最后登录 IP', value: user.value?.last_login_ip || '—' },
	{ label: '允许登录应用', value: appNames.value },
	{ label: '邀请码', value: user.value?.my_invite_code || '—' },
	{ label: '邀请人 ID', value: user.value?.inviter_uid?.[0] || '—' },
	{ label: '受邀时间', value: date(user.value?.invite_time) }
]);
</script>

<style scoped>
.detail-user-heading {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
	margin-bottom: 8px;
}
.detail-summary {
	padding: 16px;
	margin: 0 0 12px;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 8px;
}
.detail-profile {
	display: flex;
	align-items: flex-start;
	gap: 16px;
	min-width: 0;
}
.detail-profile .el-avatar {
	flex-shrink: 0;
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
}
.detail-profile-info {
	flex: 1;
	min-width: 0;
}
h2,
h3 {
	color: var(--el-text-color-primary);
	font-weight: 600;
	margin: 0;
}
h2 {
	font-size: 20px;
	line-height: 28px;
	overflow-wrap: anywhere;
}
h3 {
	font-size: 16px;
	line-height: 24px;
	margin-bottom: 14px;
}
.detail-facts {
	margin: 0;
	font-size: 14px;
}
.detail-facts > div {
	display: flex;
	align-items: flex-start;
	min-width: 0;
	gap: 10px;
	margin-bottom: 8px;
	line-height: 22px;
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
.detail-facts dd > .el-tag {
	margin-left: 6px;
}
.detail-facts dt .el-icon {
	vertical-align: -2px;
	margin-right: 7px;
}
.detail-summary dt {
	width: 72px;
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
	font-size: 14px;
	height: 42px;
}
.detail-tabs :deep(.el-tabs__nav-wrap::after) {
	height: 1px;
}
.detail-base-grid {
	display: grid;
	gap: 12px;
}
.detail-card {
	padding: 16px;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 10px;
	min-width: 0;
	background: var(--el-bg-color);
}
.detail-facts-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px 16px;
}
.detail-facts-grid > div {
	margin-bottom: 0;
}
.detail-muted {
	color: var(--el-text-color-placeholder);
	font-size: 14px;
}
@media (max-width: 520px) {
	.detail-facts-grid {
		grid-template-columns: 1fr;
	}
	.detail-profile {
		gap: 14px;
	}
	.detail-profile .el-avatar {
		width: 64px;
		height: 64px;
	}
}
</style>
