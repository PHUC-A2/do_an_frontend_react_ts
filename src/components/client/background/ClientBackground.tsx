import styles from './ClientBackground.module.scss';
import backgroundImage from '../../../assets/background-01.png';

interface ClientBackgroundProps {
    theme: 'light' | 'dark';
}

const ClientBackground = ({ theme }: ClientBackgroundProps) => {
    return (
        <div className={styles.root} data-theme={theme} aria-hidden="true">
            <div className={styles.imageWrap}>
                <img
                    src={backgroundImage}
                    alt=""
                    className={styles.bgImage}
                    decoding="async"
                />
            </div>
            <div className={styles.veil} />
        </div>
    );
};

export default ClientBackground;
