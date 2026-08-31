self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(clients.claim()); });
self.addEventListener('message', function(e) {
    if (e.data === 'test') {
        setTimeout(function() {
            self.registration.showNotification('Тест ПУША!', { body: 'Работает!', vibrate: [500, 200, 500] });
        }, 5000);
    }
});
