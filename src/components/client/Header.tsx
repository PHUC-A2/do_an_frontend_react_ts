import { Avatar, Button, Flex, Input, Layout, Switch, Tooltip, Typography, type InputRef } from 'antd';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
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

const { Text } = Typography;
const { Header: AntHeader } = Layout;

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
    const searchInputRef = useRef<InputRef | null>(null);
    const mobileSearchInputRef = useRef<InputRef | null>(null);
    const searchDirtyRef = useRef(false);
    const lastScrollYRef = useRef(0);
    const tickingRef = useRef(false);
    const accountMenuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleAccountMouseEnter = () => {
        if (accountMenuCloseTimerRef.current) {
            clearTimeout(accountMenuCloseTimerRef.current);
            accountMenuCloseTimerRef.current = null;
        }
        setAccountMenuOpen(true);
    };

    const handleAccountMouseLeave = () => {
        accountMenuCloseTimerRef.current = setTimeout(() => {
            setAccountMenuOpen(false);
        }, 200);
    };

    const isDark = theme === 'dark';
    const displayName = account?.fullName || account?.name || 'Tài khoản của bạn';
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

    const handleSearchPressEnter = () => {
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
            <AntHeader className={`${styles.header}${compact ? ` ${styles.compact}` : ''}`}>
                <Flex className={styles.headerInner}>
                    <Link to="/" className={styles.brand} onClick={closeAllPanels}>
                        <LogoGlow variant="header" />
                        <Flex vertical className={styles.brandText}>
                            <Text className={styles.brandTitle}>UTB <Text className={styles.brandTitleAccent} italic>Sport</Text></Text>
                            <Text className={styles.brandSubtitle}>Đặt sân chuyên nghiệp</Text>
                        </Flex>
                    </Link>

                    <Flex className={styles.desktopNav} aria-label="Điều hướng chính">
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
                    </Flex>

                    <Flex className={styles.desktopActions}>
                        <Flex className={`${styles.desktopSearchShell}${searchOpen ? ` ${styles.desktopSearchShellOpen}` : ''}`} ref={desktopSearchRef}>
                            <Flex className={`${styles.desktopSearchForm}${searchOpen ? ` ${styles.desktopSearchFormOpen}` : ''}`}>
                                <Input
                                    ref={searchInputRef}
                                    className={styles.desktopSearchInput}
                                    value={searchValue}
                                    onChange={(event) => {
                                        searchDirtyRef.current = true;
                                        setSearchValue(event.target.value);
                                    }}
                                    allowClear={{ clearIcon: <FiX className={styles.clearIcon} /> }}
                                    placeholder="Tìm tên sân, khu vực..."
                                    aria-label="Từ khóa tìm sân"
                                    onPressEnter={handleSearchPressEnter}
                                />
                            </Flex>

                            <Tooltip title="Tìm kiếm sân" placement="bottom" classNames={{ root: styles.headerTooltip }}>
                                <Button
                                    type="text"
                                    className={`${styles.actionButton} ${styles.desktopSearchToggle}${searchOpen ? ` ${styles.actionButtonActive}` : ''}`}
                                    onClick={handleDesktopSearchAction}
                                    aria-label="Tìm kiếm sân"
                                    aria-expanded={searchOpen}
                                    icon={<FiSearch />}
                                />
                            </Tooltip>
                        </Flex>
                        <Tooltip title="Thông báo" placement="bottom" classNames={{ root: styles.headerTooltip }}>
                            <Button type="text" className={styles.actionButton} onClick={handleNotifications} aria-label="Thông báo" icon={<FiBell />}>
                                <Text className={styles.notificationDot} aria-hidden="true" />
                            </Button>
                        </Tooltip>
                        <Tooltip title="Lịch đặt sân" placement="bottom" classNames={{ root: styles.headerTooltip }}>
                            <Button type="text" className={styles.actionButton} onClick={handleBookingShortcut} aria-label="Lịch đặt sân" icon={<FiCalendar />} />
                        </Tooltip>
                        <Tooltip title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} placement="bottom" classNames={{ root: styles.headerTooltip }}>
                            <Flex className={styles.themeSwitchShell}>
                                <Switch
                                    className={styles.themeSwitch}
                                    size="small"
                                    checked={isDark}
                                    onChange={toggleTheme}
                                    checkedChildren={<FiMoon />}
                                    unCheckedChildren={<FiSun />}
                                />
                            </Flex>
                        </Tooltip>

                        {isAuthenticated ? (
                            <Flex vertical className={styles.accountShell} ref={accountMenuRef}
                                onMouseEnter={handleAccountMouseEnter}
                                onMouseLeave={handleAccountMouseLeave}
                            >
                                <Button
                                    type="text"
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
                                </Button>

                                <Flex vertical className={`${styles.accountMenu}${accountMenuOpen ? ` ${styles.accountMenuOpen}` : ''}`} role="menu">
                                    <Flex className={styles.accountCardTop}>
                                        <Avatar src={account?.avatarUrl || undefined} size={60}>
                                            {!account?.avatarUrl && initials}
                                        </Avatar>
                                        <Flex vertical className={styles.accountCardMeta}>
                                            <Text className={styles.accountName}>{displayName}</Text>
                                            <Text className={styles.accountEmail}>{account?.email || 'Không có email'}</Text>
                                        </Flex>
                                    </Flex>

                                    <Flex vertical className={styles.accountMenuList}>
                                        {canOpenAdmin ? (
                                            <Button type="text" className={styles.accountMenuItem} onClick={openAdminPortal}>
                                                <FiShield />
                                                <Text>Trang quản trị</Text>
                                            </Button>
                                        ) : null}
                                        <Button type="text" className={styles.accountMenuItem} onClick={openAccountInfo}>
                                            <FiUser />
                                            <Text>Thông tin tài khoản</Text>
                                        </Button>
                                        <Button type="text" className={styles.accountMenuItem} onClick={openAccountUpdate}>
                                            <FiEdit3 />
                                            <Text>Cập nhật tài khoản</Text>
                                        </Button>
                                        <Button type="text" className={styles.accountMenuItem} onClick={openPasswordReset}>
                                            <FiKey />
                                            <Text>Đổi mật khẩu</Text>
                                        </Button>
                                        <Button type="text" className={`${styles.accountMenuItem} ${styles.logoutAction}`} onClick={handleLogout}>
                                            <FiLogOut />
                                            <Text>Đăng xuất</Text>
                                        </Button>
                                    </Flex>

                                </Flex>
                            </Flex>
                        ) : (
                            <Flex gap={8} align="center">
                                <Button type="text" className={styles.loginButton} onClick={() => navigate('/login')}>
                                    <FiLogIn />
                                    <Text>Đăng nhập</Text>
                                </Button>
                                <Button type="text" className={styles.loginButton} onClick={() => navigate('/register')}>
                                    <FiUserPlus />
                                    <Text>Đăng ký</Text>
                                </Button>
                            </Flex>
                        )}
                    </Flex>

                    <Flex className={styles.mobileHeaderActions}>
                        <Flex className={`${styles.mobileSearchShell}${searchOpen ? ` ${styles.mobileSearchShellOpen}` : ''}`} ref={mobileSearchRef}>
                            <Flex className={`${styles.mobileSearchForm}${searchOpen ? ` ${styles.mobileSearchFormOpen}` : ''}`}>
                                <Input
                                    ref={mobileSearchInputRef}
                                    className={styles.mobileSearchInput}
                                    value={searchValue}
                                    onChange={(event) => {
                                        searchDirtyRef.current = true;
                                        setSearchValue(event.target.value);
                                    }}
                                    allowClear={{ clearIcon: <FiX className={styles.clearIcon} /> }}
                                    placeholder="Tìm tên sân..."
                                    aria-label="Tìm sân trên mobile"
                                    onPressEnter={handleSearchPressEnter}
                                />
                            </Flex>
                            <Button
                                type="text"
                                className={`${styles.actionButton} ${styles.mobileSearchToggle}${searchOpen ? ` ${styles.actionButtonActive}` : ''}`}
                                onClick={handleMobileSearchAction}
                                aria-label="Tìm kiếm sân"
                                aria-expanded={searchOpen}
                                icon={<FiSearch />}
                            />
                        </Flex>

                        <Flex className={`${styles.themeSwitchShell}${searchOpen ? ` ${styles.themeSwitchHidden}` : ''}`}>
                            <Switch
                                className={styles.themeSwitch}
                                size="small"
                                checked={isDark}
                                onChange={toggleTheme}
                                checkedChildren={<FiMoon />}
                                unCheckedChildren={<FiSun />}
                            />
                        </Flex>

                        <Button
                            type="text"
                            className={`${styles.mobileMenuButton}${drawerOpen ? ` ${styles.mobileMenuButtonOpen}` : ''}`}
                            onClick={() => {
                                setSearchOpen(false);
                                setDrawerOpen((current) => !current);
                            }}
                            aria-label={drawerOpen ? 'Đóng menu' : 'Mở menu'}
                            aria-expanded={drawerOpen}
                        >
                            <Flex className={styles.mobileMenuIconWrap} aria-hidden="true">
                                <FiMenu className={styles.mobileMenuIconMenu} />
                                <FiX className={styles.mobileMenuIconClose} />
                            </Flex>
                        </Button>
                    </Flex>
                </Flex>

            </AntHeader>

            <Flex
                className={`${styles.mobileOverlay}${drawerOpen ? ` ${styles.mobileOverlayOpen}` : ''}`}
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
            />

            <Flex vertical className={`${styles.mobileDrawer}${drawerOpen ? ` ${styles.mobileDrawerOpen}` : ''}`} aria-label="Menu di động">
                <Flex vertical className={styles.drawerHeader}>
                    {isAuthenticated ? (
                        <Flex className={styles.drawerUserBlock}>
                            <Avatar src={account?.avatarUrl || undefined} size={40}>
                                {!account?.avatarUrl && initials}
                            </Avatar>
                            <Flex vertical>
                                <Text className={styles.drawerTitle}>{displayName}</Text>
                                <Text className={styles.drawerEmail}>{account?.email || 'Không có email'}</Text>
                            </Flex>
                        </Flex>
                    ) : (
                        <Flex vertical className={styles.drawerGuestBlock}>
                            <Text className={styles.drawerSectionTitle}>Tài khoản</Text>
                            <Flex vertical className={styles.drawerAuthActions}>
                                <Button type="text" className={styles.secondaryDrawerButton} onClick={() => { setDrawerOpen(false); navigate('/login'); }}>
                                    <FiLogIn />
                                    <Text>Đăng nhập</Text>
                                </Button>
                                <Button type="text" className={styles.secondaryDrawerButton} onClick={() => { setDrawerOpen(false); navigate('/register'); }}>
                                    <FiUserPlus />
                                    <Text>Đăng ký</Text>
                                </Button>
                            </Flex>
                        </Flex>
                    )}
                </Flex>

                <Flex vertical className={styles.drawerNav}>
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
                </Flex>

                <Flex className={styles.drawerQuickActions}>
                    <Button type="text" className={styles.drawerQuickButton} onClick={handleNotifications}>
                        <FiBell />
                        <Text>Thông báo</Text>
                    </Button>
                    <Button type="text" className={styles.drawerQuickButton} onClick={handleBookingShortcut}>
                        <FiCalendar />
                        <Text>Lịch đặt</Text>
                    </Button>
                </Flex>

                {isAuthenticated ? (
                    <Flex vertical className={styles.drawerAccountActions}>
                        {canOpenAdmin ? (
                            <Button type="text" className={styles.drawerActionItem} onClick={openAdminPortal}>
                                <FiShield />
                                <Text>Trang quản trị</Text>
                            </Button>
                        ) : null}
                        <Button type="text" className={styles.drawerActionItem} onClick={openAccountInfo}>
                            <FiUser />
                            <Text>Thông tin tài khoản</Text>
                        </Button>
                        <Button type="text" className={styles.drawerActionItem} onClick={openAccountUpdate}>
                            <FiEdit3 />
                            <Text>Cập nhật tài khoản</Text>
                        </Button>
                        <Button type="text" className={styles.drawerActionItem} onClick={openPasswordReset}>
                            <FiKey />
                            <Text>Đổi mật khẩu</Text>
                        </Button>
                        <Button type="text" className={`${styles.drawerActionItem} ${styles.logoutAction}`} onClick={handleLogout}>
                            <FiLogOut />
                            <Text>Đăng xuất</Text>
                        </Button>
                    </Flex>
                ) : null}

            </Flex>

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