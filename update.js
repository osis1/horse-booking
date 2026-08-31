if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }
// ==========================================
// 1. ПРОВЕРКА РАСПИСАНИЯ (Каждые 30 сек)
// ==========================================
setInterval(function() {
    if (typeof checkRemind === 'function') checkRemind();
}, 30000);

// ==========================================
// 2. ЗВУК (Двойной писк)
// ==========================================
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

// ==========================================
// 3. ПОКАЗ УВЕДОМЛЕНИЙ
// ==========================================
var originalShowBadge = window.showBadge;
window.showBadge = function(text) {
    // 1. Зеленый баннер сверху (из основного кода)
    if (originalShowBadge) originalShowBadge(text);
    // 2. Звук
    if (typeof playBeep === 'function') playBeep();

    var notifSent = false;

    // 3. Пытаемся отправить НА ПРЯМУЮ в систему телефона (если есть HTTPS и разрешение)
    if ('Notification' in window && Notification.permission === 'granted') {
        if (location.protocol === 'https:') {
            try { 
                new Notification('🐴 Конный клуб', { body: text, icon: window.icon64 }); 
                notifSent = true; 
            } catch(e) {}
        }
    }

    // 4. Если система не приняла (нет HTTPS, нет разрешения или просто вкладка) — показываем красивую плашку внизу экрана
    if (!notifSent) {
        showBrowserPopup(text);
    }
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
