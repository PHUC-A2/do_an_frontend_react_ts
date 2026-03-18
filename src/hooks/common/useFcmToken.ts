/**
 * Hook lấy FCM token và đăng ký với backend.
 * Gọi sau khi user đăng nhập thành công.
 */
import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '../../config/firebase';
import { registerFcmToken } from '../../config/Api';
import { playBell } from '../../utils/sound';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

export const useFcmToken = (isLoggedIn: boolean) => {
    const registered = useRef(false);

    useEffect(() => {
        if (!isLoggedIn || registered.current) return;

        const register = async () => {
            try {
                const msg = getFirebaseMessaging();
                if (!msg) return;

                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                const token = await getToken(msg, { vapidKey: VAPID_KEY });
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
        const msg = getFirebaseMessaging();
        if (!msg) return;

        const unsubscribe = onMessage(msg, (payload) => {
            // Khi tab đang mở và đã có SSE, tránh duplicate popup hệ thống.
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                return;
            }

            const title = payload.notification?.title ?? 'TBU Sport';
            const body = payload.notification?.body ?? '';
            if (Notification.permission === 'granted') {
                playBell();
                const n = new Notification(title, {
                    body,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                } as NotificationOptions);
                setTimeout(() => n.close(), 6000);
            }
        });
        return unsubscribe;
    }, []);
};
