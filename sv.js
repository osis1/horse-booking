// Фоновый скрипт для PWA уведомлений
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

// Слушаем команду показать уведомление от сайта
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    var data = event.data.payload;
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      vibrate: [200, 100, 200],
      badge: data.icon
    });
  }
});

// Если пользователь кликнул по уведомлению на экране блокировки — открываем сайт
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
