import { CalendarOutlined, ClockCircleOutlined, DownOutlined, HistoryOutlined, LeftOutlined, RightOutlined, StarFilled } from '@ant-design/icons';
import { Button, DatePicker, Image, Layout, Spin, Tag, Tooltip } from 'antd';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { IoMdClock } from 'react-icons/io';
import { TbSoccerField } from 'react-icons/tb';
import { useLocation, useParams } from 'react-router';

import { getPublicAssetById } from '../../../../config/Api';
import type { IAsset } from '../../../../types/asset';
import { useRoomBookingTimeline } from './hook/useRoomBookingTimeline';
import CreateRoomBookingForm from './components/CreateRoomBookingForm';
import RoomBookingTimeline from './components/RoomBookingTimeline';
import UpdateRoomBookingForm from './components/UpdateRoomBookingForm';
import RoomBookingDevicePanel from './components/RoomBookingDevicePanel';
import ModalRoomBookingHistory from './modals/ModalRoomBookingHistory';
import '../../../../pages/client/booking/BookingPage.scss';
import '../components/RoomTimelinePanel.scss';

const { Content } = Layout;

interface RoomBookingPageProps {
    theme: 'light' | 'dark';
}

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
    visible: (i = 0) => ({ opacity: 1, transition: { duration: 0.8, ease: 'easeOut', delay: i * 0.1 } }),
};

