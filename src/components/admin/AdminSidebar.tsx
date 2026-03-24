import { Layout, Menu, Breadcrumb, Button, Grid, Drawer, Switch, Tooltip, Typography, Avatar, Popover, Badge, Space, Modal } from 'antd';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
    BellOutlined,
    DeleteOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    LoginOutlined,
} from '@ant-design/icons';
import { LockOutlined } from '@ant-design/icons';
import { MdFeaturedPlayList, MdOutlineSecurity, MdPayments, MdSportsHandball, MdOutlineSupportAgent, MdRateReview } from 'react-icons/md';
import { RiRobot2Line } from 'react-icons/ri';
import { GiReturnArrow } from 'react-icons/gi';
import { FaReact, FaUserCircle, FaUserCog } from 'react-icons/fa';
import ModalAccount from '../../pages/auth/modal/ModalAccount';
import ModalForget from '../../pages/auth/modal/ModalForget';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
    clientDeleteAllNotifications,
    clientDeleteNotification,
    clientGetNotifications,
    clientMarkAllNotificationsRead,
    clientMarkNotificationRead,
    logout,
    updateAccount,
} from '../../config/Api';
import { toast } from 'react-toastify';
import { setLogout } from '../../redux/features/authSlice';
import { setAccount } from '../../redux/features/accountSlice';
import { IoMenu, IoSunny, IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { LuMoon } from 'react-icons/lu';
import { PiSoccerBallBold } from 'react-icons/pi';
import { useRole } from '../../hooks/common/useRole';
import { usePermission } from '../../hooks/common/usePermission';
import { TbBrandBooking } from 'react-icons/tb';
import { useBrowserNotification } from '../../hooks/common/useBrowserNotification';
import type { INotification } from '../../types/notification';
import NotificationSoundSettingsPanel from '../common/NotificationSoundSettingsPanel';
import {
    normalizeNotificationSoundPreset,
    attachNotificationAudioUserGestureUnlock,
    playNotificationSound,
    type NotificationSoundPreset,
} from '../../utils/notificationSound';
import styles from './AdminSidebar.module.scss';

const { Sider, Header, Content } = Layout;
const { useBreakpoint } = Grid;
const { Text } = Typography;
const ADMIN_SOUND_PREF_KEY = 'tub_sport_admin_notification_sound';

interface AdminSidebarProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ theme, toggleTheme }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [openModalAccount, setOpenModalAccount] = useState(false);
    const [openModalForget, setOpenModalForget] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [bellSoundEnabled, setBellSoundEnabled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return localStorage.getItem(ADMIN_SOUND_PREF_KEY) !== 'off';
    });
    const [soundPreset, setSoundPreset] = useState<NotificationSoundPreset>('DEFAULT');
    const [adminNotifSoundPopoverOpen, setAdminNotifSoundPopoverOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const screens = useBreakpoint();
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
    const account = useAppSelector(state => state.account.account);
    const notificationWsRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const notifTouchRef = useRef<{ id: number | null; x: number; y: number }>({ id: null, x: 0, y: 0 });
    const swipedDeleteRef = useRef<{ id: number | null; at: number }>({ id: null, at: 0 });
    const bellSoundEnabledRef = useRef(bellSoundEnabled);
    const soundPresetRef = useRef<NotificationSoundPreset>('DEFAULT');

    const { requestPermission, sendBrowserNotif } = useBrowserNotification();

    const isDark = theme === 'dark';
    const isViewRole = useRole("VIEW");
    const canViewUsers = usePermission("USER_VIEW_LIST");
    const canViewRoles = usePermission("ROLE_VIEW_LIST");
    const canViewPermissions = usePermission("PERMISSION_VIEW_LIST");
    const canViewPitches = usePermission("PITCH_VIEW_LIST");
    const canViewBookings = usePermission("BOOKING_VIEW_LIST");
    const canViewPayments = usePermission("PAYMENT_VIEW_LIST");
    const canViewEquipments = usePermission("EQUIPMENT_VIEW_LIST");
    const canViewBookingEquipments = usePermission("BOOKING_EQUIPMENT_VIEW");
    const canManageAi = usePermission(["AI_VIEW_LIST", "AI_CREATE", "AI_UPDATE", "AI_DELETE", "AI_CHAT_ADMIN"]);

    const routeLabelMap: Record<string, string> = {
        admin: 'Bảng điều khiển',
        user: 'Người dùng',
        asset: 'Tài sản · Phòng',
        device: 'Thiết bị theo tài sản',
        'device-issues': 'Sự cố thiết bị',
        'asset-usage': 'Sử dụng tài sản',
        checkouts: 'Nhận tài sản',
        returns: 'Trả tài sản',
        role: 'Vai trò',
        permission: 'Quyền hạn',
        pitch: 'Sân bóng',
        v2: 'Phòng tin học',
        rooms: 'Phòng tin học',
        booking: 'Lịch đặt',
        payment: 'Thanh toán',
        equipment: 'Thiết bị',
        'booking-equipment': 'Mượn thiết bị',
        'room-booking-equipment': 'Mượn / trả phòng',
        support: 'Hỗ trợ & Bảo trì',
        review: 'Đánh giá & Chat',
    };

    const cssVars = useMemo(() => ({
        '--admin-accent': '#faad14',
        '--admin-accent-strong': '#d48806',
        '--admin-surface': isDark ? '#0f1c2b' : '#f8fafc',
        '--admin-surface-soft': isDark ? 'rgba(15, 28, 43, 0.86)' : 'rgba(248, 250, 252, 0.9)',
        '--admin-panel': isDark ? '#102033' : '#ffffff',
        '--admin-layout': isDark ? '#080f17' : '#f1f5f9',
        '--admin-border': isDark ? 'rgba(250, 173, 20, 0.15)' : 'rgba(15, 23, 42, 0.1)',
        '--admin-text': isDark ? '#e2e8f0' : '#1a2733',
        '--admin-muted': isDark ? '#94a3b8' : '#5a6a7e',
        '--admin-shadow': isDark ? '0 24px 56px rgba(2, 6, 23, 0.42)' : '0 18px 42px rgba(15, 23, 42, 0.12)',
    }) as CSSProperties, [isDark]);

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

    // Đặt '/admin' cuối cùng để khớp con (/admin/asset, ...) trước, tránh mọi URL bị coi là Dashboard
    const routeMenuKeys = ['/admin/user', '/admin/asset', '/admin/device', '/admin/device-issues', '/admin/asset-usage', '/admin/checkouts', '/admin/returns', '/admin/role', '/admin/permission', '/admin/pitch', '/admin/booking', '/admin/payment', '/admin/equipment', '/admin/booking-equipment', '/admin/room-booking-equipment', '/admin/ai', '/admin/review', '/admin/support', '/admin'];

    const selectedMenuKey = useMemo(() => {
        const currentPath = location.pathname;
        const directMatch = routeMenuKeys.find((path) => currentPath === path || currentPath.startsWith(`${path}/`));
        return directMatch || '';
    }, [location.pathname]);

    const breadcrumbText = useMemo(() => {
        const segments = location.pathname.split('/').filter(Boolean);
        return segments.map((segment) => routeLabelMap[segment] ?? segment).join(' / ');
    }, [location.pathname]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    /** Độ rộng drawer menu mobile — đồng bộ với desktop Sider (280 / 88) */
    const mobileDrawerStyles = useMemo(
        () => ({
            body: { padding: collapsed ? 6 : 12 },
            wrapper: { width: collapsed ? 88 : 280 },
        }),
        [collapsed]
    );

    useEffect(() => {
        bellSoundEnabledRef.current = bellSoundEnabled;
    }, [bellSoundEnabled]);

    useEffect(() => {
        localStorage.setItem(ADMIN_SOUND_PREF_KEY, bellSoundEnabled ? 'on' : 'off');
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

    // Mở khóa Web Audio sau lần chạm đầu — thông báo realtime qua WebSocket không kế thừa gesture từ thao tác khác
    useEffect(() => attachNotificationAudioUserGestureUnlock(audioCtxRef), []);

    const clearReconnectTimer = () => {
        if (reconnectRef.current !== null) {
            window.clearTimeout(reconnectRef.current);
            reconnectRef.current = null;
        }
    };

    const connectNotificationSocket = () => {
        clearReconnectTimer();

        const token = localStorage.getItem('access_token') ?? '';
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${protocol}://${window.location.host}/ws/notifications?token=${encodeURIComponent(token)}`);
        notificationWsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as { event?: string; data?: INotification | string };
                if (payload.event === 'notification' && payload.data && typeof payload.data !== 'string') {
                    const notif = payload.data as INotification;
                    setNotifications(prev => [notif, ...prev]);
                    const isRoomBookingNotif = (notif.message || '').toLowerCase().includes('phòng')
                        || (notif.message || '').toLowerCase().includes('roombooking');

                    const titleMap: Record<string, string> = {
                        BOOKING_CREATED: isRoomBookingNotif ? '🏫 Đặt phòng thành công' : '🏟️ Đặt sân thành công',
                        BOOKING_PENDING_CONFIRMATION: isRoomBookingNotif ? '📝 Lịch đặt phòng chờ duyệt' : '📝 Booking chờ duyệt',
                        BOOKING_APPROVED: isRoomBookingNotif ? '✅ Lịch đặt phòng đã được xác nhận' : '✅ Booking đã được xác nhận',
                        BOOKING_REJECTED: isRoomBookingNotif ? '❌ Lịch đặt phòng đã bị từ chối' : '❌ Booking đã bị từ chối',
                        EQUIPMENT_BORROWED: '🎽 Mượn thiết bị',
                        EQUIPMENT_RETURNED: '📦 Trả thiết bị',
                        EQUIPMENT_LOST: '⚠️ Báo mất thiết bị',
                        EQUIPMENT_DAMAGED: '🛠️ Thiết bị bị hỏng',
                        PAYMENT_REQUESTED: '💸 Yêu cầu thanh toán QR',
                        PAYMENT_PROOF_UPLOADED: '🧾 Đã tải minh chứng thanh toán',
                        PAYMENT_CONFIRMED: '💳 Thanh toán xác nhận',
                        MATCH_REMINDER: '⏰ Sắp đến giờ đá!',
                    };

                    if (bellSoundEnabledRef.current) {
                        playNotificationSound(audioCtxRef, soundPresetRef.current);
                    }
                    sendBrowserNotif(titleMap[notif.type] ?? 'TUB Sport', notif.message);

                    if (notif.type === 'BOOKING_PENDING_CONFIRMATION') {
                        toast.info(notif.message, { autoClose: 6000 });
                    }
                } else if (payload.event === 'ring' && bellSoundEnabledRef.current) {
                    playNotificationSound(audioCtxRef, soundPresetRef.current);
                }
            } catch {
                // ignore malformed payload
            }
        };

        ws.onerror = () => {
            ws.close();
        };

        ws.onclose = () => {
            if (isAuthenticated) {
                reconnectRef.current = window.setTimeout(() => {
                    connectNotificationSocket();
                }, 3000);
            }
        };
    };

    const menuItems = [
        {
            key: '/admin',
            label: <Link to="/admin" className={styles.menuLink}>Dashboard</Link>,
            icon: <FaReact className='icon-spin' />,
        },
        {
            key: 'features',
            label: 'Tính năng',
            icon: <MdFeaturedPlayList />,
            children: [
                ...(!isViewRole
                    ? [
                        ...(canViewUsers ? [{
                            key: '/admin/user',
                            label: <Link to="/admin/user" className={styles.menuLink}>Người dùng</Link>,
                            icon: <UserOutlined />,
                        }] : []),

                        ...(canViewRoles ? [{
                            key: '/admin/role',
                            label: <Link to="/admin/role" className={styles.menuLink}>Vai trò</Link>,
                            icon: <FaUserCog />,
                        }] : []),

                        ...(canViewPermissions ? [{
                            key: '/admin/permission',
                            label: <Link to="/admin/permission" className={styles.menuLink}>Quyền hạn</Link>,
                            icon: <MdOutlineSecurity />,
                        }] : []),

                        ...(canViewPitches ? [{
                            key: '/admin/pitch',
                            label: <Link to="/admin/pitch" className={styles.menuLink}>Sân bóng</Link>,
                            icon: <PiSoccerBallBold />,
                        }] : []),
                        ...(canViewBookings ? [{
                            key: '/admin/booking',
                            label: <Link to="/admin/booking" className={styles.menuLink}>Lịch đặt</Link>,
                            icon: <TbBrandBooking />,
                        }] : []),

                        ...(canViewPayments ? [{
                            key: '/admin/payment',
                            label: <Link to="/admin/payment" className={styles.menuLink}>Thanh toán</Link>,
                            icon: <MdPayments />,
                        }] : []),

                        ...(canViewEquipments ? [{
                            key: '/admin/equipment',
                            label: <Link to="/admin/equipment" className={styles.menuLink}>Thiết bị</Link>,
                            icon: <MdSportsHandball />,
                        }] : []),

                        ...(canViewBookingEquipments ? [{
                            key: '/admin/booking-equipment',
                            label: <Link to="/admin/booking-equipment" className={styles.menuLink}>Mượn thiết bị</Link>,
                            icon: <GiReturnArrow />,
                        }] : []),

                        ...(canManageAi ? [{
                            key: '/admin/ai',
                            label: <Link to="/admin/ai" className={styles.menuLink}>AI</Link>,
                            icon: <RiRobot2Line />,
                        }] : []),
                        ...(canViewBookings ? [{
                            key: '/admin/review',
                            label: <Link to="/admin/review" className={styles.menuLink}>Đánh giá & Chat</Link>,
                            icon: <MdRateReview />,
                        }] : []),
                        {
                            key: '/admin/support',
                            label: <Link to="/admin/support" className={styles.menuLink}>Hỗ trợ & Bảo trì</Link>,
                            icon: <MdOutlineSupportAgent />,
                        },

                    ]
                    : []),

            ],
        },
        {
            key: 'settings',
            label: 'Cài đặt',
            icon: <SettingOutlined />,
            children: [
                { key: 'go-client', label: <Link to="/" className={styles.menuLink}>Trang khách</Link>, icon: <UserOutlined /> },

                ...(isAuthenticated ?
                    [
                        { key: 'account', label: <span onClick={() => setOpenModalAccount(true)} className={styles.menuAction}>Tài khoản</span>, icon: <FaUserCircle /> },
                        { key: 'logout', label: <span onClick={handleLogout} className={styles.menuAction}>Đăng xuất</span>, icon: <LogoutOutlined /> },
                    ]
                    :
                    [
                        { key: 'login', label: <span onClick={() => navigate("/login")} className={styles.menuAction}>Đăng nhập</span>, icon: <LoginOutlined /> },
                    ]),

            ],
        },
    ];

    useEffect(() => {
        if (!isAuthenticated) {
            clearReconnectTimer();
            if (notificationWsRef.current) {
                notificationWsRef.current.close();
                notificationWsRef.current = null;
            }
            setNotifications([]);
            return;
        }

        requestPermission();

        clientGetNotifications()
            .then(res => {
                if (res.data.statusCode === 200) {
                    setNotifications(res.data.data ?? []);
                }
            })
            .catch(() => { /* ignore */ });

        connectNotificationSocket();

        return () => {
            clearReconnectTimer();
            if (notificationWsRef.current) {
                notificationWsRef.current.close();
            }
            notificationWsRef.current = null;
        };
    }, [isAuthenticated, requestPermission, sendBrowserNotif]);

    const handleAdminBellSoundPreferenceChange = async (checked: boolean) => {
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

    const handleAdminSoundPresetPreferenceChange = async (preset: NotificationSoundPreset) => {
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

    const handleMarkAllRead = async () => {
        try {
            await clientMarkAllNotificationsRead();
            setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
        } catch {
            toast.error('Không thể đánh dấu đã đọc');
        }
    };

    const handleDeleteNotif = async (id: number) => {
        try {
            await clientDeleteNotification(id);
            setNotifications(prev => prev.filter(item => item.id !== id));
        } catch {
            toast.error('Không thể xóa thông báo');
        }
    };

    const handleDeleteAllNotifications = () => {
        if (notifications.length === 0) return;
        Modal.confirm({
            title: 'Xóa tất cả thông báo?',
            content: 'Các mục sẽ được ẩn khỏi danh sách của bạn.',
            okText: 'Xóa tất cả',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await clientDeleteAllNotifications();
                    setNotifications([]);
                } catch {
                    toast.error('Không thể xóa thông báo');
                }
            },
        });
    };

    const extractBookingId = (message: string): string | null => {
        const match = message.match(/Booking\s*#(\d+)/i);
        return match?.[1] ?? null;
    };

    const extractAssetUsageId = (message: string): string | null => {
        const m1 = message.match(/AssetUsage\s*#(\d+)/i);
        if (m1?.[1]) return m1[1];
        const m2 = message.match(/RoomBooking\s*#(\d+)/i);
        if (m2?.[1]) return m2[1];
        const m3 = message.match(/đặt phòng\s*#(\d+)/i);
        if (m3?.[1]) return m3[1];
        return null;
    };

    const isRoomBookingMessage = (message: string) => {
        const normalized = message.toLowerCase();
        return normalized.includes('phòng') || normalized.includes('room') || normalized.includes('assetusage');
    };

    /** Nhấn vào dòng: chỉ đánh dấu đã đọc (đồng bộ luồng client Header) */
    const handleNotificationRowClick = async (notif: INotification) => {
        if (Date.now() - swipedDeleteRef.current.at < 350 && swipedDeleteRef.current.id === notif.id) {
            return;
        }
        if (!notif.isRead) {
            try {
                await clientMarkNotificationRead(notif.id);
                setNotifications(prev => prev.map(item => (item.id === notif.id ? { ...item, isRead: true } : item)));
            } catch {
                /* bỏ qua */
            }
        }
    };

    /** “Xem chi tiết”: đánh dấu đã đọc rồi điều hướng tới trang liên quan */
    const handleNotificationOpenDetail = async (notif: INotification) => {
        if (Date.now() - swipedDeleteRef.current.at < 350 && swipedDeleteRef.current.id === notif.id) {
            return;
        }
        if (!notif.isRead) {
            try {
                await clientMarkNotificationRead(notif.id);
                setNotifications(prev => prev.map(item => (item.id === notif.id ? { ...item, isRead: true } : item)));
            } catch {
                /* vẫn mở chi tiết */
            }
        }

        const bookingId = extractBookingId(notif.message);
        const assetUsageId = extractAssetUsageId(notif.message);

        if (notif.type === 'PAYMENT_CONFIRMED' || notif.type === 'PAYMENT_REQUESTED' || notif.type === 'PAYMENT_PROOF_UPLOADED') {
            navigate('/admin/payment');
            setNotifOpen(false);
            return;
        }

        if (notif.type === 'EQUIPMENT_BORROWED' || notif.type === 'EQUIPMENT_RETURNED' || notif.type === 'EQUIPMENT_LOST' || notif.type === 'EQUIPMENT_DAMAGED') {
            navigate('/admin/booking-equipment');
            setNotifOpen(false);
            return;
        }

        if (
            notif.type === 'BOOKING_CREATED' ||
            notif.type === 'BOOKING_PENDING_CONFIRMATION' ||
            notif.type === 'BOOKING_APPROVED' ||
            notif.type === 'BOOKING_REJECTED'
        ) {
            const routeToRooms = isRoomBookingMessage(notif.message) || assetUsageId != null;
            if (routeToRooms) {
                navigate(assetUsageId ? `/admin/asset-usage?openAssetUsageId=${assetUsageId}` : '/admin/asset-usage');
                setNotifOpen(false);
                return;
            }
        }

        if (bookingId) {
            navigate(`/admin/booking?bookingId=${bookingId}`);
        } else {
            navigate('/admin/booking');
        }
        setNotifOpen(false);
    };

    const handleNotifTouchStart = (id: number, e: TouchEvent<HTMLDivElement>) => {
        if (window.innerWidth > 768) return;
        const touch = e.changedTouches[0];
        notifTouchRef.current = { id, x: touch.clientX, y: touch.clientY };
    };

    const handleNotifTouchEnd = (id: number, e: TouchEvent<HTMLDivElement>) => {
        if (window.innerWidth > 768) return;
        if (notifTouchRef.current.id !== id) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - notifTouchRef.current.x;
        const deltaY = touch.clientY - notifTouchRef.current.y;

        if (deltaX < -70 && Math.abs(deltaY) < 40) {
            swipedDeleteRef.current = { id, at: Date.now() };
            void handleDeleteNotif(id);
        }
    };

    const adminSoundSettingsPopover = (
        <Popover
            title="Cài đặt chuông thông báo"
            trigger="click"
            open={adminNotifSoundPopoverOpen}
            onOpenChange={setAdminNotifSoundPopoverOpen}
            placement="bottomRight"
            rootClassName={styles.adminNotifSoundPopover}
            getPopupContainer={() => document.body}
            content={(
                <NotificationSoundSettingsPanel
                    bellSoundEnabled={bellSoundEnabled}
                    onBellSoundChange={(c) => { void handleAdminBellSoundPreferenceChange(c); }}
                    soundPreset={soundPreset}
                    onSoundPresetChange={(p) => { void handleAdminSoundPresetPreferenceChange(p); }}
                    onTestSound={() => playNotificationSound(audioCtxRef, soundPresetRef.current)}
                />
            )}
        >
            <Tooltip title="Cài đặt chuông thông báo" placement="bottom">
                <Button
                    type="text"
                    size="small"
                    className={styles.adminNotifGearBtn}
                    icon={<SettingOutlined />}
                    aria-label="Cài đặt chuông thông báo"
                    onClick={(e) => e.stopPropagation()}
                />
            </Tooltip>
        </Popover>
    );

    const notifContent = (
        <div className={styles.notifCard}>
            <div className={styles.notifHeader}>
                <span className={styles.notifTitle}>Thông báo quản trị</span>
                <Space size={10} wrap className={styles.notifActions}>
                    {adminSoundSettingsPopover}
                    {unreadCount > 0 && (
                        <button type="button" className={styles.notifMarkAll} onClick={handleMarkAllRead}>
                            Đánh dấu đã đọc
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button type="button" className={styles.notifDeleteAll} onClick={handleDeleteAllNotifications}>
                            Xóa tất cả
                        </button>
                    )}
                </Space>
            </div>
            <div className={styles.notifList}>
                {notifications.length === 0 ? (
                    <span className={styles.notifEmpty}>Chưa có thông báo nào</span>
                ) : (
                    notifications.slice(0, 10).map((notif) => (
                        <div
                            key={notif.id}
                            className={`${styles.notifItem} ${!notif.isRead ? styles.notifItemUnread : ''} ${styles.notifItemClickable}`}
                            onClick={() => void handleNotificationRowClick(notif)}
                            onTouchStart={(e) => handleNotifTouchStart(notif.id, e)}
                            onTouchEnd={(e) => handleNotifTouchEnd(notif.id, e)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    void handleNotificationRowClick(notif);
                                }
                            }}
                            title="Nhấn để đánh dấu đã đọc"
                        >
                            <Avatar
                                size={28}
                                src={notif.senderAvatarUrl || undefined}
                                className={styles.notifItemIcon}
                            >
                                {!notif.senderAvatarUrl ? (notif.senderName?.trim()?.[0] || 'H') : null}
                            </Avatar>
                            <div className={styles.notifItemBody}>
                                <span className={styles.notifItemTime}>{notif.senderName || 'Hệ thống'}</span>
                                <span className={styles.notifItemMsg}>{notif.message}</span>
                                <span className={styles.notifItemTime}>
                                    {new Date(notif.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                                <button
                                    type="button"
                                    className={styles.notifDetailLink}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void handleNotificationOpenDetail(notif);
                                    }}
                                >
                                    Xem chi tiết
                                </button>
                            </div>
                            <div className={styles.notifItemActions}>
                                {!notif.isRead && <span className={styles.notifDot} />}
                                <button
                                    type="button"
                                    className={styles.notifDeleteBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void handleDeleteNotif(notif.id);
                                    }}
                                >
                                    <DeleteOutlined />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <Layout className={styles.adminShell} style={cssVars}>
            {screens.md && (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    trigger={null}
                    theme={isDark ? 'dark' : 'light'}
                    width={252}
                    collapsedWidth={88}
                    className={styles.desktopSider}
                >
                    <div className={styles.siderBrand}>
                        <FaReact className={`icon-spin ${styles.brandIcon}`} />
                        {!collapsed && (
                            <div className={styles.brandText}>
                                <span className={styles.brandTitle}>UTB Admin</span>
                                <span className={styles.brandSubTitle}>Control Center</span>
                            </div>
                        )}
                        <Tooltip title={collapsed ? 'Mở rộng' : 'Thu gọn'} placement="right">
                            <Button
                                type="text"
                                onClick={() => setCollapsed(!collapsed)}
                                className={styles.collapseButton}
                                icon={collapsed ? <IoChevronForwardOutline /> : <IoChevronBackOutline />}
                            />
                        </Tooltip>
                    </div>

                    <div className={styles.siderMenuScroll}>
                        <Menu
                            theme={isDark ? 'dark' : 'light'}
                            mode="inline"
                            inlineCollapsed={collapsed}
                            items={menuItems}
                            selectedKeys={selectedMenuKey ? [selectedMenuKey] : []}
                            defaultOpenKeys={['features', 'settings']}
                            className={styles.sidebarMenu}
                        />
                    </div>
                </Sider>
            )}

            {!screens.md && (
                <Drawer
                    /* Close bên trái, nút thu gọn (extra) bên phải — flex trong SCSS giữ title không đè nút */
                    closable={{ placement: 'start' }}
                    title={
                        <span className={styles.mobileDrawerTitle}>
                            <FaReact className={`icon-spin ${styles.brandIcon}`} />
                            {!collapsed && <span className={styles.drawerTitle}>UTB Admin</span>}
                        </span>
                    }
                    extra={
                        <Tooltip title={collapsed ? 'Mở rộng' : 'Thu gọn'} placement="bottom">
                            <Button
                                type="text"
                                onClick={() => setCollapsed(!collapsed)}
                                className={`${styles.collapseButton} ${styles.drawerCollapseButton}`}
                                icon={collapsed ? <IoChevronForwardOutline /> : <IoChevronBackOutline />}
                            />
                        </Tooltip>
                    }
                    placement="left"
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    rootClassName={styles.mobileDrawer}
                    rootStyle={cssVars}
                    styles={mobileDrawerStyles}
                    mask={false}
                >
                    <div className={styles.siderMenuScroll}>
                        <Menu
                            mode="inline"
                            inlineCollapsed={collapsed}
                            items={menuItems}
                            theme={isDark ? 'dark' : 'light'}
                            onClick={() => setDrawerVisible(false)}
                            selectedKeys={selectedMenuKey ? [selectedMenuKey] : []}
                            defaultOpenKeys={['features', 'settings']}
                            className={styles.sidebarMenu}
                        />
                    </div>
                </Drawer>
            )}

            <Layout
                className={`${styles.mainLayout} ${collapsed ? styles.mainLayoutCollapsed : styles.mainLayoutExpanded}`}
            >
                <Header
                    className={styles.adminHeader}
                >
                    <div className={styles.headerLeft}>
                        {!screens.md && (
                            <Tooltip title={drawerVisible ? 'Đóng menu' : 'Mở menu'}>
                                <Button
                                    type="text"
                                    icon={<IoMenu />}
                                    onClick={() => setDrawerVisible(!drawerVisible)}
                                    className={styles.mobileMenuButton}
                                />
                            </Tooltip>
                        )}

                        <div className={styles.headerInfo}>
                            <Text className={styles.welcomeTitle}>
                                Chào mừng bạn đến với trang quản trị
                            </Text>
                            <Breadcrumb
                                items={[{ title: breadcrumbText }]}
                                className={styles.breadcrumb}
                            />
                        </div>
                    </div>

                    <div className={styles.headerRight}>
                        {screens.md ? (
                            <Popover
                                open={notifOpen}
                                onOpenChange={setNotifOpen}
                                placement="bottomRight"
                                trigger="click"
                                rootClassName={styles.notifPopover}
                                content={notifContent}
                            >
                                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                                    <Button
                                        type="text"
                                        className={styles.headerUtilityButton}
                                        icon={<BellOutlined />}
                                        aria-label="Thông báo quản trị"
                                    />
                                </Badge>
                            </Popover>
                        ) : (
                            <>
                                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                                    <Button
                                        type="text"
                                        className={styles.headerUtilityButton}
                                        icon={<BellOutlined />}
                                        aria-label="Thông báo quản trị"
                                        onClick={() => setNotifOpen(true)}
                                    />
                                </Badge>

                                <Drawer
                                    title="Thông báo quản trị"
                                    placement="right"
                                    open={notifOpen}
                                    onClose={() => setNotifOpen(false)}
                                    size="default"
                                    rootClassName={styles.mobileNotifDrawer}
                                    styles={{ body: { padding: 0 } }}
                                >
                                    {notifContent}
                                </Drawer>
                            </>
                        )}

                        <Tooltip placement="topLeft" title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}>
                            <Switch
                                size='small'
                                checked={isDark}
                                onChange={toggleTheme}
                                checkedChildren={<LuMoon />}
                                unCheckedChildren={<IoSunny />}
                                className={styles.themeSwitch}
                            />
                        </Tooltip>

                        <Popover
                            placement="bottomRight"
                            trigger="click"
                            rootClassName={`${styles.profilePopover} ${!screens.md ? styles.profilePopoverMobile : ''}`}
                            content={
                                <div className={styles.profileCard}>
                                    <div className={styles.profileCardTop}>
                                        {account?.avatarUrl ? (
                                            <img src={account.avatarUrl} className={styles.profileCardAvatar} alt="avatar" />
                                        ) : (
                                            <Avatar size={64} icon={<UserOutlined />} className={styles.profileCardAvatarFallback} />
                                        )}
                                        <div className={styles.profileCardInfo}>
                                            <span className={styles.profileCardName}>{account?.fullName || account?.name || 'Admin'}</span>
                                            <span className={styles.profileCardEmail}>{account?.email}</span>
                                            <span className={styles.profileCardRole}>
                                                {account?.roles?.map(r => r.name).join(', ') || 'Admin'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.profileCardDivider} />
                                    <div className={styles.profileCardActions}>
                                        <button className={styles.profileCardAction} onClick={() => { setOpenModalAccount(true); }}>
                                            <FaUserCircle size={14} /> Thông tin cá nhân
                                        </button>
                                        <button className={styles.profileCardAction} onClick={() => { setOpenModalForget(true); }}>
                                            <LockOutlined /> Đổi mật khẩu
                                        </button>
                                        <button className={styles.profileCardAction} onClick={handleLogout}>
                                            <LogoutOutlined /> Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            }
                        >
                            <button className={styles.headerAvatarBtn} aria-label="Profile">
                                {account?.avatarUrl ? (
                                    <img src={account.avatarUrl} className={styles.headerAvatarImg} alt="avatar" />
                                ) : (
                                    <Avatar size={32} icon={<UserOutlined />} className={styles.headerAvatarFallback} />
                                )}
                                {screens.md && (
                                    <span className={styles.headerAvatarName}>{account?.fullName || account?.name || 'Admin'}</span>
                                )}
                            </button>
                        </Popover>
                    </div>
                </Header>

                <Content
                    className={styles.adminContent}
                >
                    <Outlet />
                </Content>
            </Layout>

            <ModalAccount
                openModalAccount={openModalAccount}
                setOpenModalAccount={setOpenModalAccount}
            />
            <ModalForget open={openModalForget} setOpen={setOpenModalForget} />
        </Layout>
    );
};

export default AdminSidebar;