import { Avatar, Badge, Button, Flex, Grid, Input, Layout, Modal, Popover, Switch, Tooltip, Typography, type InputRef } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState, type CSSProperties, type TouchEvent } from 'react';
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
    FiTrash2,
    FiX,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { toast } from 'react-toastify';
import {
    clientDeleteAllNotifications,
    clientDeleteNotification,
    clientGetNotifications,
    clientMarkAllNotificationsRead,
    clientMarkNotificationRead,
    logout,
    updateAccount,
} from '../../config/Api';
import { useBrowserNotification } from '../../hooks/common/useBrowserNotification';
import { useOutsideClick } from '../../hooks/common/useOutsideClick';
import type { INotification } from '../../types/notification';
import ModalAccount from '../../pages/auth/modal/ModalAccount';
import ModalForget from '../../pages/auth/modal/ModalForget';
import ModalUpdateAccount from '../../pages/auth/modal/ModalUpdateAccount';
import ModalBookingHistory from '../../pages/client/booking/modals/ModalBookingHistory';
import { setLogout } from '../../redux/features/authSlice';
import { setAccount } from '../../redux/features/accountSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import styles from './Header.module.scss';
import LogoGlow from '../logo-glow/LogoGlow';
import NotificationSoundSettingsPanel from '../common/NotificationSoundSettingsPanel';
import {
    normalizeNotificationSoundPreset,
    attachNotificationAudioUserGestureUnlock,
    playNotificationSound,
    type NotificationSoundPreset,
} from '../../utils/notificationSound';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    mobileNavOpen: boolean;
    onMobileNavOpenChange: (open: boolean) => void;
    mobileNavPortalEl: HTMLDivElement | null;
}

const { Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
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
const CLIENT_SOUND_PREF_KEY = 'tbu_sport_client_notification_sound';

const buildPitchSearchPath = (keyword: string, preserveSort?: string | null) => {
    const params = new URLSearchParams();
    const trimmedKeyword = keyword.trim();

    params.set('page', '1');
    params.set('pageSize', String(DEFAULT_PITCH_PAGE_SIZE));

    if (trimmedKeyword) {
        params.set('keyword', trimmedKeyword);
    }
    if (preserveSort?.trim()) {
        params.set('sort', preserveSort.trim());
    }

    return `/pitch?${params.toString()}`;
};

const Header = ({ theme, toggleTheme, mobileNavOpen, onMobileNavOpenChange, mobileNavPortalEl }: HeaderProps) => {
    const screens = useBreakpoint();
    const isMobileLayout = screens.md !== true;
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [compact, setCompact] = useState(false);
    const [openModalAccount, setOpenModalAccount] = useState(false);
    const [openModalUpdateAccount, setOpenModalUpdateAccount] = useState(false);
    const [openModalForget, setOpenModalForget] = useState(false);
    const [openModalBookingHistory, setOpenModalBookingHistory] = useState(false);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [bellSoundEnabled, setBellSoundEnabled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return localStorage.getItem(CLIENT_SOUND_PREF_KEY) !== 'off';
    });
    const [soundPreset, setSoundPreset] = useState<NotificationSoundPreset>('DEFAULT');
    const [notifSoundPopoverOpen, setNotifSoundPopoverOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [drawerNotifOpen, setDrawerNotifOpen] = useState(false);
    const [deleteAllNotificationsOpen, setDeleteAllNotificationsOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement | null>(null);
    const notifCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notificationWsRef = useRef<WebSocket | null>(null);
    const notificationReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notificationFailureCountRef = useRef(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const notifTouchRef = useRef<{ id: number | null; x: number; y: number }>({ id: null, x: 0, y: 0 });
    const swipedDeleteRef = useRef<{ id: number | null; at: number }>({ id: null, at: 0 });
    const bellSoundEnabledRef = useRef(bellSoundEnabled);
    const soundPresetRef = useRef<NotificationSoundPreset>('DEFAULT');

    const { requestPermission, sendBrowserNotif } = useBrowserNotification();

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

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        bellSoundEnabledRef.current = bellSoundEnabled;
    }, [bellSoundEnabled]);

    useEffect(() => {
        localStorage.setItem(CLIENT_SOUND_PREF_KEY, bellSoundEnabled ? 'on' : 'off');
    }, [bellSoundEnabled]);

    useEffect(() => {
        if (account?.notificationSoundEnabled === undefined || account?.notificationSoundEnabled === null) {
            return;
        }
        setBellSoundEnabled(Boolean(account.notificationSoundEnabled));
    }, [account?.notificationSoundEnabled]);

    useEffect(() => {
        if (account?.notificationSoundPreset === undefined || account?.notificationSoundPreset === null) {
            return;
        }
        const next = normalizeNotificationSoundPreset(String(account.notificationSoundPreset));
        setSoundPreset(next);
    }, [account?.notificationSoundPreset]);

    useEffect(() => {
        soundPresetRef.current = soundPreset;
    }, [soundPreset]);

    // Mở khóa Web Audio sau lần chạm đầu — chuông qua WebSocket không nằm trong cùng gesture với thao tác đặt sân
    useEffect(() => attachNotificationAudioUserGestureUnlock(audioCtxRef), []);

    const handleNotifMouseEnter = () => {
        if (notifCloseTimerRef.current) {
            clearTimeout(notifCloseTimerRef.current);
            notifCloseTimerRef.current = null;
        }
        setNotifOpen(true);
    };

    const handleNotifMouseLeave = () => {
        notifCloseTimerRef.current = setTimeout(() => setNotifOpen(false), 200);
    };

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
    const canOpenAdmin = Boolean(account?.roles?.some((role) => role.name !== 'VIEW'));
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
        onMobileNavOpenChange(false);
        setDrawerNotifOpen(false);
    }, [location.pathname, onMobileNavOpenChange]);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth > 768) {
                onMobileNavOpenChange(false);
            }
        };

        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [onMobileNavOpenChange]);

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

    // WebSocket: connect when authenticated, disconnect on logout
    useEffect(() => {
        if (!isAuthenticated) {
            if (notificationWsRef.current) {
                notificationWsRef.current.close();
                notificationWsRef.current = null;
            }
            if (notificationReconnectTimerRef.current) {
                clearTimeout(notificationReconnectTimerRef.current);
                notificationReconnectTimerRef.current = null;
            }
            notificationFailureCountRef.current = 0;
            setNotifications([]);
            return;
        }

        // Xin quyền browser notification ngay khi đăng nhập
        requestPermission();

        let cancelled = false;

        const fetchNotifications = async () => {
            try {
                const res = await clientGetNotifications();
                if (res.data.statusCode === 200) {
                    setNotifications(res.data.data ?? []);
                }
            } catch {
                // ignore fetch error
            }
        };

        const connectNotificationSocket = () => {
            if (cancelled) {
                return;
            }

            const token = localStorage.getItem('access_token') ?? '';
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const ws = new WebSocket(`${protocol}://${window.location.host}/ws/notifications?token=${encodeURIComponent(token)}`);
            notificationWsRef.current = ws;

            ws.onopen = () => {
                notificationFailureCountRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data) as { event?: string; data?: INotification | string };
                    if (payload.event === 'notification' && payload.data && typeof payload.data !== 'string') {
                        const notif = payload.data as INotification;
                        setNotifications(prev => [notif, ...prev]);

                        const titleMap: Record<string, string> = {
                            BOOKING_CREATED: '🏟️ Đặt sân thành công',
                            BOOKING_PENDING_CONFIRMATION: '📝 Yêu cầu đặt sân mới',
                            BOOKING_APPROVED: '✅ Booking đã được xác nhận',
                            BOOKING_REJECTED: '❌ Booking đã bị từ chối',
                            EQUIPMENT_BORROWED: '🎽 Mượn thiết bị',
                            EQUIPMENT_RETURNED: '📦 Trả thiết bị',
                            EQUIPMENT_LOST: '⚠️ Báo mất thiết bị',
                            EQUIPMENT_DAMAGED: '🛠️ Thiết bị bị hỏng',
                            PAYMENT_REQUESTED: '💸 Yêu cầu thanh toán QR',
                            PAYMENT_PROOF_UPLOADED: '🧾 Đã tải minh chứng thanh toán',
                            PAYMENT_CONFIRMED: '💳 Thanh toán xác nhận',
                            MATCH_REMINDER: '⏰ Sắp đến giờ đá!',
                            AI_KEY_EXPIRED: '🔑 Key AI cần thay',
                        };
                        const title = titleMap[notif.type] ?? 'UTB Sport';

                        sendBrowserNotif(title, notif.message);
                        if (notif.type === 'MATCH_REMINDER') {
                            toast.info(notif.message, { autoClose: 6000 });
                        }
                        if (notif.type === 'AI_KEY_EXPIRED') {
                            toast.error(notif.message, { autoClose: 12000 });
                        }
                    } else if (payload.event === 'ring' && bellSoundEnabledRef.current) {
                        playNotificationSound(audioCtxRef, soundPresetRef.current);
                    }
                } catch {
                    // ignore parse error
                }
            };

            ws.onerror = () => {
                if (cancelled) {
                    return;
                }
                ws.close();
            };

            ws.onclose = () => {
                if (cancelled) {
                    return;
                }
                if (notificationWsRef.current === ws) {
                    notificationWsRef.current = null;
                }
                notificationFailureCountRef.current += 1;
                if (notificationFailureCountRef.current === 4) {
                    toast.warn('Kết nối WebSocket thông báo đang không ổn định, hệ thống sẽ tự động thử lại.');
                }
                const retryDelay = Math.min(30000, 1000 * Math.pow(2, Math.min(notificationFailureCountRef.current, 5)));
                if (notificationReconnectTimerRef.current) {
                    clearTimeout(notificationReconnectTimerRef.current);
                }
                notificationReconnectTimerRef.current = setTimeout(connectNotificationSocket, retryDelay);
            };
        };

        void fetchNotifications();
        connectNotificationSocket();

        return () => {
            cancelled = true;
            if (notificationWsRef.current) {
                notificationWsRef.current.close();
                notificationWsRef.current = null;
            }
            if (notificationReconnectTimerRef.current) {
                clearTimeout(notificationReconnectTimerRef.current);
                notificationReconnectTimerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const handleBellSoundPreferenceChange = async (checked: boolean) => {
        setBellSoundEnabled(checked);
        if (!account) {
            return;
        }
        try {
            await updateAccount({ notificationSoundEnabled: checked });
            dispatch(setAccount({ ...account, notificationSoundEnabled: checked }));
        } catch {
            toast.error('Không lưu được cấu hình chuông thông báo');
            setBellSoundEnabled(!checked);
        }
    };

    const handleSoundPresetPreferenceChange = async (preset: NotificationSoundPreset) => {
        const previous = soundPreset;
        setSoundPreset(preset);
        if (!account) {
            return;
        }
        try {
            await updateAccount({ notificationSoundPreset: preset });
            dispatch(setAccount({ ...account, notificationSoundPreset: preset }));
        } catch {
            toast.error('Không lưu được kiểu âm thanh thông báo');
            setSoundPreset(previous);
        }
    };

    const clientSoundSettingsPopover = (
        <Popover
            title="Cài đặt chuông thông báo"
            trigger="click"
            open={notifSoundPopoverOpen}
            onOpenChange={setNotifSoundPopoverOpen}
            placement="bottomRight"
            rootClassName={styles.notifSoundPopover}
            getPopupContainer={() => document.body}
            content={(
                <NotificationSoundSettingsPanel
                    bellSoundEnabled={bellSoundEnabled}
                    onBellSoundChange={(c) => { void handleBellSoundPreferenceChange(c); }}
                    soundPreset={soundPreset}
                    onSoundPresetChange={(p) => { void handleSoundPresetPreferenceChange(p); }}
                    onTestSound={() => playNotificationSound(audioCtxRef, soundPresetRef.current)}
                />
            )}
        >
            <Tooltip title="Cài đặt chuông thông báo" placement="bottom" classNames={{ root: styles.headerTooltip }}>
                <Button
                    type="text"
                    size="small"
                    className={styles.notifHeaderGear}
                    icon={<SettingOutlined />}
                    aria-label="Cài đặt chuông thông báo"
                    onClick={(e) => e.stopPropagation()}
                />
            </Tooltip>
        </Popover>
    );

    useOutsideClick(notifRef, () => setNotifOpen(false), notifOpen);

    const closeAllPanels = () => {
        onMobileNavOpenChange(false);
        setDrawerNotifOpen(false);
        setAccountMenuOpen(false);
        setSearchOpen(false);
        setNotifOpen(false);
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
        onMobileNavOpenChange(false);

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
        const sortParam = isPitchListingPage ? new URLSearchParams(location.search).get('sort') : null;
        const nextPath = trimmedKeyword
            ? buildPitchSearchPath(trimmedKeyword, sortParam)
            : (isPitchListingPage ? buildPitchSearchPath('', sortParam) : currentPath);

        if (currentPath === nextPath) {
            onMobileNavOpenChange(false);
            setAccountMenuOpen(false);
            setSearchOpen(false);
            return;
        }

        onMobileNavOpenChange(false);
        setAccountMenuOpen(false);
        setSearchOpen(false);
        navigate(nextPath);
    };

    const handleSearchPressEnter = () => {
        submitPitchSearch();
    };

    const handleNotifications = () => {
        if (!isAuthenticated) {
            toast.info('Đăng nhập để nhận thông báo đặt sân.');
            navigate('/login');
            return;
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await clientMarkAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch { /* ignore */ }
    };

    const handleOpenDeleteAllNotifications = () => {
        if (notifications.length === 0) return;
        setDeleteAllNotificationsOpen(true);
    };

    const handleConfirmDeleteAllNotifications = async () => {
        try {
            await clientDeleteAllNotifications();
            setNotifications([]);
            setDeleteAllNotificationsOpen(false);
        } catch {
            toast.error('Không thể xóa thông báo');
            throw new Error('keep-open');
        }
    };

    const handleDeleteNotif = async (id: number) => {
        try {
            await clientDeleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch { /* ignore */ }
    };

    /** Nhấn vào dòng thông báo: chỉ đánh dấu đã đọc. */
    const handleNotificationRowClick = async (n: INotification) => {
        if (Date.now() - swipedDeleteRef.current.at < 350 && swipedDeleteRef.current.id === n.id) return;
        if (!n.isRead) {
            try {
                await clientMarkNotificationRead(n.id);
                setNotifications(prev => prev.map(item => (item.id === n.id ? { ...item, isRead: true } : item)));
            } catch {
                /* ignore */
            }
        }
    };

    /** Link “Xem chi tiết”: đánh dấu đã đọc (nếu cần) rồi mở lịch đặt / luồng liên quan. */
    const handleNotificationOpenDetail = async (n: INotification) => {
        if (!n.isRead) {
            try {
                await clientMarkNotificationRead(n.id);
                setNotifications(prev => prev.map(item => (item.id === n.id ? { ...item, isRead: true } : item)));
            } catch {
                /* vẫn mở */
            }
        }
        closeAllPanels();
        if (
            n.type === 'BOOKING_CREATED' || n.type === 'BOOKING_APPROVED' ||
            n.type === 'BOOKING_REJECTED' || n.type === 'BOOKING_PENDING_CONFIRMATION' ||
            n.type === 'MATCH_REMINDER' || n.type === 'PAYMENT_CONFIRMED' ||
            n.type === 'EQUIPMENT_BORROWED' || n.type === 'EQUIPMENT_RETURNED' ||
            n.type === 'EQUIPMENT_LOST' || n.type === 'EQUIPMENT_DAMAGED'
        ) {
            setOpenModalBookingHistory(true);
            return;
        }
        setOpenModalBookingHistory(true);
    };

    const handleNotifTouchStart = (id: number, e: TouchEvent<HTMLElement>) => {
        const touch = e.changedTouches[0];
        notifTouchRef.current = { id, x: touch.clientX, y: touch.clientY };
    };

    const handleNotifTouchEnd = (id: number, e: TouchEvent<HTMLElement>) => {
        if (notifTouchRef.current.id !== id) return;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - notifTouchRef.current.x;
        const deltaY = touch.clientY - notifTouchRef.current.y;
        if (deltaX < -70 && Math.abs(deltaY) < 40) {
            swipedDeleteRef.current = { id, at: Date.now() };
            void handleDeleteNotif(id);
        }
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
                            <Text className={styles.brandSubtitle}>Đặt sân trực tuyến</Text>
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
                        <Flex vertical className={styles.notifShell} ref={notifRef}
                            onMouseEnter={handleNotifMouseEnter}
                            onMouseLeave={handleNotifMouseLeave}
                        >
                            <Tooltip title="Thông báo" placement="bottom" classNames={{ root: styles.headerTooltip }}>
                                <Badge count={unreadCount} size="small" offset={[-4, 4]}>
                                    <Button
                                        type="text"
                                        className={`${styles.actionButton}${notifOpen ? ` ${styles.actionButtonActive}` : ''}`}
                                        onClick={() => { handleNotifications(); setNotifOpen(v => !v); }}
                                        aria-label="Thông báo"
                                        icon={<FiBell />}
                                    />
                                </Badge>
                            </Tooltip>

                            <Flex vertical className={`${styles.notifMenu}${notifOpen ? ` ${styles.notifMenuOpen}` : ''}`}>
                                <Flex className={styles.notifHeader}>
                                    <Text className={styles.notifTitle}>Thông báo</Text>
                                    <Flex align="center" gap={8} wrap="wrap" className={styles.notifActions}>
                                        {isAuthenticated ? clientSoundSettingsPopover : null}
                                        {unreadCount > 0 && (
                                            <Button type="text" className={styles.notifMarkAll} onClick={handleMarkAllRead}>
                                                Đánh dấu đã đọc
                                            </Button>
                                        )}
                                        {notifications.length > 0 && (
                                            <Button type="text" className={styles.notifDeleteAll} onClick={handleOpenDeleteAllNotifications}>
                                                Xóa tất cả
                                            </Button>
                                        )}
                                    </Flex>
                                </Flex>
                                <Flex vertical className={styles.notifList}>
                                    {notifications.length === 0 ? (
                                        <Text className={styles.notifEmpty}>Chưa có thông báo nào</Text>
                                    ) : (
                                        notifications.slice(0, 10).map(n => (
                                            <Flex key={n.id}
                                                className={`${styles.notifItem}${!n.isRead ? ` ${styles.notifItemUnread}` : ''} ${styles.notifItemClickable}`}
                                                onClick={() => void handleNotificationRowClick(n)}
                                                onTouchStart={(e) => handleNotifTouchStart(n.id, e)}
                                                onTouchEnd={(e) => handleNotifTouchEnd(n.id, e)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        void handleNotificationRowClick(n);
                                                    }
                                                }}
                                                title="Nhấn để đánh dấu đã đọc"
                                            >
                                                <Avatar
                                                    size={28}
                                                    src={n.senderAvatarUrl || undefined}
                                                    className={styles.notifItemIcon}
                                                >
                                                    {!n.senderAvatarUrl ? (n.senderName?.trim()?.[0] || 'H') : null}
                                                </Avatar>
                                                <Flex vertical className={styles.notifItemBody}>
                                                    <Text className={styles.notifItemTime}>
                                                        {n.senderName || 'Hệ thống'}
                                                    </Text>
                                                    <Text className={styles.notifItemMsg}>{n.message}</Text>
                                                    <Text className={styles.notifItemTime}>
                                                        {new Date(n.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </Text>
                                                    <button
                                                        type="button"
                                                        className={styles.notifDetailLink}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void handleNotificationOpenDetail(n);
                                                        }}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                </Flex>
                                                <Flex align="center" gap={4}>
                                                    {!n.isRead && <span className={styles.notifDot} />}
                                                    <Button type="text" className={styles.notifDeleteBtn} icon={<FiTrash2 />}
                                                        onClick={(e) => { e.stopPropagation(); void handleDeleteNotif(n.id); }} />
                                                </Flex>
                                            </Flex>
                                        ))
                                    )}
                                </Flex>
                            </Flex>
                        </Flex>
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
                            className={`${styles.mobileMenuButton}${mobileNavOpen ? ` ${styles.mobileMenuButtonOpen}` : ''}`}
                            onClick={() => {
                                setSearchOpen(false);
                                onMobileNavOpenChange(!mobileNavOpen);
                            }}
                            aria-label={mobileNavOpen ? 'Đóng menu' : 'Mở menu'}
                            aria-expanded={mobileNavOpen}
                        >
                            <Flex className={styles.mobileMenuIconWrap} aria-hidden="true">
                                <FiMenu className={styles.mobileMenuIconMenu} />
                                <FiX className={styles.mobileMenuIconClose} />
                            </Flex>
                        </Button>
                    </Flex>
                </Flex>

            </AntHeader>

            {isMobileLayout && mobileNavOpen && mobileNavPortalEl
                ? createPortal(
                    <nav className={styles.mobileNavFlow} aria-label="Menu di động">
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
                                        <Button type="text" className={styles.secondaryDrawerButton} onClick={() => { onMobileNavOpenChange(false); navigate('/login'); }}>
                                            <FiLogIn />
                                            <Text>Đăng nhập</Text>
                                        </Button>
                                        <Button type="text" className={styles.secondaryDrawerButton} onClick={() => { onMobileNavOpenChange(false); navigate('/register'); }}>
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
                                    onClick={() => onMobileNavOpenChange(false)}
                                >
                                    <item.icon className={styles.drawerNavIcon} />
                                    {item.label}
                                </Link>
                            ))}
                        </Flex>

                        <Flex className={styles.drawerQuickActions}>
                            <Button type="text" className={`${styles.drawerQuickButton}${drawerNotifOpen ? ` ${styles.actionButtonActive}` : ''}`}
                                onClick={() => { handleNotifications(); setDrawerNotifOpen(v => !v); }}
                            >
                                <Badge count={unreadCount} size="small">
                                    <FiBell />
                                </Badge>
                                <Text>Thông báo</Text>
                            </Button>
                            <Button type="text" className={styles.drawerQuickButton} onClick={handleBookingShortcut}>
                                <FiCalendar />
                                <Text>Lịch đặt</Text>
                            </Button>
                        </Flex>

                        {drawerNotifOpen && isAuthenticated && (
                            <Flex vertical className={styles.drawerNotifPanel}>
                                <Flex className={styles.notifHeader}>
                                    <Text className={styles.notifTitle}>Thông báo</Text>
                                    <Flex align="center" gap={8} wrap="wrap" className={styles.notifActions}>
                                        {isAuthenticated ? clientSoundSettingsPopover : null}
                                        {unreadCount > 0 && (
                                            <Button type="text" className={styles.notifMarkAll} onClick={handleMarkAllRead}>
                                                Đánh dấu đã đọc
                                            </Button>
                                        )}
                                        {notifications.length > 0 && (
                                            <Button type="text" className={styles.notifDeleteAll} onClick={handleOpenDeleteAllNotifications}>
                                                Xóa tất cả
                                            </Button>
                                        )}
                                    </Flex>
                                </Flex>
                                <Flex vertical className={styles.drawerNotifList}>
                                    {notifications.length === 0 ? (
                                        <Text className={styles.notifEmpty}>Chưa có thông báo nào</Text>
                                    ) : (
                                        notifications.slice(0, 10).map(n => (
                                            <Flex key={n.id}
                                                className={`${styles.notifItem}${!n.isRead ? ` ${styles.notifItemUnread}` : ''} ${styles.notifItemClickable}`}
                                                onClick={() => void handleNotificationRowClick(n)}
                                                onTouchStart={(e) => handleNotifTouchStart(n.id, e)}
                                                onTouchEnd={(e) => handleNotifTouchEnd(n.id, e)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        void handleNotificationRowClick(n);
                                                    }
                                                }}
                                                title="Nhấn để đánh dấu đã đọc"
                                            >
                                                <Avatar
                                                    size={28}
                                                    src={n.senderAvatarUrl || undefined}
                                                    className={styles.notifItemIcon}
                                                >
                                                    {!n.senderAvatarUrl ? (n.senderName?.trim()?.[0] || 'H') : null}
                                                </Avatar>
                                                <Flex vertical className={styles.notifItemBody}>
                                                    <Text className={styles.notifItemTime}>
                                                        {n.senderName || 'Hệ thống'}
                                                    </Text>
                                                    <Text className={styles.notifItemMsg}>{n.message}</Text>
                                                    <Text className={styles.notifItemTime}>
                                                        {new Date(n.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </Text>
                                                    <button
                                                        type="button"
                                                        className={styles.notifDetailLink}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void handleNotificationOpenDetail(n);
                                                        }}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                </Flex>
                                                <Flex align="center" gap={4}>
                                                    {!n.isRead && <span className={styles.notifDot} />}
                                                    <Button type="text" className={styles.notifDeleteBtn} icon={<FiTrash2 />}
                                                        onClick={(e) => { e.stopPropagation(); void handleDeleteNotif(n.id); }} />
                                                </Flex>
                                            </Flex>
                                        ))
                                    )}
                                </Flex>
                            </Flex>
                        )}

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

                    </nav>,
                    mobileNavPortalEl,
                )
                : null}

            <Modal
                title="Xóa tất cả thông báo?"
                open={deleteAllNotificationsOpen}
                onCancel={() => setDeleteAllNotificationsOpen(false)}
                onOk={handleConfirmDeleteAllNotifications}
                okText="Xóa tất cả"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                destroyOnHidden
            >
                <Paragraph style={{ marginBottom: 0 }}>
                    Các mục sẽ được ẩn khỏi danh sách của bạn.
                </Paragraph>
            </Modal>

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