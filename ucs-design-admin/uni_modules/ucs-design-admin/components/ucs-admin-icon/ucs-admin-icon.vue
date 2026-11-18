<template>
	<component :is="availableIcons[name] || availableIcons[fallback] || availableIcons.Document" />
</template>
<script setup>
import { watch } from 'vue';
import { availableIcons, loadIcons } from '../../common/icons.js';
const props = defineProps({ name: String, fallback: { type: String, default: 'Document' } });
watch(() => props.name, name => {
	if (name && !availableIcons.value[name]) loadIcons().catch(() => {});
}, { immediate: true });
</script>
