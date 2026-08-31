if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js?v=3');

setInterval(function(){ if(typeof checkRemind==='function') checkRemind(); }, 30000);

var origBeep = window.playBeep;
window.playBeep = function() {
    try {
        var c = new (window.AudioContext||window.webkitAudioContext)(), o1=c.createOscillator(), g1=c.createGain();
        o1.connect(g1); g1.connect(c.destination); o1.frequency.value=880; g1.gain.value=0.3; o1.start(c.currentTime); o1.stop(c.currentTime+0.2);
        var o2=c.createOscillator(), g2=c.createGain(); o2.connect(g2); g2.connect(c.destination); o2.frequency.value=1100; g2.gain.value=0;
        g2.setValueAtTime(0,c.currentTime+0.2); g2.gain.linearRampToValueAtTime(0.3,c.currentTime+0.25); o2.start(c.currentTime+0.2); o2.stop(c.currentTime+0.5);
    } catch(e){}
};

var origBadge = window.showBadge;
window.showBadge = function(t) {
    if(origBadge) origBadge(t);
    if(typeof playBeep==='function') playBeep();
    var ok = false;
    if('Notification' in window && Notification.permission==='granted' && location.protocol==='https:') {
        try { new Notification('🐴 Конный клуб', {body:t, icon:window.icon64}); ok=true; } catch(e){}
    }
    if(!ok) {
        var p=document.createElement('div');
        p.innerHTML='<div style="font-weight:700;margin-bottom:4px;font-size:14px;">🐴 Конный клуб</div><div style="font-size:13px;opacity:0.9;">'+t.replace(/\n/g,'<br>')+'</div>';
        p.style.cssText='position:fixed;bottom:20px;right:20px;left:20px;max-width:360px;margin-left:auto;background:#25252b;color:#e0ddd6;padding:16px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.4);z-index:99998;font-family:-apple-system,sans-serif;border:1px solid #3a3a42;transform:translateY(20px);opacity:0;transition:all .3s ease';
        document.body.appendChild(p);
        requestAnimationFrame(function(){p.style.transform='translateY(0)';p.style.opacity='1';});
        setTimeout(function(){p.style.transform='translateY(20px)';p.style.opacity='0';setTimeout(function(){p.remove()},300)},5000);
    }
};

(function(){
    var h=document.querySelector('header'); if(!h) return;
    var b=document.createElement('button'); b.className='hdr-btn'; b.textContent='🧪 Тест Пуша';
    b.onclick=function(){
        if(navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage('test');
            b.textContent='⏳ 5 сек...'; b.disabled=true;
            setTimeout(function(){ b.textContent='🧪 Тест Пуша'; b.disabled=false; }, 6000);
        } else { alert('sw.js не загрузился. Обнови страницу (F5).'); }
    };
    var m=document.getElementById('mskClock');
    if(m&&m.nextSibling) h.insertBefore(b,m.nextSibling); else h.appendChild(b);
})();
