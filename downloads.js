// Void Music - downloads.js
// التحميلات: تحميل على الهاتف + حفظ جوه التطبيق + تشغيل المحمل

let downloads = JSON.parse(localStorage.getItem('void_downloads') || '[]');
let downloadsFilter = '';

function saveDownloads(){
  localStorage.setItem('void_downloads', JSON.stringify(downloads));
  updateDownloadsCount();
}

function updateDownloadsCount(){
  const el = document.querySelector('#downloadsCount');
  if(el) el.textContent = downloads.length ? `${downloads.length} أغنية محملة` : 'لسه محملتش حاجة';
  const empty = document.querySelector('#downloadsEmpty');
  if(empty) empty.style.display = downloads.length ? 'none' : 'block';
}

// --- التحميل الأساسي ---
function downloadTrack(track){
  if(!track) return;
  if(!track.previewUrl){
    alert('المعاينة غير متاحة للأغنية دي');
    return;
  }

  // 1) تحميل على الهاتف - بينزل ملف .m4a
  const a = document.createElement('a');
  a.href = track.previewUrl;
  a.download = `${track.artistName} - ${track.trackName}.m4a`;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();

  // 2) حفظ جوه التطبيق
  addToDownloads(track);
  alert('تم بدء التحميل: ' + track.trackName + ' ⬇️');
}

function addToDownloads(track){
  if(downloads.find(x => x.trackId === track.trackId)){
    alert('الأغنية دي محملة عندك أصلاً');
    return;
  }
  downloads.unshift({
    ...track,
    downloadedAt: Date.now()
  });
  saveDownloads();
  renderDownloads();
}

function removeDownload(trackId){
  downloads = downloads.filter(x => x.trackId !== trackId);
  saveDownloads();
  renderDownloads();
}

function clearDownloads(){
  if(!downloads.length) return;
  if(!confirm('متأكد عايز تمسح كل التحميلات؟')) return;
  downloads = [];
  saveDownloads();
  renderDownloads();
}

function filterDownloads(q){
  downloadsFilter = (q || '').toLowerCase();
  renderDownloads();
}

function playAllDownloads(){
  if(!downloads.length){
    alert('لسه محملتش حاجة');
    return;
  }
  // بيشغل أول واحدة، والمشغل بيكمل الباقي
  if(window.playTrack) window.playTrack(downloads[0], downloads);
  else if(window.playSong) window.playSong(0);
}

function playFromDownloads(i){
  const list = getFilteredDownloads();
  const track = list[i];
  if(!track) return;
  if(window.playTrack) window.playTrack(track, list);
}

function getFilteredDownloads(){
  if(!downloadsFilter) return downloads;
  return downloads.filter(t =>
    (t.trackName || '').toLowerCase().includes(downloadsFilter) ||
    (t.artistName || '').toLowerCase().includes(downloadsFilter)
  );
}

// --- رسم القايمة ---
function renderDownloads(){
  const list = document.querySelector('#downloadsList');
  if(!list) return;
  updateDownloadsCount();

  const items = getFilteredDownloads();

  if(!items.length){
    list.innerHTML = downloadsFilter
      ? '<p class="empty">مفيش نتيجة للبحث ده في تحميلاتك</p>'
      : '';
    return;
  }

  list.innerHTML = items.map((t,i)=>`
    <div class="card">
      <img src="${t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb.jpg','600x600bb.jpg') : 'placeholder.png'}" onerror="this.src='placeholder.png'" alt="">
      <div class="info">
        <b>${t.trackName}</b>
        <span onclick="openArtist('${(t.artistName||'').replace(/'/g,"")}')">${t.artistName}</span>
        <small>تم التحميل • ${new Date(t.downloadedAt).toLocaleDateString('ar-EG')} • ${formatTimeSafe(t.trackTimeMillis)}</small>
      </div>
      <div class="actions">
        <button onclick="playFromDownloads(${i})">▶️</button>
        <button onclick="shareDownload(${t.trackId})">↗️</button>
        <button onclick="removeDownload(${t.trackId})">❌</button>
      </div>
    </div>
  `).join('');
}

function shareDownload(trackId){
  const t = downloads.find(x=>x.trackId===trackId);
  if(!t) return;
  const text = `اسمع ${t.trackName} - ${t.artistName} على Void Music 🎵`;
  if(navigator.share){
    navigator.share({ title: 'Void Music', text }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(text).then(()=> alert('تم نسخ اسم الأغنية'));
  }
}

function formatTimeSafe(ms){
  if(!ms) return '0:00';
  const s = Math.floor(ms/1000);
  return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
}

document.addEventListener('DOMContentLoaded', renderDownloads);

window.downloadTrack = downloadTrack;
window.downloadSong = downloadTrack;
window.addToDownloads = addToDownloads;
window.removeDownload = removeDownload;
window.clearDownloads = clearDownloads;
window.filterDownloads = filterDownloads;
window.playAllDownloads = playAllDownloads;
window.playFromDownloads = playFromDownloads;
window.renderDownloads = renderDownloads;
window.shareDownload = shareDownload;
