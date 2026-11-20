<!-- 注册管理员 -->
<template>
	<el-dialog v-model="visible" class="auth-dialog" title="注册超级管理员" :close-on-click-modal="false" :close-on-press-escape="!submitting" :show-close="!submitting" align-center>
		<el-form :model="form" :disabled="submitting" label-position="top" @submit.prevent="handleSubmit" ref="formRef">
			<el-form-item prop="username" label="管理员账号" required
				:rules="[{required:true,message:'账号不能为空'},{min:5,message:'账号最少为五位字符'}]">
				<el-input v-model="form.username" :prefix-icon="User" placeholder="请输入管理员账号" autocomplete="username" />
			</el-form-item>
			<el-form-item prop="password" label="管理员密码" required
				:rules="[{required:true,message:'密码不能为空'},{min:6,message:'密码最少为六位字符'}]">
				<el-input type="password" show-password v-model="form.password" :prefix-icon="Lock" placeholder="请输入管理员密码" autocomplete="new-password" />
			</el-form-item>
			<el-button class="auth-dialog-primary" native-type="submit" type="primary" :loading="submitting">{{ submitting ? '注册中…' : '确认注册' }}</el-button>
		</el-form>
	</el-dialog>
</template>

<script setup>
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus';
import { Lock, User } from '@element-plus/icons-vue';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import './auth-dialog.css';
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
			const values = {
				...form,
				applicationName: manifestJson.name,
				applicationType: Object.prototype.hasOwnProperty.call(manifestJson, 'uni-app-x') ? 1 : 0
			};
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
