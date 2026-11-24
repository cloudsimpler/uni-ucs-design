<template>
	<div v-if="store.delegation" class="admin-delegation">
		<div class="delegation-context">
			<div
				v-for="(level, index) in levels"
				:key="level.label"
				class="delegation-level"
				:class="{ 'is-current': index === levels.length - 1 }"
				:title="[level.label, level.name, level.identifier].filter(Boolean).join(' · ')"
			>
				<span class="delegation-status">{{ level.label }}</span>
				<span class="delegation-name">{{ level.name }}</span>
				<span v-if="level.identifier" class="delegation-number">{{ level.identifier }}</span>
			</div>
		</div>
		<el-button link type="primary" class="delegation-exit" :title="nested ? '返回租户代管' : undefined" :loading="leaving" @click="leave">{{ exitLabel }}</el-button>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElButton, ElMessage } from 'element-plus';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import store from '../../common/store.js';
import { exitDelegation } from '../../common/tenant-session.js';

const employeeDelegation = computed(() => Boolean(store.delegation?.userDelegationToken));
const nested = computed(() => employeeDelegation.value && Boolean(store.delegation?.parent?.delegationToken));
const exitLabel = computed(() => employeeDelegation.value ? '退出员工代管' : '退出租户代管');
const leaving = ref(false);

const levels = computed(() => {
	const { tenant, targetUser, parent } = store.delegation || {};
	const delegatedTenant = parent?.tenant || tenant;
	const tenantLevel = { label: '租户代管', name: delegatedTenant?.name, identifier: delegatedTenant?.tenant_no };
	if (!employeeDelegation.value) return [tenantLevel];
	const employeeName = targetUser?.name || targetUser?.username || targetUser?.uid;
	const employeeLevel = {
		label: '员工代管',
		name: employeeName,
		identifier: employeeName !== targetUser?.username ? targetUser?.username : ''
	};
	return nested.value ? [tenantLevel, employeeLevel] : [employeeLevel];
});

async function leave() {
	if (leaving.value) return;
	leaving.value = true;
	try {
		await exitDelegation();
	} catch (error) {
		ElMessage.error(error?.errMsg || error?.message || '退出代管失败，请重试');
	} finally {
		leaving.value = false;
	}
}
</script>

<style scoped>
.admin-delegation,
.delegation-level {
	display: flex;
	align-items: center;
	min-width: 0;
}
.admin-delegation { gap: 10px; }
.delegation-context {
	min-width: 0;
	padding: 4px 8px;
	border: 1px solid var(--el-color-primary-light-7);
	border-radius: var(--el-border-radius-base);
	background: var(--el-color-primary-light-9);
	color: var(--el-text-color-primary);
	font-size: 12px;
	line-height: 16px;
	white-space: nowrap;
}
.delegation-level { gap: 6px; }
.delegation-status { color: var(--el-text-color-secondary); }
.is-current .delegation-status { color: var(--el-color-primary); font-weight: 600; }
.delegation-name { overflow: hidden; text-overflow: ellipsis; }
.delegation-number { color: var(--el-text-color-secondary); }
.delegation-status, .delegation-number, .delegation-exit { flex-shrink: 0; }
.delegation-exit.el-button { margin: 0; font-size: 12px; }
</style>
