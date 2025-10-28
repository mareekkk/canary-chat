(() => {
	const BRAND_LOGO_PATH = '/canary-logo.png';
	const BRAND_TEXT_SOURCE = 'Open WebUI';
	const BRAND_TEXT_TARGET = 'Canary Builds';
	const BRAND_TEXT_REGEX = new RegExp(BRAND_TEXT_SOURCE, 'g');
	const SKIP_TEXT_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE']);

	const LOGO_SELECTORS = ['img#logo', 'img#logo-her', 'img[alt="logo"]'];
	const ATTRIBUTE_TARGETS = [
		'title',
		'aria-label',
		'aria-description',
		'aria-labelledby',
		'alt',
		'placeholder',
		'content',
		'data-title',
		'data-tooltip'
	];

	const updateImage = (img) => {
		if (!img || img.dataset.canaryLogoApplied === 'true') {
			return;
		}

		img.dataset.originalSrc = img.dataset.originalSrc || img.src;
		img.dataset.canaryLogoApplied = 'true';
		img.removeAttribute('srcset');
		img.src = BRAND_LOGO_PATH;
		img.setAttribute('data-canary-logo', 'true');

		if (!img.alt || img.alt === 'logo' || img.alt.includes(BRAND_TEXT_SOURCE)) {
			img.alt = BRAND_TEXT_TARGET;
		}

		if (img.classList.contains('dark:invert')) {
			img.classList.remove('dark:invert');
		}
		if (img.style?.filter) {
			img.style.filter = '';
		}
	};

	const updateAllLogos = () => {
		const selectors = [
			...LOGO_SELECTORS,
			'img[src$="splash.png"]',
			'img[src$="splash-dark.png"]',
			'img[src$="favicon.png"]',
			'img[src$="favicon-dark.png"]',
			'img[src$="logo.png"]'
		];

		document.querySelectorAll(selectors.join(',')).forEach(updateImage);
	};

	const replaceTextNodes = (root = document.body) => {
		if (!root) return;

		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		let node;

		while ((node = walker.nextNode())) {
			if (!node.nodeValue || !node.nodeValue.includes(BRAND_TEXT_SOURCE)) continue;

			const parentName = node.parentNode?.nodeName;
			if (parentName && SKIP_TEXT_TAGS.has(parentName)) continue;

			node.nodeValue = node.nodeValue.replace(BRAND_TEXT_REGEX, BRAND_TEXT_TARGET);
		}
	};

	const replaceAttributeBranding = () => {
		const selector = ATTRIBUTE_TARGETS.map((attr) => `[${attr}*="${BRAND_TEXT_SOURCE}"]`).join(',');
		if (!selector) return;

		document.querySelectorAll(selector).forEach((el) => {
			ATTRIBUTE_TARGETS.forEach((attr) => {
				const value = el.getAttribute?.(attr);
				if (typeof value === 'string' && value.includes(BRAND_TEXT_SOURCE)) {
					el.setAttribute(attr, value.replace(BRAND_TEXT_REGEX, BRAND_TEXT_TARGET));
				}
			});
		});
	};

	const replaceDocumentBranding = () => {
		if (document.title && document.title.includes(BRAND_TEXT_SOURCE)) {
			document.title = document.title.replace(BRAND_TEXT_REGEX, BRAND_TEXT_TARGET);
		}

		document
			.querySelectorAll('meta[name="application-name"], meta[name="apple-mobile-web-app-title"]')
			.forEach((meta) => {
				const content = meta.getAttribute('content');
				if (typeof content === 'string' && content.includes(BRAND_TEXT_SOURCE)) {
					meta.setAttribute('content', content.replace(BRAND_TEXT_REGEX, BRAND_TEXT_TARGET));
				}
			});

		document
			.querySelectorAll('meta[property="og:title"], meta[property="og:site_name"], meta[name="description"]')
			.forEach((meta) => {
				const content = meta.getAttribute('content');
				if (typeof content === 'string' && content.includes(BRAND_TEXT_SOURCE)) {
					meta.setAttribute('content', content.replace(BRAND_TEXT_REGEX, BRAND_TEXT_TARGET));
				}
			});
	};

	const applyBranding = () => {
		updateAllLogos();
		replaceTextNodes();
		replaceAttributeBranding();
		replaceDocumentBranding();
	};

	window.__applyCanaryBranding = applyBranding;

	const initBranding = () => {
		applyBranding();

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === 'childList' || mutation.type === 'characterData') {
					applyBranding();
					return;
				}

				if (
					mutation.type === 'attributes' &&
					ATTRIBUTE_TARGETS.includes(mutation.attributeName || '')
				) {
					applyBranding();
					return;
				}
			}
		});

		if (document.body) {
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				characterData: true,
				attributes: true,
				attributeFilter: ATTRIBUTE_TARGETS
			});
		} else {
			observer.observe(document.documentElement, {
				childList: true,
				subtree: true,
				characterData: true
			});
		}

		window.__canaryBrandingObserver = observer;
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initBranding);
	} else {
		initBranding();
	}
})();
