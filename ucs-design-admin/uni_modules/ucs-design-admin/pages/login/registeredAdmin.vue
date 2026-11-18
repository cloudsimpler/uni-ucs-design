<!-- 注册管理员 -->
<template>
	<el-dialog v-model="visible" class="admin-registration-dialog" title="注册超级管理员" :close-on-click-modal="false" :close-on-press-escape="!submitting" :show-close="!submitting" align-center width="min(calc(100vw - 32px), 520px)">
		<el-form id="admin-registration-form" class="admin-registration-form" :model="form" :disabled="submitting" label-width="108px" label-position="right" @submit.prevent="handleSubmit" ref="formRef">
			<el-form-item prop="username" label="管理员账号" required
				:rules="[{required:true,message:'账号不能为空'},{min:5,message:'账号最少为五位字符'}]">
				<el-input v-model="form.username" placeholder="请输入管理员账号" autocomplete="username" size="large" />
			</el-form-item>
			<el-form-item prop="password" label="管理员密码" required
				:rules="[{required:true,message:'密码不能为空'},{min:6,message:'密码最少为六位字符'}]">
				<el-input type="password" show-password v-model="form.password" placeholder="请输入管理员密码" autocomplete="new-password" size="large" />
			</el-form-item>
		</el-form>
		<template #footer>
			<div class="admin-registration-actions">
				<el-button :disabled="submitting" @click="close">取消</el-button>
				<el-button native-type="submit" form="admin-registration-form" type="primary" :loading="submitting">{{ submitting ? '注册中…' : '确认注册' }}</el-button>
			</div>
		</template>
	</el-dialog>
</template>

<script setup>
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import manifestJson from '/manifest.json';

	const uniIdCo = uniCloud.importObject("uni-id-co", {
		errorOptions: {
			type: 'toast'
		}
	});

	import {
		reactive,
		ref
	} from 'vue';

	const visible = ref(false);
	const submitting = ref(false);
	const formRef = ref(null);
	const emit = defineEmits(['change']);

	const form = reactive({
		username: '',
		password: '',
		nickname: '超级管理员'
	});

	const open = () => {
		visible.value = true;
	};

	const close = () => {
		visible.value = false;
	}

	const handleSubmit = async () => {
		if (submitting.value) return;
		submitting.value = true;
		try {
			const valid = await formRef.value.validate().catch(() => false);
			if (!valid) return;
			const values = { ...form, applicationName: manifestJson.name };
			await uniIdCo.registerAdmin(values);
				uni.showToast({
					icon: "none",
					title: "创建超级管理员成功",
					success: () => {
						emit("change", {
							isAdmin: false
						});
						close();
					}
				})
		} catch (error) {
			// 云对象的 errorOptions 已统一显示注册失败提示。
		} finally {
			submitting.value = false;
		}
	};



	// 暴露方法
	defineExpose({
		open,
		close
	});
</script>

<style>
.admin-registration-dialog {
    padding: 0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    overflow: hidden;
}
.admin-registration-dialog .el-dialog__header { margin: 0; padding: 20px 52px 20px 24px; border-bottom: 1px solid var(--el-border-color-lighter); }
.admin-registration-dialog .el-dialog__title { font-size: 18px; line-height: 26px; font-weight: 600; }
.admin-registration-dialog .el-dialog__headerbtn { top: 12px; right: 12px; }
.admin-registration-dialog .el-dialog__body { padding: 28px 24px 12px; min-height: 0; overflow: auto; }
.admin-registration-dialog .el-dialog__footer { padding: 16px 24px; border-top: 1px solid var(--el-border-color-lighter); }
.admin-registration-dialog .admin-registration-form .el-form-item { margin-bottom: 24px; }
.admin-registration-dialog .admin-registration-form .el-form-item__label { white-space: nowrap; height: 40px; line-height: 40px; margin: 0; padding-right: 16px; font-size: 14px; }
.admin-registration-dialog .admin-registration-form .el-form-item__content { min-width: 0; }
.admin-registration-dialog .admin-registration-form .el-input__wrapper { min-height: 40px; padding: 0 12px; box-sizing: border-box; }
.admin-registration-dialog .admin-registration-form .el-input__inner { height: 40px; font-size: 14px; }
.admin-registration-dialog .admin-registration-actions { display: flex; justify-content: flex-end; gap: 12px; }
.admin-registration-dialog .admin-registration-actions .el-button { margin: 0; min-width: 72px; height: 36px; }
@media (max-width: 480px) {
    .admin-registration-dialog .el-dialog__header { padding-left: 16px; }
    .admin-registration-dialog .el-dialog__body { padding-left: 16px; padding-right: 16px; }
    .admin-registration-dialog .el-dialog__footer { padding-left: 16px; padding-right: 16px; }
}
</style>
