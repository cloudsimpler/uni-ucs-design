<template>
	<ucs-admin-layout class="permission-page" title="权限管理" mode="card"><PermissionPanel fill /></ucs-admin-layout>
</template>
<script setup>
import PermissionPanel from './permission-panel.vue';
</script>
<style scoped>
.permission-page { height: calc(100dvh - var(--top-window-height, 60px)); min-height: 360px; }
.permission-page :deep(.layout-card) { display: flex; min-height: 0; overflow: hidden; }
</style>
