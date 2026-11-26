<template>
  <contact-code-form v-if="inline" ref="inlineForm" inline :show-tenant="!tenantLocked" :tenant-no="tenantNo()"
    :channel="channel" :contact="contact" :code="code" :busy="busy" :cooldown="cooldown"
    @tenant="emit('update:tenantNo', $event)" @contact="changeContact" @code="code = $event" @send="send" @verify="verify()" />
  <el-dialog v-model="visible" class="auth-dialog" :title="purpose === 'reset' ? '找回密码' : proof ? '选择登录账号' : '验证码登录'" align-center
    :close-on-click-modal="false" :close-on-press-escape="!busy" :show-close="!busy" @closed="clear">
    <template v-if="!proof">
      <contact-code-form ref="dialogForm" :show-tenant="purpose === 'reset' && !tenantLocked" :tenant-no="tenantNo()"
        :channel="channel" :contact="contact" :code="code" :busy="busy" :cooldown="cooldown"
        @tenant="dialogTenantNo = $event" @channel="channel = $event; changeContact('')" @contact="changeContact"
        @code="code = $event" @send="send" @verify="verify()" />
      <p class="contact-hint" v-if="purpose === 'reset'">未绑定手机号或邮箱的账号，请联系其他管理员重置密码。</p>
    </template>
    <template v-else>
      <p class="contact-hint">{{ proof.accounts.length > 1 ? '请选择要' + (purpose === 'reset' ? '重置密码' : '登录') + '的账号' : '请设置此账号的新密码' }}</p>
      <div class="account-choices">
        <button v-for="account in proof.accounts" :key="account.uid" type="button" class="account-choice"
          :class="{ selected: selectedUid === account.uid }" :disabled="busy" @click="selectedUid = account.uid">
          <el-avatar :src="account.avatar?.startsWith('http') ? account.avatar : ''">{{ (account.nickname || account.username || '用').slice(0, 1) }}</el-avatar>
          <span class="account-name"><strong>{{ account.nickname || account.username }}</strong><small>{{ account.username }}</small></span>
          <el-tag>{{ ['系统用户', '社区用户'][account.account_type] }}</el-tag>
        </button>
      </div>
      <el-form v-if="purpose === 'reset'" label-position="top" @submit.prevent="finish">
        <el-form-item label="新密码"><el-input v-model="password" type="password" show-password autocomplete="new-password" :disabled="busy" /></el-form-item>
        <el-form-item label="确认密码"><el-input v-model="confirm" type="password" show-password autocomplete="new-password" :disabled="busy" /></el-form-item>
      </el-form>
      <el-button class="auth-dialog-primary" type="primary" :loading="busy" :disabled="!selectedUid" @click="finish">{{ purpose === 'reset' ? '确认重置' : '登录所选账号' }}</el-button>
    </template>
  </el-dialog>
  <ucs-admin-captcha ref="captchaRef" :scene="captchaScene" @change="onCaptcha" />
</template>

<script setup>
import { ElAvatar, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElTag } from 'element-plus';
import 'element-plus/es/components/avatar/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/dialog/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/tag/style/css.mjs';
import 'element-plus/es/components/message/style/css.mjs';
import './auth-dialog.css';

