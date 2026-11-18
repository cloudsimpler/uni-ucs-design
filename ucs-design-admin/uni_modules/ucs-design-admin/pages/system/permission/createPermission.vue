<!-- 创建权限 -->
<template>
	<el-dialog v-model="visible" title="创建表权限" class="admin-form-dialog" :close-on-click-modal="false" align-center width="min(90vw, 520px)">
		<el-form label-position="right" label-width="100px" :model="form" @submit.prevent="handleSubmit" ref="formRef">
			<el-form-item prop="permission_id" label="表名" required
				:rules="[{required:true,message:'表名不能为空'}]">
				<el-input :readonly="disabled" @input="onTableNameInput" v-model="form.permission_id" placeholder="填写数据库表名">
					<template #append>
						表
					</template>
				</el-input>
			</el-form-item>
			<el-form-item prop="permission_name" label="名称" required
				:rules="[{required:true,message:'名称不能为空'}]">
				<el-input :readonly="disabled" @input="onNameInput" v-model="form.permission_name" placeholder="填写数据库表名的中文名称">
					<template #append>
						表
					</template>
				</el-input>
			</el-form-item>
			<el-form-item prop="comment" label="备注">
				<el-input :readonly="disabled" v-model="form.comment" />
			</el-form-item>
			<el-space direction="vertical" fill style="width: 100%" size="default">
				<el-table class="permission-preview-table" :data="data">
					<template #empty>
						<el-empty :image-size="100" description="暂无权限预览数据" />
					</template>
					<el-table-column v-for="(column, index) in columns" :key="column.prop || index" v-bind="column" />
				</el-table>

			</el-space>
		</el-form>
		<template #footer><el-button :disabled="disabled" @click="close">取消</el-button><el-button :loading="disabled" type="primary" @click="handleSubmit">确认创建</el-button></template>
	</el-dialog>
</template>

<script setup>
import '../../../common/form-dialog.css';
import { ElButton, ElCol, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElRow, ElSpace, ElTable, ElTableColumn } from 'element-plus';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/col/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/empty/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/row/style/css.mjs';
import 'element-plus/es/components/space/style/css.mjs';
import 'element-plus/es/components/table/style/css.mjs';
import 'element-plus/es/components/table-column/style/css.mjs';

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
	// 表头
	const columns = [{
			label: '权限代码',
			prop: 'code'
		},
		{
			label: '权限名称',
			prop: 'name'
		}
	];
	// 模板
	let data = ref([{
		code: 'READ_',
		name: "查询"
	}, {
		code: 'CREATE_',
		name: "创建"
	}, {
		code: 'UPDATE_',
		name: "更新"
	}, {
		code: 'DELETE_',
		name: "删除"
	}]);
	// 打开弹出层
	const open = () => {
		visible.value = true;
	};
	// 关闭弹出层
	const close = () => {
		visible.value = false;
	};
	// 表名数据转化
	const transformString = (str) => {
		// 将所有小写字母转换为大写字母
		let upperCasedStr = str.toUpperCase();
		// 将所有连字符（-）转换为下划线（_）
		let transformedStr = upperCasedStr.replace(/-/g, '_');
		return transformedStr;
	};
	// 表权限代码转化
	const onTableNameInput = (e) => {
		form.permission_id_big = transformString(e);
		data.value[0].code = `READ_${transformString(e)}`;
		data.value[1].code = `CREATE_${transformString(e)}`;
		data.value[2].code = `UPDATE_${transformString(e)}`;
		data.value[3].code = `DELETE_${transformString(e)}`;
	};
	// 表权限名称转化
	const onNameInput = (e) => {
		data.value[0].name = `查询${e}`;
		data.value[1].name = `创建${e}`;
		data.value[2].name = `更新${e}`;
		data.value[3].name = `删除${e}`;
	};
	// 表单数据
	const form = reactive({
		permission_id: '',
		permission_id_big: '',
		permission_name: '',
		comment: ''
	});
	// 表单提交
	const handleSubmit = async () => {
		const valid = await formRef.value.validate().catch(() => false);
		if (valid) {
			const values = { ...form };
			disabled.value = true;
			uniIdCo.createPermission(values).then(res => {
				// 关闭弹出层
				visible.value = false;
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
.permission-preview-table :deep(table) {
	user-select: text;
}
</style>
