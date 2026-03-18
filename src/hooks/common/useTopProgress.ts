type ProgressStatus = "idle" | "loading" | "error";

type ProgressSnapshot = {
    progress: number;
    visible: boolean;
    opacity: number;
    status: ProgressStatus;
};

type ProgressListener = (snapshot: ProgressSnapshot) => void;

class TopProgressController {
    private static readonly MAX_LOADING_MS = 12000;

    private activeCount = 0;
    private progress = 0;
    private visible = false;
    private opacity = 0;
    private status: ProgressStatus = "idle";
    private listeners = new Set<ProgressListener>();

    private bootstrapTimer: ReturnType<typeof setTimeout> | null = null;
    private trickleTimer: ReturnType<typeof setTimeout> | null = null;
    private fadeTimer: ReturnType<typeof setTimeout> | null = null;
    private resetTimer: ReturnType<typeof setTimeout> | null = null;
    private errorTimer: ReturnType<typeof setTimeout> | null = null;
    private watchdogTimer: ReturnType<typeof setTimeout> | null = null;

    subscribe(listener: ProgressListener) {
        this.listeners.add(listener);
        listener(this.getSnapshot());

        return () => {
            this.listeners.delete(listener);
        };
    }

    start = () => {
        this.activeCount += 1;

        this.clearTimer("fadeTimer");
        this.clearTimer("resetTimer");
        this.clearTimer("errorTimer");

        this.status = "loading";
        this.visible = true;
        this.opacity = 1;
        this.ensureWatchdog();

        if (this.progress === 0) {
            this.progress = 8;
            this.emit();

            this.clearTimer("bootstrapTimer");
            this.bootstrapTimer = setTimeout(() => {
                this.progress = Math.max(this.progress, 32);
                this.emit();
                this.scheduleTrickle();
            }, 40);

            return;
        }

        this.progress = Math.max(this.progress, 30);
        this.emit();
        this.scheduleTrickle();
    };

    done = () => {
        if (this.activeCount > 0) {
            this.activeCount -= 1;
        }

        if (this.activeCount > 0) {
            return;
        }

        this.finish();
    };

    error = () => {
        if (this.activeCount > 0) {
            this.activeCount -= 1;
        }

        this.clearTimer("bootstrapTimer");
        this.clearTimer("trickleTimer");
        this.clearTimer("fadeTimer");
        this.clearTimer("resetTimer");

        this.visible = true;
        this.opacity = 1;
        this.status = "error";
        this.progress = Math.max(this.progress, 88);
        this.emit();

        this.clearTimer("errorTimer");
        this.errorTimer = setTimeout(() => {
            if (this.activeCount > 0) {
                this.status = "loading";
                this.emit();
                this.scheduleTrickle();
                return;
            }

            this.finish();
        }, 300);
    };

    private finish() {
        this.clearTimer("bootstrapTimer");
        this.clearTimer("trickleTimer");
        this.clearTimer("fadeTimer");
        this.clearTimer("resetTimer");
        this.clearWatchdog();

        this.visible = true;
        this.opacity = 1;
        this.status = this.status === "error" ? "error" : "loading";
        this.progress = 100;
        this.emit();

        this.fadeTimer = setTimeout(() => {
            this.opacity = 0;
            this.emit();

            this.resetTimer = setTimeout(() => {
                if (this.activeCount > 0) {
                    this.status = "loading";
                    this.progress = Math.min(this.progress, 30);
                    this.opacity = 1;
                    this.emit();
                    this.scheduleTrickle();
                    return;
                }

                this.progress = 0;
                this.opacity = 0;
                this.visible = false;
                this.status = "idle";
                this.emit();
            }, 400);
        }, 120);
    }

    private ensureWatchdog() {
        if (this.watchdogTimer) {
            return;
        }

        this.watchdogTimer = setTimeout(() => {
            // Safety net: avoid visual stuck bar when a request never settles.
            this.activeCount = 0;
            this.finish();
        }, TopProgressController.MAX_LOADING_MS);
    }

    private clearWatchdog() {
        if (!this.watchdogTimer) {
            return;
        }

        clearTimeout(this.watchdogTimer);
        this.watchdogTimer = null;
    }

    private scheduleTrickle() {
        this.clearTimer("trickleTimer");

        if (this.activeCount <= 0 || this.progress >= 80) {
            return;
        }

        this.trickleTimer = setTimeout(() => {
            const remaining = 80 - this.progress;
            const increment = Math.max(remaining * 0.18, 1.2);

            this.progress = Math.min(80, this.progress + increment);
            this.emit();
            this.scheduleTrickle();
        }, 180);
    }

    private getSnapshot(): ProgressSnapshot {
        return {
            progress: this.progress,
            visible: this.visible,
            opacity: this.opacity,
            status: this.status,
        };
    }

    private emit() {
        const snapshot = this.getSnapshot();

        this.listeners.forEach((listener) => {
            listener(snapshot);
        });
    }

    private clearTimer(timerKey: "bootstrapTimer" | "trickleTimer" | "fadeTimer" | "resetTimer" | "errorTimer") {
        const timer = this[timerKey];

        if (timer) {
            clearTimeout(timer);
            this[timerKey] = null;
        }
    }
}

export const topProgress = new TopProgressController();

export const useTopProgress = () => topProgress;

export type { ProgressSnapshot, ProgressStatus };