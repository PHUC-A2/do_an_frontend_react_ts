import type { MutableRefObject } from 'react';

/** Các kiểu chuông do người dùng chọn (khớp backend enum). */
export type NotificationSoundPreset = 'DEFAULT' | 'SOFT' | 'ALERT';

/** Chuẩn hóa giá trị từ API / form. */
export const normalizeNotificationSoundPreset = (v: string | null | undefined): NotificationSoundPreset => {
    if (v === 'SOFT' || v === 'ALERT') {
        return v;
    }
    return 'DEFAULT';
};

/** Nhãn hiển thị tiếng Việt cho từng kiểu. */
export const NOTIFICATION_SOUND_PRESET_LABELS: Record<NotificationSoundPreset, string> = {
    DEFAULT: 'Chuông mặc định (hai tiếng)',
    SOFT: 'Âm nhẹ (một tiếng trầm)',
    ALERT: 'Báo động ngắn (ba tiếng bíp)',
};

const getAudioCtor = (): (typeof AudioContext) | null => {
    const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
    return window.AudioContext || w.webkitAudioContext || null;
};

/**
 * Gắn listener: lần chạm/chuột đầu trên trang sẽ resume AudioContext.
 * Chuông đến qua WebSocket sau khi user đã click "Đặt sân" vẫn không được coi là cùng "gesture" với Chrome → cần mở khóa sớm.
 */
export const attachNotificationAudioUserGestureUnlock = (
    audioCtxRef: MutableRefObject<AudioContext | null>,
): (() => void) => {
    const unlock = () => {
        try {
            const AudioCtor = getAudioCtor();
            if (!AudioCtor) {
                return;
            }
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioCtor();
            }
            void audioCtxRef.current.resume();
        } catch {
            /* Trình duyệt có thể từ chối trước tương tác */
        }
    };
    document.addEventListener('pointerdown', unlock, { capture: true });
    return () => document.removeEventListener('pointerdown', unlock, { capture: true });
};

/**
 * Phát thử / phát khi có thông báo — dùng Web Audio API theo preset.
 * Chờ resume() xong rồi mới schedule oscillator (tránh âm lượng 0 khi context còn suspended).
 */
export const playNotificationSound = (
    audioCtxRef: MutableRefObject<AudioContext | null>,
    preset: NotificationSoundPreset,
): void => {
    try {
        const AudioCtor = getAudioCtor();
        if (!AudioCtor) {
            return;
        }

        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioCtor();
        }

        const ctx = audioCtxRef.current;

        const run = () => {
            const now = ctx.currentTime;

            if (preset === 'SOFT') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.36);
                return;
            }

            if (preset === 'ALERT') {
                for (let i = 0; i < 3; i += 1) {
                    const t = now + i * 0.12;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(2000, t);
                    gain.gain.setValueAtTime(0.0001, t);
                    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.09);
                }
                return;
            }

            const triggerPulse = (startAt: number) => {
                const carrier = ctx.createOscillator();
                const harmonics = ctx.createOscillator();
                const gain = ctx.createGain();

                carrier.type = 'square';
                harmonics.type = 'triangle';

                carrier.frequency.setValueAtTime(1850, startAt);
                carrier.frequency.exponentialRampToValueAtTime(1100, startAt + 0.14);

                harmonics.frequency.setValueAtTime(2300, startAt);
                harmonics.frequency.exponentialRampToValueAtTime(1350, startAt + 0.14);

                gain.gain.setValueAtTime(0.0001, startAt);
                gain.gain.exponentialRampToValueAtTime(0.32, startAt + 0.015);
                gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);

                carrier.connect(gain);
                harmonics.connect(gain);
                gain.connect(ctx.destination);

                carrier.start(startAt);
                harmonics.start(startAt);

                carrier.stop(startAt + 0.16);
                harmonics.stop(startAt + 0.16);
            };

            triggerPulse(now);
            triggerPulse(now + 0.19);
        };

        if (ctx.state === 'suspended') {
            void ctx.resume().then(run).catch(() => {
                try {
                    run();
                } catch {
                    /* vẫn có thể bị chặn autoplay */
                }
            });
            return;
        }

        run();
    } catch {
        /* Trình duyệt có thể chặn audio nếu chưa có tương tác */
    }
};
