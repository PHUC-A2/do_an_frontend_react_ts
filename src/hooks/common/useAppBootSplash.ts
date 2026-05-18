import { useEffect, useState } from 'react';

/** Thời gian tối thiểu hiển thị splash (ms) */
const DEFAULT_MIN_MS = 1600;

/** Thời gian fade out overlay — đồng bộ với LoadingScreen fadeOutMs */
export const BOOT_SPLASH_FADE_MS = 480;

/**
 * Điều khiển splash khi F5 / mở app lần đầu:
 * chờ tải trang (window load) và thời gian tối thiểu để hiệu ứng logo mượt.
 */
export const useAppBootSplash = (minMs: number = DEFAULT_MIN_MS) => {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const startedAt = Date.now();

        const waitForWindowLoad = () =>
            new Promise<void>((resolve) => {
                if (document.readyState === 'complete') {
                    resolve();
                    return;
                }
                window.addEventListener('load', () => resolve(), { once: true });
            });

        const waitForMinDuration = () =>
            new Promise<void>((resolve) => {
                const elapsed = Date.now() - startedAt;
                const remaining = Math.max(0, minMs - elapsed);
                window.setTimeout(() => resolve(), remaining);
            });

        void Promise.all([waitForWindowLoad(), waitForMinDuration()]).then(() => {
            if (!cancelled) {
                setShowSplash(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [minMs]);

    return { showSplash };
};
