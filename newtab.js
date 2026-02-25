if (localStorage.getItem('cooltab_changelog_read_status') === null) { localStorage.setItem('cooltab_changelog_read_status', 'n'); }
if (localStorage.getItem('cooltab_changelog_read_status') === 'n') {
    const dialog = document.getElementById('changelog');
    dialog.showModal();
}
function hideChangelog() {
    const dialog = document.getElementById('changelog');
    dialog.close();
    localStorage.setItem('cooltab_changelog_read_status', 'y');
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
updateTime();
setInterval(updateTime, 100);
const search = document.getElementById('search');
const searchBar = document.querySelector('.search_bar');
const suggestionsContainer = document.getElementById('suggestions');
let debounceTimeout;
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
const apps = {
    './img/gmail.png': 'https://mail.google.com/',
    './img/github.svg': 'https://github.com',
    './img/figma.png': 'https://figma.com',
    './img/docs.png': 'https://docs.google.com/document/u/0/',
    './img/drive.png': 'https://drive.google.com/',
    './img/slides.png': 'https://docs.google.com/presentation/u/0/',
    './img/forms.png': 'https://forms.google.com/',
    './img/sites.png': 'https://sites.google.com',
    './img/sheets.png': 'https://docs.google.com/spreadsheets/u/0/',
    './img/earth.png': 'https://earth.google.com/web/',
    './img/maps.png': 'https://google.com/maps/',
    './img/tinkercad.png': 'https://tinkercad.com/',
    './img/copilot.png': 'https://copilot.microsoft.com/',
    './img/gemini.png': 'https://gemini.google.com/',
    './img/claude.svg': 'https://claude.ai'
};
localStorage.setItem('cooltab_apps', JSON.stringify(apps));
function loadApps() {
    const grid = document.querySelector('.apps_grid');
    const apps = JSON.parse(localStorage.getItem('cooltab_apps'));
    for (const icon in apps) {
        const link = document.createElement('a');
        link.href = apps[icon];
        const img = document.createElement('img');
        img.src = icon;
        link.appendChild(img);
        grid.appendChild(link);
    }
}
const app_button = document.getElementById('app_button');
const apps_dialog = document.getElementById('apps');
function showApps() { apps_dialog.setAttribute('open', ''); }
function hideApps() { apps_dialog.removeAttribute('open'); }
app_button.addEventListener('click', showApps);
window.addEventListener('click', (e) => {
    if (!apps_dialog.contains(e.target) && e.target !== app_button) {
        hideApps();
    }
});
function updateBg() {
    const stored = localStorage.getItem('cooltab_background');
    const body = document.querySelector('body');
    const bgUrl = stored ? stored : './taptappingu.gif';
    body.style.backgroundImage = `url(${bgUrl})`;
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundSize = 'cover';
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundPosition = 'center';
}
updateBg();
loadApps();