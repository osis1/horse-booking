self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(clients.claim()); });

var mySchedule = [];
var REMIND_MIN = 15;

// Функция, которая сравнивает время и шлет пуш
function checkTime() {
    var now = new Date();
    // Высчитываем московское время
    var mskNow = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
    var nowMinutes = mskNow.getHours() * 60 + mskNow.getMinutes();
    var todayStr = mskNow.getFullYear() + '-' + String(mskNow.getMonth()+1).padStart(2,'0') + '-' + String(mskNow.getDate()).padStart(2,'0');

    mySchedule.forEach(function(b) {
        if (b.status !== 'wait' || b.dateKey !== todayStr || b.sent) return;
        var diff = b.startMin - nowMinutes;
        if (diff >= 0 && diff <= REMIND_MIN) {
            b.sent = true; // Помечаем, чтобы не отправлять дважды
            var timeStr = String(Math.floor(b.startMin/60)).padStart(2,'0') + ':' + String(b.startMin%60).padStart(2,'0');
            self.registration.showNotification('🐴 ' + b.horse + ' через ' + diff + ' мин', {
                body: b.trainer + ' · ' + timeStr + ' · ' + (b.loadLabel || ''),
                vibrate: [200, 100, 200],
                icon: '/icon-192.png' // Иконка PWA
            });
        }
    });
}

// Слушаем команды от сайта
self.addEventListener('message', function(e) {
    if (e.data === 'test') {
        setTimeout(function() {
            self.registration.showNotification('Тест ПУША!', { body: 'Работает при свернутом приложении!', vibrate: [500, 200, 500] });
        }, 5000);
    } 
    else if (e.data.cmd === 'update_schedule') {
        mySchedule = e.data.list || [];
        // Запускаем свою проверку времени каждые 30 секунд ВНУТРИ фонового скрипта
        setInterval(checkTime, 30000);
        checkTime(); // Проверяем сразу
    }
});
