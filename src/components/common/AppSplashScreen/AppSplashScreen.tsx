import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LogoGlow from '../../logo-glow/LogoGlow';
import styles from './AppSplashScreen.module.scss';

interface AppSplashScreenProps {
    visible: boolean;
    theme: 'light' | 'dark';
}

const AppSplashScreen = ({ visible, theme }: AppSplashScreenProps) => {
    const [mounted, setMounted] = useState(visible);
    const [hiding, setHiding] = useState(false);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            setHiding(false);
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
        if (mounted) {
            setHiding(true);
        }
    }, [visible, mounted]);

    const handleTransitionEnd = () => {
        if (hiding) {
            setMounted(false);
            setHiding(false);
        }
    };

    if (!mounted) {
        return null;
    }

    return createPortal(
        <div
            className={`${styles.overlay} ${theme === 'dark' ? styles.dark : styles.light} ${hiding ? styles.hiding : ''}`}
            role="status"
            aria-live="polite"
            aria-label="Đang tải"
            onTransitionEnd={handleTransitionEnd}
        >
            <div className={styles.backdrop} aria-hidden />
            <div className={styles.content}>
                <LogoGlow variant="splash" />
                <p className={styles.brand}>TBU Sport</p>
                <p className={styles.hint}>Đang tải...</p>
            </div>
        </div>,
        document.body,
    );
};

export default AppSplashScreen;
