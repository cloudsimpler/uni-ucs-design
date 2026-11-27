import { computed, ref, watch } from 'vue';
import manifest from '@/manifest.json';
import { resolveFileUrl } from './storage.js';

const defaultLogo = '/uni_modules/ucs-design-admin/static/logo.svg';

export function useTenantBrand(getTenant) {
	const name = computed(() => getTenant()?.system_name || manifest.name);
	const logo = ref(defaultLogo);
	watch(() => getTenant()?.system_logo, async (file, _previous, onCleanup) => {
		logo.value = defaultLogo;
		if (!file) return;
		let active = true;
		onCleanup(() => { active = false; });
		try {
			const url = await resolveFileUrl(file, uniCloud);
			if (active) logo.value = url;
		} catch {
			// The default logo remains visible if cloud storage is unavailable.
		}
	}, { immediate: true });
	const resetLogo = () => { logo.value = defaultLogo; };
	return { name, logo, resetLogo };
}
