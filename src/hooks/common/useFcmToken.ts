/**
 * Hook lấy FCM token và đăng ký với backend.
 * Gọi sau khi user đăng nhập thành công.
 */
import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../../config/firebase';
import { registerFcmToken } from '../../config/Api';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

export const useFcmToken = (isLoggedIn: boolean) => {
    const registered = useRef(false);

    useEffect(() => {
        if (!isLoggedIn || registered.current) return;

        const register = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                const token = await getToken(messaging, { vapidKey: VAPID_KEY });
                if (!token) return;

                await registerFcmToken(token);
                registered.current = true;
            } catch (err) {
                console.warn('[FCM] register error', err);
            }
        };

        register();
    }, [isLoggedIn]);

    // Lắng nghe foreground message (app đang mở)
    useEffect(() => {
        const unsubscribe = onMessage(messaging, (payload) => {
            const title = payload.notification?.title ?? 'TBU Sport';
            const body = payload.notification?.body ?? '';
            if (Notification.permission === 'granted') {
                const n = new Notification(title, {
                    body,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    tag: 'tbu-sport-fcm',
                    renotify: true,
                });
                setTimeout(() => n.close(), 6000);
            }
        });
        return unsubscribe;
    }, []);
};
