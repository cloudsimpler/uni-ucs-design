import { onScopeDispose, watch } from 'vue';

export const defaultTenantThemeColor = '#409EFF';
export const tenantThemeOptions = [
	{ value: '#F53F3F', label: '浪漫红' },
	{ value: '#F77234', label: '晚秋红' },
	{ value: '#FF7D00', label: '活力橙' },
	{ value: '#F7BA1E', label: '黄昏' },
	{ value: '#FADC19', label: '柠檬黄' },
	{ value: '#9FDB1D', label: '新生绿' },
	{ value: '#00B42A', label: '仙野绿' },
	{ value: '#14C9C9', label: '碧涛青' },
	{ value: '#3491FA', label: '海蔚蓝' },
	{ value: '#165DFF', label: '极致蓝' },
	{ value: '#722ED1', label: '暗夜紫' },
	{ value: '#D91AD9', label: '青春紫' },
	{ value: '#F5319D', label: '品红' }
];

const lightLevels = Array.from({ length: 9 }, (_, index) => index + 1);
const primary = '--el-color-primary';
const themeProperties = [
	primary, `${primary}-rgb`, ...lightLevels.map(level => `${primary}-light-${level}`), `${primary}-dark-2`
];
let activeOwner;
let activeColor;

export function normalizeTenantThemeColor(value) {
	return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : '';
}

function rgb(hex) {
	return [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function mix(channels, target, level) {
	const weight = level / 10;
	return '#' + channels.map((value, index) =>
		Math.round(target[index] * weight + value * (1 - weight)).toString(16).padStart(2, '0')
	).join('');
}

export function refreshTenantTheme() {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	const color = activeColor;
	if (!color) {
		themeProperties.forEach(property => root.style.removeProperty(property));
		return;
	}

	// Theme Chalk mixes in tenths and rounds each RGB channel.
	const dark = root.classList.contains('dark');
	const channels = rgb(color);
	const lightTarget = rgb(dark ? '#141414' : '#ffffff');
	root.style.setProperty(primary, color);
	root.style.setProperty(`${primary}-rgb`, channels.join(', '));
	lightLevels.forEach(level => root.style.setProperty(`${primary}-light-${level}`, mix(channels, lightTarget, level)));
	root.style.setProperty(`${primary}-dark-2`, mix(channels, rgb(dark ? '#ffffff' : '#000000'), 2));
}

export function holdLoginTenantTheme(value) {
	const color = normalizeTenantThemeColor(value);
	if (!color) return;
	// Keep the login color until the authenticated header claims the theme.
	activeOwner = undefined;
	activeColor = color;
	refreshTenantTheme();
}

export function useTenantTheme(getColor) {
	const owner = Symbol();
	const release = () => {
		if (activeOwner !== owner) return;
		activeOwner = undefined;
		activeColor = undefined;
		refreshTenantTheme();
	};
	watch(getColor, color => {
		if (color === undefined) return release();
		activeOwner = owner;
		activeColor = normalizeTenantThemeColor(color);
		refreshTenantTheme();
	}, { immediate: true, flush: 'sync' });
	onScopeDispose(release);
}
