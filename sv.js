self.addEventListener('install', function(event) { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(clients.claim()); });
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    var data = event.data.payload;
    self.registration.showNotification(data.title, {
      body: data.body, icon: data.icon, vibrate: [200, 100, 200], badge: data.icon
    });
  }
});
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.matchAll({type: 'window'}).then(function(clientList) {
    if (clientList.length > 0) { return clientList[0].focus(); }
    return clients.openWindow('/');
  }));
});
