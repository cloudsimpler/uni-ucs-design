<template>
	<div v-if="store.delegation" class="admin-delegation">
		<div class="delegation-tenant" :title="tenantLabel">
			<span class="delegation-status">代管中</span>
			<span class="delegation-name">{{ store.delegation.tenant.name }}</span>
			<span class="delegation-number">{{ store.delegation.tenant.tenant_no }}</span>
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

const tenantLabel = computed(() => {
	const tenant = store.delegation?.tenant;
	return tenant ? `代管中 · ${tenant.name}（${tenant.tenant_no}）` : '';
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
