<template>
	<view class="_ucs-approveStatus">
		<ucs-svg :width="size" :height="size" :src="statusSvg" />
		<text class="_desc" :style="descStyle">{{text}}</text>
	</view>
</template>
<script lang="uts" setup>
	/**
	 * @description 审批状态组件
	 * @tutorial https://ucs.cloudsimpler.com/library/ucs-approveStatus
	 * @property {String} text 文本
	 * @property {Number} size 大小
	 * @property {String} color 颜色
	 */
	import { computed } from "vue";
	import { getOsColor } from "@/uni_modules/ucs-config";
	const props = defineProps({
		text: {
			type: String,
			default: "待审批"
		},
		size: {
			type: Number,
			default: 100
		},
		color: {
			type: String,
			default: "primary"
		}
	});

	const statusSvg = computed(() : string => {
		return `<?xml version="1.0" standalone="no"?> <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${props.size}" height="${props.size}"> <path d="M327.488 255.84l10.208 24.368 13.36-22.8 26.72-2.352-18.08-19.648 6.288-25.92-23.568 10.992-22.784-13.36 3.136 26.72-20.432 16.496 25.152 5.504z m184.64-80.928l-12.56-23.568-11.008 24.352-25.92 4.72 19.648 18.08-3.152 25.92 22.784-13.36 23.568 11.792-4.704-26.72 18.08-18.864-26.72-2.352z m-128.064 135.936c33.776-21.216 71.504-33.008 111.568-36.16l35.36-21.984c-7.072-0.8-13.36-0.8-20.432-0.8a259.392 259.392 0 0 0-242 166.592l35.36-22a226.864 226.864 0 0 1 80.144-85.648z m-159.52 68.352l21.216 16.512 0.8-25.92 22-14.944-25.152-8.64-7.072-25.92-15.712 21.2-26.72-0.784 15.712 21.216-9.424 25.152 24.352-7.872zM696.8 775.232l-9.44-24.368-13.36 22.8-26.72 1.568 17.28 20.432-6.272 25.92 24.368-10.992 22.784 14.144-2.368-26.72 20.432-17.28-26.72-5.504z" fill="${getOsColor(props.color)}" /> <path d="M107.472 519.856C103.536 296.704 280.336 112.832 503.488 108.128c65.216-1.584 129.664 13.344 187.808 42.416l22-14.144C505.856 24.832 247.328 102.624 135.76 310.08c-36.928 68.352-55.008 146.144-51.072 223.936l22.784-14.144z m404.656 335.52l12.576 23.568 11.008-24.352 25.92-4.72-19.632-18.08 3.92-25.92-22.784 12.576-23.568-11.792 5.504 25.92-18.88 18.88 25.936 3.92z" fill="${getOsColor(props.color)}" /> <path d="M915.232 503.36c4.72 223.152-172.864 407.808-396.016 411.728-65.216 1.584-129.648-13.344-187.792-42.432l-22.016 14.144c206.656 112.368 465.184 35.36 577.536-172.08 37.728-69.136 55.008-146.928 51.088-225.504l-22.8 14.144z m78.576-128.08l-150.08-235.728a38.896 38.896 0 0 0-33.792-18.864c-7.84 0-14.928 2.368-21.216 6.288L43.84 598.432c-18.08 11.792-23.568 36.928-12.56 55.792l150.08 235.728c11.776 18.848 36.928 24.352 54.992 12.576l744.112-471.456c19.648-11.792 25.152-36.16 13.36-55.792z m-24.352 36.144L225.344 882.88c-3.152 1.568-6.288 3.136-9.44 3.136-6.272 0-11.776-3.136-14.928-8.64l-149.28-235.728c-4.72-8.64-2.368-19.648 5.488-24.352L801.296 146.624a17.552 17.552 0 0 1 24.368 5.504l149.28 235.728c4.72 7.84 2.368 18.848-5.488 23.568z" fill="${getOsColor(props.color)}" /> <path d="M798.16 656.576l-9.44-24.352-13.36 22.784-26.72 1.568 17.296 20.432-6.288 25.92 24.368-10.992 22.784 14.144-2.352-26.72 20.416-17.28-26.72-5.504z" fill="${getOsColor(props.color)}" /> </svg>`
	});

	const descStyle = computed(() : UTSJSONObject => {
		return {
			fontSize: `${props.size * 0.16}px`,
			letterSpacing: `${props.size * 0.02}px`,
			color: `${getOsColor(props.color)}`
		}
	});
</script>
<style lang="scss" scoped>
	._ucs-approveStatus {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;

		._desc {
			transform: rotate(-33deg);
			position: absolute;
			text-align: center;
			font-weight: bold;
		}
	}
</style>