<template>
	<text :class="textClass" :style="[textStyle]">
		<slot></slot>
	</text>
</template>

<script setup lang="uts">
	/**
	 * 文本
	 */
	import {
		computed
	} from "vue";
	import {
		getOsColor,
		getOsFontSize
	} from "@/uni_modules/ucs-config";

	const props = defineProps({
		color: {
			type: String,
			default: "grey-12"
		},
		size: {
			type: Number,
			default: 14
		},
		align: {
			type: String,
			default: "left"
		},
		spacing: {
			type: Number,
			default: 0
		},
		leading: {
			type: Number,
			default: 0
		},
		weight: {
			type: String,
			default: "normal"
		}
	});

	const textStyle = computed((): UTSJSONObject => {
		let style = {
			color: `${getOsColor(props.color)}`,
			fontSize: `${getOsFontSize(props.size)}px`
		};

		// 字间距
		if (props.spacing != 0) {
			style['letter-spacing'] = `${props.spacing}px`;
		};

		// 字行高
		if (props.leading != 0) {
			style['line-height'] = `${props.leading}px`;
		};

		return style;
	});
	const textClass = computed((): UTSArray<string> => {
		return [`font-${props.weight}`, `text-${props.align}`]
	});
</script>

<style lang="scss">
	// 文本字体字重
	.font-normal {
		font-weight: normal;
	}

	.font-bold {
		font-weight: bold;
	}

	// 文本位置
	.text-left {
		text-align: left;
	}

	.text-center {
		text-align: center;
	}

	.text-right {
		text-align: right;
	}
</style>