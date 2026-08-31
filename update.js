// ==========================================
// 1. УВЕДОМЛЕНИЯ ДЛЯ PWA
// ==========================================
setInterval(function() {
    if (typeof checkRemind === 'function') checkRemind();
}, 30000);

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

var originalShowBadge = window.showBadge;
window.showBadge = function(text) {
    if (originalShowBadge) originalShowBadge(text);
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(function(reg) {
                    reg.showNotification('Конный клуб', { body: text, icon: window.icon64, vibrate: [200, 100, 200] });
                });
            } else {
                new Notification('Конный клуб', { body: text, icon: window.icon64 });
            }
        } catch(e) {}
    }
};

// ==========================================
// 2. ЭКРАН-ЗАГЛУШКА (Темный, не выжигает глаза)
// ==========================================
var SITE_PASSWORD = "admin"; // Поменяйте на свой пароль

var wall = document.createElement('div');
wall.id = 'authWall';
wall.innerHTML = '<div style="font-size:60px;opacity:0.8;">🐴</div>' +
    '<div style="font-size:20px;font-weight:700;color:#e0ddd6;text-align:center;padding:0 20px;">Расписание Конного клуба</div>' +
    '<input type="password" id="sitePass" placeholder="Введите пароль" style="padding:14px 20px;font-size:16px;border:1.5px solid #3a3a42;border-radius:12px;width:260px;background:#25252b;color:#e0ddd6;outline:none;text-align:center;margin-top:10px;">' +
    '<button id="wallBtn" style="padding:14px 30px;font-size:16px;cursor:pointer;border:none;border-radius:12px;background:#4a7c59;color:#fff;font-weight:700;">Войти</button>' +
    '<div id="passErr" style="color:#e06050;font-size:13px;display:none;">Неверный пароль</div>';
wall.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#1a1a1e;';
document.body.prepend(wall);

var wallStyle = document.createElement('style');
wallStyle.textContent = 'body>*:not(#authWall){display:none!important}body.unlocked>*:not(#authWall){display:initial!important}body.unlocked header,body.unlocked .legend,body.unlocked .trainer-legend,body.unlocked .days,body.unlocked .chips,body.unlocked .btnrow,body.unlocked .addrow,body.unlocked .multrow,body.unlocked .trainer-row,body.unlocked .stat-row,body.unlocked .dc-row,body.unlocked .who-item,body.unlocked .grid{display:flex!important}#sitePass:focus{border-color:#4a7c59!important}';
document.head.appendChild(wallStyle);

function checkSitePass() {
    if (document.getElementById('sitePass').value === SITE_PASSWORD) {
        document.getElementById('authWall').remove();
        document.body.classList.add('unlocked');
        if (typeof initFB === 'function') initFB();
        addTestButton(); // Добавляем тестовую кнопку после входа
    } else {
        document.getElementById('passErr').style.display = 'block';
    }
}

document.getElementById('wallBtn').addEventListener('click', checkSitePass);
document.getElementById('sitePass').addEventListener('keydown', function(e) { if(e.key==='Enter') checkSitePass(); });

// ==========================================
// 3. ТЕСТОВАЯ КНОПКА УВЕДОМЛЕНИЙ (10 сек)
// ==========================================
function addTestButton() {
    var header = document.querySelector('header');
    if (!header) return;
    
    var btn = document.createElement('button');
    btn.className = 'hdr-btn';
    btn.textContent = '🧪 Тест (10с)';
    btn.title = 'Проверка уведомлений через 10 секунд';
    
    btn.addEventListener('click', function() {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.textContent = '⏳ Ожидайте...';
        
        setTimeout(function() {
            // Вызываем те же функции, что и при реальном уведомлении
            if (typeof showBadge === 'function') {
                showBadge('🐴 ТЕСТ: Рокки через 15 мин!\nОльга · Плац');
            }
            if (typeof playBeep === 'function') {
                playBeep();
            }
            
            btn.textContent = '🧪 Тест (10с)';
            btn.disabled = false;
            btn.style.opacity = '1';
        }, 10000); // 10000 миллисекунд = 10 секунд
    });
    
    // Вставляем кнопку в шапку после часов МСК
    var mskClock = document.getElementById('mskClock');
    if (mskClock && mskClock.nextSibling) {
        header.insertBefore(btn, mskClock.nextSibling);
    } else {
        header.appendChild(btn);
    }
}

// ==========================================
// 4. ИСПРАВЛЕНИЕ ОКНА "КТО ВЫ" (Поверх всего)
// ==========================================
var whoOv = document.getElementById('whoOverlay');
if (whoOv) whoOv.style.zIndex = '10001';

var origShowWho = window.showWhoSelect;
window.showWhoSelect = function() {
    document.querySelectorAll('.overlay.open').forEach(function(ol) {
        if (ol.id !== 'whoOverlay') ol.classList.remove('open');
    });
    if (origShowWho) origShowWho();
};
