export const loginPath = '/uni_modules/ucs-design-admin/pages/login/login';
const storageKey = 'ucs-admin-login-tenant-no';

export const isTenantNo = value => typeof value === 'string' && /^\d{5}$/.test(value);

export function rememberLoginTenant(tenantNo) {
	if (isTenantNo(tenantNo)) uni.setStorageSync(storageKey, tenantNo);
	else uni.removeStorageSync(storageKey);
}

export function getLoginTenantNo() {
	const tenantNo = uni.getStorageSync(storageKey);
	return isTenantNo(tenantNo) ? tenantNo : '';
}

export function getLoginRedirectUrl(route = '') {
	const tenantNo = getLoginTenantNo();
	const query = [];
	if (tenantNo) query.push(`tenant_no=${tenantNo}`);
	if (route) query.push('uniIdRedirectUrl=' + encodeURIComponent('/' + route.replace(/^\//, '')));
	return query.length ? `${loginPath}?${query.join('&')}` : loginPath;
}
