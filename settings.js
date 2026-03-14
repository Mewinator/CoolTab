document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileUpload');
    const preview = document.getElementById('previewImage');
    let currentPreviewUrl = null;
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
        let name = await Storage.get('cooltab_background_name');
        document.getElementById('imgText').textContent = name || 'taptappingu.gif';
    } catch (e) {
        console.warn('Failed to read background from storage', e);
    }
    if (fileInput) {
        fileInput.addEventListener('change', async (evt) => {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;
            if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
            currentPreviewUrl = URL.createObjectURL(file);
            if (preview) preview.src = currentPreviewUrl;
            try {
                await Storage.set('cooltab_background', file);
                await Storage.set('cooltab_background_name', file.name);
            } catch (e) {
                console.warn('Failed to save background to storage', e);
            }
        });
    }
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
async function loadTheme() {
    const theme = await Storage.get('cooltab_theme');
    if (theme && typeof theme === 'object') {
        for (const [name, value] of Object.entries(theme)) {
            document.documentElement.style.setProperty(`--${name}`, value);
        }
    } else {
        await saveCurrentTheme();
    }
}
async function main() {
    await Storage.init();
    await loadTheme();
    await formatVariables();
}
async function formatVariables() {
    const theme = await Storage.get('cooltab_theme');
    let result = "";
    if (theme && typeof theme === 'object') {
        for (const [name, value] of Object.entries(theme)) {
            result += `
            <div class="var-line" data-name="${name}" data-value="${value}">
                <span class="var-name" style="color: #75b8ff;">${name}</span>
                <span class="colon">:</span>
                <span class="var-value" style="color: #6dfdba; cursor: pointer;">${value}</span>
            </div>`;
        }
    }
    const output = document.getElementById('themeOutput');
    if (output) {
        output.innerHTML = result;
        output.addEventListener('click', evt => {
            const line = evt.target.closest('.var-line');
            if (!line) return;
            showVarPanel(line.dataset.name, line.dataset.value);
        });
    }
}
async function saveCurrentTheme() {
    const theme = {};
    const declared = new Set();
    for (let sheet of document.styleSheets) {
        try {
            for (let rule of sheet.cssRules) {
                if (rule.selectorText === ':root') {
                    for (let i = 0; i < rule.style.length; i++) {
                        const prop = rule.style[i];
                        if (prop.startsWith('--')) {
                            const name = prop.slice(2);
                            declared.add(name);
                            theme[name] = rule.style.getPropertyValue(prop);
                        }
                    }
                }
            }
        } catch (e) {}
    }
    const rootStyle = getComputedStyle(document.documentElement);
    for (let prop of declared) {
        const value = rootStyle.getPropertyValue(`--${prop}`).trim();
        theme[prop] = value;
    }
    await Storage.set('cooltab_theme', theme);
}
function showVarPanel(name, value) {
    let panel = document.getElementById('varPanel');
    if (!panel) return;
    panel.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
            <strong>${name}</strong>
            <div class="color-swatch" style="width:24px;height:24px;background:${value};border:1px solid #ffffff;cursor:pointer;border-radius:4px;"></div>
            <span class="color-value" contenteditable="true" style="min-width:60px;outline:1px solid #75b8ff;padding:2px 4px;border-radius:4px;cursor:text;">${value}</span>
        </div>`;
    const swatch = panel.querySelector('.color-swatch');
    const valDisplay = panel.querySelector('.color-value');
    valDisplay.addEventListener('input', () => {
        const newVal = valDisplay.textContent.trim();
        swatch.style.background = newVal;
        document.documentElement.style.setProperty(`--${name}`, newVal);
    });
    valDisplay.addEventListener('blur', async () => {
        const newVal = valDisplay.textContent.trim();
        valDisplay.textContent = newVal;
        await saveCurrentTheme();
    });
}
document.addEventListener('DOMContentLoaded', () => {
    main().catch(err => console.error('error in main()', err));
});