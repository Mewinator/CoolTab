console.log('newtab.js loaded');

// global error handlers to catch issues preventing logs
window.addEventListener('error', e => console.error('window error', e.error || e.message || e));
window.addEventListener('unhandledrejection', e => console.error('unhandled promise rejection', e.reason));

async function initChangelog() {
    let status = await Storage.get('cooltab_changelog_read_status');
    if (status === null) {
        status = 'n';
        await Storage.set('cooltab_changelog_read_status', status);
    }
    if (status === 'n') {
        const dialog = document.getElementById('changelog');
        dialog.showModal();
    }
}
function hideChangelog() {
    const dialog = document.getElementById('changelog');
    dialog.close();
    Storage.set('cooltab_changelog_read_status', 'y');
} 
function updateTime() {
    const ampm = document.getElementById('ampm');
    const time = document.getElementById('hhmmss');
    const date = document.getElementById('date');
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    const ampmValue = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    time.textContent = hours + ':' + minutes + ':' + seconds;
    ampm.textContent = ampmValue;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    date.textContent = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
}
// DOM-dependent initialization inside DOMContentLoaded
let search, searchBar, suggestionsContainer, debounceTimeout;

function setupSearch() {
    search = document.getElementById('search');
    searchBar = document.querySelector('.search_bar');
    suggestionsContainer = document.getElementById('suggestions');
    if (!search) return;

    search.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        const query = search.value;
        if (query.length > 0) {
            searchBar.classList.add('active');
            suggestionsContainer.classList.add('active');
            debounceTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`https://api.suggestions.victr.me/?q=${encodeURIComponent(query)}&l=en&with=duckduckgo`);
                    const suggestions = await response.json();
                    suggestionsContainer.innerHTML = '';
                    suggestions.slice(0, 10).forEach(suggestion => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.classList.add('suggestion-item');
                        suggestionItem.textContent = suggestion.text;
                        suggestionItem.addEventListener('click', () => {
                            window.location.href = `https://duckduckgo.com/?q=${suggestion.text}`;
                        });
                        suggestionsContainer.appendChild(suggestionItem);
                    });
                } catch (error) {
                    console.error("Error fetching suggestions:", error);
                    suggestionsContainer.innerHTML = '<div class="suggestion-item">Error loading suggestions.</div>';
                }
            }, 300);
        } else {
            searchBar.classList.remove('active');
            suggestionsContainer.classList.remove('active');
        }
    });

    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const url = 'https://duckduckgo.com/search?q=';
            window.location.href = url + search.value;
        }
    });
}

const defaultApps = {
    'Gmail': { url: 'https://mail.google.com/', icon: './img/gmail.png' },
    'Github': { url: 'https://github.com', icon: './img/github.svg' },
    'Figma': { url: 'https://figma.com', icon: './img/figma.png' },
    'Docs': { url: 'https://docs.google.com/document/u/0/', icon: './img/docs.png' },
    'Drive': { url: 'https://drive.google.com/', icon: './img/drive.png' },
    'Slides': { url: 'https://docs.google.com/presentation/u/0/', icon: './img/slides.png' },
    'Forms': { url: 'https://forms.google.com/', icon: './img/forms.png' },
    'Sites': { url: 'https://sites.google.com', icon: './img/sites.png' },
    'Sheets': { url: 'https://docs.google.com/spreadsheets/u/0/', icon: './img/sheets.png' },
    'Earth': { url: 'https://earth.google.com/web/', icon: './img/earth.png' },
    'Maps': { url: 'https://google.com/maps/', icon: './img/maps.png' },
    'TinkerCAD': { url: 'https://tinkercad.com/', icon: './img/tinkercad.png' },
    'Copilot': { url: 'https://copilot.microsoft.com/', icon: './img/copilot.png' },
    'Gemini': { url: 'https://gemini.google.com/', icon: './img/gemini.png' },
    'Claude': { url: 'https://claude.ai', icon: './img/claude.svg' }
};
async function loadApps() {
    const grid = document.querySelector('.apps_grid');
    grid.innerHTML = '';
    let apps = await Storage.get('cooltab_apps');
    if (!apps) {
        apps = defaultApps;
        await Storage.set('cooltab_apps', apps);
    }
    for (const name in apps) {
        if (!Object.prototype.hasOwnProperty.call(apps, name)) continue;
        const app = apps[name];
        const link = document.createElement('a');
        link.href = app.url || '#';
        link.title = name;
        link.classList.add('app-link');
        const img = document.createElement('img');
        img.src = app.icon || '';
        img.alt = name;
        link.appendChild(img);
        const span = document.createElement('span');
        span.textContent = name;
        link.appendChild(span);
        grid.appendChild(link);
    }
}
function installAppHandlers() {
    const app_button = document.getElementById('app_button');
    const apps_dialog = document.getElementById('apps');
    if (!app_button || !apps_dialog) return;
    function showApps() { apps_dialog.setAttribute('open', ''); }
    function hideApps() { apps_dialog.removeAttribute('open'); }
    app_button.addEventListener('click', showApps);
    window.addEventListener('click', (e) => {
        if (!apps_dialog.contains(e.target) && e.target !== app_button) {
            hideApps();
        }
    });
}

let _currentBgUrl = null;
async function updateBg() {
    const stored = await Storage.get('cooltab_background');
    const body = document.querySelector('body');
    let bgUrl;
    if (stored instanceof Blob) {
        if (_currentBgUrl) URL.revokeObjectURL(_currentBgUrl);
        _currentBgUrl = URL.createObjectURL(stored);
        bgUrl = _currentBgUrl;
    } else {
        if (_currentBgUrl) {
            URL.revokeObjectURL(_currentBgUrl);
            _currentBgUrl = null;
        }
        bgUrl = stored ? stored : './taptappingu.gif';
    }
    body.style.setProperty('--bg-url', `url(${bgUrl})`);
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundSize = 'cover';
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundPosition = 'center';
}

async function main() {
    await Storage.init();
    await initChangelog();
    updateTime();
    setInterval(updateTime, 100);
    await updateBg();
    await loadApps();
    const bg_blendpx = await Storage.get('cooltab_bg_blendpx');
    console.log('bg_blendpx loaded from storage:', bg_blendpx);
    if (bg_blendpx === true || bg_blendpx === 'True' || bg_blendpx === 'true') {
        document.querySelector('body').style.imageRendering = 'pixelated';
        console.log('applied pixelated background');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    setupSearch();
    installAppHandlers();
    main().catch(err => console.error('error in main()', err));
});