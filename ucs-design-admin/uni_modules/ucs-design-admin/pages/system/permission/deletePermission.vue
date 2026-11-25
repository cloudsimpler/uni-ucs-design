<!-- 删除权限 -->
<template>
	<el-dialog v-model="visible" title="确认删除表权限" class="admin-form-dialog" :close-on-click-modal="false" align-center width="min(90vw, 520px)">
		<el-form :model="form" @submit.prevent="handleSubmit" ref="formRef">
			<text class="prkv_S">{{sendParams.permission_id}}</text>
			<el-form-item prop="table_name" label="验证" required
				:rules="[{required:true,message:'表名不能为空'},{validator: validateTableName}]">
				<el-input :readonly="disabled" placeholder="请手动输入表名" v-model="form.table_name" size="large" />
			</el-form-item>
			<el-row justify="center">
				<el-col :span="5">
					<el-button :disabled="disabled" @click="close">取消</el-button>
				</el-col>
				<el-col :span="5">
					<el-button :loading="disabled" native-type="submit"
						type="primary">{{disabled?'删除中...':'确认删除'}}</el-button>
				</el-col>
			</el-row>
		</el-form>
	</el-dialog>
</template>

<script setup>
import '../../../common/form-dialog.css';
import { ElButton, ElCol, ElDialog, ElForm, ElFormItem, ElInput, ElRow } from 'element-plus';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/col/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/row/style/css.mjs';

	const uniIdCo = uniCloud.importObject("uni-id-co", {
		customUI: true
	});
	import {
		reactive,
		ref
	} from 'vue';
	const emit = defineEmits(['change']);
	// 组件实例
	const formRef = ref(null);
	// 状态
	const disabled = ref(false);
	const visible = ref(false);
	// 传递数据
	const sendParams = ref({});
	// 打开弹出层
	const open = (params = {}) => {
		sendParams.value = params;
		visible.value = true;
	};
	// 关闭弹出层
	const close = () => {
		visible.value = false;
	}
	// 表单数据
	const form = reactive({
		table_name: ''
	});
	const validateTableName = (rule, value, callback) => {
		callback(value === sendParams.value.permission_id ? undefined : new Error('验证表不一致'));
	};
	// 表单提交
	const handleSubmit = async () => {
		const valid = await formRef.value.validate().catch(() => false);
		if (valid) {
			const values = { ...form };
			disabled.value = true;
			uniIdCo.deletePermission({
				_id: sendParams.value._id
			}).then(res => {
				uni.showToast({
					icon: "none",
					title: res.errMsg
				});
				// 关闭弹出层
				visible.value = false;
				// 重置菜单
				formRef.value.resetFields();
				emit("change");
			}).catch(err => {
				uni.showToast({
					icon: "none",
					title: err.errMsg
				});
			}).finally(() => {
				disabled.value = false;
			})
		};
	};

	// 暴露方法
	defineExpose({
		open,
		close
	});
</script>

<style scoped>
	.prkv_S {
		text-align: center;
		font-size: 24px;
		padding-bottom: 24px;
	}
</style>