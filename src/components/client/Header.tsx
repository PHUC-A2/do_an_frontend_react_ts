import { Avatar, Switch, Tooltip } from 'antd';
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
    FiBell,
    FiBookOpen,
    FiCalendar,
    FiChevronDown,
    FiEdit3,
    FiHome,
    FiInfo,
    FiKey,
    FiLogIn,
    FiLogOut,
    FiMapPin,
    FiMenu,
    FiMoon,
    FiSearch,
    FiShield,
    FiSun,
    FiUser,
    FiUserPlus,
    FiX,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { toast } from 'react-toastify';
import { logout } from '../../config/Api';
import { useOutsideClick } from '../../hooks/common/useOutsideClick';
import ModalAccount from '../../pages/auth/modal/ModalAccount';
import ModalForget from '../../pages/auth/modal/ModalForget';
import ModalUpdateAccount from '../../pages/auth/modal/ModalUpdateAccount';
import ModalBookingHistory from '../../pages/client/booking/modals/ModalBookingHistory';
import { setLogout } from '../../redux/features/authSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { hasRole } from '../../utils/role';
import styles from './Header.module.scss';
import LogoGlow from '../logo-glow/LogoGlow';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

interface NavItem {
    key: 'home' | 'pitch' | 'booking' | 'about';
    label: string;
    to: string;
    matches: string[];
    icon: IconType;
}

const NAV_ITEMS: NavItem[] = [
    { key: 'home', label: 'Trang chủ', to: '/', matches: ['/'], icon: FiHome },
    { key: 'pitch', label: 'Sân bóng', to: '/pitch', matches: ['/pitch'], icon: FiMapPin },
    { key: 'booking', label: 'Đặt sân', to: '/pitch', matches: ['/booking'], icon: FiBookOpen },
    { key: 'about', label: 'Giới thiệu', to: '/about', matches: ['/about'], icon: FiInfo },
];

const buildCssVars = (isDark: boolean): CSSProperties => ({
    '--header-accent': '#faad14',
    '--header-accent-strong': '#d48806',
    '--header-hover-text': isDark ? '#faad14' : '#92700a',
    '--header-surface-soft': isDark ? 'rgba(15, 28, 43, 0.86)' : 'rgba(248, 250, 252, 0.9)',
    '--header-surface-solid': isDark ? '#0f1c2b' : '#f8fafc',
    '--header-panel': isDark ? '#102033' : '#ffffff',
    '--header-border': isDark ? 'rgba(250, 173, 20, 0.14)' : 'rgba(15, 23, 42, 0.12)',
    '--header-text': isDark ? '#e2e8f0' : '#1a2733',
    '--header-muted': isDark ? '#94a3b8' : '#5a6a7e',
    '--header-hover': isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(250, 173, 20, 0.12)',
    '--header-shadow': isDark ? '0 18px 48px rgba(2, 6, 23, 0.35)' : '0 18px 42px rgba(15, 23, 42, 0.10)',
    '--header-overlay': 'rgba(5, 8, 16, 0.54)',
    '--header-menu-shadow': isDark ? '0 22px 48px rgba(2, 6, 23, 0.55)' : '0 22px 48px rgba(15, 23, 42, 0.16)',
}) as CSSProperties;

const getHeaderHeight = (compact: boolean) => {
    if (typeof window === 'undefined') {
        return compact ? 52 : 70;
    }

    const isMobileViewport = window.innerWidth <= 768;

    if (isMobileViewport) {
        return compact ? 56 : 68;
    }

    return compact ? 52 : 70;
};

const DEFAULT_PITCH_PAGE_SIZE = 12;

const buildPitchSearchPath = (keyword: string) => {
    const params = new URLSearchParams();
    const trimmedKeyword = keyword.trim();

    params.set('page', '1');
    params.set('pageSize', String(DEFAULT_PITCH_PAGE_SIZE));

    if (trimmedKeyword) {
        params.set('keyword', trimmedKeyword);
    }

    return `/pitch?${params.toString()}`;
};

