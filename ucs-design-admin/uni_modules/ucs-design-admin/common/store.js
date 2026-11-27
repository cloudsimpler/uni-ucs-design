// 共享数据存储
import {
	reactive
} from "vue";
let store = reactive({
	// 是否登录
	isLogin: false,
	// 收缩左侧菜单
	isCollapsed: false,
	menuVersion: 0,
	delegation: null,
	userInfoVersion: 0,
	// 面包屑菜单
	breadcrumbMenu: []
});

export function currentDelegationId() {
	return store.delegation?.userDelegationId || store.delegation?.sessionId || '';
}

export default store;
