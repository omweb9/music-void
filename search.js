// Void Music - search.js
// البحث: عن أغنية / فنان / ألبوم - باستخدام iTunes API المجاني

let searchResults = [];
let lastQuery = '';
let searchTimeout = null;

// 1) البحث الرئيسي - بتناديه من أي حتة في التطبيق
async function searchMusic(query) {
  query = (query || '').trim();
  if (!query) return;

  lastQuery = query;
  showSearchLoading(query);

  try {
    // iTunes Search API - مجاني ومن غير Key
    // بنبحث عن أغاني بس، 50 نتيجة
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=50&lang=ar`
    );
    const data = await res.json();
    searchResults = (data.results || []).filter(t => t.wrapperType === 'track');

    window.__lastResults = searchResults;
    window.__searchResults = searchResults;

    renderSearchResults(searchResults, query);
    hideSearchLoading();

  } catch (e) {
    hideSearchLoading();
    const box = document.querySelector('#results');
    if (box) box.innerHTML = '<p class="empty">حصل خطأ في الاتصال، جرب تاني 📶</p>';
  }
}

// 2) بحث وانت بتكتب - Debounce عشان منبعتش طلب كل حرف
function searchLive(value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (value.trim()) searchMusic(value);
  }, 500); // استنى نص ثانية بعد آخر حرف
}

// 3) رسم نتايج البحث
function renderSearchResults(list, query) {
  const box = document.querySelector('#results');
  const status = document.querySelector('#status');
  if (!box) return;

  if (status) {
    status.textContent = list.length
      ? `تم العثور على ${list.length} نتيجة لـ "${query}"`
      : `ملقيناش حاجة لـ "${query}"، جرب اسم تاني`;
  }

  if (!list.length) {
    box.innerHTML = `
      <div class="empty-box">
        <p>😕 مفيش نتايج</p>
        <p>جرب تكتب اسم الأغنية أو الفنان بطريقة تانية</p>
      </div>`;
    return;
  }

  box.innerHTML = list.map((t, i) => `
    <div class="card" onclick="playFromSearch(${i})">
      <img src="${t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb.jpg','600x600bb.jpg') : 'placeholder.png'}" onerror="this.src='placeholder.png'" alt="">
      <div class="info">
        <b>${t.trackName}</b>
        <span onclick="event.stopPropagation(); openArtist('${(t.artistName||'').replace(/'/g,"")}')">${t.artistName}</span>
        <small>${t.collectionName || ''} • ${formatSearchTime(t.trackTimeMillis)} ${t.trackExplicitness === 'explicit' ? '• 🅴' : ''}</small>
      </div>
      <div class="actions">
        <button title="حفظ في المكتبة" onclick="event.stopPropagation(); toggleLibraryByTrack(${t.trackId})">${window.isSaved && window.isSaved(t.trackId) ? '❤️' : '🤍'}</button>
        <button title="تحميل" onclick="event.stopPropagation(); downloadFromSearch(${i})">⬇️</button>
      </div>
    </div>
  `).join('');

  // اقتراح فنانين من النتايج
  renderSearchArtists(list);
}

// 4) الفنانين اللي ظهروا في البحث
function renderSearchArtists(list) {
  const box = document.querySelector('#searchArtists');
  if (!box) return;

  const artists = [];
  const seen = new Set();
  for (const t of list) {
    if (t.artistName && !seen.has(t.artistName)) {
      seen.add(t.artistName);
      artists.push(t);
    }
  }

  if (!artists.length) {
    box.innerHTML = '';
    return;
  }

  box.innerHTML = `
    <h3>👨‍🎤 فنانين</h3>
    <div class="artists-row">
      ${artists.slice(0, 6).map(t => `
        <div class="artist-chip" onclick="openArtist('${t.artistName.replace(/'/g,"")}')">
          <img src="${t.artworkUrl100}" onerror="this.src='placeholder.png'">
          <span>${t.artistName}</span>
        </div>
      `).join('')}
    </div>`;
}

// 5) تشغيل من البحث
function playFromSearch(i) {
  const track = searchResults[i];
  if (!track) return;
  if (window.playTrack) window.playTrack(track, searchResults);
}

// 6) تحميل من البحث
function downloadFromSearch(i) {
  const track = searchResults[i];
  if (!track) return;
  if (window.downloadTrack) window.downloadTrack(track);
}

// 7) بحث سريع من اقتراحات جاهزة
function searchSuggestion(term) {
  const inp = document.querySelector('#searchInput');
  if (inp) inp.value = term;
  searchMusic(term);
}

// 8) مسح البحث
function clearSearch() {
  const inp = document.querySelector('#searchInput');
  if (inp) inp.value = '';
  searchResults = [];
  const box = document.querySelector('#results');
  if (box) box.innerHTML = '<p class="empty">اكتب اسم أغنية أو فنان فوق وابدأ 🔍</p>';
  const status = document.querySelector('#status');
  if (status) status.textContent = '';
}

// 9) تحميل الترندات للرئيسية
async function loadTrending() {
  const box = document.querySelector('#trendingList');
  if (!box) return;
  box.innerHTML = '<p>جارٍ تحميل الترندات...</p>';
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=Top%20Hits&media=music&entity=song&limit=12&lang=ar`);
    const data = await res.json();
    const list = (data.results || []).filter(t => t.wrapperType === 'track');
    box.innerHTML = list.map((t, i) => `
      <div class="card" onclick="playTrending(${i})">
        <img src="${t.artworkUrl100.replace('100x100bb.jpg','600x600bb.jpg')}" onerror="this.src='placeholder.png'">
        <div class="info"><b>${t.trackName}</b><span>${t.artistName}</span></div>
        <button>▶️</button>
      </div>
    `).join('');
    window.__trending = list;
  } catch (e) {
    box.innerHTML = '<p class="empty">مش قادر أجيب الترندات دلوقتي</p>';
  }
}

function playTrending(i) {
  const list = window.__trending || [];
  const track = list[i];
  if (track && window.playTrack) window.playTrack(track, list);
}

// أدوات مساعدة
function formatSearchTime(ms) {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function showSearchLoading(q) {
  const box = document.querySelector('#results');
  if (box) box.innerHTML = `<p class="empty">جارٍ البحث عن "${q}"... ⏳</p>`;
}

function hideSearchLoading() {}

// ربط فورم البحث أول ما يفتح
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#searchForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = document.querySelector('#searchInput');
      if (inp) searchMusic(inp.value);
    });
  }

  const input = document.querySelector('#searchInput');
  if (input) {
    input.addEventListener('input', (e) => searchLive(e.target.value));
  }

  // الترندات أول ما يفتح
  loadTrending();
});

// دي اللي باقي الملفات بتنادي عليها
window.searchMusic = searchMusic;
window.searchLive = searchLive;
window.playFromSearch = playFromSearch;
window.downloadFromSearch = downloadFromSearch;
window.searchSuggestion = searchSuggestion;
window.clearSearch = clearSearch;
window.loadTrending = loadTrending;
window.playTrending = playTrending;