const Header = ({ theme, toggleTheme }: HeaderProps) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [compact, setCompact] = useState(false);
    const [openModalAccount, setOpenModalAccount] = useState(false);
    const [openModalUpdateAccount, setOpenModalUpdateAccount] = useState(false);
    const [openModalForget, setOpenModalForget] = useState(false);
    const [openModalBookingHistory, setOpenModalBookingHistory] = useState(false);

    const account = useAppSelector((state) => state.account.account);
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const accountMenuRef = useRef<HTMLDivElement | null>(null);
    const desktopSearchRef = useRef<HTMLDivElement | null>(null);
    const mobileSearchRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
    const searchSubmitIntentRef = useRef<'enter' | null>(null);
    const searchDirtyRef = useRef(false);
    const lastScrollYRef = useRef(0);
    const tickingRef = useRef(false);

    const isDark = theme === 'dark';
    const displayName = account?.fullName || account?.name || 'Tài khoản của bạn';
    const roleLabel = account?.roles?.[0]?.name || 'MEMBER';
    const canOpenAdmin = hasRole(account, 'ADMIN');
    const initials = (displayName.trim()[0] || 'U').toUpperCase();

    useOutsideClick(accountMenuRef, () => setAccountMenuOpen(false), accountMenuOpen);
    useOutsideClick(desktopSearchRef, () => {
        if (window.innerWidth > 768) {
            setSearchOpen(false);
        }
    }, searchOpen);
    useOutsideClick(mobileSearchRef, () => {
        if (window.innerWidth <= 768) {
            setSearchOpen(false);
        }
    }, searchOpen);

    useEffect(() => {
        const vars = buildCssVars(isDark);
        const entries = Object.entries(vars);
        entries.forEach(([key, value]) => {
            if (typeof value === 'string') {
                document.documentElement.style.setProperty(key, value);
            }
        });
        return () => {
            entries.forEach(([key]) => {
                document.documentElement.style.removeProperty(key);
            });
        };
    }, [isDark]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setSearchValue(params.get('keyword') ?? '');
        searchDirtyRef.current = false;
        setSearchOpen(false);
    }, [location.pathname, location.search]);

    useEffect(() => {
        if (!searchOpen) {
            return;
        }

        if (window.innerWidth <= 768) {
            mobileSearchInputRef.current?.focus();
            return;
        }

        searchInputRef.current?.focus();
    }, [searchOpen]);

    useEffect(() => {
        if (!drawerOpen) {
            return;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [drawerOpen]);


    useEffect(() => {
        const updateHeaderHeight = () => {
            document.documentElement.style.setProperty('--header-height', `${getHeaderHeight(compact)}px`);
        };

        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);

        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            document.documentElement.style.setProperty('--header-height', '70px');
        };
    }, [compact]);

    useEffect(() => {
        const updateOnScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollingDown = currentScrollY > lastScrollYRef.current;
            const scrollingUp = currentScrollY < lastScrollYRef.current;

            if (currentScrollY <= 24) {
                setCompact(false);
            } else if (currentScrollY > 80 && scrollingDown) {
                setCompact(true);
            } else if (scrollingUp) {
                setCompact(false);
            }

            lastScrollYRef.current = currentScrollY;
            tickingRef.current = false;
        };

        const handleScroll = () => {
            if (tickingRef.current) {
                return;
            }

            tickingRef.current = true;
            window.requestAnimationFrame(updateOnScroll);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const closeAllPanels = () => {
        setDrawerOpen(false);
        setAccountMenuOpen(false);
        setSearchOpen(false);
    };

    const handleLogout = async () => {
        try {
            const response = await logout();

            if (response?.data?.statusCode === 200) {
                dispatch(setLogout());
                closeAllPanels();
                toast.success('Đăng xuất thành công');
                navigate('/');
            }
        } catch (error: unknown) {
            const message = typeof error === 'object' && error !== null && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(message || 'Có lỗi xảy ra');
        }
    };

    const handleDesktopSearchAction = () => {
        setAccountMenuOpen(false);

        if (!searchOpen) {
            setSearchOpen(true);
            return;
        }

        submitPitchSearch();
    };

    const handleMobileSearchAction = () => {
        setDrawerOpen(false);

        if (!searchOpen) {
            setSearchOpen(true);
            return;
        }

        submitPitchSearch();
    };

    const submitPitchSearch = () => {
        const trimmedKeyword = searchValue.trim();
        const currentPath = `${location.pathname}${location.search}`;
        const isPitchListingPage = location.pathname === '/pitch';
        const nextPath = trimmedKeyword
            ? buildPitchSearchPath(trimmedKeyword)
            : (isPitchListingPage ? buildPitchSearchPath('') : currentPath);

        if (currentPath === nextPath) {
            setDrawerOpen(false);
            setAccountMenuOpen(false);
            setSearchOpen(false);
            return;
        }

        setDrawerOpen(false);
        setAccountMenuOpen(false);
        setSearchOpen(false);
        navigate(nextPath);
    };

    const markEnterSubmitIntent = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            searchSubmitIntentRef.current = 'enter';
            return;
        }

        searchSubmitIntentRef.current = null;
    };

    const handleSearchFormSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Prevent accidental submits (tap outside/header interactions); only Enter can submit form.
        if (searchSubmitIntentRef.current !== 'enter') {
            searchSubmitIntentRef.current = null;
            return;
        }

        searchSubmitIntentRef.current = null;
        submitPitchSearch();
    };

    const handleNotifications = () => {
        closeAllPanels();

        if (!isAuthenticated) {
            toast.info('Đăng nhập để nhận thông báo đặt sân.');
            navigate('/login');
            return;
        }

        toast.info('Bạn chưa có thông báo mới.');
    };

    const handleBookingShortcut = () => {
        closeAllPanels();

        if (!isAuthenticated) {
            toast.info('Vui lòng đăng nhập để xem lịch đặt sân.');
            navigate('/login');
            return;
        }

        setOpenModalBookingHistory(true);
    };

    const openAccountInfo = () => {
        closeAllPanels();
        setOpenModalAccount(true);
    };

    const openAccountUpdate = () => {
        closeAllPanels();
        setOpenModalUpdateAccount(true);
    };

    const openPasswordReset = () => {
        closeAllPanels();
        setOpenModalForget(true);
    };

    const openAdminPortal = () => {
        closeAllPanels();
        navigate('/admin');
    };

    const isActiveLink = (item: NavItem) => {
        if (item.key === 'home') {
            return location.pathname === '/';
        }

        return item.matches.some((match) => location.pathname.startsWith(match));
    };

    return (
        <>
            <header className={`${styles.header}${compact ? ` ${styles.compact}` : ''}`}>
                <div className={styles.headerInner}>
                    <Link to="/" className={styles.brand} onClick={closeAllPanels}>
                        <LogoGlow variant="header" />
                        <div className={styles.brandText}>
                            <span className={styles.brandTitle}>UTB <em>Sport</em></span>
                            <span className={styles.brandSubtitle}>Đặt sân chuyên nghiệp</span>
                        </div>
                    </Link>

                    <nav className={styles.desktopNav} aria-label="Điều hướng chính">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.key}
                                to={item.to}
                                className={`${styles.navLink}${isActiveLink(item) ? ` ${styles.navLinkActive}` : ''}`}
                            >
                                <item.icon className={styles.navLinkIcon} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className={styles.desktopActions}>
                        <div className={`${styles.desktopSearchShell}${searchOpen ? ` ${styles.desktopSearchShellOpen}` : ''}`} ref={desktopSearchRef}>
                            <form
                                className={`${styles.desktopSearchForm}${searchOpen ? ` ${styles.desktopSearchFormOpen}` : ''}`}
                                onSubmit={handleSearchFormSubmit}
                            >
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className={styles.desktopSearchInput}
                                    value={searchValue}
                                    onChange={(event) => {
                                        searchDirtyRef.current = true;
                                        setSearchValue(event.target.value);
                                    }}
                                    placeholder="Tìm tên sân, khu vực..."
                                    aria-label="Từ khóa tìm sân"
                                    onKeyDown={markEnterSubmitIntent}
                                />
                                {searchValue.trim() ? (
                                    <button
                                        type="button"
                                        className={styles.searchClear}
                                        onClick={() => {
                                            searchDirtyRef.current = true;
                                            setSearchValue('');
                                            searchInputRef.current?.focus();
                                        }}
                                        aria-label="Xóa từ khóa tìm kiếm"
                                    >
                                        <FiX />
                                    </button>
                                ) : null}
                            </form>

                            <Tooltip title="Tìm kiếm sân" placement="bottom" classNames={{ root: styles.headerTooltip }}>
                                <button
                                    type="button"
                                    className={`${styles.actionButton} ${styles.desktopSearchToggle}${searchOpen ? ` ${styles.actionButtonActive}` : ''}`}
                                    onClick={handleDesktopSearchAction}
                                    aria-label="Tìm kiếm sân"
                                    aria-expanded={searchOpen}
                                >
                                    <FiSearch />
                                </button>
                            </Tooltip>
                        </div>
                        <Tooltip title="Thông báo" placement="bottom" classNames={{ root: styles.headerTooltip }}>
                            <button type="button" className={styles.actionButton} onClick={handleNotifications} aria-label="Thông báo">
                                <FiBell />
                                <span className={styles.notificationDot} aria-hidden="true" />
                            </button>
                        </Tooltip>
                        <Tooltip title="Lịch đặt sân" placement="bottom" classNames={{ root: styles.headerTooltip }}>
                            <button type="button" className={styles.actionButton} onClick={handleBookingShortcut} aria-label="Lịch đặt sân">
                                <FiCalendar />
                            </button>
                        </Tooltip>

                        {isAuthenticated ? (
                            <div className={styles.accountShell} ref={accountMenuRef}>
                                <button
                                    type="button"
                                    className={`${styles.accountTrigger}${accountMenuOpen ? ` ${styles.accountTriggerOpen}` : ''}`}
                                    onClick={() => setAccountMenuOpen((current) => !current)}
                                    aria-expanded={accountMenuOpen}
                                    aria-haspopup="menu"
                                    aria-label="Mở menu tài khoản"
                                >
                                    <Avatar src={account?.avatarUrl || undefined} size={36}>
                                        {!account?.avatarUrl && initials}
                                    </Avatar>
                                    <FiChevronDown className={styles.accountChevron} />
                                </button>

                                <div className={`${styles.accountMenu}${accountMenuOpen ? ` ${styles.accountMenuOpen}` : ''}`} role="menu">
                                    <div className={styles.accountCardTop}>
                                        <Avatar src={account?.avatarUrl || undefined} size={60}>
                                            {!account?.avatarUrl && initials}
                                        </Avatar>
                                        <div className={styles.accountCardMeta}>
                                            <span className={styles.accountName}>{displayName}</span>
                                            <span className={styles.accountEmail}>{account?.email || 'Không có email'}</span>
                                            <span className={styles.roleBadge}>{roleLabel}</span>
                                        </div>
                                    </div>

                                    <div className={styles.accountMenuList}>
                                        {canOpenAdmin ? (
                                            <button type="button" className={styles.accountMenuItem} onClick={openAdminPortal}>
                                                <FiShield />
                                                <span>Trang quản trị</span>
                                            </button>
                                        ) : null}
                                        <button type="button" className={styles.accountMenuItem} onClick={openAccountInfo}>
                                            <FiUser />
                                            <span>Thông tin tài khoản</span>
                                        </button>
                                        <button type="button" className={styles.accountMenuItem} onClick={openAccountUpdate}>
                                            <FiEdit3 />
                                            <span>Cập nhật tài khoản</span>
                                        </button>
                                        <button type="button" className={styles.accountMenuItem} onClick={openPasswordReset}>
                                            <FiKey />
                                            <span>Đổi mật khẩu</span>
                                        </button>
                                        <button type="button" className={`${styles.accountMenuItem} ${styles.logoutAction}`} onClick={handleLogout}>
                                            <FiLogOut />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>

                                    <div className={styles.accountMenuFooter}>
                                        <span>Giao diện</span>
                                        <Switch
                                            size="small"
                                            checked={isDark}
                                            onChange={toggleTheme}
                                            checkedChildren={<FiMoon />}
                                            unCheckedChildren={<FiSun />}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button type="button" className={styles.loginButton} onClick={() => navigate('/login')}>
                                <FiLogIn />
                                <span>Đăng nhập</span>
                            </button>
                        )}
                    </div>

                    <div className={styles.mobileHeaderActions}>
                        <div className={`${styles.mobileSearchShell}${searchOpen ? ` ${styles.mobileSearchShellOpen}` : ''}`} ref={mobileSearchRef}>
                            <form
                                className={`${styles.mobileSearchForm}${searchOpen ? ` ${styles.mobileSearchFormOpen}` : ''}`}
                                onSubmit={handleSearchFormSubmit}
                            >
                                <input
                                    ref={mobileSearchInputRef}
                                    type="text"
                                    className={styles.mobileSearchInput}
                                    value={searchValue}
                                    onChange={(event) => {
                                        searchDirtyRef.current = true;
                                        setSearchValue(event.target.value);
                                    }}
                                    placeholder="Tìm tên sân..."
                                    aria-label="Tìm sân trên mobile"
                                    onKeyDown={markEnterSubmitIntent}
                                />
                                {searchValue.trim() ? (
                                    <button
                                        type="button"
                                        className={`${styles.searchClear} ${styles.mobileSearchClear}`}
                                        onClick={() => {
                                            searchDirtyRef.current = true;
                                            setSearchValue('');
                                            mobileSearchInputRef.current?.focus();
                                        }}
                                        aria-label="Xóa từ khóa tìm kiếm"
                                    >
                                        <FiX />
                                    </button>
                                ) : null}
                            </form>
                            <button
                                type="button"
                                className={`${styles.actionButton} ${styles.mobileSearchToggle}${searchOpen ? ` ${styles.actionButtonActive}` : ''}`}
                                onClick={handleMobileSearchAction}
                                aria-label="Tìm kiếm sân"
                                aria-expanded={searchOpen}
                            >
                                <FiSearch />
                            </button>
                        </div>

                        <button
                            type="button"
                            className={`${styles.mobileMenuButton}${drawerOpen ? ` ${styles.mobileMenuButtonOpen}` : ''}`}
                            onClick={() => {
                                setSearchOpen(false);
                                setDrawerOpen((current) => !current);
                            }}
                            aria-label={drawerOpen ? 'Đóng menu' : 'Mở menu'}
                            aria-expanded={drawerOpen}
                        >
                            <span className={styles.mobileMenuIconWrap} aria-hidden="true">
                                <FiMenu className={styles.mobileMenuIconMenu} />
                                <FiX className={styles.mobileMenuIconClose} />
                            </span>
                        </button>
                    </div>
                </div>

            </header>

            <div
                className={`${styles.mobileOverlay}${drawerOpen ? ` ${styles.mobileOverlayOpen}` : ''}`}
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
            />

            <aside className={`${styles.mobileDrawer}${drawerOpen ? ` ${styles.mobileDrawerOpen}` : ''}`} aria-label="Menu di động">
                <div className={styles.drawerHeader}>
                    {isAuthenticated ? (
                        <div className={styles.drawerUserBlock}>
                            <Avatar src={account?.avatarUrl || undefined} size={40}>
                                {!account?.avatarUrl && initials}
                            </Avatar>
                            <div>
                                <div className={styles.drawerTitle}>{displayName}</div>
                                <div className={styles.drawerEmail}>{account?.email || 'Không có email'}</div>
                                <span className={styles.drawerRole}>{roleLabel}</span>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.drawerGuestBlock}>
                            <span className={styles.drawerSectionTitle}>Tài khoản</span>
                            <div className={styles.drawerAuthActions}>
                                <button type="button" className={styles.primaryDrawerButton} onClick={() => { setDrawerOpen(false); navigate('/login'); }}>
                                    <FiLogIn />
                                    <span>Đăng nhập</span>
                                </button>
                                <button type="button" className={styles.secondaryDrawerButton} onClick={() => { setDrawerOpen(false); navigate('/register'); }}>
                                    <FiUserPlus />
                                    <span>Đăng ký</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <nav className={styles.drawerNav}>
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.key}
                            to={item.to}
                            className={`${styles.drawerNavLink}${isActiveLink(item) ? ` ${styles.drawerNavLinkActive}` : ''}`}
                            onClick={() => setDrawerOpen(false)}
                        >
                            <item.icon className={styles.drawerNavIcon} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.drawerQuickActions}>
                    <button type="button" className={styles.drawerQuickButton} onClick={handleNotifications}>
                        <FiBell />
                        <span>Thông báo</span>
                    </button>
                    <button type="button" className={styles.drawerQuickButton} onClick={handleBookingShortcut}>
                        <FiCalendar />
                        <span>Lịch đặt</span>
                    </button>
                </div>

                {isAuthenticated ? (
                    <div className={styles.drawerAccountActions}>
                        {canOpenAdmin ? (
                            <button type="button" className={styles.drawerActionItem} onClick={openAdminPortal}>
                                <FiShield />
                                <span>Trang quản trị</span>
                            </button>
                        ) : null}
                        <button type="button" className={styles.drawerActionItem} onClick={openAccountInfo}>
                            <FiUser />
                            <span>Thông tin tài khoản</span>
                        </button>
                        <button type="button" className={styles.drawerActionItem} onClick={openAccountUpdate}>
                            <FiEdit3 />
                            <span>Cập nhật tài khoản</span>
                        </button>
                        <button type="button" className={styles.drawerActionItem} onClick={openPasswordReset}>
                            <FiKey />
                            <span>Đổi mật khẩu</span>
                        </button>
                        <button type="button" className={`${styles.drawerActionItem} ${styles.logoutAction}`} onClick={handleLogout}>
                            <FiLogOut />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                ) : null}

                <div className={styles.drawerBottom}>
                    <span>Giao diện</span>
                    <Switch
                        size="small"
                        checked={isDark}
                        onChange={toggleTheme}
                        checkedChildren={<FiMoon />}
                        unCheckedChildren={<FiSun />}
                    />
                </div>
            </aside>

            <ModalAccount
                openModalAccount={openModalAccount}
                setOpenModalAccount={setOpenModalAccount}
            />
            <ModalUpdateAccount
                openModalUpdateAccount={openModalUpdateAccount}
                setOpenModalUpdateAccount={setOpenModalUpdateAccount}
            />
            <ModalForget open={openModalForget} setOpen={setOpenModalForget} />
            <ModalBookingHistory
                openModalBookingHistory={openModalBookingHistory}
                setOpenModalBookingHistory={setOpenModalBookingHistory}
            />
        </>
    );
};

export default Header;