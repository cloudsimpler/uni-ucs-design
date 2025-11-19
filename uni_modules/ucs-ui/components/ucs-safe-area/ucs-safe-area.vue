<template>
	<view class="_ucs-safe-area" :style="[getOsBackground(props.backgroundColor)]" />
</template>

<script setup lang="uts">
	import { getOsBackground } from "@/uni_modules/ucs-config";
	
	const props = defineProps({
		backgroundColor: {
			type: String,
			default: "transparent"
		}
	});
</script>

<style lang="scss" scoped>
	._ucs-safe-area {
		/* #ifdef UNI-APP-X && APP */
		height: var(--uni-safe-area-inset-bottom);
		/* #endif */
		/* #ifndef UNI-APP-X && APP */
		height: env(safe-area-inset-bottom);
		/* #endif */
	}
</style>