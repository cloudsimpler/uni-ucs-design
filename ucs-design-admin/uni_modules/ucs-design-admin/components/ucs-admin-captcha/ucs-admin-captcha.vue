<template>
	<el-dialog v-model="visible" :close-on-click-modal="false" align-center width="min(90vw, 520px)" @opened="focusFirstInput">
		<template #header>
			图形验证码
		</template>
		<div class="Gtrsa">
			<div v-loading="isCaptcha" element-loading-text="验证码加载中">
				<image class="Raghj" @click="refresh" :src="captchaBase64" />
			</div>
			<el-input-otp ref="otpRef" class="Asdst" size="large" :length="4" v-model="verificationCode"
				:disabled="isCaptcha" @finish="onFinish" />
			<view class="Lsdyg">
				说明：由于两小时内输入错误超过三次以上，请输入验证码核验成功后进行下一步操作。
			</view>
		</div>
	</el-dialog>
</template>

<script setup>
import { ElDialog, ElInputOtp, vLoading } from 'element-plus';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/input-otp/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';

	import {
		ref, nextTick
	} from 'vue';

	const props = defineProps({
		scene: {
			type: String,
			default: "",
		}
	})
	const visible = ref(false);
	const isCaptcha = ref(false);
	const captchaBase64 = ref("");
	const verificationCode = ref("");
	const otpRef = ref(null);
	const focusFirstInput = async () => {
		await nextTick();
		if (visible.value && !isCaptcha.value && captchaBase64.value) otpRef.value?.focus(0);
	};
	const emit = defineEmits(['change']);

	const open = () => {
		if (props.scene) {
			verificationCode.value = '';
			visible.value = true;
			getImageCaptcha();
		} else {
			uni.showToast({
				icon: "none",
				title: "未填写scene值"
			})
		};
	};

	const close = () => {
		visible.value = false;
		captchaBase64.value = "";
		verificationCode.value = "";
	};

	const refresh = () => {
		verificationCode.value = "";
		getImageCaptcha();
	};

	const onFinish = (e) => {
		emit("change", {
			code: e
		})
	};


	const getImageCaptcha = () => {
		isCaptcha.value = true;
		const uniIdCo = uniCloud.importObject("uni-captcha-co", {
			customUI: true
		});
		uniIdCo.getImageCaptcha({
			scene: props.scene
		}).then(result => {
			captchaBase64.value = result.captchaBase64;
		}).catch(e => {
			uni.showToast({
				title: e.message,
				icon: 'none'
			});
		}).finally(e => {
			isCaptcha.value = false;
			focusFirstInput();
		});
	};
	// 暴露方法
	defineExpose({
		open,
		close,
		refresh
	});
</script>

<style lang="scss">
	.Gtrsa {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 32px;

		.Raghj {
			height: 100px;
			width: 300px;
			cursor: pointer;
		}

		.Asdst {
			width: 200px
		}

		.Lsdyg {
			font-size: 14px;
			color: var(--el-text-color-secondary);
		}
	}
</style>
