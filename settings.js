document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileUpload');
    const preview = document.getElementById('previewImage');
    let currentPreviewUrl = null;

    // Load background from storage and display preview
    try {
        const stored = await Storage.get('cooltab_background');
        if (stored) {
            if (stored instanceof Blob) {
                if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
                currentPreviewUrl = URL.createObjectURL(stored);
                preview.src = currentPreviewUrl;
            } else {
                preview.src = stored;
            }
        }
    } catch (e) {
        console.warn('Failed to read background from storage', e);
    }

    // Handle file upload
    if (fileInput) {
        fileInput.addEventListener('change', async (evt) => {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;

            // Update preview with new file
            if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
            currentPreviewUrl = URL.createObjectURL(file);
            if (preview) preview.src = currentPreviewUrl;

            // Save file blob to storage
            try {
                await Storage.set('cooltab_background', file);
            } catch (e) {
                console.warn('Failed to save background to storage', e);
            }
        });
    }

    // Load and manage blend pixel checkbox
    const blendCheckbox = document.getElementById('blend_px');
    if (blendCheckbox) {
        const blendStored = await Storage.get('cooltab_bg_blendpx');
        blendCheckbox.checked = blendStored === true;

        blendCheckbox.addEventListener('change', async () => {
            try {
                await Storage.set('cooltab_bg_blendpx', blendCheckbox.checked);
            } catch (e) {
                console.warn('Failed to save blend setting', e);
            }
        });
    }
});
