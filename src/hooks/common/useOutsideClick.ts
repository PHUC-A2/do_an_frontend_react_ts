import { useEffect, type RefObject } from "react";

type OutsideEvent = MouseEvent | TouchEvent;

export const useOutsideClick = <T extends HTMLElement>(
    ref: RefObject<T | null>,
    onOutsideClick: () => void,
    enabled = true,
) => {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        const handlePointerDown = (event: OutsideEvent) => {
            const target = event.target as Node | null;

            if (!ref.current || !target || ref.current.contains(target)) {
                return;
            }

            onOutsideClick();
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("touchstart", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
        };
    }, [enabled, onOutsideClick, ref]);
};
