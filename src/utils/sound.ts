/**
 * Standalone bell sound utility – usable outside of React components.
 * Plays the same dual-pulse tone used in the notification panels.
 */

let _audioCtx: AudioContext | null = null;

const getAudioCtx = (): AudioContext | null => {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;
        if (!_audioCtx) _audioCtx = new AudioCtx();
        return _audioCtx;
    } catch {
        return null;
    }
};

export const playBell = (): void => {
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended') void ctx.resume();
        const now = ctx.currentTime;

        const triggerPulse = (startAt: number) => {
            const carrier = ctx.createOscillator();
            const harmonics = ctx.createOscillator();
            const gain = ctx.createGain();

            carrier.type = 'square';
            carrier.frequency.setValueAtTime(1900, startAt);
            carrier.frequency.exponentialRampToValueAtTime(1150, startAt + 0.16);

            harmonics.type = 'triangle';
            harmonics.frequency.setValueAtTime(2400, startAt);
            harmonics.frequency.exponentialRampToValueAtTime(1400, startAt + 0.16);

            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(0.32, startAt + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);

            carrier.connect(gain);
            harmonics.connect(gain);
            gain.connect(ctx.destination);

            carrier.start(startAt);
            harmonics.start(startAt);
            carrier.stop(startAt + 0.18);
            harmonics.stop(startAt + 0.18);
        };

        triggerPulse(now);
        triggerPulse(now + 0.19);
    } catch {
        // ignore – Safari private mode etc.
    }
};
