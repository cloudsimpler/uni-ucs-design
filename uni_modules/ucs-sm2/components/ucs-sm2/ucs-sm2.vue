<template>
	<web-view class="__ucs-web-view" id="ucs_WvSm2" @message="changeMessageWv"
		src="/uni_modules/ucs-sm2/hybrid/html/ucs-wvjs.html" />
</template>

<script setup>
	/**
	 * sm2 国密-加密-解密
	 * @property {String} text 需要加密或者需要解密的文本
	 * @property {String} secretKey 加密：填写publicKey公钥；解密：填写privateKey私钥
	 * @property {Number} mode 模式：1 - C1C3C2，0 - C1C2C3，默认为0
	 * @returns 加密或解密值
	 */

	const props = defineProps({
		text: {
			type: String,
			default: ""
		},
		secretKey: {
			type: String,
			default: ""
		},
		mode: {
			type: Number,
			default: 0
		}
	});

	const emits = defineEmits(['change']);
	
	const getwebviewContext = (text: string, key: string, mode: number) => {
		const sm2js = uni.createWebviewContext("ucs_WvSm2")
		sm2js?.evalJS(`onPostMessage(${text},${key},${mode})`);
	};
	
	const changeMessageWv = (event: UniWebViewMessageEvent) => {
		if (event.detail.data[0]['isInitialize'] == true) {
			if(props.text != ""){getwebviewContext(props.text, props.secretKey, props.mode)};
		}else{
			emits("change", event.detail.data[0]);
		};
	};

	watch((): string => props.text, () => {
		getwebviewContext(props.text, props.secretKey, props.mode)
	});
</script>

<style>
	.__ucs-web-view {
		width: 0px;
		height: 0px;
	}
</style>