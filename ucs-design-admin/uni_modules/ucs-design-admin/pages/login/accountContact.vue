<template>
  <contact-code-form v-if="inline" inline :channel="channel" :contact="contact" :code="code" :busy="busy" :cooldown="cooldown" :error="proof ? '' : error"
    @contact="contact = $event; code = ''; error = ''" @code="code = $event" @send="send" @verify="verify()" />
  <el-dialog v-model="visible" class="auth-dialog" :title="purpose === 'reset' ? '找回密码' : proof ? '选择登录账号' : '验证码登录'" align-center
    :close-on-click-modal="false" :close-on-press-escape="!busy" :show-close="!busy" @closed="clear">
    <template v-if="!proof">
      <contact-code-form :channel="channel" :contact="contact" :code="code" :busy="busy" :cooldown="cooldown" :error="error"
        @channel="channel = $event; contact = ''; code = ''; error = ''" @contact="contact = $event; code = ''; error = ''"
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
          <el-tag>{{ (Array.isArray(account.account_type) ? account.account_type : [account.account_type]).map(type => ['系统用户', '社区用户'][type]).join(' / ') }}</el-tag>
        </button>
      </div>
      <el-form v-if="purpose === 'reset'" label-position="top" @submit.prevent="finish">
        <el-form-item label="新密码"><el-input v-model="password" type="password" show-password autocomplete="new-password" :disabled="busy" /></el-form-item>
        <el-form-item label="确认密码"><el-input v-model="confirm" type="password" show-password autocomplete="new-password" :disabled="busy" /></el-form-item>
      </el-form>
      <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
      <el-button class="auth-dialog-primary" type="primary" :loading="busy" :disabled="!selectedUid" @click="finish">{{ purpose === 'reset' ? '确认重置' : '登录所选账号' }}</el-button>
    </template>
  </el-dialog>
  <ucs-admin-captcha ref="captchaRef" :scene="captchaScene" @change="onCaptcha" />
</template>

