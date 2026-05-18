import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import logoUtb from '../../../assets/logo-utb.svg';
import styles from './LoadingScreen.module.scss';

export interface LoadingScreenProps {
    /** true = đang hiển thị overlay boot */
    visible: boolean;
    /** Thời gian fade out (ms) */
    fadeOutMs?: number;
}

interface ParticleSpec {
    id: number;
    angle: number;
    delay: number;
    duration: number;
    size: number;
    radius: number;
}

const PARTICLE_COUNT = 18;
const ROOT_CLASS = 'ls-boot-active';

const LoadingScreen = ({ visible, fadeOutMs = 480 }: LoadingScreenProps) => {
    const [mounted, setMounted] = useState(visible);
    const [phase, setPhase] = useState<'enter' | 'exit' | 'done'>('enter');

    const particles = useMemo<ParticleSpec[]>(
        () =>
            Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
                id: index,
                angle: (360 / PARTICLE_COUNT) * index,
                delay: (index % 7) * 0.22,
                duration: 2.4 + (index % 5) * 0.35,
                size: 3 + (index % 3),
                radius: 72 + (index % 4) * 8,
            })),
        [],
    );

    useEffect(() => {
        if (visible) {
            setMounted(true);
            setPhase('enter');
            document.documentElement.classList.add(ROOT_CLASS);
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }

        if (mounted) {
            setPhase('exit');
        }
    }, [visible, mounted]);

    useEffect(() => {
        if (phase !== 'exit') return undefined;

        const timer = window.setTimeout(() => {
            setMounted(false);
            setPhase('done');
            document.documentElement.classList.remove(ROOT_CLASS);
        }, fadeOutMs);

        return () => window.clearTimeout(timer);
    }, [phase, fadeOutMs]);

    if (!mounted) {
        return null;
    }

    return createPortal(
        <div
            className={`${styles.overlay} ${phase === 'exit' ? styles.exit : ''}`}
            style={{ ['--ls-fade-ms' as string]: `${fadeOutMs}ms` }}
            role="status"
            aria-live="polite"
            aria-label="Đang tải ứng dụng"
        >
            <div className={styles.backdrop} aria-hidden />

            <div className={styles.stage}>
                <div className={styles.heroCluster}>
                    <div className={styles.ambient} aria-hidden />

                    <div className={styles.orbitSystem} aria-hidden>
                        <div className={styles.ringBloom} />
                        <div className={styles.ringTrack} />
                        <div className={styles.ringSpin} />
                        <div className={styles.ringShine} />

                        <div className={styles.particles}>
                            {particles.map((particle) => (
                                <span
                                    key={particle.id}
                                    className={styles.particleOrbit}
                                    style={
                                        {
                                            ['--ls-angle' as string]: `${particle.angle}deg`,
                                            ['--ls-duration' as string]: `${particle.duration}s`,
                                            ['--ls-radius' as string]: `${particle.radius}px`,
                                        } as React.CSSProperties
                                    }
                                >
                                    <span
                                        className={styles.particleDot}
                                        style={
                                            {
                                                ['--ls-delay' as string]: `${particle.delay}s`,
                                                ['--ls-size' as string]: `${particle.size}px`,
                                            } as React.CSSProperties
                                        }
                                    />
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className={styles.logoSlot}>
                        <div className={styles.logoAnim}>
                            <img src={logoUtb} alt="TBU Sport" className={styles.logo} draggable={false} />
                        </div>
                    </div>
                </div>

                <p className={styles.brand}>TBU Sport</p>
                <p className={styles.hint}>Đang khởi động hệ thống...</p>
            </div>
        </div>,
        document.body,
    );
};

export default LoadingScreen;
