<template>
	<template v-for="item in data" :key="item._id">
		<el-sub-menu
			v-if="item.menu_type === MENU_TYPE.DIRECTORY && item.children?.length"
			:index="item._id"
			:aria-label="item.name"
		>
			<template #title>
				<el-icon><AdminIcon :name="item.icon" fallback="Folder" /></el-icon>
				<span class="menu-label">{{ item.name }}</span>
			</template>
			<leftWindowMenu :data="item.children" />
		</el-sub-menu>
		<el-menu-item
			v-else-if="item.menu_type === MENU_TYPE.PAGE"
			:index="item._id"
			:disabled="!item.url"
			:aria-label="item.name"
		>
			<el-icon><AdminIcon :name="item.icon" /></el-icon>
			<template #title>
				<span class="menu-label">{{ item.name }}</span>
			</template>
		</el-menu-item>
	</template>
</template>

<script setup>
import { ElIcon, ElMenuItem, ElSubMenu } from 'element-plus';
import 'element-plus/es/components/icon/style/css.mjs';
import 'element-plus/es/components/menu-item/style/css.mjs';
import 'element-plus/es/components/sub-menu/style/css.mjs';

import leftWindowMenu from './leftWindowMenu.vue';
import AdminIcon from '../components/ucs-admin-icon/ucs-admin-icon.vue';
import { MENU_TYPE } from '../common/menu.js';
defineProps({ data: { type: Array, default: () => [] } });
</script>

<style scoped>
.menu-label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
