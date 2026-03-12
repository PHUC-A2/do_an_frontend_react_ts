import { useEffect, useRef } from "react";
import { useTopProgress, type ProgressSnapshot } from "../../../hooks/common/useTopProgress";

const BAR_GRADIENT = "linear-gradient(90deg, #ffd666 0%, #faad14 50%, #d48806 100%)";
const ERROR_GRADIENT = "linear-gradient(90deg, #ff7875 0%, #ff4d4f 100%)";

const applySnapshot = (element: HTMLDivElement, snapshot: ProgressSnapshot) => {
    element.style.opacity = String(snapshot.opacity);
    element.style.transform = `scaleX(${snapshot.progress / 100})`;
    element.style.backgroundImage = snapshot.status === "error" ? ERROR_GRADIENT : BAR_GRADIENT;
    element.style.visibility = snapshot.visible ? "visible" : "hidden";
};

const TopProgressBar = () => {
    const progress = useTopProgress();
    const barRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!barRef.current) {
            return;
        }

        const unsubscribe = progress.subscribe((snapshot) => {
            if (!barRef.current) {
                return;
            }

            applySnapshot(barRef.current, snapshot);
        });

        let loadSettled = false;

        const completeInitialLoad = () => {
            if (loadSettled) {
                return;
            }

            loadSettled = true;
            progress.done();
        };

        progress.start();

        const fallbackTimer = setTimeout(completeInitialLoad, 1200);

        if (document.readyState === "complete") {
            const readyTimer = setTimeout(completeInitialLoad, 240);

            return () => {
                clearTimeout(readyTimer);
                clearTimeout(fallbackTimer);
                unsubscribe();
                completeInitialLoad();
            };
        }

        window.addEventListener("load", completeInitialLoad, { once: true });

        return () => {
            window.removeEventListener("load", completeInitialLoad);
            clearTimeout(fallbackTimer);
            unsubscribe();
            completeInitialLoad();
        };
    }, [progress]);

    return (
        <div
            aria-hidden="true"
            style={{
                inset: 0,
                bottom: "auto",
                height: 3,
                pointerEvents: "none",
                position: "fixed",
                zIndex: 9999,
            }}
        >
            <div
                ref={barRef}
                style={{
                    backgroundImage: BAR_GRADIENT,
                    boxShadow: "0 0 14px rgba(250, 173, 20, 0.45)",
                    height: "100%",
                    opacity: 0,
                    transform: "scaleX(0)",
                    transformOrigin: "left center",
                    transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease, background-image 180ms ease",
                    visibility: "hidden",
                    width: "100%",
                    willChange: "transform, opacity",
                }}
            />
        </div>
    );
};

export default TopProgressBar;