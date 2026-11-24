<!-- 账号登录 -->
<template>
	<div class="account-login" v-loading.fullscreen.lock="fullscreenLoading" element-loading-text="正在登录，请稍候…">
		<div class="form-heading">
			<h2>{{ loginTenant ? `登录到${loginTenant.name}` : '欢迎登录' }}</h2>
			<p>{{ checkingTenant ? '正在确认登录租户…' : '选择登录方式，进入管理工作台。' }}</p>
		</div>
		<template v-if="!checkingTenant">
		<el-tabs v-model="loginMode" class="login-tabs" stretch>
            <el-tab-pane label="账号密码" name="password" :disabled="loginBusy" />
            <el-tab-pane label="手机验证码" name="mobile" :disabled="loginBusy" />
            <el-tab-pane label="邮箱验证码" name="email" :disabled="loginBusy" />
        </el-tabs>
        <el-form v-show="loginMode === 'password'" :model="entryForm" label-position="top" hide-required-asterisk @submit.prevent="handleSubmit" ref="formRef">
			<el-form-item prop="username" label="账号" :rules="[{required:true,message:'请输入账号',trigger:'blur'}]">
				<el-input v-model="entryForm.username" :prefix-icon="User" size="large" placeholder="请输入账号"
					name="username" autocomplete="username" :disabled="isSubmitting" />
			</el-form-item>
			<el-form-item prop="password" label="密码"
				:rules="[{required:true,message:'请输入密码',trigger:'blur'},{min:6,message:'密码至少为 6 位字符',trigger:'blur'}]">
				<el-input type="password" show-password v-model="entryForm.password" :prefix-icon="Lock" size="large" placeholder="请输入密码"
					name="password" autocomplete="current-password" :disabled="isSubmitting" />
			</el-form-item>
			<el-form-item v-if="!loginTenant" prop="tenant_no" label="租户号" :rules="[{ required: true, pattern: /^\d{5}$/, message: '请输入五位数字租户号' }]">
				<el-input v-model.trim="entryForm.tenant_no" name="tenant_no" size="large" placeholder="请输入租户号" maxlength="5" inputmode="numeric" :disabled="isSubmitting" />
			</el-form-item>
			<div class="form-options">
				<el-checkbox v-model="rememberAccount" :disabled="isSubmitting" @change="onRememberChange">记住账号</el-checkbox>
				<el-button link type="primary" :disabled="isSubmitting" @click="contactRef.open('reset')">忘记密码？</el-button>
			</div>
			<el-button class="login-submit" type="primary" size="large" native-type="submit" :loading="isSubmitting">
				<span>{{ isSubmitting ? '正在登录…' : '登录' }}</span>
			</el-button>
		</el-form>
		<div v-for="channel in ['mobile', 'email']" :key="channel" :style="{ display: loginMode === channel ? '' : 'none' }">
            <el-form v-if="!loginTenant" label-position="top">
                <el-form-item label="租户号"><el-input v-model.trim="entryForm.tenant_no" size="large" placeholder="请输入租户号" maxlength="5" inputmode="numeric" :disabled="loginBusy" /></el-form-item>
            </el-form>
            <account-contact inline :tenant-no="entryForm.tenant_no" :initial-channel="channel" :active="loginMode === channel"
                @login="finishLogin" @busy-change="contactBusy[channel] = $event" @loading-change="contactLoading[channel] = $event" />
        </div>
		<div class="account-support">
			<template v-if="isAdmin && (!loginTenant || loginTenant.tenant_no === '00000')"><span>首次使用系统？</span><el-button link type="primary" @click="registeredAdmin">注册管理员</el-button></template>
			<span v-else>还没有账号？请联系系统管理员开通</span>
		</div>
		</template>
	</div>
	<!-- 验证码 -->
	<ucs-admin-captcha scene="login-by-pwd" ref="captchaRef" @change="onCaptchaChange" />
	<!-- 注册管理员 -->
	<registered-admin-vue ref="registeredRef" @change="onRegisteredAdminChange" />
	<account-contact ref="contactRef" :tenant-no="entryForm.tenant_no" :tenant-locked="Boolean(loginTenant)" @login="finishLogin" @loading-change="contactLoading.dialog = $event" />
</template>

