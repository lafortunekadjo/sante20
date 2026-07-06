// ============================================================
// SERVICE WORKER - Notifications Push
// Fichier: src/sw-push.js (à la racine de src/)
// ============================================================

// Version du Service Worker
const SW_VERSION = '1.0.0';

// Écouter l'événement 'push' (réception d'une notification)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification reçue:', event);

  let notificationData = {
    title: 'My2-0',
    body: 'Vous avez une nouvelle notification',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    tag: 'default',
    data: {
      url: '/'
    }
  };

  // Parser les données du push
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.message || payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: notificationData.badge,
        tag: payload.tag || payload.category || 'default',
        data: {
          url: payload.actionUrl || payload.url || '/',
          notificationId: payload.id,
          category: payload.category,
          groupeId: payload.groupeId
        },
        // Options supplémentaires
        vibrate: [200, 100, 200],
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions || []
      };
    } catch (e) {
      console.error('[SW] Erreur parsing push data:', e);
      notificationData.body = event.data.text();
    }
  }

  // Afficher la notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      vibrate: notificationData.vibrate,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions
    }
  );

  event.waitUntil(promiseChain);
});

// Écouter le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  // Ouvrir ou focus sur la fenêtre existante
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Chercher une fenêtre déjà ouverte
    for (let client of windowClients) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        client.focus();
        client.navigate(urlToOpen);
        return;
      }
    }
    // Sinon ouvrir une nouvelle fenêtre
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

// Écouter la fermeture de notification (pour analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée:', event.notification.tag);
  
  // Optionnel: envoyer au backend que la notification a été ignorée
  // fetch('/api/notifications/dismissed', { ... });
});

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installé - Version:', SW_VERSION);
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activé');
  event.waitUntil(clients.claim());
});