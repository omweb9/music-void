// Void Music - player.js
// المشغل: تشغيل / إيقاف / تقديم / اللي بعده / اللي قبله / الصوت / التكرار

const audio = new Audio();
audio.preload = 'auto';

let queue = [];
let currentIndex = -1;
let isPlaying = false;
let isRepeat = false;
let isShuffle = false;

// 1) تشغيل أغنية
function playTrack(track, list) {
  if (!track) return;
  if (!track.previewUrl) {
    alert('المعاينة غير متاحة للأغنية دي');
    return;
  }

  // لو جايلنا قايمة جديدة، نحفظها
  if (list && list.length) {
    queue = list;
    currentIndex = list.findIndex(t => t.trackId === track.trackId);
    if (currentIndex === -1) {
      queue = [track, ...list];
      currentIndex = 0;
    }
  } else {
    queue = [track];
    currentIndex = 0;
  }

  audio.src = track.previewUrl;
  audio.play().catch(() => alert('حصل مشكلة في تشغيل الأغنية، جرب تاني'));
  isPlaying = true;

  updatePlayerUI(track);
  addToRecent(track);
}

// 2) تشغيل / إيقاف
function togglePlay() {
  if (!audio.src) return;
  if (audio.paused) {
    audio.play();
    isPlaying = true;
  } else {
    audio.pause();
    isPlaying = false;
  }
  const btn = document.querySelector('#pPlayBtn');
  if (btn) btn.textContent = isPlaying ? '⏸️' : '▶️';
}

// 3) اللي بعده / اللي قبله
function nextSong() {
  if (!queue.length) return;
  if (isShuffle) {
    currentIndex = Math.floor(Math.random() * queue.length);
  } else {
    currentIndex++;
    if (currentIndex >= queue.length) {
      if (isRepeat) currentIndex = 0;
      else { currentIndex = queue.length - 1; return; }
    }
  }
  playTrack(queue[currentIndex], queue);
}

function prevSong() {
  if (!queue.length) return;
  // لو عدّى 3 ثواني، ارجع لأول الأغنية مش اللي قبلها
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  currentIndex--;
  if (currentIndex < 0) currentIndex = 0;
  playTrack(queue[currentIndex], queue);
}

// 4) تحديث شكل المشغل
function updatePlayerUI(track) {
  const player = document.querySelector('#player');
  if (!player) return;
  player.style.display = 'flex';

  const art = document.querySelector('#pArt');
  if (art) {
    art.src = track.artworkUrl100
      ? track.artworkUrl100.replace('100x100bb.jpg','600x600bb.jpg')
      : 'placeholder.png';
    art.onerror = () => art.src = 'placeholder.png';
  }

  const title = document.querySelector('#pTitle');
  if (title) title.textContent = track.trackName || '';

  const artist = document.querySelector('#pArtist');
  if (artist) artist.textContent = track.artistName || '';

  const playBtn = document.querySelector('#pPlayBtn');
  if (playBtn) playBtn.textContent = '⏸️';

  // زرار الحفظ في المشغل نفسه
  const favBtn = document.querySelector('#pFavBtn');
  if (favBtn) {
    favBtn.textContent = window.isSaved && window.isSaved(track.trackId) ? '❤️' : '🤍';
    favBtn.onclick = () => {
      if (window.toggleLibrary) window.toggleLibrary(track.trackId);
      favBtn.textContent = window.isSaved(track.trackId) ? '❤️' : '🤍';
    };
  }

  // زرار التحميل في المشغل نفسه
  const dlBtn = document.querySelector('#pDownloadBtn');
  if (dlBtn) {
    dlBtn.onclick = () => {
      if (window.downloadTrack) window.downloadTrack(track);
    };
  }

  document.title = `▶️ ${track.trackName} - ${track.artistName} | Void Music`;
}

// 5) شريط التقدم + الوقت
function updateProgress() {
  const bar = document.querySelector('#progress');
  const time = document.querySelector('#pTime');
  if (bar && audio.duration) {
    bar.value = (audio.currentTime / audio.duration) * 100;
  }
  if (time) {
    const cur = Math.floor(audio.currentTime);
    time.textContent = `${cur}s / 30s`;
  }
}

function seekSong(value) {
  if (!audio.duration) return;
  audio.currentTime = (value / 100) * audio.duration;
}

// 6) الصوت
function setVolume(value) {
  audio.volume = value;
  const icon = document.querySelector('#volumeIcon');
  if (icon) icon.textContent = value == 0 ? '🔇' : value < 0.5 ? '🔈' : '🔊';
}

// 7) تكرار / عشوائي
function toggleRepeat() {
  isRepeat = !isRepeat;
  const btn = document.querySelector('#pRepeatBtn');
  if (btn) {
    btn.textContent = isRepeat ? '🔁 ✅' : '🔁';
    btn.style.opacity = isRepeat ? '1' : '0.6';
  }
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  const btn = document.querySelector('#pShuffleBtn');
  if (btn) {
    btn.textContent = isShuffle ? '🔀 ✅' : '🔀';
    btn.style.opacity = isShuffle ? '1' : '0.6';
  }
}

// 8) سمعته مؤخراً
function addToRecent(track) {
  let recent = JSON.parse(localStorage.getItem('void_recent') || '[]');
  recent = [track, ...recent.filter(x => x.trackId !== track.trackId)].slice(0, 20);
  localStorage.setItem('void_recent', JSON.stringify(recent));
  if (window.renderHomeRecent) window.renderHomeRecent();
}

// 9) أحداث المشغل
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', () => {
  if (isRepeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextSong();
  }
});
audio.addEventListener('play', () => {
  isPlaying = true;
  const btn = document.querySelector('#pPlayBtn');
  if (btn) btn.textContent = '⏸️';
});
audio.addEventListener('pause', () => {
  isPlaying = false;
  const btn = document.querySelector('#pPlayBtn');
  if (btn) btn.textContent = '▶️';
});

// 10) ربط الأزرار أول ما يفتح
document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.querySelector('#pPlayBtn');
  if (playBtn) playBtn.addEventListener('click', togglePlay);

  const nextBtn = document.querySelector('#pNextBtn');
  if (nextBtn) nextBtn.addEventListener('click', nextSong);

  const prevBtn = document.querySelector('#pPrevBtn');
  if (prevBtn) prevBtn.addEventListener('click', prevSong);

  const progress = document.querySelector('#progress');
  if (progress) progress.addEventListener('input', (e) => seekSong(e.target.value));

  const vol = document.querySelector('#volume');
  if (vol) vol.addEventListener('input', (e) => setVolume(e.target.value));

  const rep = document.querySelector('#pRepeatBtn');
  if (rep) rep.addEventListener('click', toggleRepeat);

  const shuf = document.querySelector('#pShuffleBtn');
  if (shuf) shuf.addEventListener('click', toggleShuffle);
});

// دي اللي باقي الملفات بتنادي عليها
window.playTrack = playTrack;
window.togglePlay = togglePlay;
window.nextSong = nextSong;
window.prevSong = prevSong;
window.seekSong = seekSong;
window.setVolume = setVolume;
window.toggleRepeat = toggleRepeat;
window.toggleShuffle = toggleShuffle;
window.setQueue = (list) => { queue = list; };