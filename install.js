// Void Music - install.js
// تثبيت التطبيق كـ PWA على الموبايل - من غير متجر

let deferredPrompt = null;
let isInstalled = false;

// هل التطبيق متثبت أصلاً؟
function checkIfInstalled() {
  // لو مفتوح من الشاشة الرئيسية مش من المتصفح
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  if (standalone) {
    isInstalled = true;
    updateInstallUI();
  }
  return standalone;
}

// 1) المتصفح بيجهز زرار التثبيت
window.addEventListener('beforeinstallprompt', (e) => {
  // منع الرسالة التلقائية، وهنظهر زرارنا احنا
  e.preventDefault();
  deferredPrompt = e;
  console.log('Void Music جاهز للتثبيت ✅');
  updateInstallUI();
});

// 2) لو اتثبت خلاص
window.addEventListener('appinstalled', () => {
  isInstalled = true;
  deferredPrompt = null;
  alert('تم تثبيت Void Music بنجاح 🎉\nهتلاقيه على الشاشة الرئيسية');
  updateInstallUI();
});

// 3) زرار التثبيت الرئيسي - بتناديه من أي زرار في التطبيق
async function installApp() {
  // لو متثبت أصلاً
  if (isInstalled || checkIfInstalled()) {
    alert('التطبيق متثبت عندك أصلاً ✅\nافتحه من الشاشة الرئيسية');
    return;
  }

  // أندرويد - Chrome
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      console.log('المستخدم وافق على التثبيت');
    } else {
      console.log('المستخدم رفض التثبيت');
    }
    deferredPrompt = null;
    updateInstallUI();
    return;
  }

  // آيفون - Safari مفيهوش beforeinstallprompt
  // لازم نشرحله يدوي
  if (isIOS()) {
    showIOSInstructions();
    return;
  }

  // أي متصفح تاني
  showManualInstructions();
}

// 4) هل ده آيفون؟
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// 5) تعليمات الآيفون
function showIOSInstructions() {
  const box = document.querySelector('#installInstructions');
  if (box) {
    box.style.display = 'block';
    box.innerHTML = `
      <div class="install-help">
        <h3>📱 لتثبيت Void Music على الآيفون:</h3>
        <ol>
          <li>دوس على زرار <b>Share ⬆️</b> تحت في Safari</li>
          <li>انزل تحت ودوس <b>Add to Home Screen</b></li>
          <li>دوس <b>Add</b></li>
        </ol>
        <p>هتلاقي أيقونة Void Music على الشاشة الرئيسية 🎵</p>
        <button onclick="closeInstallHelp()">تمام</button>
      </div>
    `;
    return;
  }
  alert('على الآيفون:\n1. دوس Share ⬆️ في Safari\n2. دوس Add to Home Screen\n3. دوس Add');
}

// 6) تعليمات أندرويد اليدوية
function showManualInstructions() {
  const box = document.querySelector('#installInstructions');
  if (box) {
    box.style.display = 'block';
    box.innerHTML = `
      <div class="install-help">
        <h3>📱 لتثبيت Void Music:</h3>
        <ol>
          <li>افتح التطبيق في <b>Chrome</b></li>
          <li>دوس على <b>⋮</b> فوق على اليمين</li>
          <li>دوس <b>Install app / تثبيت التطبيق</b></li>
        </ol>
        <button onclick="closeInstallHelp()">تمام</button>
      </div>
    `;
    return;
  }
  alert('افتح في Chrome > دوس ⋮ > Install app');
}

function closeInstallHelp() {
  const box = document.querySelector('#installInstructions');
  if (box) box.style.display = 'none';
}

// 7) تحديث شكل زرار التثبيت
function updateInstallUI() {
  const btns = document.querySelectorAll('.install-btn');
  btns.forEach(btn => {
    if (isInstalled) {
      btn.textContent = '✅ التطبيق متثبت';
      btn.disabled = true;
    } else if (deferredPrompt) {
      btn.textContent = '📲 ثبّت التطبيق';
      btn.disabled = false;
      btn.style.display = 'block';
    } else {
      // لسه المتصفح مجهزش الـ prompt - نسيبه ظاهر برضه
      btn.textContent = '📲 ثبّت التطبيق';
      btn.style.display = 'block';
    }
  });
}

// 8) تشغيل أول ما يفتح
document.addEventListener('DOMContentLoaded', () => {
  checkIfInstalled();
  updateInstallUI();

  // ربط كل أزرار التثبيت
  document.querySelectorAll('.install-btn').forEach(b => {
    b.addEventListener('click', installApp);
  });
});

window.installApp = installApp;
window.closeInstallHelp = closeInstallHelp;
window.checkIfInstalled = checkIfInstalled;