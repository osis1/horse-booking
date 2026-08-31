self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(clients.claim()); });

// Слушаем команды от сайта (от кнопки теста)
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'TEST_PUSH') {
        // Ждем 5 секунд и показываем системное уведомление
        setTimeout(function() {
            self.registration.showNotification('🐴 Тест ПУША!', {
                body: 'Оно работает даже если сайт свернут!',
                vibrate: [500, 200, 500]
            });
        }, 5000);
    }
});
