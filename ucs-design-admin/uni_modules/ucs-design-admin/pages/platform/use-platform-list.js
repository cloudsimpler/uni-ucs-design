import { computed, ref, watch } from 'vue';

export function usePlatformList(rows, matches) {
	const keyword = ref('');
	const appliedKeyword = ref('');
	const current = ref(1);
	const size = ref(20);
	const filtered = computed(() => rows.value.filter(row => matches(row, appliedKeyword.value)));
	const pagination = computed(() => ({ current: current.value, size: size.value, count: filtered.value.length }));
	const pageRows = computed(() => filtered.value.slice((current.value - 1) * size.value, current.value * size.value));

	function search() {
		appliedKeyword.value = keyword.value.trim().toLowerCase();
		current.value = 1;
	}

	function reset() {
		keyword.value = '';
		search();
	}

	function changePage(options) {
		current.value = options.current;
		size.value = options.size;
	}

	watch(() => filtered.value.length, count => {
		current.value = Math.min(current.value, Math.max(1, Math.ceil(count / size.value)));
	});

	return { keyword, pagination, pageRows, search, reset, changePage };
}
