// Void Music - library.js
// المكتبة: حفظ الأغاني المفضلة 🤍 + قوائم التشغيل

let library = JSON.parse(localStorage.getItem('void_library') || '[]');
let playlists = JSON.parse(localStorage.getItem('void_playlists') || '[]');
let libraryFilter = '';

function saveLibrary() {
  localStorage.setItem('void_library', JSON.stringify(library));
  localStorage.setItem('void_playlists', JSON.stringify(playlists));
  updateLibraryCount();
}

function updateLibraryCount() {
  const el = document.querySelector('#libraryCount');
  if (el) el.textContent = library.length
    ? `${library.length} أغنية محفوظة`
    : 'مكتبتك فاضية لسه';
  const empty = document.querySelector('#libraryEmpty');
  if (empty) empty.style.display = library.length ? 'none' : 'block';
}

// 1) حفظ / إلغاء حفظ أغنية
function toggleLibraryByTrack(trackId) {
  // ندور على الأغنية في أي قايمة مفتوحة
  const track = findTrackById(trackId);
  if (!track) return;

  const idx = library.findIndex(x => x.trackId === trackId);
  if (idx >= 0) {
    library.splice(idx, 1);
    alert('اتشالت من المكتبة 🤍');
  } else {
    library.unshift({ ...track, savedAt: Date.now() });
    alert('اتحفظت في مكتبتك ❤️');
  }
  saveLibrary();
  renderLibrary();
  // حدّث شكل القلوب في كل الصفحات
  if (window.renderResults) window.renderResults(window.__lastResults || []);
}

function findTrackById(trackId) {
  const pools = [
    window.__lastResults || [],
    window.__artistSongs || [],
    window.__searchResults || [],
    library
  ];
  for (const pool of pools) {
    const f = pool.find(t => t.trackId === trackId);
    if (f) return f;
  }
  return null;
}

// 2) هل الأغنية محفوظة؟
function isSaved(trackId) {
  return library.some(x => x.trackId === trackId);
}

// 3) بحث جوه المكتبة
function filterLibrary(q) {
  libraryFilter = (q || '').toLowerCase();
  renderLibrary();
}

function getFilteredLibrary() {
  if (!libraryFilter) return library;
  return library.filter(t =>
    (t.trackName || '').toLowerCase().includes(libraryFilter) ||
    (t.artistName || '').toLowerCase().includes(libraryFilter)
  );
}

// 4) تشغيل من المكتبة
function playFromLibrary(i) {
  const list = getFilteredLibrary();
  const track = list[i];
  if (!track) return;
  if (window.playTrack) window.playTrack(track, list);
}

function playAllLibrary() {
  if (!library.length) {
    alert('مكتبتك فاضية لسه، دوس 🤍 على أي أغنية');
    return;
  }
  if (window.playTrack) window.playTrack(library[0], library);
}

// 5) مسح المكتبة
function clearLibrary() {
  if (!library.length) return;
  if (!confirm('متأكد عايز تمسح كل المكتبة؟')) return;
  library = [];
  saveLibrary();
  renderLibrary();
}

// 6) رسم المكتبة
function renderLibrary() {
  const list = document.querySelector('#libraryList');
  if (!list) return;
  updateLibraryCount();

  const items = getFilteredLibrary();

  if (!items.length) {
    list.innerHTML = libraryFilter
      ? '<p class="empty">مفيش نتيجة للبحث ده في مكتبتك</p>'
      : '';
    return;
  }

  list.innerHTML = items.map((t, i) => `
    <div class="card">
      <img src="${t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb.jpg','600x600bb.jpg') : 'placeholder.png'}" onerror="this.src='placeholder.png'">
      <div class="info">
        <b>${t.trackName}</b>
        <span onclick="openArtist('${(t.artistName||'').replace(/'/g,"")}')">${t.artistName}</span>
        <small>${t.collectionName || ''} • حفظتها ${new Date(t.savedAt).toLocaleDateString('ar-EG')}</small>
      </div>
      <div class="actions">
        <button onclick="playFromLibrary(${i})">▶️</button>
        <button onclick="downloadTrackById(${t.trackId})">⬇️</button>
        <button onclick="addToPlaylistPrompt(${t.trackId})">➕</button>
        <button onclick="toggleLibraryByTrack(${t.trackId})">❌</button>
      </div>
    </div>
  `).join('');
}

function downloadTrackById(trackId) {
  const t = library.find(x => x.trackId === trackId);
  if (t && window.downloadTrack) window.downloadTrack(t);
}

// 7) قوائم التشغيل - Playlist
function createPlaylist() {
  const name = prompt('اسم القايمة الجديدة؟');
  if (!name) return;
  playlists.push({ id: Date.now(), name: name.trim(), songs: [] });
  saveLibrary();
  renderPlaylists();
}

function addToPlaylistPrompt(trackId) {
  if (!playlists.length) {
    const make = confirm('معندكش قوائم لسه، تحب أعملك قايمة جديدة؟');
    if (make) createPlaylist();
    return;
  }
  const names = playlists.map((p, i) => `${i+1}. ${p.name}`).join('\n');
  const pick = prompt('اختار رقم القايمة:\n' + names);
  const idx = parseInt(pick) - 1;
  if (playlists[idx]) {
    const t = findTrackById(trackId);
    if (t && !playlists[idx].songs.find(x => x.trackId === trackId)) {
      playlists[idx].songs.push(t);
      saveLibrary();
      renderPlaylists();
      alert(`اتضافت لقايمة ${playlists[idx].name} ✅`);
    } else {
      alert('الأغنية دي موجودة في القايمة أصلاً');
    }
  }
}

function renderPlaylists() {
  const box = document.querySelector('#playlistsList');
  if (!box) return;
  if (!playlists.length) {
    box.innerHTML = '<p class="empty">معندكش قوائم لسه، دوس + جنب أي أغنية</p>';
    return;
  }
  box.innerHTML = playlists.map((p, i) => `
    <div class="playlist-card">
      <b>🎵 ${p.name}</b>
      <span>${p.songs.length} أغنية</span>
      <button onclick="playPlaylist(${i})">▶️</button>
      <button onclick="deletePlaylist(${i})">🗑️</button>
    </div>
  `).join('');
}

function playPlaylist(i) {
  const p = playlists[i];
  if (!p || !p.songs.length) return alert('القايمة دي فاضية');
  if (window.playTrack) window.playTrack(p.songs[0], p.songs);
}

function deletePlaylist(i) {
  if (!confirm('تمسح القايمة دي؟')) return;
  playlists.splice(i, 1);
  saveLibrary();
  renderPlaylists();
}

document.addEventListener('DOMContentLoaded', () => {
  renderLibrary();
  renderPlaylists();
});

// دي اللي باقي الملفات بتنادي عليها
window.toggleLibrary = toggleLibraryByTrack;
window.toggleLibraryByTrack = toggleLibraryByTrack;
window.isSaved = isSaved;
window.filterLibrary = filterLibrary;
window.playFromLibrary = playFromLibrary;
window.playAllLibrary = playAllLibrary;
window.clearLibrary = clearLibrary;
window.renderLibrary = renderLibrary;
window.createPlaylist = createPlaylist;
window.addToPlaylistPrompt = addToPlaylistPrompt;
window.renderPlaylists = renderPlaylists;
window.playPlaylist = playPlaylist;
window.deletePlaylist = deletePlaylist;
window.downloadTrackById = downloadTrackById;