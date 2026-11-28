<template>
  <main class="login-page" :class="{ 'is-confirming-tenant': !tenantReady }">
    <div v-if="!tenantReady" class="tenant-loading" role="status">
      <span class="tenant-loading-spinner" aria-hidden="true"></span>
      <span>正在确认登录租户…</span>
    </div>
    <section v-if="tenantReady" class="welcome-panel" aria-label="平台介绍">
      <img class="workspace-art" src="/uni_modules/ucs-design-admin/static/login-workspace.webp" alt="" />
      <header class="brand">
        <div class="brand-name">{{ brandName }}</div>
        <p class="brand-caption">管理控制台</p>
      </header>
      <div class="welcome-copy">
        <h1>让管理更简单<br /><span>让工作更专注</span></h1>
        <p>连接团队与业务，开启高效有序的一天。</p>
      </div>
    </section>
    <section v-show="tenantReady" class="signin-panel" aria-label="登录管理工作台">
      <div class="signin-content">
        <account-login v-if="routeOptions" :key="routeOptions.tenant_no" :route-options="routeOptions" @tenant-resolved="loginTenant = $event" />
      </div>
      <footer v-if="tenantReady" class="login-footer">© {{ currentYear }} {{ brandName }}</footer>
    </section>
  </main>
</template>

<script setup>
import store from '../../common/store.js';
import AccountLogin from './accountLogin.vue';
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getLoginTenantNo } from '../../common/login-tenant.js';
import manifest from '@/manifest.json';
import { useTenantTheme } from '../../common/tenant-theme.js';

const routeOptions = ref(null);
const loginTenant = ref();
const tenantReady = computed(() => routeOptions.value !== null && loginTenant.value !== undefined);
const brandName = computed(() => loginTenant.value?.system_name || manifest.name);
useTenantTheme(() => !store.isLogin && tenantReady.value ? (loginTenant.value?.theme_color || '') : undefined);
onLoad((options = {}) => {
  // uniIdRouter may open the login page directly when a local token has expired.
  const expires = Number(uni.getStorageSync('uni_id_token_expired'));
  const fromExpiredSession = options.uniIdRedirectUrl && expires > 0 && expires <= Date.now();
  const tenantNo = options.tenant_no === undefined && fromExpiredSession ? getLoginTenantNo() : options.tenant_no;
  store.isLogin = false;
  uni.removeStorageSync('uni_id_token');
  uni.removeStorageSync('uni_id_token_expired');
  loginTenant.value = undefined;
  routeOptions.value = { ...options, tenant_no: tenantNo };
});
const currentYear = new Date().getFullYear();
</script>

<style lang="scss" scoped>
.login-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.login-page.is-confirming-tenant { display: grid; grid-template-columns: 1fr; place-items: center; }
.tenant-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}
.tenant-loading-spinner {
  box-sizing: border-box;
  width: 32px;
  height: 32px;
  border: 2px solid var(--el-border-color);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: tenant-loading-spin 0.8s linear infinite;
}
@keyframes tenant-loading-spin { to { transform: rotate(360deg); } }
.welcome-panel { position: relative; min-width: 0; min-height: 0; overflow: hidden; background: #edf5ff; }
.workspace-art { position: absolute; inset: auto 0 0; width: 100%; height: 86%; object-fit: cover; object-position: center bottom; }
.welcome-panel::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, #edf5ff 0%, rgba(237, 245, 255, .96) 22%, rgba(237, 245, 255, .8) 40%, rgba(237, 245, 255, .15) 68%, rgba(237, 245, 255, 0) 100%); }
.brand { position: relative; z-index: 1; padding: 44px 10.5% 0; }
.brand-name { font-size: 22px; font-weight: 600; color: #1e2b40; letter-spacing: .5px; }
.brand-caption { margin: 4px 0 0; color: #738399; font-size: 13px; letter-spacing: 2px; }
.welcome-copy { position: relative; z-index: 1; margin: clamp(52px, 11vh, 120px) 10.5% 0; }
.welcome-copy h1 { margin: 0; color: #233650; font-size: clamp(30px, 3.15vw, 48px); line-height: 1.5; letter-spacing: 1.5px; font-weight: 600; }
.welcome-copy h1 span { color: var(--el-color-primary); }
.welcome-copy p { margin: 22px 0 0; max-width: 340px; font-size: clamp(14px, 1.1vw, 16px); color: #6b809b; line-height: 1.9; }
.signin-panel { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; box-sizing: border-box; min-width: 0; min-height: 0; padding: clamp(24px, 8vh, 96px) 48px 24px; overflow: auto; scrollbar-width: none; }
/* 极矮窗口或软键盘弹出时仍可滚动访问表单，但不显示滚动条。 */
.signin-panel::-webkit-scrollbar { display: none; }
.signin-content { width: 100%; max-width: 464px; flex-shrink: 0; }
.login-footer { flex-shrink: 0; margin-top: auto; padding-top: 24px; text-align: center; color: var(--el-text-color-secondary); font-size: 12px; line-height: 20px; }
@media (max-width: 1100px) {
  .brand { padding-left: 8%; padding-right: 8%; }
  .brand-name { font-size: 21px; }
  .welcome-copy { margin-left: 8%; margin-right: 8%; }
  .signin-panel { padding-left: 32px; padding-right: 32px; }
}
@media (min-width: 801px) and (max-height: 800px) {
  .brand { padding-top: 32px; }
  .welcome-copy { margin-top: 58px; }
  .signin-panel { padding-top: 32px; }
}
@media (max-width: 800px) {
  .login-page { display: flex; flex-direction: column; }
  .welcome-panel { flex-shrink: 0; background: var(--el-bg-color); }
  .workspace-art, .welcome-copy, .welcome-panel::after { display: none; }
  .brand { padding: 24px 28px 0; }
  .brand-name { color: var(--el-text-color-primary); font-size: 21px; }
  .brand-caption { font-size: 13px; }
  .signin-panel { flex: 1; padding: 24px 28px 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .login-page :deep(*) { transition: none !important; }
  .tenant-loading-spinner { animation: none; }
}
</style>