const DOW_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function weekOf(anchor: Dayjs): Dayjs[] {
    const sunday = anchor.startOf('week');
    return Array.from({ length: 7 }, (_, i) => sunday.add(i, 'day'));
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
    const [timelineOpen, setTimelineOpen] = useState(true);
    const [roomOpen, setRoomOpen] = useState(true);
    const [formOpen, setFormOpen] = useState(true);
    const [modeFlexible, setModeFlexible] = useState(false);
    const [openHistory, setOpenHistory] = useState(false);
    const stripRef = useRef<HTMLDivElement>(null);

    const { timeline, timelineLoading, reloadTimeline } = useRoomBookingTimeline(
        assetIdNumber,
        bookingDate,
        modeFlexible ? 'FLEXIBLE' : 'PERIODS'
    );

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
        const active = stripRef.current?.querySelector<HTMLElement>('.bk__date-chip--active');
        active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [bookingDate]);

    const weekDays = weekOf(weekAnchor);
    const pickerPopupClass = isDark ? 'bk__picker-popup bk__picker-popup--dark' : 'bk__picker-popup bk__picker-popup--light';

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
                            Đặt phòng <em className="bk__gold-text">linh hoạt</em>
                        </motion.h1>
                        <Button icon={<HistoryOutlined />} onClick={() => setOpenHistory(true)}>
                            Lịch sử đặt phòng
                        </Button>
                    </div>
                </section>

                <section className="bk__main">
                    <div className="bk__container bk__main-inner">
                        <div className="bk__main-timeline">
                            <motion.div className="bk__panel" initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                                <div className="bk__pitch-accordion" role="button" tabIndex={0} onClick={() => setTimelineOpen((v) => !v)}>
                                    <span className="bk__pitch-accordion__title">
                                        <CalendarOutlined /> Chọn ngày xem lịch phòng
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div className="bk__cal-nav" onClick={(e) => e.stopPropagation()}>
                                            <button className="bk__nav-btn" onClick={() => setWeekAnchor((a) => a.subtract(7, 'day'))}>
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
                                                    onChange={(value) => {
                                                        if (!value) return;
                                                        setBookingDate(value);
                                                        setWeekAnchor(value);
                                                    }}
                                                />
                                            </Tooltip>
                                            <button className="bk__nav-btn" onClick={() => setWeekAnchor((a) => a.add(7, 'day'))}>
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
                                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                            <p className="bk__week-label">
                                                {weekDays[0].format('DD/MM')} - {weekDays[6].format('DD/MM/YYYY')}
                                            </p>
                                            <div className="bk__date-strip" ref={stripRef}>
                                                {weekDays.map((d) => {
                                                    const isActive = d.isSame(bookingDate, 'day');
                                                    const isToday = d.isSame(dayjs(), 'day');
                                                    return (
                                                        <motion.button
                                                            key={d.format('YYYY-MM-DD')}
                                                            type="button"
                                                            className={['bk__date-chip', isActive && 'bk__date-chip--active', isToday && 'bk__date-chip--today']
                                                                .filter(Boolean)
                                                                .join(' ')}
                                                            onClick={() => {
                                                                setBookingDate(d);
                                                                setWeekAnchor(d);
                                                            }}
                                                        >
                                                            <span className="bk__date-chip__dow">{DOW_VN[d.day()]}</span>
                                                            <span className="bk__date-chip__day">{d.format('DD')}</span>
                                                            <span className="bk__date-chip__mon">Th{d.format('M')}</span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                            <p className="bk__panel-label" style={{ marginBottom: 10 }}>
                                                <IoMdClock size={12} /> {bookingDate.format('dddd, DD/MM/YYYY')}
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
                                            <motion.div className="bk__panel bk__spin-center">
                                                <Spin size="large" />
                                            </motion.div>
                                        ) : asset ? (
                                            <motion.div className="bk__panel bk__pitch-panel">
                                                <button className="bk__pitch-accordion" onClick={() => setRoomOpen((v) => !v)}>
                                                    <span className="bk__pitch-accordion__title">
                                                        <TbSoccerField size={15} /> {asset.assetName}
                                                    </span>
                                                    <motion.span animate={{ rotate: roomOpen ? 180 : 0 }} className="bk__pitch-accordion__arrow">
                                                        <DownOutlined />
                                                    </motion.span>
                                                </button>
                                                {roomOpen ? (
                                                    <div>
                                                        <div className="bk__pitch-img-wrap">
                                                            <Image
                                                                src={asset.assetsUrl || '/placeholder-pitch.jpg'}
                                                                width="100%"
                                                                height={148}
                                                                style={{ objectFit: 'cover' }}
                                                                fallback="/placeholder-pitch.jpg"
                                                            />
                                                        </div>
                                                        <div className="bk__pitch-body">
                                                            <div className="bk__pitch-meta">
                                                                <div className="bk__pitch-meta-row">
                                                                    <TbSoccerField />
                                                                    <span className="bk__pitch-meta-label">Tên phòng:</span>
                                                                    <span className="bk__pitch-meta-value">{asset.assetName}</span>
                                                                </div>
                                                                <div className="bk__pitch-meta-row">
                                                                    <ClockCircleOutlined />
                                                                    <span className="bk__pitch-meta-label">Sức chứa:</span>
                                                                    <span className="bk__pitch-meta-value">
                                                                        {asset.capacity != null ? `${asset.capacity} chỗ` : 'Chưa cập nhật'}
                                                                    </span>
                                                                </div>
                                                                <div className="bk__pitch-meta-row">
                                                                    <FaMapMarkerAlt />
                                                                    <span className="bk__pitch-meta-label">Vị trí:</span>
                                                                    <span className="bk__pitch-meta-value">{asset.location || 'Chưa cập nhật'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="bk__pitch-footer">
                                                                <Tag color="processing">Phòng tin học</Tag>
                                                            </div>
                                                        </div>
                                                        <RoomBookingDevicePanel
                                                            assetId={asset.id}
                                                            roomBookingId={roomBookingId}
                                                        />
                                                    </div>
                                                ) : null}
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="bk__main-cards__slot bk__main-cards__slot--booking">
                                <div className="bk__main-cards__panel-stretch">
                                    <motion.div className="bk__panel bk__form-panel" initial="hidden" animate="visible" variants={fadeUp} custom={2}>
                                        <button className="bk__pitch-accordion" onClick={() => setFormOpen((v) => !v)}>
                                            <span className="bk__pitch-accordion__title">
                                                <TbSoccerField size={15} /> Thông tin đặt phòng
                                            </span>
                                            <motion.span animate={{ rotate: formOpen ? 180 : 0 }} className="bk__pitch-accordion__arrow">
                                                <DownOutlined />
                                            </motion.span>
                                        </button>
                                        {formOpen ? (
                                            <div className="bk__form-panel__body">
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
                                                        onSuccess={reloadTimeline}
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
                                                        onSuccess={reloadTimeline}
                                                    />
                                                )}
                                            </div>
                                        ) : null}
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Content>
            <ModalRoomBookingHistory open={openHistory} onClose={() => setOpenHistory(false)} />
        </Layout>
    );
};

export default RoomBookingPage;
