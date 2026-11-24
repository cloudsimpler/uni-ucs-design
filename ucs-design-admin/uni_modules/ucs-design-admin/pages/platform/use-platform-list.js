import { reactive, ref } from 'vue';

export function usePlatformList(request) {
	const rows = ref([]);
	const auth = ref({});
	const keyword = ref('');
	const loading = ref(false);
	const error = ref('');
	const pagination = reactive({ current: 1, size: 20, count: 0 });
	let appliedKeyword = '';
	let requestId = 0;

	async function load({ current = pagination.current, size = pagination.size } = {}) {
		const id = ++requestId;
		loading.value = true;
		error.value = '';
		try {
			const result = await request({ keyword: appliedKeyword, current, size });
			if (id !== requestId) return;
			if (result.errCode) throw result;
			rows.value = result.data;
			auth.value = result.auth;
			Object.assign(pagination, result.pagination);
		} catch (e) {
			if (id === requestId) error.value = e?.errMsg || e?.message || '加载失败，请重试';
		} finally {
			if (id === requestId) loading.value = false;
		}
	}

	function search() {
		appliedKeyword = keyword.value.trim();
		return load({ current: 1 });
	}

	function reset() {
		keyword.value = '';
		return search();
	}

	return { rows, auth, keyword, loading, error, pagination, load, search, reset, changePage: load };
}
