import { shallowRef } from 'vue';
import { OfficeBuilding, Folder, Collection, Document, House, HomeFilled, User, UserFilled, Avatar, Setting, Menu, Grid, Monitor, Cpu, Lock } from '@element-plus/icons-vue';

export const availableIcons = shallowRef({ OfficeBuilding, Folder, Collection, Document, House, HomeFilled, User, UserFilled, Avatar, Setting, Menu, Grid, Monitor, Cpu, Lock });
let request;
export function loadIcons() {
	if (!request) request = import('./icon-catalog.js').then(module => {
		availableIcons.value = module.default;
		return module.default;
	}).catch(error => {
		request = undefined;
		throw error;
	});
	return request;
}
