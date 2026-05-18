// ─────────────────────────────────────────────────────────────
// LogoGlow.tsx
// Reusable logo với glow + spinning ring animation
// Usage:
//   <LogoGlow />              → Header size (40px)
//   <LogoGlow variant="footer" /> → Footer size (56px)
// ─────────────────────────────────────────────────────────────
import logoUtb from '../../assets/logo-utb.svg';
import styles from './LogoGlow.module.scss';

interface LogoGlowProps {
    variant?: 'header' | 'footer' | 'splash';
    className?: string;
    alt?: string;
}

const LogoGlow = ({ variant = 'header', className = '', alt = 'TBU Sport logo' }: LogoGlowProps) => {
    const variantClass =
        variant === 'footer' ? styles.footer : variant === 'splash' ? styles.splash : '';

    return (
        <div
            className={`${styles.logoGlowWrapper}${variantClass ? ` ${variantClass}` : ''}${className ? ` ${className}` : ''}`}
        >
            {/* Spinning conic-gradient ring */}
            <div className={styles.logoRing} aria-hidden="true" />

            {/* Logo image với glow + pulse */}
            <img
                src={logoUtb}
                alt={alt}
                className={styles.logoGlowImg}
                draggable={false}
            />
        </div>
    );
};

export default LogoGlow;