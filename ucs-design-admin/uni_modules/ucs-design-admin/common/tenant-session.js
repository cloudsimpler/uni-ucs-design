import store from './store.js';

export const tenantListRoute = '/uni_modules/ucs-design-admin/pages/platform/tenant/tenant';
const storageKey = 'ucs-admin-delegation';

try {
	const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
	if (saved?.uid && saved.uid === uniCloud.getCurrentUserInfo().uid && saved.delegation?.delegationToken) {
		store.delegation = saved.delegation;
	}
} catch {
	// Session storage can be unavailable in this runtime.
}

export function importTenantAdmin() {
	const api = uniCloud.importObject('uni-id-co', { customUI: true });
	return new Proxy(api, {
		get(target, key) {
			return async (params = {}) => {
				const delegation = store.delegation;
				const credential = delegation?.delegationToken;
				const result = await (credential ? target[key](params, credential) : target[key](params));
				if (result.newDelegation && store.delegation?.delegationToken === credential) {
					setDelegation({ ...delegation, ...result.newDelegation });
				}
				return result;
			};
		}
	});
}

export function setDelegation(delegation) {
	store.delegation = delegation;
	store.menuVersion++;
	try {
		if (delegation?.delegationToken) sessionStorage.setItem(storageKey, JSON.stringify({ uid: uniCloud.getCurrentUserInfo().uid, delegation }));
		else sessionStorage.removeItem(storageKey);
	} catch {
		// The current page can still use the in-memory credential.
	}
}

export async function exitDelegation() {
	const delegation = store.delegation;
	if (!delegation) return;
	const api = uniCloud.importObject('uni-id-co', { customUI: true });
	setDelegation(null);
	try {
		const result = await api.exitTenantManagement({ delegationToken: delegation.delegationToken });
		if (result.errCode) throw result;
	} finally {
		uni.redirectTo({ url: tenantListRoute });
	}
}