import { ref, nextTick, onUnmounted, watch } from 'vue';
import ContactCodeForm from './contactCodeForm.vue';
import { ElMessage } from 'element-plus';
const props = defineProps({ inline: Boolean, tenantNo: { type: String, default: '' }, tenantLocked: Boolean, active: { type: Boolean, default: true } });
const emit = defineEmits(['login', 'busy-change', 'loading-change', 'update:tenantNo']);
const api = uniCloud.importObject('uni-id-co', { customUI: true });
const visible = ref(false), purpose = ref('login'), channel = ref('mobile'), contact = ref(''), code = ref('');
const busy = ref(false), proof = ref(null), selectedUid = ref(''), password = ref(''), confirm = ref('');
const cooldown = ref(0), captchaRef = ref(), captchaScene = ref('send-sms-code');
const inlineForm = ref(), dialogForm = ref();
const contactForm = () => props.inline ? inlineForm.value : dialogForm.value;
let timer, pending = 'send', epoch = 0;
const dialogTenantNo = ref('');
const tenantNo = () => props.inline || props.tenantLocked ? props.tenantNo : dialogTenantNo.value;
const scene = () => purpose.value === 'reset' ? `reset-pwd-by-${channel.value === 'mobile' ? 'sms' : 'email'}` : 'login-by-sms';
const clear = () => { epoch++; proof.value = null; selectedUid.value = ''; password.value = ''; confirm.value = ''; code.value = ''; contactForm()?.clearValidation(); captchaRef.value?.close(); };
function changeContact(value) {
  contact.value = value;
  code.value = '';
  contactForm()?.clearValidation(['contact', 'code']);
}
function open(mode = 'login', selection) {
  clear(); purpose.value = mode; contact.value = ''; dialogTenantNo.value = props.tenantNo; visible.value = true;
  if (selection) setProof(selection);
}
function setProof(result) {
  proof.value = result; selectedUid.value = result.accounts.length === 1 ? result.accounts[0].uid : '';
  visible.value = true;
}
async function validateContact(includeCode) {
  if (!await contactForm()?.validate(includeCode)) return false;
  if (/^\d{5}$/.test(tenantNo())) return true;
  ElMessage.error('请输入租户号');
  return false;
}
async function askCaptcha(action) {
  if (!props.active) return;
  pending = action; captchaScene.value = action === 'send' ? `send-${channel.value === 'mobile' ? 'sms' : 'email'}-code` : scene();
  await nextTick(); captchaRef.value.open();
}
async function send() {
  if (busy.value || cooldown.value || !props.active || !await validateContact(false)) return;
  if (!busy.value && !cooldown.value) await askCaptcha('send');
}
async function onCaptcha({ code: captcha }) {
  if (pending === 'verify') return verify(captcha);
  if (busy.value || !props.active) return;
  busy.value = true; const request = epoch;
  try {
    const result = await api[channel.value === 'mobile' ? 'sendSmsCode' : 'sendEmailCode']({ [channel.value]: contact.value, tenant_no: tenantNo(), scene: scene(), captcha });
    if (request !== epoch) return;
    captchaRef.value.close(); cooldown.value = 60; clearInterval(timer);
    timer = setInterval(() => { if (--cooldown.value <= 0) clearInterval(timer); }, 1000);
    if (result.testMode) ElMessage.warning(result.errMsg); else ElMessage.success('验证码已发送');
  } catch (e) {
    if (request !== epoch) return;
    ElMessage.error(e.errMsg || e.message || '发送失败，请重试');
    if (e.errCode === 'uni-captcha-verify-fail') captchaRef.value.refresh(); else captchaRef.value.close();
  } finally { busy.value = false; }
}
async function verify(captcha = '') {
  if (busy.value || !props.active || !await validateContact(true)) return;
  if (busy.value || !props.active) return;
  busy.value = true; const request = epoch;
  if (purpose.value === 'login') emit('loading-change', true);
  try {
    const params = { [channel.value]: contact.value, tenant_no: tenantNo(), code: code.value, captcha: typeof captcha === 'string' ? captcha : '' };
    const result = purpose.value === 'reset' ? await api.adminBeginAccountRecovery({ ...params, channel: channel.value })
      : await api.adminLoginBySms(params);
    if (result.errCode) throw result;
    if (request !== epoch) return;
    captchaRef.value.close(); code.value = '';
    if (result.selectionTicket) setProof(result);
    else { visible.value = false; emit('login', result); }
  } catch (e) {
    if (request !== epoch) return;
    if (e.errCode === 'uni-id-captcha-required') {
      ElMessage.info('请完成图形验证码验证');
      await askCaptcha('verify');
    }
    else {
      ElMessage.error(e.errMsg || e.message || '验证失败');
      if (e.errCode === 'uni-captcha-verify-fail') captchaRef.value.refresh();
      else captchaRef.value.close();
    }
  } finally { busy.value = false; emit('loading-change', false); }
}
async function finish() {
  if (busy.value || !selectedUid.value) return;
  if (purpose.value === 'reset' && (password.value.length < 6 || password.value.length > 64 || password.value !== confirm.value)) {
    ElMessage.error('密码需为 6–64 位，且两次输入一致'); return;
  }
  busy.value = true; const request = epoch;
  if (purpose.value === 'login') emit('loading-change', true);
  try {
    const params = { selectionTicket: proof.value.selectionTicket, uid: selectedUid.value, tenant_no: tenantNo() };
    const result = purpose.value === 'reset' ? await api.adminCompleteAccountRecovery({ ...params, password: password.value }) : await api.adminCompleteAccountLogin(params);
    if (result.errCode) throw result;
    if (request !== epoch) return;
    visible.value = false;
    if (purpose.value === 'reset') ElMessage.success('密码已重置，请使用新密码登录'); else emit('login', result);
  } catch (e) {
    if (request !== epoch) return;
    if (e.errCode === 'ACCOUNT_SELECTION_EXPIRED') { proof.value = null; password.value = ''; confirm.value = ''; if (props.inline) visible.value = false; }
    ElMessage.error(e.errMsg || e.message || '操作失败，请重试');
  } finally { busy.value = false; emit('loading-change', false); }
}
watch(() => busy.value || visible.value, value => emit('busy-change', value));
watch(() => props.active, active => { if (!active) { visible.value = false; clear(); } });
onUnmounted(() => { clear(); clearInterval(timer); emit('loading-change', false); });
defineExpose({ open });
</script>

<style scoped>
.contact-hint { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; }
.contact-code-form + .contact-hint { margin-top: 12px; }
.account-choices { display: grid; gap: 12px; margin: 18px 0; }
.account-choice { display: flex; align-items: center; gap: 12px; width: 100%; padding: 16px; border: 1px solid var(--el-border-color); border-radius: 8px; background: var(--el-bg-color); cursor: pointer; text-align: left; color: var(--el-text-color-primary); }
.account-choice.selected { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.account-name { display: grid; gap: 5px; flex: 1; min-width: 0; overflow-wrap: anywhere; }
.account-name small { color: var(--el-text-color-secondary); }
</style>
