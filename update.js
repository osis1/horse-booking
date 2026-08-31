// ==========================================
// 1. УМНАЯ ЭКРАН-ЗАГЛУШКА
// ==========================================
var wallForm = null;
var sitePassInput = null;

function createWall() {
    if (localStorage.getItem('hc_admin') === 'true') {
        initUpdates(); 
        return;
    }

    wallForm = document.createElement('form');
    wallForm.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#1a1a1e;margin:0;padding:0;border:none;';
    wallForm.onsubmit = function(e) { e.preventDefault(); checkSitePass(); };

    wallForm.innerHTML = 
        '<div style="font-size:60px;opacity:0.8;">🐴</div>' +
        '<div style="font-size:20px;font-weight:700;color:#e0ddd6;text-align:center;padding:0 20px;">Расписание Конного клуба</div>' +
        '<input type="password" id="sitePass" placeholder="Введите пароль" autocomplete="current-password" style="padding:14px 20px;font-size:16px;border:1.5px solid #3a3a42;border-radius:12px;width:260px;background:#25252b;color:#e0ddd6;outline:none;text-align:center;margin-top:10px;">' +
        '<button type="submit" id="wallBtn" style="padding:14px 30px;font-size:16px;cursor:pointer;border:none;border-radius:12px;background:#4a7c59;color:#fff;font-weight:700;">Войти</button>' +
        '<div id="passErr" style="color:#e06050;font-size:13px;display:none;">Неверный пароль</div>';
        
    document.body.prepend(wallForm);
    sitePassInput = document.getElementById('sitePass');
}

function checkSitePass() {
    if (!sitePassInput) return;
    var enteredPass = sitePassInput.value;
    var correctPass = (typeof config !== 'undefined') ? config.adminPass : 'admin';

    if (enteredPass === correctPass) {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        wallForm.remove(); 
        initUpdates();     
    } else {
        document.getElementById('passErr').style.display = 'block';
    }
}

createWall();

// ==========================================
// 2. ТЕСТОВАЯ КНОПКА (10 секунд)
// ==========================================
function addTestButton() {
    var header = document.querySelector('header');
    if (!header) return;
    var btn = document.createElement('button');
    btn.className = 'hdr-btn';
    btn.textContent = '🧪 Тест (10с)';
    btn.title = 'Проверка уведомлений через 10 секунд';
    btn.addEventListener('click', function() {
        btn.disabled = true; btn.style.opacity = '0.5'; btn.textContent = '⏳ Ожидайте...';
        setTimeout(function() {
            if (typeof showBadge === 'function') showBadge('🐴 ТЕСТ: Рокки через 15 мин!\nОльга · Плац');
            if (typeof playBeep === 'function') playBeep();
            btn.textContent = '🧪 Тест (10с)'; btn.disabled = false; btn.style.opacity = '1';
        }, 10000); 
    });
    var mskClock = document.getElementById('mskClock');
    if (mskClock && mskClock.nextSibling) { header.insertBefore(btn, mskClock.nextSibling); } 
    else { header.appendChild(btn); }
}

// ==========================================
// 3. РЕАЛЬНЫЕ УВЕДОМЛЕНИЯ НА ТЕЛЕФОН (PWA)
// ==========================================
// Регистрируем фоновый процесс для разблокированного экрана
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
}

// Проверка времени
setInterval(function() {
    if (typeof checkRemind === 'function') checkRemind();
}, 30000);

// Звук
var originalPlayBeep = window.playBeep;
window.playBeep = function() {
    try {
        var c = new (window.AudioContext || window.webkitAudioContext)();
        var o1 = c.createOscillator(); var g1 = c.createGain();
        o1.connect(g1); g1.connect(c.destination);
        o1.frequency.value = 880; g1.gain.value = 0.3;
        o1.start(c.currentTime); o1.stop(c.currentTime + 0.2);
        var o2 = c.createOscillator(); var g2 = c.createGain();
        o2.connect(g2); g2.connect(c.destination);
        o2.frequency.value = 1100; g2.gain.value = 0;
        g2.setValueAtTime(0, c.currentTime + 0.2);
        g2.gain.linearRampToValueAtTime(0.3, c.currentTime + 0.25);
        o2.start(c.currentTime + 0.2); o2.stop(c.currentTime + 0.5);
    } catch(e) {}
};

// Отправка на телефон
var originalShowBadge = window.showBadge;
window.showBadge = function(text) {
    if (originalShowBadge) originalShowBadge(text);
    if (typeof playBeep === 'function') playBeep();

    if ('Notification' in window && Notification.permission === 'granted') {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            // Отправляем команду в sw.js, чтобы он разбудил телефон
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                payload: { title: '🐴 Конный клуб', body: text, icon: window.icon64 || '' }
            });
        } else if (location.protocol === 'https:') {
            try { new Notification('🐴 Конный клуб', { body: text }); } catch(e) {}
        }
    }
};

// ==========================================
// 4. ЗАПУСК
// ==========================================
function initUpdates() {
    addTestButton();
}
