// Void Music - artist.js
// صفحة الفنان: بيجيب كل أغانيه + ألبوماته + أغاني مشابهة

async function openArtist(artistName){
  if(!artistName) return;
  const header = document.querySelector('#artistHeader');
  const list = document.querySelector('#artistSongs');
  const albumsBox = document.querySelector('#artistAlbums');
  const status = document.querySelector('#status');

  if(header) header.innerHTML = '<p>جارٍ تحميل الفنان...</p>';
  if(list) list.innerHTML = '';
  if(status) status.textContent = 'جارٍ تحميل أغاني ' + artistName + ' ...';

  // عشان نرجع للبحث لما ندوس رجوع
  showPage('artist');

  try{
    // 1) كل أغاني الفنان
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&media=music&entity=song&limit=100&lang=ar`);
    const data = await res.json();
    let songs = (data.results || []).filter(s => s.wrapperType === 'track');

    // رتب: الأكثر شعبية الأول - اللي ليهم صورة واسم
    songs = songs.sort((a,b) => (b.trackPrice||0) - (a.trackPrice||0));

    // خزنهم في الـ queue عشان المشغل يعرف يشغلهم ورا بعض
    window.__artistSongs = songs;
    if(window.setQueue) window.setQueue(songs);

    // 2) هيدر الفنان
    const first = songs[0];
    const img = first ? first.artworkUrl100.replace('100x100bb.jpg','600x600bb.jpg') : 'placeholder.png';
    if(header){
      header.innerHTML = `
        <div class="artist-header">
          <img src="${img}" onerror="this.src='placeholder.png'" alt="${artistName}">
          <div class="artist-info">
            <small>فنان • Verified Artist</small>
            <h2>${artistName}</h2>
            <p>${songs.length} أغنية • ${first ? first.primaryGenreName || '' : ''}</p>
            <div class="artist-actions">
              <button class="btn-primary" onclick="playArtistTop()">▶️ تشغيل الكل</button>
              <button class="btn-ghost" onclick="followArtist('${artistName.replace(/'/g,"")}')">+ متابعة</button>
            </div>
          </div>
        </div>`;
    }

    // 3) قايمة الأغاني
    if(list){
      if(!songs.length){
        list.innerHTML = '<p class="empty">ملقيناش أغاني للفنان ده، جرب اسم تاني</p>';
      } else {
        list.innerHTML = songs.map((t,i)=>`
          <div class="card" onclick="playArtistSong(${i})">
            <span class="num">${i+1}</span>
            <img src="${t.artworkUrl100.replace('100x100bb.jpg','600x600bb.jpg')}" onerror="this.src='placeholder.png'">
            <div class="info">
              <b>${t.trackName}</b>
              <span>${t.artistName}</span>
              <small>${t.collectionName || ''} • ${formatTime(t.trackTimeMillis)}</small>
            </div>
            <div class="actions">
              <button onclick="event.stopPropagation(); toggleLibraryByTrack(${t.trackId})">🤍</button>
              <button onclick="event.stopPropagation(); downloadArtistSong(${i})">⬇️</button>
            </div>
          </div>
        `).join('');
      }
    }

    // 4) ألبومات الفنان - من الأغاني نفسها
    if(albumsBox){
      const albums = [];
      const seen = new Set();
      for(const s of songs){
        if(s.collectionId && !seen.has(s.collectionId)){
          seen.add(s.collectionId);
          albums.push(s);
        }
      }
      albumsBox.innerHTML = albums.slice(0,12).map(a=>`
        <div class="album-card" onclick="openAlbum('${a.collectionName.replace(/'/g,"")}', '${artistName.replace(/'/g,"")}')">
          <img src="${a.artworkUrl100.replace('100x100bb.jpg','600x600bb.jpg')}" onerror="this.src='placeholder.png'">
          <b>${a.collectionName}</b>
          <span>${a.releaseDate ? new Date(a.releaseDate).getFullYear() : ''}</span>
        </div>
      `).join('');
    }

    if(status) status.textContent = `${artistName} - ${songs.length} أغنية`;

  }catch(e){
    if(header) header.innerHTML = '<p class="empty">حصل خطأ، جرب تاني</p>';
    if(status) status.textContent = 'خطأ في تحميل الفنان';
  }
}

function playArtistSong(i){
  const songs = window.__artistSongs || [];
  const track = songs[i];
  if(!track) return;
  // شغل من قايمة الفنان نفسها
  if(window.playTrack) window.playTrack(track, songs);
  else if(window.playSong) window.playSong(i);
}

function playArtistTop(){
  const songs = window.__artistSongs || [];
  if(!songs.length) return;
  playArtistSong(0);
}

function downloadArtistSong(i){
  const songs = window.__artistSongs || [];
  const track = songs[i];
  if(!track) return;
  if(window.downloadTrack) window.downloadTrack(track);
}

function openAlbum(albumName, artistName){
  // بسيطة: نبحث باسم الألبوم
  if(window.searchMusic) window.searchMusic(albumName + ' ' + artistName);
  showPage('search');
}

function followArtist(name){
  let following = JSON.parse(localStorage.getItem('void_following') || '[]');
  if(following.includes(name)){
    following = following.filter(x=>x!==name);
    alert('ألغيت متابعة ' + name);
  } else {
    following.push(name);
    alert('تابعت ' + name + ' ❤️');
  }
  localStorage.setItem('void_following', JSON.stringify(following));
}

function formatTime(ms){
  if(!ms) return '0:00';
  const s = Math.floor(ms/1000);
  return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
}

function showPage(name){
  // بيخفي كل الصفحات ويظهر صفحة واحدة
  document.querySelectorAll('.page').forEach(p=> p.classList.remove('active'));
  const el = document.querySelector('#page-' + name);
  if(el) el.classList.add('active');
  // تحديث شريط التنقل
  document.querySelectorAll('.nav-btn').forEach(b=> b.classList.toggle('active', b.dataset.page===name));
}

window.openArtist = openArtist;
window.playArtistSong = playArtistSong;
window.playArtistTop = playArtistTop;
window.downloadArtistSong = downloadArtistSong;
window.openAlbum = openAlbum;
window.followArtist = followArtist;
window.showPage = showPage;
