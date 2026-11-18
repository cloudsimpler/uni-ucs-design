<template>
	<el-form class="contact-code-form" :class="{ 'is-inline': inline }" label-position="top" @submit.prevent="$emit('verify')">
		<el-form-item v-if="!inline" label="验证方式">
			<el-radio-group :model-value="channel" :disabled="busy || cooldown > 0" @update:model-value="$emit('channel', $event)">
				<el-radio-button value="mobile">手机号</el-radio-button><el-radio-button value="email">邮箱</el-radio-button>
			</el-radio-group>
		</el-form-item>
		<el-form-item :label="channel === 'mobile' ? '手机号' : '邮箱'">
			<el-input :model-value="contact" :type="channel === 'mobile' ? 'tel' : 'email'" :autocomplete="channel === 'mobile' ? 'tel' : 'email'"
				:prefix-icon="channel === 'mobile' ? Iphone : Message" :placeholder="channel === 'mobile' ? '请输入手机号' : '请输入邮箱地址'"
				:disabled="busy" :maxlength="channel === 'mobile' ? 11 : 100" @update:model-value="$emit('contact', $event.trim())" />
		</el-form-item>
		<el-form-item label="验证码">
			<div class="code-entry">
				<el-input :model-value="code" placeholder="请输入验证码" :prefix-icon="Key" maxlength="6" inputmode="numeric"
					autocomplete="one-time-code" :disabled="busy" @update:model-value="$emit('code', $event.trim())" />
				<el-button class="code-send" :disabled="busy || cooldown > 0" @click="$emit('send')">{{ cooldown ? `${cooldown} 秒后重发` : '获取验证码' }}</el-button>
			</div>
		</el-form-item>
		<div v-if="inline" class="contact-options"><span>{{ channel === 'mobile' ? '使用已绑定的手机号登录' : '使用已绑定的邮箱登录' }}</span></div>
		<el-alert v-if="error" class="contact-error" :title="error" type="error" :closable="false" show-icon />
		<el-button class="contact-primary" type="primary" native-type="submit" :loading="busy">{{ inline ? '登录' : '验证并继续' }}</el-button>
	</el-form>
</template>

<script setup>
import { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElRadioButton, ElRadioGroup } from 'element-plus';
import { Iphone, Key, Message } from '@element-plus/icons-vue';
import 'element-plus/es/components/alert/style/css.mjs';
import 'element-plus/es/components/button/style/css.mjs';
import 'element-plus/es/components/form/style/css.mjs';
import 'element-plus/es/components/form-item/style/css.mjs';
import 'element-plus/es/components/input/style/css.mjs';
import 'element-plus/es/components/radio-button/style/css.mjs';
import 'element-plus/es/components/radio-group/style/css.mjs';
defineProps({ inline: Boolean, channel: String, contact: String, code: String, busy: Boolean, cooldown: Number, error: String });
defineEmits(['verify', 'send', 'contact', 'code', 'channel']);
</script>

<style scoped>
.code-entry { display: flex; gap: 12px; width: 100%; min-width: 0; }
.code-entry .el-input { min-width: 0; flex: 1; }
.code-send { flex-shrink: 0; color: var(--el-color-primary); }
.code-send.is-disabled { color: var(--el-text-color-placeholder); }
.contact-primary { width: 100%; margin-top: 20px; }
.contact-error { margin-bottom: 16px; }
.is-inline :deep(.el-form-item) { margin-bottom: 28px; }
.is-inline :deep(.el-form-item__label) { font-size: 14px; line-height: 22px; margin-bottom: 10px; color: var(--el-text-color-primary); }
.is-inline :deep(.el-input__wrapper) { min-height: 48px; box-sizing: border-box; border-radius: 5px; padding: 0 15px; }
.is-inline :deep(.el-input__inner) { height: 46px; font-size: 14px; }
.is-inline .code-send { height: 48px; border-radius: 5px; min-width: 120px; }
.contact-options { min-height: 32px; margin: -6px 0 24px; display: flex; align-items: center; color: var(--el-text-color-secondary); font-size: 13px; }
.is-inline .contact-primary { height: 48px; font-size: 16px; border-radius: 5px; margin-top: 0; }
@media (max-height: 800px) {
 .is-inline :deep(.el-form-item) { margin-bottom: 22px; }
 .is-inline .contact-options { margin-bottom: 16px; }
}
@media (max-width: 400px) { .code-entry { gap: 8px; } .is-inline .code-send { min-width: 104px; padding: 0 10px; } }
</style>
