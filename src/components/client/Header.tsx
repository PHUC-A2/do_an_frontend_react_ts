import { Menu, Button, Dropdown, Space, Switch, Tooltip, Grid } from 'antd';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import {
    AiFillHome, AiOutlineLogin, AiOutlineLogout,
    AiOutlineUserAdd, AiFillDashboard, AiFillCodepenCircle,
} from 'react-icons/ai';
import { MdAccountCircle, MdWorkHistory } from 'react-icons/md';
import { FaInfoCircle } from 'react-icons/fa';
import ModalAccount from '../../pages/auth/modal/ModalAccount';
import type { MenuProps } from 'antd';
import { LuMoon } from 'react-icons/lu';
import { IoSettingsOutline, IoSunny } from 'react-icons/io5';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../config/Api';
import { setLogout } from '../../redux/features/authSlice';
import { toast } from 'react-toastify';
import ModalBookingHistory from '../../pages/client/booking/modals/ModalBookingHistory';
import { useRole } from '../../hooks/common/useRole';
import styles from './Header.module.scss';
import LogoGlow from '../logo-glow/LogoGlow';

const { useBreakpoint } = Grid;

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

function buildCssVars(isDark: boolean, scrolled: boolean): React.CSSProperties {
    return {
        '--fp-gold': '#faad14',
        '--fp-text': isDark ? '#e2e8f0' : '#1a2733',
        '--fp-muted': isDark ? '#475569' : '#94a3b8',
        '--fp-header-bg': isDark
            ? (scrolled ? 'rgba(0,21,41,0.97)' : 'rgba(0,21,41,0.88)')
            : (scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.88)'),
        '--fp-border': isDark
            ? '1px solid rgba(250,173,20,0.1)'
            : '1px solid rgba(0,0,0,0.07)',
        '--fp-shadow': scrolled
            ? (isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)')
            : 'none',
        '--fp-panel-bg': isDark ? '#001529' : '#ffffff',
        '--fp-panel-shadow': isDark
            ? '0 16px 40px rgba(0,0,0,0.6)'
            : '0 16px 40px rgba(0,0,0,0.12)',
        '--fp-hover-bg': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        '--fp-icon-bg': isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        '--fp-link-active-bg': isDark ? 'rgba(250,173,20,0.10)' : 'rgba(250,173,20,0.08)',
        '--fp-link-active-bg-strong': isDark ? 'rgba(250,173,20,0.14)' : 'rgba(250,173,20,0.10)',
        '--fp-divider': isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    } as React.CSSProperties;
}

// ── Animated hamburger ────────────────────────────────────────
const HamburgerIcon = ({ open, color }: { open: boolean; color: string }) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect className="hb-top" x="3" y="6" width="16" height="2" rx="1" fill={color}
            style={{ transform: open ? 'rotate(45deg) translateY(4px)' : undefined }} />
        <rect className="hb-mid" x="3" y="10" width="16" height="2" rx="1" fill={color}
            style={{ opacity: open ? 0 : 1, transform: open ? 'scaleX(0)' : undefined }} />
        <rect className="hb-bot" x="3" y="14" width="16" height="2" rx="1" fill={color}
            style={{ transform: open ? 'rotate(-45deg) translateY(-4px)' : undefined }} />
    </svg>
);

