document.addEventListener('DOMContentLoaded', () => {
	const fileInput = document.getElementById('fileUpload');
	const preview = document.getElementById('previewImage');
	const storageKey = 'cooltab_background';
	try {
		const stored = localStorage.getItem(storageKey);
		if (stored) preview.src = stored;
	} catch (e) {
		console.warn('Failed to read from localStorage', e);
	}
	if (!fileInput) return;
	fileInput.addEventListener('change', (evt) => {
		const file = evt.target.files && evt.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result;
			if (preview && dataUrl) preview.src = dataUrl;
			try {
				localStorage.setItem(storageKey, dataUrl);
			} catch (e) {
				console.warn('Failed to save to localStorage', e);
			}
		};
		reader.readAsDataURL(file);
	});
});