<script setup>
import { ElButton, ElCheckbox, ElForm, ElFormItem, ElInput, ElTabs, ElTabPane, ElMessage, vLoading } from 'element-plus';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/checkbox/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/tabs/style/css.mjs';
import 'element-plus/es/components/tab-pane/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/loading/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';

	import { User, Lock } from '@element-plus/icons-vue';
	const uniIdCo = uniCloud.importObject("uni-id-co", {
		customUI: true
	});
	import pagesJson from "/pages.json";
	import registeredAdminVue from "./registeredAdmin.vue"
	import AccountContact from './accountContact.vue';
	import store from "../../common/store.js";
	import { setDelegation } from "../../common/tenant-session.js";
	import { isTenantNo, rememberLoginTenant } from '../../common/login-tenant.js';

	import {
		ref, reactive, computed, watch
	} from 'vue';

	const props = defineProps({ routeOptions: { type: Object, required: true } });
	const loginTenant = ref(null);
	const checkingTenant = ref(isTenantNo(props.routeOptions.tenant_no));
	const loginMode = ref('password');
    const contactBusy = reactive({ mobile: false, email: false });
    const contactLoading = reactive({ mobile: false, email: false, dialog: false });
    const navigating = ref(false);
    const fullscreenLoading = computed(() => isSubmitting.value || navigating.value || Object.values(contactLoading).some(Boolean));
    const loginBusy = computed(() => isSubmitting.value || contactBusy.mobile || contactBusy.email);
    const formRef = ref(null);
	const contactRef = ref(null);
	const finishLogin = (result) => {
		rememberLoginTenant(result.tenant_no);
        setDelegation(null);
        navigating.value = true;
		store.isLogin = true;
		uni.redirectTo({
            url: uniIdRedirectUrl.value || `/${pagesJson.pages[0].path}`,
            success: () => { ElMessage.success('登录成功'); },
            fail: () => {
                store.isLogin = false;
                ElMessage.warning('登录成功，但页面跳转失败，请重试');
            },
            complete: () => { navigating.value = false; }
        });
	};
	const savedAccount = uni.getStorageSync('ucs-admin-login-account') || '';
	const rememberAccount = ref(Boolean(savedAccount));
	const isSubmitting = ref(false);
	const onRememberChange = (checked) => {
		if (!checked) uni.removeStorageSync('ucs-admin-login-account');
	};
	// 表单数据
	const entryForm = ref({
		username: savedAccount,
		tenant_no: '',
		password: "",
		captcha: ""
	});
	// 验证码
	const captchaRef = ref(null);
	// 是否显示了验证码
	const isNeedCaptcha = ref(false);
    watch(loginMode, () => { captchaRef.value?.close(); entryForm.value.captcha = ''; formRef.value?.clearValidate(); });
	// 获取验证码值
	const onCaptchaChange = (e) => {
		entryForm.value.captcha = e.code;
		getLogin(entryForm.value);
	};
	// 是否显示管理员注册入口
	const isAdmin = ref(false);
	const registeredRef = ref(null);
	const onRegisteredAdminChange = (e) => {
		isAdmin.value = e.isAdmin;
	};
	const uniIdRedirectUrl = ref(null);
	async function initialize(e) {
		let redirect = e.uniIdRedirectUrl;
		// uni-app x Web 会额外编码回跳地址。已解码的地址保留原有查询参数。
		try {
			while (/^%(?:25)*2f/i.test(redirect)) redirect = decodeURIComponent(redirect);
		} catch {
			redirect = null;
		}
		if (typeof redirect === 'string' && pagesJson.pages.some(({ path }) =>
			`/${path}` === redirect.split(/[?#]/, 1)[0]
		)) uniIdRedirectUrl.value = redirect;
		if (checkingTenant.value) {
			try {
				const tenant = await uniIdCo.getLoginTenant({ tenant_no: e.tenant_no });
				if (tenant.errCode === 0 && tenant.tenant_no === e.tenant_no) {
					entryForm.value.tenant_no = tenant.tenant_no;
					loginTenant.value = tenant;
				}
			} catch {
				// Unavailable tenant links use the same form as the common login page.
			} finally {
				checkingTenant.value = false;
			}
		}
		// 查询是否已经有管理员注册了，如果有，则隐藏注册管理员的入口
		try {
			const result = await uniCloud.importObject('uni-id-co', { customUI: true }).getAdminRegistrationStatus();
			isAdmin.value = result.errCode === 0 && result.canRegisterAdmin === true;
		} catch (err) {
			isAdmin.value = false;
		}
	}
	initialize(props.routeOptions);

	/**
	 * 注册管理员
	 */
	const registeredAdmin = () => {
		registeredRef.value.open();
	}
	/**
	 * 账号密码登录
	 */
	const handleSubmit = async () => {
		if (isSubmitting.value) return;
		const valid = await formRef.value.validate().catch(() => false);
		if (valid) {
			const values = { ...entryForm.value };
			getLogin(values);
		};
	};

	const getLogin = (form) => {
		if (isSubmitting.value) return;
		isSubmitting.value = true;
		uniIdCo.adminLogin({
			username: form.username,
			tenant_no: form.tenant_no,
			password: form.password,
			captcha: form.captcha
		}).then(res => {
			if (res.errCode) throw res;
			if (res.selectionTicket) { captchaRef.value.close(); contactRef.value.open('login', res); return; }
			if (rememberAccount.value) {
				uni.setStorageSync('ucs-admin-login-account', form.username);
			} else {
				uni.removeStorageSync('ucs-admin-login-account');
			}
			// 如果使用了验证码，登录成功后关闭弹窗
			if (isNeedCaptcha.value) {
				captchaRef.value.close();
			};
			finishLogin(res);
		}).catch(err => {
			if (err.errCode !== 'uni-id-captcha-required') ElMessage.error(err.errMsg || err.message || '登录失败，请重试');
			if (err.errCode == 'uni-id-captcha-required') {
                ElMessage.info('请完成图形验证码验证');
				isNeedCaptcha.value = true;
				captchaRef.value.open();
			} else if (err.errCode == 'uni-captcha-verify-fail') {
				// 验证码错误
				captchaRef.value.refresh();
			} else if (err.errCode == 'uni-id-password-error') {
				// 密码错误
				captchaRef.value.close();
			} else if (err.errCode == 'uni-id-password-error-exceed-limit') {
				// 密码错误次数过多，稍后重试
				captchaRef.value.close();
			} else {
				// 其它情况
				captchaRef.value.close();
			}
		}).finally(e => {
			isSubmitting.value = false;
			// 清空验证码
			entryForm.value.captcha = "";
		});
	}
</script>

<style lang="scss" scoped>
.account-login { color: var(--el-text-color-primary); }
.form-heading { margin-bottom: 40px; }
.form-heading h2 { font-size: 34px; line-height: 1.4; font-weight: 650; margin: 0 0 8px; }
.form-heading p { font-size: 15px; color: var(--el-text-color-secondary); line-height: 1.7; margin: 0; }
.login-tabs { margin-bottom: 32px; }
.login-tabs :deep(.el-tabs__header) { margin-bottom: 0; }
.login-tabs :deep(.el-tabs__content) { display: none; }
.login-tabs :deep(.el-tabs__item) { height: 48px; font-size: 16px; padding: 0 10px; }
.login-tabs :deep(.el-tabs__nav-wrap::after) { height: 1px; background: var(--el-border-color-light); }
.account-login :deep(.el-form-item) { margin-bottom: 28px; }
.account-login :deep(.el-form-item__label) { font-size: 15px; line-height: 22px; margin-bottom: 10px; color: var(--el-text-color-primary); }
.account-login :deep(.el-input__wrapper) { min-height: 48px; box-sizing: border-box; border-radius: 5px; padding: 0 15px; background: var(--el-fill-color-blank); }
.account-login :deep(.el-input__inner) { font-size: 15px; height: 46px; }
.account-login :deep(.el-input__prefix) { color: var(--el-text-color-placeholder); margin-right: 4px; }
.account-login :deep(.el-form-item__error) { padding-top: 5px; font-size: 12px; }
.form-options { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 32px; margin: -6px 0 24px; }
.form-options :deep(.el-checkbox__label), .form-options :deep(.el-button) { font-size: 13px; }
.login-submit { width: 100%; height: 48px; border-radius: 5px; font-size: 16px; }
.login-submit:focus-visible { outline: 3px solid var(--el-color-primary-light-5); outline-offset: 3px; }
.account-support { margin-top: 44px; display: flex; justify-content: center; align-items: center; gap: 6px; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
.account-support :deep(.el-button) { font-size: 13px; }
@media (max-height: 800px) {
 .form-heading { margin-bottom: 24px; }
 .login-tabs { margin-bottom: 20px; }
 .account-login :deep(.el-form-item) { margin-bottom: 22px; }
 .form-options { margin-bottom: 16px; }
 .account-support { margin-top: 24px; }
}
@media (max-width: 800px) {
 .form-heading { margin-bottom: 28px; }
 .form-heading h2 { font-size: 28px; }
}
@media (max-width: 400px) {
 .login-tabs :deep(.el-tabs__item) { font-size: 14px; padding: 0 5px; }
 .form-heading p { font-size: 14px; }
}
</style>
