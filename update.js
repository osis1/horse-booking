// ==========================================
// 1. ЭКРАН-ЗАГЛУШКА (Безопасная для верстки)
// ==========================================
var SITE_PASSWORD = "admin"; // Поменяйте на свой пароль

// ВРЕМЕННО замораживаем запуск Firebase из index.html
var realInitFB = window.initFB;
window.initFB = function() {
    window._fbWaiting = true; // Говорим: "я готов запуститься, но жду пароль"
};

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
wallStyle.textContent = 'body>*:not(#authWall){display:none!important}body.unlocked>*:not(#authWall){display:block!important}body.unlocked header,body.unlocked .legend,body.unlocked .trainer-legend,body.unlocked .days,body.unlocked .chips,body.unlocked .btnrow,body.unlocked .addrow,body.unlocked .multrow,body.unlocked .trainer-row,body.unlocked .stat-row,body.unlocked .dc-row,body.unlocked .who-item,body.unlocked .grid{display:flex!important}#sitePass:focus{border-color:#4a7c59!important}';
document.head.appendChild(wallStyle);

function checkSitePass() {
    if (document.getElementById('sitePass').value === SITE_PASSWORD) {
        document.getElementById('authWall').remove();
        document.body.classList.add('unlocked');
        
        // РАЗМОРАЖИВАЕМ Firebase и запускаем
        window.initFB = realInitFB; 
        if (window._fbWaiting) {
            window.initFB();
            window._fbWaiting = false;
        }
        
        initUpdates();
    } else {
        document.getElementById('passErr').style.display = 'block';
    }
}

document.getElementById('wallBtn').addEventListener('click', checkSitePass);
document.getElementById('sitePass').addEventListener('keydown', function(e) { if(e.key==='Enter') checkSitePass(); });


// ==========================================
// 2. УВЕДОМЛЕНИЯ (PWA и браузер)
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
    var notifSent = false;
    if ('Notification' in window && Notification.permission === 'granted') {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(function(reg) {
                reg.showNotification('Конный клуб', { body: text, icon: window.icon64, vibrate: [200, 100, 200] });
                notifSent = true;
            }).catch(function(){});
        } else if (location.protocol === 'https:') {
            try { new Notification('Конный клуб', { body: text, icon: window.icon64 }); notifSent = true; } catch(e) {}
        }
    }
    if (!notifSent) showBrowserPopup(text);
};

function showBrowserPopup(text) {
    var popup = document.createElement('div');
    popup.innerHTML = '<div style="font-weight:700;margin-bottom:4px;font-size:14px;">🐴 Конный клуб</div><div style="font-size:13px;opacity:0.9;">' + text.replace(/\n/g, '<br>') + '</div>';
    popup.style.cssText = 'position:fixed;bottom:20px;right:20px;left:20px;max-width:360px;margin-left:auto;background:#25252b;color:#e0ddd6;padding:16px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.4);z-index:99998;font-family:-apple-system,sans-serif;border:1px solid #3a3a42;transform:translateY(20px);opacity:0;transition:all 0.3s ease;';
    document.body.appendChild(popup);
    requestAnimationFrame(function() { popup.style.transform = 'translateY(0)'; popup.style.opacity = '1'; });
    setTimeout(function() {
        popup.style.transform = 'translateY(20px)'; popup.style.opacity = '0';
        setTimeout(function() { popup.remove(); }, 300);
    }, 5000);
}

// ==========================================
// 3. ТЕСТОВАЯ КНОПКА
// ==========================================
function addTestButton() {
    var header = document.querySelector('header');
    if (!header) return;
    var btn = document.createElement('button');
    btn.className = 'hdr-btn';
    btn.textContent = '🧪 Тест (10с)';
    btn.title = 'Проверка уведомлений';
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
// 4. КНОПКА "КТО Я" В НАСТРОЙКАХ
// ==========================================
function forceShowWho() {
    var whoOv = document.getElementById('whoOverlay');
    if (whoOv) {
        var cfgOv = document.getElementById('cfgOverlay');
        if(cfgOv) cfgOv.classList.remove('open');
        whoOv.style.zIndex = '10001';
        whoOv.classList.add('open');
    }
}

function addWhoButtonToCfg() {
    var cfgOverlay = document.getElementById('cfgOverlay');
    if (!cfgOverlay) return;
    var observer = new MutationObserver(function() {
        if (cfgOverlay.classList.contains('open')) {
            if (!document.getElementById('myWhoBtn')) {
                var errDiv = document.getElementById('cfgErr');
                var parent = errDiv ? errDiv.parentNode : cfgOverlay.querySelector('.modal');
                if (parent) {
                    var btn = document.createElement('button');
                    btn.id = 'myWhoBtn';
                    btn.className = 'btn save';
                    btn.style.marginTop = '12px';
                    btn.style.background = 'var(--surface-alt)';
                    btn.style.color = 'var(--ink)';
                    btn.textContent = '👤 Выбрать «Кто я» (для уведомлений)';
                    btn.addEventListener('click', forceShowWho);
                    parent.insertBefore(btn, errDiv);
                }
            }
        }
    });
    observer.observe(cfgOverlay, { attributes: true, attributeFilter: ['class'] });
}

// Блокируем авто-всплытие
var origShowWho = window.showWhoSelect;
window.showWhoSelect = function() {};

// Запуск всего остального после снятия заглушки
function initUpdates() {
    addTestButton();
    addWhoButtonToCfg();
}
