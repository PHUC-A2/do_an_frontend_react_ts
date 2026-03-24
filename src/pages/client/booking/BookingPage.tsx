import React, { useEffect, useRef, useState } from "react";
import { DatePicker, Layout, Spin, Tag, Tooltip, Image } from "antd";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
    EnvironmentOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    StarFilled,
    LeftOutlined,
    RightOutlined,
    ReloadOutlined,
    DownOutlined,
} from "@ant-design/icons";
import { TbSoccerField } from "react-icons/tb";
import { IoMdClock } from "react-icons/io";
import { MdMergeType, MdPriceChange } from "react-icons/md";
import { GiSloth } from "react-icons/gi";
import { FaMapMarkerAlt } from "react-icons/fa";
import { GrStatusGood } from "react-icons/gr";
import dayjs, { type Dayjs } from "dayjs";
import { useLocation, useParams } from "react-router";

import "./BookingPage.scss";
import { clientGetPitchEquipments, getPitchById } from "../../../config/Api";
import type { IPitch } from "../../../types/pitch";
import type { IPitchEquipment } from "../../../types/pitchEquipment";
import { useBookingTimeline } from "./hook/useBookingTimeline";
import { useAppSelector } from "../../../redux/hooks";
import { formatVND } from "../../../utils/format/price";
import { getPitchTypeLabel, PITCH_STATUS_META } from "../../../utils/constants/pitch.constants";
import BookingTime from "./components/BookingTimeline";
import CreateBookingForm from "./components/CreateBookingForm";
import UpdateBookingForm from "./components/UpdateBookingForm";

const { Content } = Layout;

interface BookingPageProps {
    theme: "light" | "dark";
}

// ── Variants đồng bộ HomePage ──────────────────────────────────
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.7, ease: "easeOut", delay: i * 0.12 },
    }),
};
const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 0) => ({
        opacity: 1,
        transition: { duration: 0.8, ease: "easeOut", delay: i * 0.1 },
    }),
};
const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.94, transition: { duration: 0.2, ease: "easeIn" } },
};

const DOW_VN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** 7 ngày của tuần chứa `anchor` */
function weekOf(anchor: Dayjs): Dayjs[] {
    const monday = anchor.startOf("week"); // dayjs default: Sunday=0
    return Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));
}