// ─────────────────────────────────────────────────────────────
const Header = ({ theme, toggleTheme }: HeaderProps) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openModalAccount, setOpenModalAccount] = useState(false);
    const [openModalBookingHistory, setOpenModalBookingHistory] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const screens = useBreakpoint();
    const isViewRole = useRole('VIEW');

    const isDark = theme === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#1a2733';
    const cssVars = buildCssVars(isDark, scrolled);

    const activeKey = (() => {
        if (location.pathname === '/') return 'home';
        if (location.pathname.startsWith('/pitch')) return 'pitch';
        if (location.pathname.startsWith('/about')) return 'about';
        return '';
    })();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => { if (screens.md) setMobileOpen(false); }, [screens.md]);
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const handleLogout = async () => {
        try {
            const res = await logout();
            if (res?.data?.statusCode === 200) {
                dispatch(setLogout());
                toast.success('Đăng xuất thành công');
                navigate('/');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    const linkStyle = { textDecoration: 'none', color: textColor };

    const mainMenuItems: MenuProps['items'] = [
        { label: <Link to="/" style={linkStyle}>Trang chủ</Link>, key: 'home', icon: <AiFillHome /> },
        { label: <Link to="/pitch" style={linkStyle}>Sân bóng</Link>, key: 'pitch', icon: <AiFillCodepenCircle /> },
        { label: <Link to="/about" style={linkStyle}>Về chúng tôi</Link>, key: 'about', icon: <FaInfoCircle /> },
    ];

    const settingsMenu: MenuProps['items'] = isAuthenticated
        ? [
            {
                label: <Link to="#" onClick={() => setOpenModalAccount(true)} style={linkStyle}>Tài khoản</Link>,
                key: 'account', icon: <MdAccountCircle />,
            },
            {
                label: <Link to="#" style={linkStyle} onClick={handleLogout}>Đăng xuất</Link>,
                key: 'logout', icon: <AiOutlineLogout />,
            },
            ...(!isViewRole ? [{
                label: <Link to="/admin" style={linkStyle}>Trang quản trị</Link>,
                key: 'admin', icon: <AiFillDashboard />,
            }] : []),
        ]
        : [
            { label: <Link to="/login" style={linkStyle}>Đăng nhập</Link>, key: 'login', icon: <AiOutlineLogin /> },
            { label: <Link to="/register" style={linkStyle}>Đăng ký</Link>, key: 'register', icon: <AiOutlineUserAdd /> },
        ];

    const mobileNavLinks = [
        { to: '/', label: 'Trang chủ', icon: <AiFillHome />, key: 'home' },
        { to: '/pitch', label: 'Sân bóng', icon: <AiFillCodepenCircle />, key: 'pitch' },
        { to: '/about', label: 'Về chúng tôi', icon: <FaInfoCircle />, key: 'about' },
    ];

    return (
        <>
            {/* ── Header bar ──────────────────────────────────── */}
            <header className={styles.fpHeader} style={cssVars}>

                {/* ── Logo ── */}
                <Link to="/" className={styles.fpLogo} onClick={() => setMobileOpen(false)}>
                    <LogoGlow variant="header" />
                    <div className={styles.fpLogoText}>
                        <span className={styles.fpLogoName}>TBU <em>Sport</em></span>
                        <span className={styles.fpLogoTagline}>Đặt sân · Thi đấu</span>
                    </div>
                </Link>

                {/* Desktop nav */}
                <div className={styles.fpDesktopOnly} style={{ flex: 1 }}>
                    <Menu
                        onClick={() => setMobileOpen(false)}
                        selectedKeys={[activeKey]}
                        mode="horizontal"
                        theme={isDark ? 'dark' : 'light'}
                        items={mainMenuItems}
                        className="fp-menu"
                    />
                </div>

                {/* Right controls */}
                <Space size={4} style={{ marginLeft: 'auto' }}>
                    {isAuthenticated && (
                        <Tooltip title="Lịch đặt sân" placement="bottom">
                            <div className={styles.fpIconBtn}
                                onClick={() => setOpenModalBookingHistory(true)}>
                                <MdWorkHistory size={19} />
                            </div>
                        </Tooltip>
                    )}

                    {/* Theme switch — desktop only */}
                    <div className={styles.fpDesktopOnly}>
                        <Tooltip title={isDark ? 'Giao diện sáng' : 'Giao diện tối'} placement="bottom">
                            <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px' }}>
                                <Switch size="small" checked={isDark} onChange={toggleTheme}
                                    checkedChildren={<LuMoon />} unCheckedChildren={<IoSunny />} />
                            </div>
                        </Tooltip>
                    </div>

                    {/* Settings dropdown — desktop only */}
                    <div className={styles.fpDesktopOnly}>
                        <Dropdown menu={{ items: settingsMenu }} placement="bottomRight" trigger={['click']}>
                            <Button type="text" icon={<IoSettingsOutline />} className="fp-acct-btn">
                                Tài khoản
                            </Button>
                        </Dropdown>
                    </div>

                    {/* Hamburger — mobile only */}
                    <button
                        className={`${styles.fpHamburger} ${styles.fpMobileOnly}`}
                        onClick={() => setMobileOpen(v => !v)}
                        aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
                        aria-expanded={mobileOpen}
                    >
                        <HamburgerIcon open={mobileOpen} color={textColor} />
                    </button>
                </Space>
            </header>

            {/* ── Mobile backdrop ─────────────────────────────── */}
            <div
                className={`${styles.fpMobileOverlay}${mobileOpen ? ` ${styles.open}` : ''}`}
                style={cssVars}
                onClick={() => setMobileOpen(false)}
                aria-hidden
            />

            {/* ── Mobile slide-down panel ──────────────────────── */}
            <div
                className={`${styles.fpMobilePanel}${mobileOpen ? ` ${styles.open}` : ''}`}
                style={cssVars}
                role="navigation"
            >
                <nav className={styles.fpMobileNav}>
                    {mobileNavLinks.map(link => (
                        <Link
                            key={link.key}
                            to={link.to}
                            className={`${styles.fpMobileLink}${activeKey === link.key ? ` ${styles.active}` : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className={styles.fpMobileLinkIcon}>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.fpMobileDivider} />

                <div className={styles.fpMobileActions}>
                    <span className={styles.fpMobileActionLabel}>Giao diện</span>
                    <div className={styles.fpMobileActionRow}>
                        <Switch size="small" checked={isDark} onChange={toggleTheme}
                            checkedChildren={<LuMoon />} unCheckedChildren={<IoSunny />} />
                        <Dropdown menu={{ items: settingsMenu }} placement="bottomRight" trigger={['click']}>
                            <Button
                                size="small"
                                icon={<IoSettingsOutline />}
                                style={{
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    color: textColor,
                                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                                    background: 'transparent',
                                }}
                            >
                                Tài khoản
                            </Button>
                        </Dropdown>
                    </div>
                </div>
            </div>

            {/* ── Modals ──────────────────────────────────────── */}
            <ModalAccount
                openModalAccount={openModalAccount}
                setOpenModalAccount={setOpenModalAccount}
            />
            <ModalBookingHistory
                openModalBookingHistory={openModalBookingHistory}
                setOpenModalBookingHistory={setOpenModalBookingHistory}
            />
        </>
    );
};

export default Header;