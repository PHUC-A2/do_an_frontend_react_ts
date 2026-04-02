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
    Rate,
    Input,
    Modal,
    Popover,
    Grid,
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
    StarFilled,
    MessageOutlined,
    SendOutlined,
    SmileOutlined,
} from "@ant-design/icons";
import { IoMdClock } from "react-icons/io";
import { useNavigate, useParams } from "react-router";
import RBButton from 'react-bootstrap/Button';
import { clientGetPitchEquipments, getPitchById } from "../../../config/Api";
import { clientCreateReview, clientGetMyReviews, clientGetReviewMessages, clientSendReviewMessage } from "../../../config/Api";
import type { IPitch } from "../../../types/pitch";
import type { IPitchEquipment } from "../../../types/pitchEquipment";
import type { IReview, IReviewMessage } from "../../../types/review";
import {
    PITCH_STATUS_META
} from "../../../utils/constants/pitch.constants";
import { formatVND } from "../../../utils/format/price";

import "./PitchDetailsPage.scss";
import "../../../styles/reviewChatScroll.scss";
import { formatDateTime } from "../../../utils/format/localdatetime";
import dayjs, { type Dayjs } from "dayjs";
import { useBookingTimeline } from "../booking/hook/useBookingTimeline";
import BookingTime from "../booking/components/BookingTimeline";
import { useAppSelector } from "../../../redux/hooks";
import ReviewChatMessageRow from "../../../components/common/ReviewChatMessageRow";
import { toast } from "react-toastify";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;
const QUICK_EMOJIS = ["😀", "😁", "😂", "😍", "🥰", "😘", "😎", "🤩", "😢", "😭", "😡", "👍", "👏", "🙏", "🔥", "⚽", "❤️"];

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
    const screens = useBreakpoint();
    const isMobile = screens.md !== true;
    const { id } = useParams();
    const navigate = useNavigate();
    const [pitch, setPitch] = useState<IPitch | null>(null);
    const [pitchEquipments, setPitchEquipments] = useState<IPitchEquipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [timelineDate, setTimelineDate] = useState<Dayjs>(dayjs());
    const [weekAnchor, setWeekAnchor] = useState<Dayjs>(dayjs());
    const [timelineOpen, setTimelineOpen] = useState(true);
    const stripRef = useRef<HTMLDivElement>(null);
    const account = useAppSelector((state) => state.account.account);

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewContent, setReviewContent] = useState("");
    const [myReviews, setMyReviews] = useState<IReview[]>([]);
    const [activeReview, setActiveReview] = useState<IReview | null>(null);
    const [chatMessages, setChatMessages] = useState<IReviewMessage[]>([]);
    const [chatContent, setChatContent] = useState("");
    const [emojiOpen, setEmojiOpen] = useState(false);
    const chatSocketRef = useRef<WebSocket | null>(null);

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

    const loadMyReviews = (pitchId?: number) => {
        clientGetMyReviews()
            .then((res) => {
                const list = res.data.data ?? [];
                // So sánh số — backend có thể trả pitchId kiểu khác, tránh lọc rỗng nhầm
                const filtered = list.filter(
                    (item) =>
                        item.targetType === "PITCH" &&
                        (pitchId == null || Number(item.pitchId) === Number(pitchId)),
                );
                setMyReviews(filtered);
            })
            .catch(() => setMyReviews([]));
    };

    useEffect(() => {
        if (!id) return;
        loadMyReviews(Number(id));
    }, [id]);

    // Khi quay lại tab: đồng bộ danh sách đánh giá (không phải F5 cả trang)
    useEffect(() => {
        if (!id) return;
        const onVis = () => {
            if (document.visibilityState === "visible") {
                loadMyReviews(Number(id));
            }
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
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

    const handleCreateReview = async () => {
        try {
            if (!reviewContent.trim()) {
                toast.error("Vui lòng nhập nội dung nhận xét");
                return;
            }
            const res = await clientCreateReview({
                targetType: "PITCH",
                pitchId: Number(id),
                rating: reviewRating,
                content: reviewContent.trim(),
            });
            const created = res.data?.data;
            toast.success("Gửi đánh giá thành công");
            setReviewModalOpen(false);
            setReviewContent("");
            setReviewRating(5);
            const pid = Number(id);
            if (created) {
                setMyReviews((prev) => {
                    const merged = [created, ...prev.filter((r) => r.id !== created.id)];
                    return merged.filter(
                        (item) =>
                            item.targetType === "PITCH" && Number(item.pitchId) === pid,
                    );
                });
                await openChatByReview(created);
            }
            void loadMyReviews(pid);
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Không thể gửi đánh giá");
        }
    };

    const closeChatSocket = () => {
        if (chatSocketRef.current) {
            chatSocketRef.current.close();
            chatSocketRef.current = null;
        }
    };

    const openChatByReview = async (review: IReview) => {
        try {
            setActiveReview(review);
            setEmojiOpen(false);
            closeChatSocket();
            const res = await clientGetReviewMessages(review.id);
            setChatMessages(res.data.data ?? []);

            const token = localStorage.getItem("access_token");
            if (!token) return;
            const protocol = window.location.protocol === "https:" ? "wss" : "ws";
            const ws = new WebSocket(`${protocol}://${window.location.host}/ws/reviews/${review.id}?token=${encodeURIComponent(token)}`);
            ws.onerror = () => {
                toast.warn(
                    "Kết nối chat realtime lỗi (kiểm tra proxy /ws trên server). Gửi tin vẫn được qua API; để xem tin mới hãy mở lại khung chat.",
                    { autoClose: 8000 },
                );
            };
            ws.onmessage = (event) => {
                try {
                    const incoming: IReviewMessage = JSON.parse(event.data);
                    setChatMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
                } catch {
                    // bỏ qua payload lỗi
                }
            };
            chatSocketRef.current = ws;
        } catch {
            toast.error("Không thể tải chat đánh giá");
        }
    };

    const handleSendChat = async () => {
        if (!activeReview || !chatContent.trim()) return;
        const payload = { content: chatContent.trim() };
        if (chatSocketRef.current && chatSocketRef.current.readyState === WebSocket.OPEN) {
            chatSocketRef.current.send(JSON.stringify(payload));
            setChatContent("");
            return;
        }
        try {
            await clientSendReviewMessage(activeReview.id, payload);
            const res = await clientGetReviewMessages(activeReview.id);
            setChatMessages(res.data.data ?? []);
            setChatContent("");
        } catch {
            toast.error("Không thể gửi tin nhắn");
        }
    };

    const insertEmoji = (emoji: string) => {
        setChatContent((prev) => `${prev}${emoji}`);
        setEmojiOpen(false);
    };

    const getChatStatusLabel = (msg: IReviewMessage) => {
        if (msg.readAt) return "Đã xem";
        if (msg.deliveredAt) return "Đã nhận";
        return "Đã gửi";
    };

    useEffect(() => {
        return () => {
            closeChatSocket();
        };
    }, []);

    // Đang mở khung chat: đồng bộ REST định kỳ (dự phòng khi WebSocket/proxy lỗi — vẫn thấy tin như admin gửi)
    useEffect(() => {
        if (!activeReview) {
            return;
        }
        const reviewId = activeReview.id;
        const syncMessages = async () => {
            try {
                const res = await clientGetReviewMessages(reviewId);
                setChatMessages(res.data.data ?? []);
            } catch {
                /* bỏ qua một nhịp nếu mạng lỗi */
            }
        };
        const quickSync = window.setTimeout(() => {
            void syncMessages();
        }, 600);
        const timer = window.setInterval(() => {
            void syncMessages();
        }, 4000);
        return () => {
            window.clearTimeout(quickSync);
            window.clearInterval(timer);
        };
    }, [activeReview?.id]);

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
                                {(pitch.reviewCount ?? 0) > 0 ? (
                                    <Space size={6}>
                                        <StarFilled style={{ color: "#faad14" }} />
                                        <Text>{`${(pitch.averageRating ?? 0).toFixed(1)} / 5`}</Text>
                                        <Text type="secondary">({pitch.reviewCount ?? 0} đánh giá)</Text>
                                    </Space>
                                ) : (
                                    <Space size={6}>
                                        <StarFilled style={{ color: "#94a3b8" }} />
                                        <Text type="secondary">Hiện chưa có đánh giá</Text>
                                    </Space>
                                )}
                                <Tag color={PITCH_STATUS_META[pitch.status].color} className="status-tag-vip status-tag-inline">
                                    {PITCH_STATUS_META[pitch.status].label}
                                </Tag>
                            </motion.div>

                            {/* Booking Card */}
                            <motion.div variants={itemVariants} className="booking-card-wrapper">
                                <Card className="booking-card-glass">
                                    <Row align="middle" justify="space-between">
                                        <Col>
                                            <Text strong className="price-label">Giá mỗi giờ</Text>
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
                                                Đặt sân ngay <ArrowRightOutlined />
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
                                            Lịch sân trong ngày (xem nhanh)
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
                                                                            <GlobalOutlined /> Xem ảnh lớn
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

                            <motion.div variants={itemVariants} className="booking-card-wrapper">
                                <Card className="booking-card-glass">
                                    <Collapse
                                        className="pitch-detail-collapse"
                                        defaultActiveKey={["review-box"]}
                                        items={[
                                            {
                                                key: "review-box",
                                                label: (
                                                    <Space>
                                                        <StarFilled style={{ color: "#faad14" }} />
                                                        <span>Đánh giá của bạn</span>
                                                    </Space>
                                                ),
                                                extra: (
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<StarFilled />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setReviewModalOpen(true);
                                                        }}
                                                    >
                                                        Viết đánh giá
                                                    </Button>
                                                ),
                                                children: myReviews.slice(0, 6).length === 0 ? (
                                                    <Text type="secondary">Bạn chưa có đánh giá nào</Text>
                                                ) : (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                        {myReviews.slice(0, 6).map((item) => (
                                                            <div
                                                                key={item.id}
                                                                style={{
                                                                    border: "1px solid rgba(148,163,184,0.25)",
                                                                    borderRadius: 10,
                                                                    padding: "10px 12px",
                                                                    background: "rgba(148,163,184,0.06)",
                                                                }}
                                                            >
                                                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                                                    <Space>
                                                                        <Rate
                                                                            disabled
                                                                            allowHalf
                                                                            value={item.rating}
                                                                            style={{ fontSize: 14, color: "#faad14", whiteSpace: "nowrap", flexShrink: 0 }}
                                                                        />
                                                                        <Tag color="gold">{item.pitchName ?? "Sân"}</Tag>
                                                                        <Tag color={item.status === "APPROVED" ? "green" : item.status === "HIDDEN" ? "red" : "orange"}>
                                                                            {item.status === "APPROVED" ? "Đã duyệt" : item.status === "HIDDEN" ? "Đã ẩn" : "Chờ duyệt"}
                                                                        </Tag>
                                                                    </Space>
                                                                    <Button
                                                                        type="link"
                                                                        icon={<MessageOutlined />}
                                                                        onClick={() => openChatByReview(item)}
                                                                    >
                                                                        {activeReview?.id === item.id ? "Đang chat" : "Chat với admin"}
                                                                    </Button>
                                                                </div>
                                                                <Text>{item.content}</Text>
                                                                {activeReview?.id === item.id ? (
                                                                    <div
                                                                        style={{
                                                                            marginTop: 10,
                                                                            borderTop: "1px dashed rgba(148,163,184,0.35)",
                                                                            paddingTop: 10,
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="review-chat-scroll"
                                                                            style={{
                                                                                maxHeight: isMobile ? 180 : 220,
                                                                                marginBottom: 10,
                                                                                display: "flex",
                                                                                flexDirection: "column",
                                                                                gap: 8,
                                                                            }}
                                                                        >
                                                                            {chatMessages.length === 0 ? (
                                                                                <Text type="secondary">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện.</Text>
                                                                            ) : (
                                                                                chatMessages.map((msg) => {
                                                                                    const mine =
                                                                                        account?.id != null &&
                                                                                        Number(msg.senderId) === Number(account.id);
                                                                                    return (
                                                                                        <ReviewChatMessageRow
                                                                                            key={msg.id}
                                                                                            msg={msg}
                                                                                            isMine={mine}
                                                                                            isMobile={isMobile}
                                                                                            statusLabel={getChatStatusLabel(msg)}
                                                                                        />
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </div>

                                                                        <div
                                                                            style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: 8,
                                                                                width: "100%",
                                                                                flexWrap: isMobile ? "wrap" : "nowrap",
                                                                            }}
                                                                        >
                                                                            <Popover
                                                                                trigger="click"
                                                                                open={emojiOpen}
                                                                                onOpenChange={setEmojiOpen}
                                                                                content={
                                                                                    <div
                                                                                        style={{
                                                                                            display: "grid",
                                                                                            gridTemplateColumns: "repeat(6, minmax(26px, 1fr))",
                                                                                            gap: 6,
                                                                                            maxWidth: 220,
                                                                                        }}
                                                                                    >
                                                                                        {QUICK_EMOJIS.map((emoji) => (
                                                                                            <button
                                                                                                key={emoji}
                                                                                                type="button"
                                                                                                onClick={() => insertEmoji(emoji)}
                                                                                                style={{
                                                                                                    border: "1px solid rgba(148,163,184,0.3)",
                                                                                                    background: "transparent",
                                                                                                    borderRadius: 8,
                                                                                                    height: 30,
                                                                                                    cursor: "pointer",
                                                                                                    fontSize: 18,
                                                                                                }}
                                                                                            >
                                                                                                {emoji}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                }
                                                                            >
                                                                                <Button icon={<SmileOutlined />} />
                                                                            </Popover>
                                                                            <Input
                                                                                value={chatContent}
                                                                                onChange={(e) => setChatContent(e.target.value)}
                                                                                placeholder="Nhập nội dung chat với admin..."
                                                                                onPressEnter={handleSendChat}
                                                                                style={{ flex: 1, minWidth: isMobile ? "100%" : 180 }}
                                                                            />
                                                                            <Button type="primary" icon={<SendOutlined />} onClick={handleSendChat}>
                                                                                Gửi
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ),
                                            },
                                        ]}
                                    />
                                </Card>
                            </motion.div>

                            <div className="meta-footer">
                                <Divider dashed />
                                <Text disabled>Cập nhật lần cuối: {formatDateTime(pitch.createdAt)}</Text>
                            </div>
                        </motion.div>
                    </Content>
                </div>
            </div>

            <Modal
                title="Gửi đánh giá về sân"
                open={reviewModalOpen}
                onCancel={() => setReviewModalOpen(false)}
                onOk={handleCreateReview}
                okButtonProps={{ icon: <SendOutlined /> }}
                okText="Gửi đánh giá"
                cancelText="Hủy"
            >
                <Space orientation="vertical" style={{ width: "100%" }} size={12}>
                    <div>
                        <Text>Chấm sao</Text>
                        <div>
                            <Rate value={reviewRating} onChange={setReviewRating} />
                        </div>
                    </div>
                    <div>
                        <Text>Nội dung nhận xét</Text>
                        <TextArea
                            rows={4}
                            value={reviewContent}
                            onChange={(e) => setReviewContent(e.target.value)}
                            placeholder="Nhập trải nghiệm của bạn..."
                            maxLength={1000}
                            showCount
                            style={{ marginBottom: 14 }}
                        />
                    </div>
                </Space>
            </Modal>

        </Layout>
    );
};

export default PitchDetailsPage;