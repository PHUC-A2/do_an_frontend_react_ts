/**
 * Hook quản lý Browser Notification API.
 * - Tự xin quyền khi user đăng nhập
 * - Expose hàm `sendBrowserNotif(title, body)` để hiện popup hệ thống
 */

const ICON = '/logo192.png'; // hoặc favicon của app

export const useBrowserNotification = () => {

    const requestPermission = async (): Promise<boolean> => {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        const result = await Notification.requestPermission();
        return result === 'granted';
    };

    const sendBrowserNotif = (title: string, body: string) => {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;
        try {
            const n = new Notification(title, {
                body,
                icon: ICON,
                badge: ICON,
                tag: 'utb-sport', // ghi đè thay vì stack nhiều cái
                renotify: true,
            });
            // Tự đóng sau 6 giây
            setTimeout(() => n.close(), 6000);
        } catch { /* Safari private mode có thể throw */ }
    };

    return { requestPermission, sendBrowserNotif };
};
