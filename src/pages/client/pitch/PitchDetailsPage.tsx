import React, { useEffect, useState } from "react";
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
    type DividerProps,
} from "antd";
import { motion, type Variants } from "framer-motion";
import {
    ClockCircleOutlined,
    ArrowLeftOutlined,
    EnvironmentOutlined,
    CheckCircleOutlined,
    ThunderboltOutlined,
    GlobalOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { MdMergeType } from "react-icons/md";

import { getPitchById } from "../../../config/Api";
import type { IPitch } from "../../../types/pitch";
import {
    getPitchTypeLabel,
    PITCH_STATUS_META
} from "../../../utils/constants/pitch.constants";
import { formatVND } from "../../../utils/format/price";

import "./PitchDetailsPage.scss";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

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

const PitchDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pitch, setPitch] = useState<IPitch | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getPitchById(Number(id))
            .then((res) => setPitch(res.data.data ?? null))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const handleOpenMap = () => {
        if (!pitch?.latitude || !pitch?.longitude) return;
        window.open(`https://www.google.com/maps?q=${pitch.latitude},${pitch.longitude}`, "_blank");
    };

    if (loading) return (
        <div className="loading-container">
            <Spin size="large" tip="Đang tải dữ liệu sân..." />
        </div>
    );

    if (!pitch) return null;

    return (
        <Layout className="pitch-details-page">
            <Row gutter={[0, 0]} className="main-row">
                {/* LEFT: MEDIA SECTION */}
                <Col xs={24} lg={12} className="media-section">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="sticky-container"
                    >
                        <Button
                            shape="circle"
                            icon={<ArrowLeftOutlined />}
                            className="back-btn-glass"
                            onClick={() => navigate(-1)}
                        />
                        <Image
                            src={pitch.pitchUrl ?? "/placeholder-pitch.jpg"}
                            className="pitch-hero-image"
                            preview={{ mask: <div className="mask-content"><GlobalOutlined /> Xem toàn cảnh</div> }}
                        />
                        <div className="status-overlay">
                            <Tag color={PITCH_STATUS_META[pitch.status].color} className="status-tag-vip">
                                {PITCH_STATUS_META[pitch.status].label}
                            </Tag>
                        </div>
                    </motion.div>
                </Col>

                {/* RIGHT: CONTENT SECTION */}
                <Col xs={24} lg={12} className="content-section">
                    <Content className="scroll-content">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Header */}
                            <motion.div variants={itemVariants} className="header-box">
                                <Tag color="gold" icon={<MdMergeType />}>{getPitchTypeLabel(pitch.pitchType)}</Tag>
                                <Title level={1} className="pitch-title">{pitch.name}</Title>
                                <Space className="address-line">
                                    <EnvironmentOutlined />
                                    <Text type="secondary">{pitch.address}</Text>
                                </Space>
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
                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<ThunderboltOutlined />}
                                                className="btn-book-now"
                                                onClick={() => navigate(`/booking/${pitch.id}`, { state: { mode: "CREATE" } })}
                                            >
                                                ĐẶT SÂN NGAY
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card>
                            </motion.div>

                            <Divider orientation={"left" as DividerProps['orientation']}>Thông tin chi tiết</Divider>

                            {/* Features Grid */}
                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <motion.div variants={itemVariants}>
                                        <Card size="small" className="feature-item-card">
                                            <Space orientation="vertical">
                                                <Text strong><ClockCircleOutlined /> Thời gian hoạt động</Text>
                                                <Paragraph>
                                                    {pitch.open24h ?
                                                        <Tag color="green-preset">Mở cửa 24/7</Tag> :
                                                        <Text code>{pitch.openTime} - {pitch.closeTime}</Text>
                                                    }
                                                </Paragraph>
                                            </Space>
                                        </Card>
                                    </motion.div>
                                </Col>

                                <Col span={24}>
                                    <motion.div variants={itemVariants}>
                                        <Card size="small" className="feature-item-card">
                                            <div className="map-header">
                                                <Text strong><EnvironmentOutlined /> Chỉ đường</Text>
                                                <Button type="link" onClick={handleOpenMap}>Xem Google Maps</Button>
                                            </div>
                                            <Text type="secondary">{pitch.address}</Text>
                                        </Card>
                                    </motion.div>
                                </Col>

                                <Col span={24}>
                                    <motion.div variants={itemVariants}>
                                        <Card size="small" className="feature-item-card" title="Tiện ích sân bãi">
                                            <Space wrap>
                                                {["Wifi", "Gửi xe", "Nước uống", "Đèn đêm"].map(item => (
                                                    <Tag key={item} icon={<CheckCircleOutlined />} className="utility-tag">
                                                        {item}
                                                    </Tag>
                                                ))}
                                            </Space>
                                        </Card>
                                    </motion.div>
                                </Col>
                            </Row>

                            <div className="meta-footer">
                                <Divider dashed />
                                <Text disabled>Cập nhật lần cuối: {new Date(pitch.createdAt).toLocaleDateString('vi-VN')}</Text>
                            </div>
                        </motion.div>
                    </Content>
                </Col>
            </Row>
        </Layout>
    );
};

export default PitchDetailsPage;