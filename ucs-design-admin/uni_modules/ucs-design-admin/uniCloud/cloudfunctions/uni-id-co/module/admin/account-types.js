// Identity v2: migration is required before deploying against an existing space.
const ACCOUNT_TYPE = Object.freeze({ SYSTEM: 0, COMMUNITY: 1, DEVELOPER: 0, EMPLOYEE: 0, CLIENT: 1 });
const customerMethods = new Set(['listCustomers', 'getCustomerOptions', 'getCustomerDetail', 'updateCustomer', 'setCustomerStatus']);
const managementType = context => customerMethods.has(context.getMethodName?.()) ? ACCOUNT_TYPE.COMMUNITY : ACCOUNT_TYPE.SYSTEM;
// Missing types retain historical system-user behavior. Old 1/2 values must be migrated offline.
const accountTypeOf = (user = {}) => [...new Set(Array.isArray(user.account_type) ? user.account_type : [user.account_type ?? 0])].filter(type => [0, 1].includes(type)).sort();
const hasAccountType = (user, type) => accountTypeOf(user).includes(type);
const hasManagementIdentity = user => hasAccountType(user, ACCOUNT_TYPE.SYSTEM);
const sameAccountTypes = (left, right) => JSON.stringify(accountTypeOf({ account_type: left })) === JSON.stringify(accountTypeOf({ account_type: right }));
module.exports = { ACCOUNT_TYPE, managementType, accountTypeOf, hasAccountType, hasManagementIdentity, sameAccountTypes };
