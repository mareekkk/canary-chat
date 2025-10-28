(() => {
	if (typeof window === 'undefined') {
		return;
	}

	const applyBranding = () => {
		if (typeof window.__applyCanaryBranding === 'function') {
			window.__applyCanaryBranding();
		}
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', applyBranding, { once: true });
	} else {
		applyBranding();
	}
})();