<script setup>
import { ElAlert, ElAvatar, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElTag } from 'element-plus';
import 'element-plus/es/components/alert/style/css.mjs';
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
const props = defineProps({ inline: Boolean, initialChannel: { type: String, default: 'mobile' }, active: { type: Boolean, default: true } });
const emit = defineEmits(['login', 'busy-change', 'loading-change']);
const api = uniCloud.importObject('uni-id-co', { customUI: true });
const visible = ref(false), purpose = ref('login'), channel = ref(props.initialChannel), contact = ref(''), code = ref('');
const busy = ref(false), error = ref(''), proof = ref(null), selectedUid = ref(''), password = ref(''), confirm = ref('');
const cooldown = ref(0), captchaRef = ref(), captchaScene = ref('send-sms-code');
let timer, pending = 'send', epoch = 0;
const scene = () => purpose.value === 'reset' ? `reset-pwd-by-${channel.value === 'mobile' ? 'sms' : 'email'}` : `login-by-${channel.value === 'mobile' ? 'sms' : 'email'}`;
const clear = () => { epoch++; proof.value = null; selectedUid.value = ''; password.value = ''; confirm.value = ''; code.value = ''; error.value = ''; captchaRef.value?.close(); };
function open(mode = 'login', selection) {
  clear(); purpose.value = mode; contact.value = ''; visible.value = true;
  if (selection) setProof(selection);
}
function setProof(result) {
  proof.value = result; selectedUid.value = result.accounts.length === 1 ? result.accounts[0].uid : '';
  visible.value = true;
}
function validContact() {
  const valid = channel.value === 'mobile' ? /^1\d{10}$/.test(contact.value) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.value);
  if (!valid) error.value = channel.value === 'mobile' ? '请输入有效的 11 位手机号' : '请输入有效的邮箱';
  return valid;
}
async function askCaptcha(action) {
  if (!props.active) return;
  pending = action; captchaScene.value = action === 'send' ? `send-${channel.value === 'mobile' ? 'sms' : 'email'}-code` : scene();
  await nextTick(); captchaRef.value.open();
}
async function send() { if (!busy.value && !cooldown.value && validContact()) await askCaptcha('send'); }
async function onCaptcha({ code: captcha }) {
  if (pending === 'verify') return verify(captcha);
  if (busy.value || !props.active) return;
  busy.value = true; error.value = ''; const request = epoch;
  try {
    const result = await api[channel.value === 'mobile' ? 'sendSmsCode' : 'sendEmailCode']({ [channel.value]: contact.value, scene: scene(), captcha });
    if (request !== epoch) return;
    captchaRef.value.close(); cooldown.value = 60; clearInterval(timer);
    timer = setInterval(() => { if (--cooldown.value <= 0) clearInterval(timer); }, 1000);
    if (result.testMode) ElMessage.warning(result.errMsg); else ElMessage.success('验证码已发送');
  } catch (e) {
    if (request !== epoch) return;
    error.value = e.errMsg || e.message || '发送失败，请重试';
    ElMessage.error(error.value);
    if (e.errCode === 'uni-captcha-verify-fail') captchaRef.value.refresh(); else captchaRef.value.close();
  } finally { busy.value = false; }
}
async function verify(captcha = '') {
  if (busy.value || !props.active || !validContact()) return;
  if (!/^\d{6}$/.test(code.value)) { error.value = '请输入 6 位验证码'; return; }
  busy.value = true; error.value = ''; const request = epoch;
  if (purpose.value === 'login') emit('loading-change', true);
  try {
    const params = { [channel.value]: contact.value, code: code.value, captcha: typeof captcha === 'string' ? captcha : '' };
    const result = purpose.value === 'reset' ? await api.adminBeginAccountRecovery({ ...params, channel: channel.value })
      : await api[channel.value === 'mobile' ? 'adminLoginBySms' : 'adminLoginByEmailCode'](params);
    if (request !== epoch) return;
    captchaRef.value.close(); code.value = '';
    if (result.selectionTicket) setProof(result);
    else { visible.value = false; emit('login', result); }
  } catch (e) {
    if (request !== epoch) return;
    error.value = e.errMsg || e.message || '验证失败';
    if (e.errCode !== 'uni-id-captcha-required') ElMessage.error(error.value);
    if (e.errCode === 'uni-id-captcha-required') {
      ElMessage.info('请完成图形验证码验证');
      await askCaptcha('verify');
    }
    else if (e.errCode === 'uni-captcha-verify-fail') captchaRef.value.refresh();
    else captchaRef.value.close();
  } finally { busy.value = false; emit('loading-change', false); }
}
async function finish() {
  if (busy.value || !selectedUid.value) return;
  if (purpose.value === 'reset' && (password.value.length < 6 || password.value.length > 64 || password.value !== confirm.value)) {
    error.value = '密码需为 6–64 位，且两次输入一致'; return;
  }
  busy.value = true; error.value = ''; const request = epoch;
  if (purpose.value === 'login') emit('loading-change', true);
  try {
    const params = { selectionTicket: proof.value.selectionTicket, uid: selectedUid.value };
    const result = purpose.value === 'reset' ? await api.adminCompleteAccountRecovery({ ...params, password: password.value }) : await api.adminCompleteAccountLogin(params);
    if (request !== epoch) return;
    visible.value = false;
    if (purpose.value === 'reset') ElMessage.success('密码已重置，请使用新密码登录'); else emit('login', result);
  } catch (e) {
    if (request !== epoch) return;
    if (e.errCode === 'ACCOUNT_SELECTION_EXPIRED') { proof.value = null; password.value = ''; confirm.value = ''; if (props.inline) visible.value = false; }
    error.value = e.errMsg || e.message || '操作失败，请重试';
    ElMessage.error(error.value);
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
