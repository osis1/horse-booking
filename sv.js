// Ждем 5 секунд после загрузки и шлем уведомление
setTimeout(function() {
    self.registration.showNotification('Тест ПУША!', {
        body: 'Если ты видишь это при закрытом приложении — ПУШИ РАБОТАЮТ!',
        vibrate: [500, 200, 500]
    });
}, 5000);

self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(clients.claim()); });
