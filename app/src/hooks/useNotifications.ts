import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isSupported, permission]);

  const showMessageNotification = useCallback((senderName: string, message: string) => {
    return showNotification(`New message from ${senderName}`, {
      body: message,
      tag: 'new-message',
      requireInteraction: true,
      data: { type: 'message' }
    });
  }, [showNotification]);

  const showCallNotification = useCallback((callerName: string, type: 'voice' | 'video') => {
    return showNotification(`Incoming ${type} call`, {
      body: `${callerName} is calling you`,
      tag: 'incoming-call',
      requireInteraction: true,
      data: { type: 'call' }
    });
  }, [showNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showMessageNotification,
    showCallNotification
  };
};

export default useNotifications;
