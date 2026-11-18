import { ElMessage } from 'element-plus';
import 'element-plus/es/components/message/style/css.mjs';
import store from './store.js';

const loginPath = '/uni_modules/ucs-design-admin/pages/login/login';
const expiredCodes = new Set(['uni-id-token-expired', 'uni-id-check-token-failed', 'USER_ADMIN_UNAUTHORIZED', 'ADMIN_ACCESS_UNAUTHORIZED']);
const accountForbiddenCodes = new Set(['USER_ADMIN_FORBIDDEN', 'ADMIN_ACCESS_FORBIDDEN', 'MENU_ADMIN_FORBIDDEN']);
const accountForbiddenMessage = '当前账号已停用或无权登录此应用';
let redirecting = false;

export function describeRequestError(error, fallback = '加载失败，请重试') {
    const code = error?.errCode || error?.code || '';
    if (expiredCodes.has(code)) return { kind: 'session', message: '登录已失效，请重新登录' };
    if (accountForbiddenCodes.has(code) && error?.errMsg === accountForbiddenMessage)
        return { kind: 'account', message: accountForbiddenMessage };
    const kind = /_FORBIDDEN$/.test(code) || code === 'uni-id-permission-denied' ? 'permission' : 'request';
    const message = error?.errMsg || error?.message;
    return { kind, message: typeof message === 'string' && message.trim() ? message.slice(0, 300) : fallback };
}

function leaveAdmin(requestToken, kind) {
    // A delayed failure from an old session must never clear a newly issued token.
    if (requestToken !== (uni.getStorageSync('uni_id_token') || '') || redirecting) return;
    const pages = getCurrentPages();
    const route = pages[pages.length - 1]?.route || '';
    if ('/' + route.replace(/^\//, '') === loginPath) return;
    redirecting = true;
    uni.removeStorageSync('uni_id_token');
    uni.removeStorageSync('uni_id_token_expired');
    store.isLogin = false;
    store.breadcrumbMenu = [];
    store.menuVersion++;
    store.userInfoVersion++;
    if (requestToken && kind === 'session') ElMessage.warning('登录已失效，请重新登录');
    uni.reLaunch({
        url: kind === 'account'
            ? loginPath
            : loginPath + (route ? '?uniIdRedirectUrl=' + encodeURIComponent('/' + route.replace(/^\//, '')) : ''),
        fail: () => ElMessage.error('返回登录页失败，请刷新页面后重新登录'),
        complete: () => { redirecting = false; }
    });
}

// Handle session failures and account-level admin access denial; cloud token validation remains unchanged.
export async function withSessionHandling(request) {
    const requestToken = uni.getStorageSync('uni_id_token') || '';
    try {
        const result = await request();
        if (result?.errCode) throw result;
        return result;
    } catch (error) {
        const { kind } = describeRequestError(error);
        if (kind === 'session' || kind === 'account') leaveAdmin(requestToken, kind);
        throw error;
    }
}
