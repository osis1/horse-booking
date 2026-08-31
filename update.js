self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(clients.claim()); });

var mySchedule = [];
var REMIND_MIN = 15;

function checkTime() {
    var now = new Date();
    var msk = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
    var nowMinutes = msk.getHours() * 60 + msk.getMinutes();
    var todayStr = msk.getFullYear() + '-' + String(msk.getMonth()+1).padStart(2,'0') + '-' + String(msk.getDate()).padStart(2,'0');

    mySchedule.forEach(function(b) {
        if (b.status !== 'wait' || b.dateKey !== todayStr || b.sent) return;
        var diff = b.startMin - nowMinutes;
        if (diff >= 0 && diff <= REMIND_MIN) {
            b.sent = true;
            var timeStr = String(Math.floor(b.startMin/60)).padStart(2,'0') + ':' + String(b.startMin%60).padStart(2,'0');
            self.registration.showNotification('🐴 ' + b.horse + ' через ' + diff + ' мин', {
                body: b.trainer + ' · ' + timeStr + ' · ' + (b.loadLabel || ''),
                vibrate: [200, 100, 200],
                tag: b.dateKey + '-' + b.startMin + '-' + b.horse,
                renotify: true
            });
        }
    });
}

setInterval(checkTime, 30000);

self.addEventListener('message', function(e) {
    if (e.data.cmd === 'update_schedule') {
        mySchedule = e.data.list || [];
        if (e.data.remindMin) REMIND_MIN = e.data.remindMin;
        checkTime();
    } else if (e.data.cmd === 'check_time') {
        checkTime();
    } else if (e.data.cmd === 'test') {
        self.registration.showNotification('🔔 Тестовое уведомление!', {
            body: 'Если вы это видите — уведомления работают!',
            vibrate: [200, 100, 200],
            tag: 'test-' + Date.now()
        });
    }
});
