import store from './store.js';
import { withSessionHandling } from './session-errors.js';
import { importTenantAdmin } from './tenant-session.js';

let cachedKey = '', cachedRequest;
// Share a single request between the sidebar and page layouts; never persist authorization locally.
export function loadNavigation(force = false) {
	const uid = uniCloud.getCurrentUserInfo().uid;
	if (!uid) {
		cachedKey = '';
		cachedRequest = undefined;
		return withSessionHandling(() => Promise.reject({ errCode: 'uni-id-check-token-failed' }));
	}
	const key = `${uid}:${uni.getStorageSync('uni_id_token')}:${store.menuVersion}`;
	if (force || key !== cachedKey || !cachedRequest) {
		cachedKey = key;
		const request = withSessionHandling(async () => {
            const api = importTenantAdmin();
            const result = await api.getCurrentMenus({ client_type: 'pc' });
            const containsMenu = (rows, id, name) => (rows || []).some(row =>
                (row.menu_id === id && (name === undefined || row.name === name)) || containsMenu(row.children, id, name));
            let changed = false;
            if (!result.errCode && result.isAdmin) {
                const operations = result.data.find(row => row.menu_id === 'platform');
                const installs = [
                    [!containsMenu(result.data, 'platform_tenants') || operations?.name === '租户运营' ||
                        containsMenu(result.data, 'platform_product_packages', '产品包管理') ||
                        !containsMenu(result.data, 'platform_menus'), 'installTenantManagement'],
                    [!containsMenu(result.data, 'platform_dictionaries'), 'installDictionaryManagement'],
                    [!containsMenu(result.data, 'system_departments'), 'installDepartmentManagement']
                ];
                for (const [needed, method] of installs) {
                    if (!needed) continue;
                    try { const installed = await api[method](); if (!installed.errCode && installed.changed) changed = true; }
                    catch (error) { console.error('管理菜单安装失败，请更新 uni-id-co 后重试', error); }
                }
                if (changed) return await api.getCurrentMenus({ client_type: 'pc' });
            }
            return result;
        });
		cachedRequest = request;
		request.catch(() => { if (cachedRequest === request) cachedRequest = undefined; });
	}
	return cachedRequest;
}

export function normalizeMenuRoute(url = '', home = '') {
	const path = '/' + url.replace(/^\//, '').split(/[?#]/)[0];
	return path === '/' ? '/' + home.replace(/^\//, '') : path;
}

export function allowedMenuRoutes(tree, home) {
	return tree.flatMap(item => item.menu_type === 1 && item.url
		? [normalizeMenuRoute(item.url, home)] : allowedMenuRoutes(item.children || [], home));
}
