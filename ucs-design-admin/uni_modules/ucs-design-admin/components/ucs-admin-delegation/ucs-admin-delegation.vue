<template>
	<div v-if="store.delegation" class="admin-delegation">
		<div class="delegation-tenant" :title="delegationLabel">
			<span class="delegation-status">代管中</span>
			<span class="delegation-name">{{ subject.name }}</span>
			<span v-if="subject.identifier" class="delegation-number">{{ subject.identifier }}</span>
		</div>
		<el-button v-if="!hideExit" link type="primary" class="delegation-exit" @click="leave">退出代管</el-button>
	</div>
</template>

<script setup>
import { computed } from 'vue';
import { ElButton, ElMessage } from 'element-plus';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import store from '../../common/store.js';
import { exitDelegation } from '../../common/tenant-session.js';

defineProps({ hideExit: Boolean });

const subject = computed(() => {
	const { tenant, targetUser } = store.delegation || {};
	return targetUser
		? { name: targetUser.name || targetUser.username || targetUser.uid, identifier: targetUser.username }
		: { name: tenant?.name, identifier: tenant?.tenant_no };
});
const delegationLabel = computed(() => {
	const { name, identifier } = subject.value;
	return identifier ? `代管中 · ${name}（${identifier}）` : `代管中 · ${name}`;
});

async function leave() {
	try {
		await exitDelegation();
	} catch (error) {
		ElMessage.error(error?.errMsg || error?.message || '退出代管失败，请重试');
	}
}
</script>

<style scoped>
.admin-delegation,
.delegation-tenant {
	display: flex;
	align-items: center;
	min-width: 0;
}
.admin-delegation { gap: 10px; }
.delegation-tenant {
	gap: 6px;
	padding: 4px 8px;
	border: 1px solid var(--el-color-primary-light-7);
	border-radius: var(--el-border-radius-base);
	background: var(--el-color-primary-light-9);
	color: var(--el-text-color-primary);
	font-size: 12px;
	line-height: 18px;
	white-space: nowrap;
}
.delegation-status { color: var(--el-color-primary); font-weight: 600; }
.delegation-name { overflow: hidden; text-overflow: ellipsis; }
.delegation-number { color: var(--el-text-color-secondary); }
.delegation-status, .delegation-number, .delegation-exit { flex-shrink: 0; }
.delegation-exit.el-button { margin: 0; font-size: 12px; }
</style>
