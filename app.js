// Void Music - app.js
// الملف الرئيسي - بيربط البحث + المشغل + المكتبة + التحميلات

const state = {
  results: [],
  queue: [],
  currentIndex: -1,
  library: JSON.parse(localStorage.getItem('void_library') || '[]'),
  downloads: JSON.parse(localStorage.getItem('void_downloads') || '[]'),
  recent: JSON.parse(localStorage.getItem('void_recent') || '[]'),
  currentTab: 'all',
  isPlaying: false,
};

const audio = new Audio();
audio.preload = 'auto';

const $ = (s) => document.querySelector(s);

// ---------- Helpers ----------
function fmtTime(ms){
  if(!ms) return '0:00';
  const sec = Math.floor(ms/1000);
  return Math.floor(sec/60) + ':' + String(sec%60).padStart(2,'0');
}
function save(){
  localStorage.setItem('void_library', JSON.stringify(state.library));
  localStorage.setItem('void_downloads', JSON.stringify(state.downloads));
  localStorage.setItem('void_recent', JSON.stringify(state.recent));
}
function bigArtwork(url){ return url ? url.replace('100x100bb.jpg','600x600bb.jpg') : 'placeholder.png'; }

// ---------- Search ----------
async function searchMusic(query){
  if(!query) return;
  $('#status').textContent = 'جارٍ البحث عن: ' + query + ' ...';
  try{
    // iTunes Search API - قانوني ومجاني - بيرجع معاينة 30 ثانية
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=50&lang=ar`);
    const data = await res.json();
    state.results = data.results || [];
    state.queue = state.results;
    renderResults(state.results);
    $('#status').textContent = `تم العثور على ${state.results.length} أغنية`;
  }catch(e){
    $('#status').textContent = 'حصل خطأ في الاتصال، جرب تاني';
  }
}

async function searchArtist(artistName){
  $('#status').textContent = 'جارٍ تحميل أغاني ' + artistName + ' ...';
  try{
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&media=music&entity=song&limit=100&lang=ar`);
    const data = await res.json();
    const songs = (data.results||[]).filter(s=> s.artistName.toLowerCase().includes(artistName.toLowerCase()) || true);
    state.results = songs;
    state.queue = songs;
    renderResults(songs);
    renderArtistHeader(artistName, songs[0]);
    $('#status').textContent = `${artistName} - ${songs.length} أغنية`;
  }catch(e){ $('#status').textContent = 'خطأ في تحميل الفنان'; }
}

// ---------- Render ----------
function renderResults(list){
  const box = $('#results');
  if(!box) return;
  if(!list.length){ box.innerHTML = '<p class="empty">لا توجد نتائج، جرب اسم أغنية أو فنان تاني</p>'; return; }
  box.innerHTML = list.map((t,i)=>`
    <div class="card" onclick="playSong(${i})">
      <img src="${bigArtwork(t.artworkUrl100)}" onerror="this.src='placeholder.png'" alt="">
      <div class="info">
        <b>${t.trackName||''}</b>
        <span onclick="event.stopPropagation(); searchArtist('${(t.artistName||'').replace(/'/g,"")}')">${t.artistName||''}</span>
        <small>${t.collectionName||''} • ${fmtTime(t.trackTimeMillis)}</small>
      </div>
      <div class="actions">
        <button onclick="event.stopPropagation(); toggleLibrary(${t.trackId})">${state.library.find(x=>x.trackId===t.trackId)?'❤️':'🤍'}</button>
        <button onclick="event.stopPropagation(); downloadSong(${i})">⬇️</button>
      </div>
    </div>
  `).join('');
}

function renderArtistHeader(name, first){
  const h = $('#artistHeader');
  if(!h) return;
  h.innerHTML = `
    <div class="artist-header">
      <img src="${first?bigArtwork(first.artworkUrl100):'placeholder.png'}" onerror="this.src='placeholder.png'">
      <div><h2>${name}</h2><p>فنان • جميع الأغاني</p></div>
    </div>`;
}

function renderLibrary(){
  const box = $('#libraryList');
  if(!box) return;
  if(!state.library.length){ box.innerHTML='<p class="empty">مكتبتك فاضية لسه، دوس 🤍 على أي أغنية</p>'; return; }
  box.innerHTML = state.library.map((t,i)=>`
    <div class="card"><img src="${bigArtwork(t.artworkUrl100)}" onerror="this.src='placeholder.png'">
    <div class="info"><b>${t.trackName}</b><span>${t.artistName}</span></div>
    <button onclick="playFromLibrary(${i})">▶️</button>
    <button onclick="toggleLibrary(${t.trackId}); renderLibrary()">❌</button></div>
  `).join('');
}

