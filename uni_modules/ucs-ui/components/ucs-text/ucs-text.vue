<template>
	<text v-if="props.isIndent" :style="[textLinesStyle]">
		<text decode="{{true}}" :style="[textSpacingStyle]">&emsp;&emsp;</text>
		<text @tap="onTap" :selectable="props.selectable" :userSelect="props.selectable" :space="props.space"
			:decode="props.decode" :style="[textStyle,textSpacingStyle]" decode="{{true}}">
			<slot></slot>
		</text>
	</text>
	<text v-else @tap="onTap" :selectable="props.selectable" :userSelect="props.selectable" :space="props.space"
		:decode="props.decode" :style="[textStyle,textLinesStyle,textSpacingStyle]" decode="{{true}}">
		<slot></slot>
	</text>
</template>

<script setup lang="uts">
	/**
	 * ucs-text 文本组件
	 * @description 用于文本显示。
	 * @tutorial 
	 * @property {String} color = [primary|success|warning|danger] 文本色彩
	 * @property {Number} size 字体大小，单位px
	 * @property {String} align = [left|center|right] 文本方向
	 * @property {String} decoration = [underline|line-through|overline|none] 文本装饰
	 * @property {Number} spacing 文本间距
	 * @property {Number} leading 文本行高
	 * @property {Number} lines 文本最大行数，超出省略
	 * @property {Boolean} isWeight 是否加粗
	 * @property {Boolean} isIndent 是否首行缩进2个字符
	 * @property {Boolean} selectable 是否可选复制
	 * @property {String} space = [ensp|emsp|nbsp] 显示连续空格
	 * @property {Boolean} decode 是否解码 (app平台如需解析字符实体，需要配置为 true)
	 * @event {Function} click 点击事件
	 * @example <ucs-text :size="16" color="success">水调歌头</ucs-text>
	 */
	import { computed } from "vue";
	import { getOsColor, getOsFontSize } from "@/uni_modules/ucs-config";

	const emits = defineEmits(['click']);

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
		decoration: {
			type: String,
			default: ""
		},
		spacing: {
			type: Number,
			default: 0
		},
		leading: {
			type: Number,
			default: 0
		},
		lines: {
			type: Number,
			default: 0
		},
		isWeight: {
			type: Boolean,
			default: false
		},
		isIndent: {
			type: Boolean,
			default: false
		},
		selectable: {
			type: Boolean,
			default: false
		},
		space: {
			type: String,
			default: ""
		},
		decode: {
			type: Boolean,
			default: false
		}
	});

	const textStyle = computed(() : UTSJSONObject => {
		let style = {
			color: `${getOsColor(props.color)}`
		};

		// 方向
		if (props.align != 'left') {
			style['textAlign'] = `${props.align}`;
		};
		// 装饰
		if (props.decoration != "") {
			style['text-decoration-line'] = `${props.decoration}`;
		}

		return style;
	});

	// 文本截断省略
	const textLinesStyle = computed(() : UTSJSONObject => {
		let style = {};
		if (props.lines != 0) {
			// #ifdef UNI-APP-X
			style['overflow'] = `hidden`;
			style['textOverflow'] = `ellipsis`;
			style['lines'] = props.lines;
			// #endif
			// #ifndef UNI-APP-X
			style['overflow'] = `hidden`;
			style['display'] = `-webkit-box`;
			style['-webkit-box-orient'] = `vertical`;
			style['-webkit-line-clamp'] = props.lines;
			// #endif
		}

		return style;
	});

	const textSpacingStyle = computed(() : UTSJSONObject => {
		let style = {
			fontSize: `${getOsFontSize(props.size)}px`
		};

		// 字间距
		if (props.spacing != 0) {
			style['letterSpacing'] = `${props.spacing}px`;
		};

		// 字行高
		if (props.leading != 0) {
			style['lineHeight'] = `${props.leading}px`;
		};

		// 加粗
		if (props.isWeight) {
			style['fontWeight'] = `bold`;
		};


		return style;
	});


	const onTap = () => {
		emits("click")
	}
</script>

<style lang="scss" scoped>

</style>