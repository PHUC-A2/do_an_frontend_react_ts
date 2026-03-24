import React, { useEffect, useRef, useState } from "react";
import {
    Layout,
    Typography,
    Row,
    Col,
    Image,
    Tag,
    Spin,
    Button,
    Divider,
    Space,
    Card,
    Collapse,
    DatePicker,
} from "antd";
import { motion, type Variants } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import {
    ClockCircleOutlined,
    ArrowLeftOutlined,
    EnvironmentOutlined,
    CheckCircleOutlined,
    GlobalOutlined,
    ArrowRightOutlined,
    InfoCircleOutlined,
    ToolOutlined,
    EnvironmentOutlined as EnvironmentIcon,
    CalendarOutlined,
    LeftOutlined,
    RightOutlined,
    ReloadOutlined,
    DownOutlined,
} from "@ant-design/icons";
import { IoMdClock } from "react-icons/io";
import { useNavigate, useParams } from "react-router";
import RBButton from 'react-bootstrap/Button';
import { clientGetPitchEquipments, getPitchById } from "../../../config/Api";
import type { IPitch } from "../../../types/pitch";
import type { IPitchEquipment } from "../../../types/pitchEquipment";
import {
    PITCH_STATUS_META
} from "../../../utils/constants/pitch.constants";
import { formatVND } from "../../../utils/format/price";

import "./PitchDetailsPage.scss";
import { formatDateTime } from "../../../utils/format/localdatetime";
import dayjs, { type Dayjs } from "dayjs";
import { useBookingTimeline } from "../booking/hook/useBookingTimeline";
import BookingTime from "../booking/components/BookingTimeline";

const { Content } = Layout;
const { Title, Text } = Typography;

// Animation Variants đồng bộ với AboutPage
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

const DOW_VN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function weekOf(anchor: Dayjs): Dayjs[] {
    const monday = anchor.startOf("week");
    return Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));
}

const PitchDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pitch, setPitch] = useState<IPitch | null>(null);
    const [pitchEquipments, setPitchEquipments] = useState<IPitchEquipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [timelineDate, setTimelineDate] = useState<Dayjs>(dayjs());
    const [weekAnchor, setWeekAnchor] = useState<Dayjs>(dayjs());
    const [timelineOpen, setTimelineOpen] = useState(true);
    const stripRef = useRef<HTMLDivElement>(null);

    const { timeline, timelineLoading } = useBookingTimeline(Number(id), timelineDate);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getPitchById(Number(id))
            .then((res) => setPitch(res.data.data ?? null))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        clientGetPitchEquipments(Number(id))
            .then((res) => setPitchEquipments(res.data.data ?? []))
            .catch(() => setPitchEquipments([]));
    }, [id]);

    const pitchArea =
        pitch?.length != null && pitch?.width != null
            ? Number((pitch.length * pitch.width).toFixed(2))
            : null;

    const handleOpenMap = () => {
        if (pitch?.latitude == null || pitch?.longitude == null) return;
        window.open(`https://www.google.com/maps?q=${pitch.latitude},${pitch.longitude}`, "_blank");
    };

    const getEquipmentImageSrc = (fileName?: string | null) => {
        if (!fileName) return undefined;
        if (/^https?:\/\//i.test(fileName) || fileName.startsWith('/')) return fileName;
        return `/storage/equipment/${fileName}`;
    };

    const goToPrevWeek = () => setWeekAnchor((a) => a.subtract(7, "day"));
    const goToNextWeek = () => setWeekAnchor((a) => a.add(7, "day"));
    const resetTimeline = () => {
        const today = dayjs();
        setTimelineDate(today);
        setWeekAnchor(today);
    };
    const weekDays = weekOf(weekAnchor);
    const selectDay = (d: Dayjs) => {
        setTimelineDate(d);
        setWeekAnchor(d);
    };
    const handlePickerChange = (value: Dayjs | null) => {
        if (!value) return;
        setTimelineDate(value);
        setWeekAnchor(value);
    };

    useEffect(() => {
        if (!stripRef.current) return;
        const el = stripRef.current.querySelector<HTMLElement>(".bk__date-chip--active");
        el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, [timelineDate]);

    if (loading) {
        return <Spin fullscreen tip="Đang tải dữ liệu sân..." />;
    }


    if (!pitch) return null;

    return (
        <Layout className="pitch-details-page">
            <div className="main-row">
                <div className="content-section content-section--full">
                    <Content className="scroll-content">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Button
                                shape="circle"
                                icon={<ArrowLeftOutlined />}
                                className="back-btn-glass"
                                onClick={() => navigate(-1)}
                            />

                            {/* Header */}
                            <motion.div variants={itemVariants} className="header-box">
                                <Title level={1} className="pitch-title">{pitch.name}</Title>
                                <Space className="address-line">
                                    <EnvironmentOutlined />
                                    <Text type="secondary">{pitch.address}</Text>
                                </Space>
                                <Tag color={PITCH_STATUS_META[pitch.status].color} className="status-tag-vip status-tag-inline">
                                    {PITCH_STATUS_META[pitch.status].label}
                                </Tag>
                            </motion.div>

                            {/* Booking Card */}
                            <motion.div variants={itemVariants} className="booking-card-wrapper">
                                <Card className="booking-card-glass">
                                    <Row align="middle" justify="space-between">
                                        <Col>
                                            <Text strong className="price-label">GIÁ THUÊ CHỈ TỪ</Text>
                                            <div className="price-value-big">
                                                {formatVND(pitch.pricePerHour)}<small>/giờ</small>
                                            </div>
                                        </Col>
                                        <Col>
                                            <RBButton
                                                variant="outline-warning"
                                                className="btn-book-now"
                                                onClick={() => navigate(`/booking/${pitch.id}`, { state: { mode: "CREATE" } })}
                                            >
                                                ĐẶT SÂN NGAY <ArrowRightOutlined />
                                            </RBButton>
                                        </Col>
                                    </Row>
                                </Card>
                            </motion.div>

                            <motion.div variants={itemVariants} className="pitch-timeline-top">
                                <div className="bk__panel">
                                    <div
                                        className="bk__pitch-accordion"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setTimelineOpen((o) => !o)}
                                        onKeyDown={(e) => e.key === "Enter" && setTimelineOpen((o) => !o)}
                                    >
                                        <span className="bk__pitch-accordion__title">
                                            <CalendarOutlined />
                                            Timeline lịch sân (chỉ xem)
                                        </span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div className="bk__cal-nav" onClick={(e) => e.stopPropagation()}>
                                                <button type="button" className="bk__nav-btn" onClick={goToPrevWeek} title="Tuần trước">
                                                    <LeftOutlined />
                                                </button>
                                                <DatePicker
                                                    className="bk__nav-picker"
                                                    value={timelineDate}
                                                    format="DD/MM/YYYY"
                                                    allowClear={false}
                                                    inputReadOnly
                                                    suffixIcon={<CalendarOutlined />}
                                                    disabledDate={(current: Dayjs) =>
                                                        !!current && current.startOf("day").isBefore(dayjs().startOf("day"))
                                                    }
                                                    onChange={handlePickerChange}
                                                />
                                                <button type="button" className="bk__nav-btn" onClick={goToNextWeek} title="Tuần sau">
                                                    <RightOutlined />
                                                </button>
                                                <button type="button" className="bk__nav-btn" onClick={resetTimeline} title="Về hôm nay">
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
                                                className="pitch-timeline-view"
                                            >
                                                <p className="bk__week-label">
                                                    {weekDays[0].format("DD/MM")} – {weekDays[6].format("DD/MM/YYYY")}
                                                </p>

                                                <div className="bk__date-strip" ref={stripRef}>
                                                    {weekDays.map((d) => {
                                                        const isActive = d.isSame(timelineDate, "day");
                                                        const isToday = d.isSame(dayjs(), "day");
                                                        return (
                                                            <button
                                                                key={d.format("YYYY-MM-DD")}
                                                                type="button"
                                                                className={[
                                                                    "bk__date-chip",
                                                                    isActive ? "bk__date-chip--active" : "",
                                                                    isToday ? "bk__date-chip--today" : "",
                                                                ].filter(Boolean).join(" ")}
                                                                onClick={() => selectDay(d)}
                                                            >
                                                                <span className="bk__date-chip__dow">{DOW_VN[d.day()]}</span>
                                                                <span className="bk__date-chip__day">{d.format("DD")}</span>
                                                                <span className="bk__date-chip__mon">Th{d.format("M")}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <p className="bk__panel-label" style={{ marginBottom: 10 }}>
                                                    <IoMdClock size={12} />
                                                    {timelineDate.format("dddd, DD/MM/YYYY")}
                                                </p>

                                                <BookingTime timelineLoading={timelineLoading} timeline={timeline} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                            <Divider titlePlacement="left">
                                Thông tin chi tiết
                            </Divider>


                            <motion.div variants={itemVariants}>
                                <Collapse
                                    className="pitch-detail-collapse"
                                    defaultActiveKey={["overview", "equipment"]}
                                    items={[
                                        {
                                            key: "overview",
                                            label: (
                                                <Space>
                                                    <InfoCircleOutlined />
                                                    <span>Thông tin sân</span>
                                                </Space>
                                            ),
                                            children: (
                                                <div className="detail-overview-stack">
                                                    <div className="detail-overview-grid">
                                                        <div className="detail-hero-image-wrap">
                                                            <Image
                                                                src={pitch.pitchUrl ?? "/placeholder-pitch.jpg"}
                                                                className="detail-hero-image"
                                                                preview={{
                                                                    cover: (
                                                                        <div className="mask-content">
                                                                            <GlobalOutlined /> Xem toàn cảnh
                                                                        </div>
                                                                    ),
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="detail-overview-meta">
                                                            <div className="detail-line">
                                                                <Text strong><ClockCircleOutlined /> Thời gian hoạt động:</Text>{' '}
                                                                {pitch.open24h ?
                                                                    <Tag color="green">Mở cửa 24/7</Tag> :
                                                                    <Text code>{pitch.openTime} - {pitch.closeTime}</Text>
                                                                }
                                                            </div>

                                                            <div className="detail-line">
                                                                <Text strong>📐 Kích thước:</Text>{' '}
                                                                <Text>{pitch.length ?? '--'}m x {pitch.width ?? '--'}m x {pitch.height ?? '--'}m</Text>
                                                            </div>

                                                            <div className="detail-line">
                                                                <Text strong>📏 Diện tích:</Text>{' '}
                                                                <Text>{pitchArea != null ? `${pitchArea.toLocaleString('vi-VN')} m2` : 'Chưa cập nhật'}</Text>
                                                            </div>

                                                            <div className="detail-line detail-line--map">
                                                                <Space>
                                                                    <EnvironmentOutlined />
                                                                    <Text strong>Chỉ đường</Text>
                                                                </Space>
                                                                <Button type="link" onClick={handleOpenMap}>
                                                                    <EnvironmentIcon /> Google Maps
                                                                </Button>
                                                            </div>

                                                            <Text type="secondary">{pitch.address}</Text>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "equipment",
                                            label: (
                                                <Space>
                                                    <ToolOutlined />
                                                    <span>Thiết bị của sân</span>
                                                </Space>
                                            ),
                                            children: pitchEquipments.length > 0 ? (
                                                <div className="pitch-equipment-list">
                                                    {pitchEquipments.map((item) => (
                                                        <div key={item.id} className="pitch-equipment-item">
                                                            <Image
                                                                width={56}
                                                                height={56}
                                                                style={{ borderRadius: 8, objectFit: 'cover' }}
                                                                src={getEquipmentImageSrc(item.equipmentImageUrl)}
                                                                fallback="/placeholder-pitch.jpg"
                                                                preview={{ mask: 'Xem' }}
                                                            />

                                                            <div className="pitch-equipment-content">
                                                                <Space size={6} wrap>
                                                                    <Text strong>{item.equipmentName}</Text>
                                                                    <Tag color="processing">SL trên sân: {item.quantity}</Tag>
                                                                    <Tag color={item.equipmentMobility === 'MOVABLE' ? 'blue' : 'default'}>
                                                                        {item.equipmentMobility === 'MOVABLE' ? 'Cho mượn khi đặt sân' : 'Cố định trên sân'}
                                                                    </Tag>
                                                                </Space>

                                                                <Space orientation="vertical" size={2}>
                                                                    <Text type="secondary">Mã thiết bị (kho): {item.equipmentId}</Text>
                                                                    <Text>{item.specification ? `Thông số / mô tả: ${item.specification}` : 'Thông số: chưa cập nhật'}</Text>
                                                                    <Text>{item.note ? `Ghi chú sân: ${item.note}` : 'Ghi chú sân: chưa cập nhật'}</Text>
                                                                    {item.equipmentConditionNote ? (
                                                                        <Text type="secondary">Tình trạng kho: {item.equipmentConditionNote}</Text>
                                                                    ) : null}
                                                                </Space>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Text type="secondary">Sân chưa cập nhật danh sách thiết bị</Text>
                                            ),
                                        },
                                        {
                                            key: "amenities",
                                            label: (
                                                <Space>
                                                    <CheckCircleOutlined />
                                                    <span>Tiện ích sân bãi</span>
                                                </Space>
                                            ),
                                            children: (
                                                <Space wrap>
                                                    {["Wifi", "Gửi xe", "Nước uống", "Đèn đêm"].map(item => (
                                                        <Tag key={item} icon={<CheckCircleOutlined />} className="utility-tag">
                                                            {item}
                                                        </Tag>
                                                    ))}
                                                </Space>
                                            ),
                                        },
                                    ]}
                                />
                            </motion.div>

                            <div className="meta-footer">
                                <Divider dashed />
                                <Text disabled>Cập nhật lần cuối: {formatDateTime(pitch.createdAt)}</Text>
                            </div>
                        </motion.div>
                    </Content>
                </div>
            </div>
        </Layout>
    );
};

export default PitchDetailsPage;