function renderDownloads(){
  const box = $('#downloadsList');
  if(!box) return;
  if(!state.downloads.length){ box.innerHTML='<p class="empty">لسه محملتش حاجة، دوس ⬇️ على أي أغنية</p>'; return; }
  box.innerHTML = state.downloads.map((t,i)=>`
    <div class="card"><img src="${bigArtwork(t.artworkUrl100)}" onerror="this.src='placeholder.png'">
    <div class="info"><b>${t.trackName}</b><span>${t.artistName}</span><small>تم التحميل • ${new Date(t.downloadedAt).toLocaleDateString('ar-EG')}</small></div>
    <button onclick="playFromDownloads(${i})">▶️</button></div>
  `).join('');
}

// ---------- Player ----------
function playSong(index){
  const track = state.queue[index];
  if(!track || !track.previewUrl) return alert('المعاينة غير متاحة للأغنية دي');
  state.currentIndex = index;
  audio.src = track.previewUrl;
  audio.play();
  state.isPlaying = true;
  updatePlayerUI(track);
  // recent
  state.recent = [track, ...state.recent.filter(x=>x.trackId!==track.trackId)].slice(0,20);
  save();
}
function playFromLibrary(i){ state.queue = state.library; playSong(i); }
function playFromDownloads(i){ state.queue = state.downloads; playSong(i); }

function updatePlayerUI(track){
  const p = $('#player'); if(!p) return;
  p.style.display='flex';
  $('#pArt').src = bigArtwork(track.artworkUrl100);
  $('#pTitle').textContent = track.trackName;
  $('#pArtist').textContent = track.artistName;
  $('#pPlayBtn').textContent = '⏸️';
}

function togglePlay(){
  if(!audio.src) return;
  if(audio.paused){ audio.play(); $('#pPlayBtn').textContent='⏸️'; }
  else{ audio.pause(); $('#pPlayBtn').textContent='▶️'; }
}
function nextSong(){ if(state.currentIndex < state.queue.length-1) playSong(state.currentIndex+1); }
function prevSong(){ if(state.currentIndex>0) playSong(state.currentIndex-1); }

// ---------- Library / Downloads ----------
function toggleLibrary(trackId){
  const track = state.results.find(t=>t.trackId===trackId) || state.queue.find(t=>t.trackId===trackId) || state.library.find(t=>t.trackId===trackId);
  if(!track) return;
  const idx = state.library.findIndex(x=>x.trackId===trackId);
  if(idx>=0) state.library.splice(idx,1);
  else state.library.push(track);
  save(); renderResults(state.results); renderLibrary();
}

function downloadSong(index){
  const track = state.queue[index];
  if(!track) return;
  // 1) تحميل على الهاتف
  const a = document.createElement('a');
  a.href = track.previewUrl;
  a.download = `${track.artistName} - ${track.trackName}.m4a`;
  a.target = '_blank';
  document.body.appendChild(a); a.click(); a.remove();
  // 2) حفظ جوه التطبيق
  if(!state.downloads.find(x=>x.trackId===track.trackId)){
    state.downloads.unshift({...track, downloadedAt: Date.now()});
    save(); renderDownloads();
  }
  alert('تم بدء التحميل: ' + track.trackName);
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', ()=>{
  const form = $('#searchForm');
  if(form) form.addEventListener('submit', e=>{ e.preventDefault(); searchMusic($('#searchInput').value.trim()); });
  if($('#pPlayBtn')) $('#pPlayBtn').addEventListener('click', togglePlay);
  if($('#pNextBtn')) $('#pNextBtn').addEventListener('click', nextSong);
  if($('#pPrevBtn')) $('#pPrevBtn').addEventListener('click', prevSong);
  if($('#volume')) $('#volume').addEventListener('input', e=> audio.volume = e.target.value);
  audio.addEventListener('ended', nextSong);
  audio.addEventListener('timeupdate', ()=>{
    const bar = $('#progress'); if(bar && audio.duration) bar.value = (audio.currentTime/audio.duration)*100;
    const t = $('#pTime'); if(t) t.textContent = Math.floor(audio.currentTime)+'s / 30s';
  });
  renderLibrary(); renderDownloads();
  // بحث افتراضي أول ما يفتح
  searchMusic('Amr Diab');
});

// متاح للـ HTML onclick
window.playSong = playSong;
window.searchArtist = searchArtist;
window.toggleLibrary = toggleLibrary;
window.downloadSong = downloadSong;
window.playFromLibrary = playFromLibrary;
window.playFromDownloads = playFromDownloads;
window.searchMusic = searchMusic;
