// ==========================================
// 1. ПРОСТАЯ ЭКРАН-ЗАГЛУШКА
// ==========================================
var SITE_PASSWORD = "admin"; // Поменяйте пароль здесь

// Создаем темный DIV поверх всего
var wall = document.createElement('div');
wall.id = 'authWall';
wall.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#1a1a1e;';
wall.innerHTML = 
    '<div style="font-size:60px;opacity:0.8;">🐴</div>' +
    '<div style="font-size:20px;font-weight:700;color:#e0ddd6;text-align:center;padding:0 20px;">Расписание Конного клуба</div>' +
    '<input type="password" id="sitePass" placeholder="Введите пароль" style="padding:14px 20px;font-size:16px;border:1.5px solid #3a3a42;border-radius:12px;width:260px;background:#25252b;color:#e0ddd6;outline:none;text-align:center;margin-top:10px;">' +
    '<button id="wallBtn" style="padding:14px 30px;font-size:16px;cursor:pointer;border:none;border-radius:12px;background:#4a7c59;color:#fff;font-weight:700;">Войти</button>' +
    '<div id="passErr" style="color:#e06050;font-size:13px;display:none;">Неверный пароль</div>';
document.body.prepend(wall);

// Логика входа
function checkSitePass() {
    if (document.getElementById('sitePass').value === SITE_PASSWORD) {
        wall.remove(); // Просто удаляем заглушку, сайт под ней цел и невредим
        initUpdates(); // Запускаем тестовую кнопку
    } else {
        document.getElementById('passErr').style.display = 'block';
    }
}

document.getElementById('wallBtn').addEventListener('click', checkSitePass);
document.getElementById('sitePass').addEventListener('keydown', function(e) { 
    if(e.key==='Enter') checkSitePass(); 
});


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
            // Вызываем функции из основного кода
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
// 3. УВЕДОМЛЕНИЯ (PWA и обычный браузер)
// ==========================================

// Запускаем фоновую проверку расписания каждые 30 секунд
setInterval(function() {
    if (typeof checkRemind === 'function') checkRemind();
}, 30000);

// Улучшаем звук (делаем двойной писк)
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

// Умное показывание уведомлений
var originalShowBadge = window.showBadge;
window.showBadge = function(text) {
    // 1. Показываем стандартный зеленый баннер сверху (из вашего кода)
    if (originalShowBadge) originalShowBadge(text);
    
    var notifSent = false;

    // 2. Пробуем отправить системное PUSH-уведомление (для iPhone/Android PWA)
    if ('Notification' in window && Notification.permission === 'granted') {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            // Если сайт установлен как приложение (PWA)
            navigator.serviceWorker.ready.then(function(reg) {
                reg.showNotification('Конный клуб', { 
                    body: text, 
                    icon: window.icon64, 
                    vibrate: [200, 100, 200] 
                });
                notifSent = true;
            }).catch(function(){});
        } else if (location.protocol === 'https:') {
            // Если просто открыт HTTPS сайт в Safari/Chrome
            try { 
                new Notification('Конный клуб', { body: text, icon: window.icon64 }); 
                notifSent = true; 
            } catch(e) {}
        }
    }

    // 3. Если системное уведомление не сработало (например, нет HTTPS или не разрешено),
    // показываем красивое всплывающее окошко внизу экрана.
    if (!notifSent) {
        showBrowserPopup(text);
    }
};

// Функция окошка для обычного браузера
function showBrowserPopup(text) {
    var popup = document.createElement('div');
    popup.innerHTML = '<div style="font-weight:700;margin-bottom:4px;font-size:14px;">🐴 Конный клуб</div><div style="font-size:13px;opacity:0.9;">' + text.replace(/\n/g, '<br>') + '</div>';
    popup.style.cssText = 'position:fixed;bottom:20px;right:20px;left:20px;max-width:360px;margin-left:auto;background:#25252b;color:#e0ddd6;padding:16px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.4);z-index:99998;font-family:-apple-system,sans-serif;border:1px solid #3a3a42;transform:translateY(20px);opacity:0;transition:all 0.3s ease;';
    document.body.appendChild(popup);
    
    // Плавное появление
    requestAnimationFrame(function() { 
        popup.style.transform = 'translateY(0)'; 
        popup.style.opacity = '1'; 
    });
    
    // Исчезновение через 5 секунд
    setTimeout(function() {
        popup.style.transform = 'translateY(20px)'; 
        popup.style.opacity = '0';
        setTimeout(function() { popup.remove(); }, 300);
    }, 5000);
}

// ==========================================
// 4. ЗАПУСК
// ==========================================
function initUpdates() {
    addTestButton();
}
