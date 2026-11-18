export const MENU_TYPE = Object.freeze({ DIRECTORY: 0, PAGE: 1 });
export const MENU_CLIENT_OPTIONS = Object.freeze([
	{ text: 'PC端', value: 'pc' },
	{ text: 'App端', value: 'app' }
]);
export const menuClients = (row) =>
	row.client_type === undefined ? ['pc'] : Array.isArray(row.client_type) ? row.client_type : [];
export const MENU_TYPE_OPTIONS = Object.freeze([
	{ text: '目录', value: MENU_TYPE.DIRECTORY },
	{ text: '页面', value: MENU_TYPE.PAGE }
]);

export function menuTree(rows) {
	const nodes = new Map(rows.map((row) => [row.menu_id, { ...row, children: [] }]));
	const roots = [];
	for (const row of rows) {
		const node = nodes.get(row.menu_id);
		const seen = new Set([row.menu_id]);
		let parent = row.parent_id;
		while (parent) {
			if (seen.has(parent) || !nodes.has(parent)) {
				node.parentError = true;
				break;
			}
			seen.add(parent);
			parent = nodes.get(parent).parent_id;
		}
		if (!row.parent_id || node.parentError) roots.push(node);
		else nodes.get(row.parent_id).children.push(node);
	}
	const sort = (items) =>
		items
			.sort((a, b) => (a.sort || 0) - (b.sort || 0) || a.menu_id.localeCompare(b.menu_id))
			.map((node) => ({ ...node, children: sort(node.children) }));
	return sort(roots);
}
export function filterTree(tree, keyword = '', enable = '') {
	const text = keyword.trim().toLowerCase();
	return tree.flatMap((row) => {
		const children = filterTree(row.children || [], keyword, enable);
		const matches =
			(!text ||
				[row.name, row.menu_id].some((value) => (value || '').toLowerCase().includes(text))) &&
			(enable === '' || (row.enable !== false) === enable);
		return matches || children.length ? [{ ...row, children }] : [];
	});
}
export function descendantIds(rows, id) {
	const ids = new Set(id ? [id] : []);
	let size;
	do {
		size = ids.size;
		rows.forEach((row) => {
			if (ids.has(row.parent_id)) ids.add(row.menu_id);
		});
	} while (size !== ids.size);
	return ids;
}