// ── Component ───────────────────────────────────────────────────
const BookingPage: React.FC<BookingPageProps> = ({ theme }) => {
    const isDark = theme === "dark";
    const { pitchId } = useParams<{ pitchId: string }>();
    const pitchIdNumber = Number(pitchId);

    const [bookingDate, setBookingDate] = useState<Dayjs>(dayjs());
    const [weekAnchor, setWeekAnchor] = useState<Dayjs>(dayjs()); // week nav
    const [pitch, setPitch] = useState<IPitch | null>(null);
    const [pitchLoading, setPitchLoading] = useState(false);
    const [activePitchId, setActivePitchId] = useState(pitchIdNumber);
    const [pitchEquipments, setPitchEquipments] = useState<IPitchEquipment[]>([]);
    const [pitchOpen, setPitchOpen] = useState(true); // accordion on mobile
    const [formOpen, setFormOpen] = useState(true);     // accordion on mobile
    const [timelineOpen, setTimelineOpen] = useState(true); // accordion on mobile

    const stripRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const mode: "CREATE" | "UPDATE" = location.state?.mode ?? "CREATE";
    const bookingId: number | undefined = location.state?.bookingId;

    const { timeline, timelineLoading, reloadTimeline } =
        useBookingTimeline(activePitchId, bookingDate);

    const bookingChangedAt = useAppSelector(s => s.bookingUi.bookingChangedAt);
    useEffect(() => { if (bookingChangedAt) reloadTimeline(); }, [bookingChangedAt, reloadTimeline]);
    useEffect(() => { if (pitchIdNumber) setActivePitchId(pitchIdNumber); }, [pitchIdNumber]);
    useEffect(() => {
        if (!activePitchId) return;
        setPitchLoading(true);
        getPitchById(activePitchId)
            .then(res => { if (res.data.statusCode === 200) setPitch(res.data.data ?? null); })
            .finally(() => setPitchLoading(false));
    }, [activePitchId]);

    useEffect(() => {
        if (!activePitchId) return;
        clientGetPitchEquipments(activePitchId)
            .then((res) => setPitchEquipments(res.data.data ?? []))
            .catch(() => setPitchEquipments([]));
    }, [activePitchId]);

    // Scroll active chip into view on mobile strip
    useEffect(() => {
        if (!stripRef.current) return;
        const el = stripRef.current.querySelector<HTMLElement>(".bk__date-chip--active");
        el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, [bookingDate]);

    const weekDays = weekOf(weekAnchor);

    const goToPrevWeek = () => setWeekAnchor(a => a.subtract(7, "day"));
    const goToNextWeek = () => setWeekAnchor(a => a.add(7, "day"));
    const resetTimeline = () => {
        const today = dayjs();
        setBookingDate(today);
        setWeekAnchor(today);
    };
    const pickerPopupClass = isDark ? "bk__picker-popup bk__picker-popup--dark" : "bk__picker-popup bk__picker-popup--light";

    const handlePickerChange = (value: Dayjs | null) => {
        if (!value) return;
        setBookingDate(value);
        setWeekAnchor(value);
    };

    const selectDay = (d: Dayjs) => {
        setBookingDate(d);
        setWeekAnchor(d);
    };

    return (
        <Layout className={`bk ${isDark ? "bk--dark" : "bk--light"}`}>
            <Content className="bk__content">

                {/* ══════════════════════════════════════════ HERO */}
                <section className="bk__hero">
                    <div className="bk__hero-bg" aria-hidden>
                        <div className="bk__hero-orb bk__hero-orb--1" />
                        <div className="bk__hero-orb bk__hero-orb--2" />
                        <div className="bk__hero-orb bk__hero-orb--3" />
                    </div>
                    <div className="bk__container bk__hero-inner">
                        <motion.div className="bk__hero-badge"
                            initial="hidden" animate="visible" variants={fadeIn} custom={0}>
                            <StarFilled style={{ color: "#faad14", fontSize: 11 }} />
                            <span>TBU Sport · Đặt sân trực tuyến</span>
                        </motion.div>

                        <motion.h1 className="bk__hero-title"
                            initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                            {mode === "CREATE"
                                ? <>Đặt lịch sân bóng <em className="bk__gold-text">tức thì</em></>
                                : <>Cập nhật <em className="bk__gold-text">lịch đặt sân</em></>}
                        </motion.h1>

                        <motion.p className="bk__hero-sub"
                            initial="hidden" animate="visible" variants={fadeUp} custom={2}>
                            Chọn ngày, xem khung giờ trống và hoàn tất đặt sân trong vài giây.
                            Mượt mà trên mọi thiết bị.
                        </motion.p>

                        <motion.div className="bk__legend"
                            initial="hidden" animate="visible" variants={fadeIn} custom={3}>
                            <IoMdClock size={14} style={{ opacity: 0.5 }} />
                            <span className="bk__legend-item">
                                <span className="bk__legend-dot bk__legend-dot--free" />Trống
                            </span>
                            <span className="bk__legend-item">
                                <span className="bk__legend-dot bk__legend-dot--booked" />Đã đặt
                            </span>
                        </motion.div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════ MAIN */}
                <section className="bk__main">
                    <div className="bk__container bk__main-inner">

                        {/* ── Row 1 (desktop full width): calendar + timeline ── */}
                        <div className="bk__main-timeline">
                        <motion.div className="bk__panel"
                            initial="hidden" animate="visible" variants={fadeUp} custom={1}>

                            {/* Accordion header */}
                            <div
                                className="bk__pitch-accordion"
                                role="button"
                                tabIndex={0}
                                onClick={() => setTimelineOpen(o => !o)}
                                onKeyDown={e => e.key === 'Enter' && setTimelineOpen(o => !o)}
                            >
                                <span className="bk__pitch-accordion__title">
                                    <CalendarOutlined />
                                    Chọn ngày xem lịch
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {/* Nav always visible */}
                                    <div className="bk__cal-nav" onClick={e => e.stopPropagation()}>
                                        <button className="bk__nav-btn" onClick={goToPrevWeek} title="Tuần trước">
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
                                                disabledDate={current => !!current && current.startOf("day").isBefore(dayjs().startOf("day"))}
                                                onChange={handlePickerChange}
                                            />
                                        </Tooltip>
                                        <button className="bk__nav-btn" onClick={goToNextWeek} title="Tuần sau">
                                            <RightOutlined />
                                        </button>
                                        <button className="bk__nav-btn" onClick={resetTimeline} title="Đặt lại timeline về hôm nay">
                                            <ReloadOutlined />
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
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                    >
                                        {/* Week label */}
                                        <p className="bk__week-label">
                                            {weekDays[0].format("DD/MM")} – {weekDays[6].format("DD/MM/YYYY")}
                                        </p>

                                        {/* 7-day strip */}
                                        <div className="bk__date-strip" ref={stripRef}>
                                            {weekDays.map(d => {
                                                const isActive = d.isSame(bookingDate, "day");
                                                const isToday = d.isSame(dayjs(), "day");
                                                return (
                                                    <motion.button
                                                        key={d.format("YYYY-MM-DD")}
                                                        type="button"
                                                        className={[
                                                            "bk__date-chip",
                                                            isActive ? "bk__date-chip--active" : "",
                                                            isToday ? "bk__date-chip--today" : "",
                                                        ].filter(Boolean).join(" ")}
                                                        onClick={() => selectDay(d)}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <span className="bk__date-chip__dow">{DOW_VN[d.day()]}</span>
                                                        <span className="bk__date-chip__day">{d.format("DD")}</span>
                                                        <span className="bk__date-chip__mon">Th{d.format("M")}</span>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>

                                        {/* Slot label */}
                                        <p className="bk__panel-label" style={{ marginBottom: 10 }}>
                                            <IoMdClock size={12} />
                                            {bookingDate.format("dddd, DD/MM/YYYY")}
                                        </p>

                                        <BookingTime timelineLoading={timelineLoading} timeline={timeline} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                        </div>

                        {/* ── Row 2 (desktop): thẻ sân | form — 50/50 ── */}
                        <div className="bk__main-cards">
                            <div className="bk__main-cards__slot bk__main-cards__slot--pitch">
                            <div className="bk__main-cards__panel-stretch">
                            {/* Pitch info */}
                            <AnimatePresence mode="wait">
                                {pitchLoading ? (
                                    <motion.div key="spin"
                                        className="bk__panel bk__spin-center"
                                        variants={scaleIn} initial="hidden" animate="visible" exit="exit">
                                        <Spin size="large" />
                                    </motion.div>
                                ) : pitch ? (
                                    <motion.div key={`pitch-${pitch.id}`}
                                        className="bk__panel bk__pitch-panel"
                                        variants={scaleIn} initial="hidden" animate="visible" exit="exit">

                                        {/* Accordion header */}
                                        <button
                                            className="bk__pitch-accordion"
                                            onClick={() => setPitchOpen(o => !o)}
                                        >
                                            <span className="bk__pitch-accordion__title">
                                                <TbSoccerField size={15} />
                                                {pitch.name}
                                            </span>
                                            <motion.span
                                                animate={{ rotate: pitchOpen ? 180 : 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="bk__pitch-accordion__arrow"
                                            >
                                                <DownOutlined />
                                            </motion.span>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {pitchOpen && (
                                                <motion.div
                                                    key="pitch-body"
                                                    initial={{ opacity: 0, y: -6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                                >
                                                    <div className="bk__pitch-img-wrap">
                                                        <Image
                                                            src={pitch.pitchUrl || "https://images.unsplash.com/photo-1574629810360-7efbbe195018"}
                                                            alt={pitch.name ?? undefined}
                                                            width="100%" height={148}
                                                            style={{ objectFit: "cover" }}
                                                            fallback="https://images.unsplash.com/photo-1574629810360-7efbbe195018"
                                                            preview={{ mask: "Xem ảnh" }}
                                                        />
                                                    </div>

                                                    <div className="bk__pitch-body">
                                                        <div className="bk__pitch-tags">
                                                            <Tag color="blue">
                                                                <MdMergeType /> {getPitchTypeLabel(pitch.pitchType)}
                                                            </Tag>
                                                            <Tag color={PITCH_STATUS_META[pitch.status].color}>
                                                                <GrStatusGood /> {PITCH_STATUS_META[pitch.status].label}
                                                            </Tag>
                                                        </div>

                                                        <div className="bk__pitch-meta">
                                                            <div className="bk__pitch-meta-row">
                                                                <EnvironmentOutlined />
                                                                <span className="bk__pitch-meta-label">Địa chỉ:</span>
                                                                <span className="bk__pitch-meta-value">{pitch.address}</span>
                                                            </div>
                                                            <div className="bk__pitch-meta-row">
                                                                <GiSloth />
                                                                <span className="bk__pitch-meta-label">Slot:</span>
                                                                <span className="bk__pitch-meta-value">{timeline?.slotMinutes ?? "—"} phút</span>
                                                            </div>
                                                            <div className="bk__pitch-meta-row">
                                                                <ClockCircleOutlined />
                                                                <span className="bk__pitch-meta-label">Giờ mở cửa:</span>
                                                                <span className="bk__pitch-meta-value">
                                                                    {pitch.open24h
                                                                        ? "Mở cửa 24/7"
                                                                        : `${pitch.openTime} – ${pitch.closeTime}`}
                                                                </span>
                                                            </div>
                                                            <div className="bk__pitch-meta-row">
                                                                <span className="bk__pitch-meta-icon" aria-hidden>📐</span>
                                                                <span className="bk__pitch-meta-label">Kích thước:</span>
                                                                <span className="bk__pitch-meta-value">
                                                                    {pitch.length ?? '--'}m x {pitch.width ?? '--'}m x {pitch.height ?? '--'}m
                                                                </span>
                                                            </div>
                                                            <div className="bk__pitch-meta-row">
                                                                <span className="bk__pitch-meta-icon" aria-hidden>📏</span>
                                                                <span className="bk__pitch-meta-label">Diện tích:</span>
                                                                <span className="bk__pitch-meta-value">
                                                                    {pitch.length != null && pitch.width != null
                                                                        ? `${Number((pitch.length * pitch.width).toFixed(2)).toLocaleString('vi-VN')} m2`
                                                                        : 'Chưa cập nhật'}
                                                                </span>
                                                            </div>
                                                            <div className="bk__pitch-meta-row">
                                                                <span className="bk__pitch-meta-icon" aria-hidden>🧰</span>
                                                                <span className="bk__pitch-meta-label">Thiết bị sân:</span>
                                                                <span className="bk__pitch-meta-value">
                                                                    {pitchEquipments.length > 0
                                                                        ? pitchEquipments
                                                                            .map((item) => {
                                                                                const role = item.equipmentMobility === 'MOVABLE' ? 'Mượn được' : 'Cố định';
                                                                                const spec = item.specification ? ` — ${item.specification}` : '';
                                                                                return `${item.equipmentName} (${role}) x${item.quantity}${spec}`;
                                                                            })
                                                                            .join('; ')
                                                                        : 'Chưa cập nhật'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="bk__pitch-footer">
                                                            <div className="bk__pitch-price">
                                                                <MdPriceChange size={15} />
                                                                {formatVND(pitch.pricePerHour)} / giờ
                                                            </div>
                                                            <Tooltip title="Chỉ đường Google Maps">
                                                                <button
                                                                    className="bk__dir-btn"
                                                                    disabled={pitch?.latitude == null || pitch?.longitude == null}
                                                                    onClick={() => {
                                                                        if (pitch?.latitude == null || pitch?.longitude == null) return;
                                                                        window.open(
                                                                            `https://www.google.com/maps/dir/?api=1&destination=${pitch.latitude},${pitch.longitude}`,
                                                                            "_blank"
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
                            <motion.div className="bk__panel bk__form-panel"
                                initial="hidden" animate="visible" variants={fadeUp} custom={3}>

                                {/* Accordion header */}
                                <button
                                    className="bk__pitch-accordion"
                                    onClick={() => setFormOpen(o => !o)}
                                >
                                    <span className="bk__pitch-accordion__title">
                                        <TbSoccerField size={15} />
                                        {mode === "CREATE" ? "Thông tin đặt sân" : "Cập nhật thông tin"}
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
                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                        >
                                            {mode === "CREATE" && (
                                                <CreateBookingForm
                                                    pitchIdNumber={pitchIdNumber}
                                                    pitch={pitch}
                                                    pitchLoading={pitchLoading}
                                                    bookingDate={bookingDate}
                                                    isDark={isDark}
                                                    onSuccess={reloadTimeline}
                                                />
                                            )}

                                            {mode === "UPDATE" && bookingId && (
                                                <UpdateBookingForm
                                                    bookingId={bookingId}
                                                    pitchIdNumber={pitchIdNumber}
                                                    pitch={pitch}
                                                    pitchLoading={pitchLoading}
                                                    bookingDate={bookingDate}
                                                    isDark={isDark}
                                                    onSuccess={reloadTimeline}
                                                    onPitchChange={setActivePitchId}
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

export default BookingPage;
