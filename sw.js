self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(clients.claim()); });

var mySchedule = [];
var REMIND_MIN = 15;

function checkTime() {
    var now = new Date();
    var mskNow = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
    var nowMinutes = mskNow.getHours() * 60 + mskNow.getMinutes();
    var todayStr = mskNow.getFullYear() + '-' + String(mskNow.getMonth()+1).padStart(2,'0') + '-' + String(mskNow.getDate()).padStart(2,'0');

    mySchedule.forEach(function(b) {
        if (b.status !== 'wait' || b.dateKey !== todayStr || b.sent) return;
        var diff = b.startMin - nowMinutes;
        if (diff >= 0 && diff <= REMIND_MIN) {
            b.sent = true; 
            var timeStr = String(Math.floor(b.startMin/60)).padStart(2,'0') + ':' + String(b.startMin%60).padStart(2,'0');
            self.registration.showNotification('🐴 ' + b.horse + ' через ' + diff + ' мин', {
                body: b.trainer + ' · ' + timeStr + ' · ' + (b.loadLabel || ''),
                vibrate: [200, 100, 200],
                icon: '/icon-192.png'
            });
        }
    });
}

self.addEventListener('message', function(e) {
    if (e.data.cmd === 'update_schedule') {
        mySchedule = e.data.list || [];
    } 
    else if (e.data.cmd === 'check_time') {
        checkTime();
    }
});
