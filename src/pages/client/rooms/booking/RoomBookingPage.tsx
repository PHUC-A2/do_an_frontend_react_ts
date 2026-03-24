import {
    CalendarOutlined,
    ClockCircleOutlined,
    DownOutlined,
    EnvironmentOutlined,
    HomeOutlined,
    LeftOutlined,
    ReloadOutlined,
    RightOutlined,
    StarFilled,
} from '@ant-design/icons';
import { Button, DatePicker, Image, Layout, Spin, Switch, Tag, Tooltip } from 'antd';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { GrStatusGood } from 'react-icons/gr';
import { IoMdClock } from 'react-icons/io';
import { MdMeetingRoom, MdMergeType, MdPriceChange } from 'react-icons/md';
import { useLocation, useParams } from 'react-router';

import {
    getClientRoomBookingById,
    getClientRoomBookingCheckout,
    getClientRoomBookingReturn,
    getPublicAssetById,
    getPublicAssetDevices,
} from '../../../../config/Api';
import type { IAsset } from '../../../../types/asset';
import type { IAssetUsage } from '../../../../types/assetUsage';
import type { ICheckout } from '../../../../types/checkout';
import type { IDevice } from '../../../../types/device';
import type { IDeviceReturn } from '../../../../types/deviceReturn';
import { ASSET_ROOM_FEE_MODE_META, resolveAssetRoomFeeMode } from '../../../../utils/constants/asset.constants';
import { ASSET_USAGE_STATUS_META } from '../../../../utils/constants/assetUsage.constants';
import { DEVICE_TYPE_META } from '../../../../utils/constants/device.constants';
import { DEVICE_CONDITION_META } from '../../../../utils/constants/deviceReturn.constants';
import { useRoomBookingTimeline } from './hook/useRoomBookingTimeline';
import CreateRoomBookingForm from './components/CreateRoomBookingForm';
import RoomBookingTimeline from './components/RoomBookingTimeline';
import UpdateRoomBookingForm from './components/UpdateRoomBookingForm';
import '../../../../pages/client/booking/BookingPage.scss';
import '../components/RoomTimelinePanel.scss';

const { Content } = Layout;

interface RoomBookingPageProps {
    theme: 'light' | 'dark';
}

/** Hiệu ứng giống BookingPage (đặt sân) — giữ đồng bộ UX. */
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: 'easeOut', delay: i * 0.12 },
    }),
};
const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 0) => ({
        opacity: 1,
        transition: { duration: 0.8, ease: 'easeOut', delay: i * 0.1 },
    }),
};
const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.94, transition: { duration: 0.2, ease: 'easeIn' } },
};

const DOW_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** 7 ngày của tuần chứa `anchor` — copy logic BookingPage. */
function weekOf(anchor: Dayjs): Dayjs[] {
    const monday = anchor.startOf('week');
    return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day'));
}

