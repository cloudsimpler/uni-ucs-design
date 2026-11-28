import { computed, ref, watch } from 'vue';
import manifest from '@/manifest.json';
import { resolveFileUrl } from './storage.js';

const defaultLogo = '/uni_modules/ucs-design-admin/static/logo.svg';

export function useTenantBrand(getTenant) {
	const name = computed(() => getTenant()?.system_name || manifest.name);
	const logo = ref(defaultLogo);
	const logoLoading = ref(false);
	watch(() => getTenant()?.system_logo, async (file, _previous, onCleanup) => {
		logo.value = defaultLogo;
		logoLoading.value = Boolean(file);
		if (!file) return;
		let active = true;
		onCleanup(() => { active = false; });
		try {
			const url = await resolveFileUrl(file, uniCloud);
			if (active) logo.value = url;
		} catch {
			// The default logo remains visible if cloud storage is unavailable.
		} finally {
			if (active) logoLoading.value = false;
		}
	}, { immediate: true });
	const resetLogo = () => { logo.value = defaultLogo; };
	return { name, logo, logoLoading, resetLogo };
}
