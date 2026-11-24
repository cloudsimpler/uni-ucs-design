const ACCOUNT_TYPE = Object.freeze({ SYSTEM: 0, COMMUNITY: 1, DEVELOPER: 0, EMPLOYEE: 0, CLIENT: 1 });
const customerMethods = new Set(['listCustomers', 'getCustomerOptions', 'getCustomerDetail', 'updateCustomer', 'setCustomerStatus']);
const managementType = context => customerMethods.has(context.getMethodName?.()) ? ACCOUNT_TYPE.COMMUNITY : ACCOUNT_TYPE.SYSTEM;
const accountTypeOf = user => user?.account_type;
const hasAccountType = (user, type) => accountTypeOf(user) === type;
const hasManagementIdentity = user => hasAccountType(user, ACCOUNT_TYPE.SYSTEM);
module.exports = { ACCOUNT_TYPE, managementType, accountTypeOf, hasAccountType, hasManagementIdentity };