const RoomBookingPage = ({ theme }: RoomBookingPageProps) => {
    const isDark = theme === 'dark';
    const { assetId } = useParams<{ assetId: string }>();
    const location = useLocation();
    const assetIdNumber = Number(assetId);
    const mode: 'CREATE' | 'UPDATE' = location.state?.mode ?? 'CREATE';
    const roomBookingId: number | undefined = location.state?.roomBookingId;

    const [bookingDate, setBookingDate] = useState<Dayjs>(dayjs());
    const [weekAnchor, setWeekAnchor] = useState<Dayjs>(dayjs());
    const [asset, setAsset] = useState<IAsset | null>(null);
    const [assetLoading, setAssetLoading] = useState(false);
    const [roomDevices, setRoomDevices] = useState<IDevice[]>([]);
    /** Snapshot đăng ký + biên bản nhận/trả — chỉ khi sửa booking (có mã). */
    const [usageDetail, setUsageDetail] = useState<IAssetUsage | null>(null);
    const [checkoutDetail, setCheckoutDetail] = useState<ICheckout | null>(null);
    const [returnDetail, setReturnDetail] = useState<IDeviceReturn | null>(null);
    const [panelRefreshing, setPanelRefreshing] = useState(false);
    /** Đã hoàn tất lần gọi đầu (hoặc sau Làm mới) — tránh nhầm “chưa có mã” khi API đang chạy. */
    const [bookingSidecarReady, setBookingSidecarReady] = useState(false);
    const [timelineOpen, setTimelineOpen] = useState(true);
    const [roomOpen, setRoomOpen] = useState(true);
    const [formOpen, setFormOpen] = useState(true);
    /** Theo tiết vs giờ linh hoạt — đồng bộ hook timeline + form (chọn tiết/giờ chỉ trong form). */
    const [modeFlexible, setModeFlexible] = useState(false);
    const stripRef = useRef<HTMLDivElement>(null);

    const { timeline, timelineLoading, reloadTimeline } = useRoomBookingTimeline(
        assetIdNumber,
        bookingDate,
        modeFlexible ? 'FLEXIBLE' : 'PERIODS'
    );

    // Tải trạng thái đăng ký / nhận / trả theo mã booking (giống RoomBookingDevicePanel).
    const reloadBookingSidecars = useCallback(async () => {
        if (!roomBookingId) {
            setUsageDetail(null);
            setCheckoutDetail(null);
            setReturnDetail(null);
            setBookingSidecarReady(true);
            return;
        }
        try {
            const usageRes = await getClientRoomBookingById(roomBookingId);
            setUsageDetail(usageRes.data.data ?? null);
        } catch {
            setUsageDetail(null);
        }
        try {
            const checkoutRes = await getClientRoomBookingCheckout(roomBookingId);
            setCheckoutDetail(checkoutRes.data.data ?? null);
        } catch {
            setCheckoutDetail(null);
        }
        try {
            const returnRes = await getClientRoomBookingReturn(roomBookingId);
            setReturnDetail(returnRes.data.data ?? null);
        } catch {
            setReturnDetail(null);
        } finally {
            setBookingSidecarReady(true);
        }
    }, [roomBookingId]);

    useEffect(() => {
        setBookingSidecarReady(false);
    }, [roomBookingId]);

    useEffect(() => {
        if (!assetIdNumber) return;
        setAssetLoading(true);
        getPublicAssetById(assetIdNumber)
            .then((res) => {
                if (res.data.statusCode === 200) setAsset(res.data.data ?? null);
            })
            .finally(() => setAssetLoading(false));
    }, [assetIdNumber]);

    useEffect(() => {
        if (!assetIdNumber) return;
        getPublicAssetDevices(assetIdNumber)
            .then((res) => setRoomDevices(res.data.data ?? []))
            .catch(() => setRoomDevices([]));
    }, [assetIdNumber]);

    useEffect(() => {
        void reloadBookingSidecars();
    }, [reloadBookingSidecars]);

    // Tự làm mới trạng thái định kỳ khi đang xem một đăng ký cụ thể (sau nhận/trả phòng).
    useEffect(() => {
        if (!roomBookingId) return;
        const timer = window.setInterval(() => {
            void reloadTimeline();
            void reloadBookingSidecars();
        }, 15000);
        return () => window.clearInterval(timer);
    }, [roomBookingId, reloadTimeline, reloadBookingSidecars]);

    /** Làm mới ảnh/meta phòng, thiết bị, timeline và trạng thái biên bản. */
    const refreshRoomPanel = useCallback(async () => {
        if (!assetIdNumber) return;
        setPanelRefreshing(true);
        setBookingSidecarReady(false);
        try {
            const [ar, dr] = await Promise.all([getPublicAssetById(assetIdNumber), getPublicAssetDevices(assetIdNumber)]);
            if (ar.data.statusCode === 200) setAsset(ar.data.data ?? null);
            setRoomDevices(dr.data.data ?? []);
            await reloadTimeline();
            await reloadBookingSidecars();
        } finally {
            setPanelRefreshing(false);
        }
    }, [assetIdNumber, reloadTimeline, reloadBookingSidecars]);

    useEffect(() => {
        const active = stripRef.current?.querySelector<HTMLElement>('.bk__date-chip--active');
        active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [bookingDate]);

    const weekDays = weekOf(weekAnchor);
    const pickerPopupClass = isDark ? 'bk__picker-popup bk__picker-popup--dark' : 'bk__picker-popup bk__picker-popup--light';

    const openHoursLabel = useMemo(() => {
        if (!timeline) return '—';
        return `${timeline.flexibleViewStart?.slice(0, 5) ?? '—'} – ${timeline.flexibleViewEnd?.slice(0, 5) ?? '—'}`;
    }, [timeline]);

    /** Dòng giá dưới card phòng — theo roomFeeMode admin cấu hình trên Asset. */
    const roomFooterFeeLine = useMemo(() => {
        if (!asset) return ASSET_ROOM_FEE_MODE_META.FREE.footerLine;
        const mode = resolveAssetRoomFeeMode(asset.roomFeeMode);
        return ASSET_ROOM_FEE_MODE_META[mode].footerLine;
    }, [asset]);

    const goToPrevWeek = () => setWeekAnchor((a) => a.subtract(7, 'day'));
    const goToNextWeek = () => setWeekAnchor((a) => a.add(7, 'day'));
    const handlePickerChange = (value: Dayjs | null) => {
        if (!value) return;
        setBookingDate(value);
        setWeekAnchor(value);
    };
    const selectDay = (d: Dayjs) => {
        setBookingDate(d);
        setWeekAnchor(d);
    };

    /** Sau khi tạo/cập nhật đặt phòng — làm mới timeline + trạng thái panel phòng. */
    const handleTimelineSuccess = () => {
        void reloadTimeline();
        void reloadBookingSidecars();
    };

    return (
        <Layout className={`bk ${isDark ? 'bk--dark' : 'bk--light'}`}>
            <Content className="bk__content">
                <section className="bk__hero">
                    <div className="bk__hero-bg" aria-hidden>
                        <div className="bk__hero-orb bk__hero-orb--1" />
                        <div className="bk__hero-orb bk__hero-orb--2" />
                        <div className="bk__hero-orb bk__hero-orb--3" />
                    </div>
                    <div className="bk__container bk__hero-inner">
                        <motion.div className="bk__hero-badge" initial="hidden" animate="visible" variants={fadeIn} custom={0}>
                            <StarFilled style={{ color: '#faad14', fontSize: 11 }} />
                            <span>TBU Sport · Đặt phòng tin học</span>
                        </motion.div>
                        <motion.h1 className="bk__hero-title" initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                            {mode === 'CREATE' ? (
                                <>
                                    Đặt lịch phòng <em className="bk__gold-text">tức thì</em>
                                </>
                            ) : (
                                <>
                                    Cập nhật <em className="bk__gold-text">lịch đặt phòng</em>
                                </>
                            )}
                        </motion.h1>
                        <motion.p className="bk__hero-sub" initial="hidden" animate="visible" variants={fadeUp} custom={2}>
                            Chọn ngày, xem khung giờ trống và hoàn tất đặt phòng trong vài giây. Mượt mà trên mọi thiết bị.
                        </motion.p>
                        <motion.div className="bk__legend" initial="hidden" animate="visible" variants={fadeIn} custom={3}>
                            <IoMdClock size={14} style={{ opacity: 0.5 }} />
                            <span className="bk__legend-item">
                                <span className="bk__legend-dot bk__legend-dot--free" />
                                Trống
                            </span>
                            <span className="bk__legend-item">
                                <span className="bk__legend-dot bk__legend-dot--booked" />
                                Đã đặt
                            </span>
                        </motion.div>
                    </div>
                </section>

                <section className="bk__main">
                    <div className="bk__container bk__main-inner">
                        <div className="bk__main-timeline">
                            <motion.div className="bk__panel" initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                                <div
                                    className="bk__pitch-accordion"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setTimelineOpen((o) => !o)}
                                    onKeyDown={(e) => e.key === 'Enter' && setTimelineOpen((o) => !o)}
                                >
                                    <span className="bk__pitch-accordion__title">
                                        <CalendarOutlined />
                                        Chọn ngày xem lịch
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div className="bk__cal-nav" onClick={(e) => e.stopPropagation()}>
                                            <button type="button" className="bk__nav-btn" onClick={goToPrevWeek} title="Tuần trước">
                                                <LeftOutlined />
                                            </button>
                                            <Tooltip title="Chọn ngày bất kỳ">
                                                <DatePicker
                                                    className="bk__nav-picker"
                                                    value={bookingDate}
                                                    format="DD/MM/YYYY"
                                                    allowClear={false}
                                                    inputReadOnly
                                                    suffixIcon={<CalendarOutlined />}
                                                    classNames={{ popup: pickerPopupClass }}
                                                    disabledDate={(current) => !!current && current.startOf('day').isBefore(dayjs().startOf('day'))}
                                                    onChange={handlePickerChange}
                                                />
                                            </Tooltip>
                                            <button type="button" className="bk__nav-btn" onClick={goToNextWeek} title="Tuần sau">
                                                <RightOutlined />
                                            </button>
                                        </div>
                                        <motion.span
                                            animate={{ rotate: timelineOpen ? 180 : 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="bk__pitch-accordion__arrow"
                                        >
                                            <DownOutlined />
                                        </motion.span>
                                    </div>
                                </div>

                                <AnimatePresence initial={false}>
                                    {timelineOpen && (
                                        <motion.div
                                            key="timeline-body"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.25, ease: 'easeOut' }}
                                        >
                                            <p className="bk__week-label">
                                                {weekDays[0].format('DD/MM')} – {weekDays[6].format('DD/MM/YYYY')}
                                            </p>
                                            <div className="bk__date-strip" ref={stripRef}>
                                                {weekDays.map((d) => {
                                                    const isActive = d.isSame(bookingDate, 'day');
                                                    const isToday = d.isSame(dayjs(), 'day');
                                                    return (
                                                        <motion.button
                                                            key={d.format('YYYY-MM-DD')}
                                                            type="button"
                                                            className={['bk__date-chip', isActive ? 'bk__date-chip--active' : '', isToday ? 'bk__date-chip--today' : '']
                                                                .filter(Boolean)
                                                                .join(' ')}
                                                            onClick={() => selectDay(d)}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <span className="bk__date-chip__dow">{DOW_VN[d.day()]}</span>
                                                            <span className="bk__date-chip__day">{d.format('DD')}</span>
                                                            <span className="bk__date-chip__mon">Th{d.format('M')}</span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => e.stopPropagation()}
                                                style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
                                            >
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                    Chế độ đặt lịch
                                                </span>
                                                <span style={{ fontSize: '0.82rem' }}>Theo tiết</span>
                                                <Switch checked={modeFlexible} onChange={setModeFlexible} />
                                                <span style={{ fontSize: '0.82rem' }}>Giờ linh hoạt</span>
                                            </div>
                                            <p className="bk__panel-label" style={{ marginBottom: 10 }}>
                                                <IoMdClock size={12} />
                                                {bookingDate.format('dddd, DD/MM/YYYY')}
                                            </p>
                                            <RoomBookingTimeline timelineLoading={timelineLoading} timeline={timeline} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>

                        <div className="bk__main-cards">
                            <div className="bk__main-cards__slot bk__main-cards__slot--pitch">
                                <div className="bk__main-cards__panel-stretch">
                                    <AnimatePresence mode="wait">
                                        {assetLoading ? (
                                            <motion.div
                                                key="spin"
                                                className="bk__panel bk__spin-center"
                                                variants={scaleIn}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                            >
                                                <Spin size="large" />
                                            </motion.div>
                                        ) : asset ? (
                                            <motion.div
                                                key={`room-${asset.id}`}
                                                className="bk__panel bk__pitch-panel"
                                                variants={scaleIn}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                            >
                                                <div className="bk__pitch-accordion-row">
                                                    <button type="button" className="bk__pitch-accordion" onClick={() => setRoomOpen((o) => !o)}>
                                                        <span className="bk__pitch-accordion__title">
                                                            <MdMeetingRoom size={17} />
                                                            {asset.assetName}
                                                        </span>
                                                        <motion.span
                                                            animate={{ rotate: roomOpen ? 180 : 0 }}
                                                            transition={{ duration: 0.25 }}
                                                            className="bk__pitch-accordion__arrow"
                                                        >
                                                            <DownOutlined />
                                                        </motion.span>
                                                    </button>
                                                    <Tooltip title="Làm mới thông tin phòng và trạng thái đăng ký">
                                                        <Button
                                                            type="text"
                                                            className="bk__pitch-refresh"
                                                            icon={<ReloadOutlined spin={panelRefreshing} />}
                                                            loading={panelRefreshing}
                                                            onClick={() => void refreshRoomPanel()}
                                                            aria-label="Làm mới"
                                                        />
                                                    </Tooltip>
                                                </div>

                                                <AnimatePresence initial={false}>
                                                    {roomOpen && (
                                                        <motion.div
                                                            key="room-body"
                                                            initial={{ opacity: 0, y: -6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -6 }}
                                                            transition={{ duration: 0.25, ease: 'easeOut' }}
                                                        >
                                                            <div className="bk__pitch-img-wrap">
                                                                <Image
                                                                    src={asset.assetsUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c'}
                                                                    alt={asset.assetName ?? undefined}
                                                                    width="100%"
                                                                    height={148}
                                                                    style={{ objectFit: 'cover' }}
                                                                    fallback="https://images.unsplash.com/photo-1497366216548-37526070297c"
                                                                    preview={{ mask: 'Xem ảnh' }}
                                                                />
                                                            </div>
                                                            <div className="bk__pitch-body">
                                                                <div className="bk__pitch-tags">
                                                                    <Tag color="blue">
                                                                        <MdMergeType /> Phòng tin học
                                                                    </Tag>
                                                                    <Tag color="success">
                                                                        <GrStatusGood /> Đang hoạt động
                                                                    </Tag>
                                                                </div>
                                                                <div className="bk__pitch-tags" style={{ marginTop: 8 }}>
                                                                    {roomBookingId && !bookingSidecarReady ? (
                                                                        <Tag>
                                                                            <Spin size="small" /> Đang tải trạng thái đăng ký…
                                                                        </Tag>
                                                                    ) : roomBookingId && usageDetail ? (
                                                                        <>
                                                                            <Tag color={ASSET_USAGE_STATUS_META[usageDetail.status]?.color ?? 'default'}>
                                                                                Đăng ký: {ASSET_USAGE_STATUS_META[usageDetail.status]?.label ?? usageDetail.status}
                                                                            </Tag>
                                                                            <Tag color={checkoutDetail ? 'processing' : 'default'}>
                                                                                {checkoutDetail ? 'Đã nhận phòng' : 'Chưa nhận phòng'}
                                                                            </Tag>
                                                                            <Tag color={returnDetail ? 'success' : 'default'}>
                                                                                {returnDetail
                                                                                    ? `Đã trả phòng (${DEVICE_CONDITION_META[returnDetail.deviceStatus]?.label ?? returnDetail.deviceStatus})`
                                                                                    : 'Chưa trả phòng'}
                                                                            </Tag>
                                                                        </>
                                                                    ) : roomBookingId && bookingSidecarReady && !usageDetail ? (
                                                                        <Tag color="error">Không tải được đăng ký — thử bấm Làm mới</Tag>
                                                                    ) : (
                                                                        <Tag color="warning">
                                                                            Đặt mới — trạng thái nhận/trả xem tại lịch sử sau khi có mã đăng ký
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                                <div className="bk__pitch-meta">
                                                                    <div className="bk__pitch-meta-row">
                                                                        <span className="bk__pitch-meta-icon" aria-hidden>
                                                                            #
                                                                        </span>
                                                                        <span className="bk__pitch-meta-label">Mã phòng:</span>
                                                                        <span className="bk__pitch-meta-value">#{asset.id}</span>
                                                                    </div>
                                                                    <div className="bk__pitch-meta-row">
                                                                        <HomeOutlined />
                                                                        <span className="bk__pitch-meta-label">Tên phòng:</span>
                                                                        <span className="bk__pitch-meta-value">{asset.assetName}</span>
                                                                    </div>
                                                                    <div className="bk__pitch-meta-row">
                                                                        <EnvironmentOutlined />
                                                                        <span className="bk__pitch-meta-label">Vị trí / tòa:</span>
                                                                        <span className="bk__pitch-meta-value">{asset.location?.trim() || 'Chưa cập nhật'}</span>
                                                                    </div>
                                                                    <div className="bk__pitch-meta-row">
                                                                        <span className="bk__pitch-meta-icon" aria-hidden>
                                                                            👥
                                                                        </span>
                                                                        <span className="bk__pitch-meta-label">Sức chứa:</span>
                                                                        <span className="bk__pitch-meta-value">
                                                                            {asset.capacity != null && asset.capacity > 0
                                                                                ? `${asset.capacity} (ước tính)`
                                                                                : 'Chưa cập nhật'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="bk__pitch-meta-row">
                                                                        <ClockCircleOutlined />
                                                                        <span className="bk__pitch-meta-label">Giờ mở cửa:</span>
                                                                        <span className="bk__pitch-meta-value">{openHoursLabel}</span>
                                                                    </div>
                                                                    <div className="bk__pitch-meta-row">
                                                                        <span className="bk__pitch-meta-icon" aria-hidden>
                                                                            🧰
                                                                        </span>
                                                                        <span className="bk__pitch-meta-label">Thiết bị phòng:</span>
                                                                        {/* Mỗi thiết bị một dòng trong cột giá trị — đồng bộ font/màu với các meta khác */}
                                                                        <div className="bk__pitch-meta-value bk__pitch-meta-value--equipment-lines">
                                                                            {roomDevices.length === 0 ? (
                                                                                <span className="bk__pitch-equipment-line">Chưa cập nhật</span>
                                                                            ) : (
                                                                                roomDevices.map((item) => {
                                                                                    const role =
                                                                                        DEVICE_TYPE_META[item.deviceType]?.label ?? item.deviceType;
                                                                                    return (
                                                                                        <span key={item.id} className="bk__pitch-equipment-line">
                                                                                            {item.deviceName} ({role}) x{item.quantity}
                                                                                        </span>
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="bk__pitch-footer">
                                                                    <div className="bk__pitch-price">
                                                                        <MdPriceChange size={15} />
                                                                        {roomFooterFeeLine}
                                                                    </div>
                                                                    <Tooltip title="Mở vị trí trên Google Maps">
                                                                        <button
                                                                            type="button"
                                                                            className="bk__dir-btn"
                                                                            disabled={!asset.location?.trim()}
                                                                            onClick={() => {
                                                                                const q = asset.location?.trim();
                                                                                if (!q) return;
                                                                                window.open(
                                                                                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
                                                                                    '_blank'
                                                                                );
                                                                            }}
                                                                        >
                                                                            <FaMapMarkerAlt size={12} />
                                                                        </button>
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="bk__main-cards__slot bk__main-cards__slot--booking">
                                <div className="bk__main-cards__panel-stretch">
                                    <motion.div className="bk__panel bk__form-panel" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
                                        <button type="button" className="bk__pitch-accordion" onClick={() => setFormOpen((o) => !o)}>
                                            <span className="bk__pitch-accordion__title">
                                                <MdMeetingRoom size={17} />
                                                {mode === 'CREATE' ? 'Thông tin đặt phòng' : 'Cập nhật thông tin'}
                                            </span>
                                            <motion.span
                                                animate={{ rotate: formOpen ? 180 : 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="bk__pitch-accordion__arrow"
                                            >
                                                <DownOutlined />
                                            </motion.span>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {formOpen && (
                                                <motion.div
                                                    key="form-body"
                                                    className="bk__form-panel__body"
                                                    initial={{ opacity: 0, y: -6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                                >
                                                    {mode === 'UPDATE' && roomBookingId ? (
                                                        <UpdateRoomBookingForm
                                                            roomBookingId={roomBookingId}
                                                            assetId={assetIdNumber}
                                                            asset={asset}
                                                            assetLoading={assetLoading}
                                                            bookingDate={bookingDate}
                                                            timeline={timeline}
                                                            modeFlexible={modeFlexible}
                                                            onModeFlexibleChange={setModeFlexible}
                                                            isDark={isDark}
                                                            onSuccess={handleTimelineSuccess}
                                                        />
                                                    ) : (
                                                        <CreateRoomBookingForm
                                                            assetId={assetIdNumber}
                                                            asset={asset}
                                                            assetLoading={assetLoading}
                                                            bookingDate={bookingDate}
                                                            timeline={timeline}
                                                            modeFlexible={modeFlexible}
                                                            onModeFlexibleChange={setModeFlexible}
                                                            isDark={isDark}
                                                            onSuccess={handleTimelineSuccess}
                                                        />
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Content>
        </Layout>
    );
};

export default RoomBookingPage;
