import store from './store.js';

export const tenantListRoute = '/uni_modules/ucs-design-admin/pages/platform/tenant/tenant';
export const systemUserRoute = '/uni_modules/ucs-design-admin/pages/system/user/user';
const storageKey = 'ucs-admin-delegation';
let expirationTimer;
const activeToken = (session) => session?.userDelegationToken || session?.delegationToken;

function restoreScope(session, code) {
	if (!session || activeToken(store.delegation) !== activeToken(session)) return;
	const parent = session.parent;
	const leaveTenant = code === 'TENANT_SESSION_INVALID' || !session.userDelegationToken ||
		Boolean(parent && parent.tokenExpired <= Date.now());
	setDelegation(leaveTenant ? null : parent || null);
	uni.redirectTo({ url: leaveTenant ? tenantListRoute : systemUserRoute });
}

function watchExpiration(session) {
	clearTimeout(expirationTimer);
	if (activeToken(session)) {
		const expiresAt = Math.min(session.tokenExpired, session.parent?.tokenExpired ?? Infinity);
		expirationTimer = setTimeout(() => restoreScope(session), Math.max(0, expiresAt - Date.now()));
	}
}

try {
	const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
	if (saved?.uid && saved.uid === uniCloud.getCurrentUserInfo().uid && activeToken(saved.delegation)) {
		store.delegation = saved.delegation;
		watchExpiration(saved.delegation);
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
				if (delegation && Math.min(delegation.tokenExpired, delegation.parent?.tokenExpired ?? Infinity) <= Date.now()) {
					const errCode = delegation.userDelegationToken && (!delegation.parent || delegation.parent.tokenExpired > Date.now())
						? 'USER_DELEGATION_INVALID' : 'TENANT_SESSION_INVALID';
					restoreScope(delegation, errCode);
					throw { errCode, errMsg: '代管已到期，请重新进入' };
				}
				const userToken = delegation?.userDelegationToken;
				const credential = userToken ? {
					userDelegationToken: userToken,
					tenantDelegationToken: delegation.parent?.delegationToken
				} : delegation?.delegationToken;
				let result;
				try {
					result = await (credential ? target[key](params, credential) : target[key](params));
				} catch (error) {
					if (['USER_DELEGATION_INVALID', 'TENANT_SESSION_INVALID'].includes(error?.errCode)) restoreScope(delegation, error.errCode);
					throw error;
				}
				if (['USER_DELEGATION_INVALID', 'TENANT_SESSION_INVALID'].includes(result.errCode)) {
					restoreScope(delegation, result.errCode);
				} else if (activeToken(store.delegation) === activeToken(delegation)) {
					if (userToken && (result.newUserDelegation || result.newDelegation)) {
						const current = store.delegation;
						const parentRenewal = result.newDelegation;
						const parent = parentRenewal && parentRenewal.tokenExpired >= (current.parent?.tokenExpired ?? 0)
							? { ...current.parent, ...parentRenewal }
							: current.parent;
						setDelegation({ ...current, ...result.newUserDelegation, parent });
					} else if (!userToken && result.newDelegation) {
						setDelegation({ ...delegation, ...result.newDelegation });
					}
				}
				return result;
			};
		}
	});
}

export function setDelegation(delegation) {
	store.delegation = delegation;
	store.menuVersion++;
	watchExpiration(delegation);
	try {
		if (activeToken(delegation)) sessionStorage.setItem(storageKey, JSON.stringify({ uid: uniCloud.getCurrentUserInfo().uid, delegation }));
		else sessionStorage.removeItem(storageKey);
	} catch {
		// The current page can still use the in-memory credential.
	}
}

export async function exitDelegation() {
	const delegation = store.delegation;
	if (!delegation) return;
	const api = uniCloud.importObject('uni-id-co', { customUI: true });
	if (delegation.userDelegationToken) {
		try {
			const result = await api.exitUserManagement({ userDelegationToken: delegation.userDelegationToken });
			if (result.errCode) throw result;
		} finally {
			const current = store.delegation;
			restoreScope(delegation.userDelegationId && current?.userDelegationId === delegation.userDelegationId
				? current : delegation);
		}
		return;
	}
	setDelegation(null);
	try {
		const result = await api.exitTenantManagement({ delegationToken: delegation.delegationToken });
		if (result.errCode) throw result;
	} finally {
		uni.redirectTo({ url: tenantListRoute });
	}
}
