<template>
	<view class="_ucs-safe-area" :style="{backgroundColor:props.backgroundColor}" />
</template>

<script setup lang="uts">
	const props = defineProps({
		backgroundColor: {
			type: String,
			default: "transparent"
		}
	});
</script>

<style lang="scss" scoped>
	._ucs-safe-area {
		/* #ifdef UNI-APP-X */
		height: var(--uni-safe-area-inset-bottom);
		/* #endif */
		/* #ifndef UNI-APP-X */
		height: env(safe-area-inset-bottom);
		/* #endif */
	}
</style>