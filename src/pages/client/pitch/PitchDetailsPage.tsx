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
    theme,
    Card,
} from "antd";
import { motion } from "framer-motion";
import {
    ClockCircleOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
    EnvironmentOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { FaMapMarkerAlt } from "react-icons/fa";
import { MdMergeType } from "react-icons/md";
import { GrStatusGood } from "react-icons/gr";

import { getPitchById } from "../../../config/Api";
import type { IPitch } from "../../../types/pitch";
import {
    getPitchTypeLabel,
    PITCH_STATUS_META
} from "../../../utils/constants/pitch.constants";
import { formatVND } from "../../../utils/format/price";

import "./PitchDetailsPage.scss";

const { Content } = Layout;
const { Title, Text } = Typography;

const PitchDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Sử dụng token để đồng bộ màu sắc với ModalBookingHistory
    const { token } = theme.useToken();

    const [pitch, setPitch] = useState<IPitch | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        getPitchById(Number(id))
            .then((res) => {
                setPitch(res.data.data ?? null);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const handleOpenMap = () => {
        if (!pitch?.latitude || !pitch?.longitude) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${pitch.latitude},${pitch.longitude}`;
        window.open(url, "_blank");
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ background: token.colorBgContainer }}>
                <Spin size="large" tip="Đang tải thông tin sân..." />
            </div>
        );
    }

    if (!pitch) return null;

    return (
        <Layout className="pitch-details-page" style={{ background: token.colorBgLayout }}>
            {/* LEFT SIDE: IMAGE */}
            <div className="left-section">
                <div className="image-wrapper">
                    <Button
                        shape="circle"
                        icon={<ArrowLeftOutlined />}
                        className="back-btn-abs"
                        onClick={() => navigate(-1)}
                    />
                    <Image
                        src={pitch.pitchUrl ?? "/placeholder-pitch.jpg"}
                        className="main-image"
                        alt={pitch.name ?? undefined}
                        preview={{
                            mask: <span style={{ color: '#fff' }}>Xem ảnh lớn</span>
                        }}
                    />
                    <div className="image-overlay-gradient"></div>
                </div>
            </div>

            {/* RIGHT SIDE: INFO SCROLLABLE */}
            <div className="right-section" style={{ background: token.colorBgContainer }}>
                <Content className="info-content">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Header Info */}
                        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                            <Space wrap>
                                <Tag color="blue" bordered={false}>
                                    <Space size={4}>
                                        <MdMergeType /> {getPitchTypeLabel(pitch.pitchType)}
                                    </Space>
                                </Tag>
                                <Tag color={PITCH_STATUS_META[pitch.status].color} bordered={false}>
                                    <Space size={4}>
                                        <GrStatusGood /> {PITCH_STATUS_META[pitch.status].label}
                                    </Space>
                                </Tag>
                            </Space>

                            <Title level={2} style={{ margin: "8px 0 0" }}>{pitch.name}</Title>

                            <Space size={4} style={{ color: token.colorTextSecondary }}>
                                <EnvironmentOutlined style={{ color: token.colorPrimary }} />
                                <Text type="secondary">{pitch.address}</Text>
                            </Space>
                        </Space>

                        <Divider style={{ margin: '20px 0' }} />

                        {/* Price & Action */}
                        <div className="price-action-box" style={{ background: token.colorFillAlter, borderRadius: token.borderRadiusLG }}>
                            <div className="price-display">
                                <Text type="secondary">Giá thuê / giờ</Text>
                                <div className="price-value" style={{ color: token.colorWarningTextActive }}>
                                    {formatVND(pitch.pricePerHour)}
                                </div>
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                className="book-btn"
                                onClick={() => navigate(`/booking/${pitch.id}`, { state: { mode: "CREATE" } })}
                            >
                                ĐẶT SÂN NGAY
                            </Button>
                        </div>

                        {/* Details Grid */}
                        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                            <Col span={24}>
                                <Card size="small" bordered={false} className="info-card" style={{ boxShadow: token.boxShadowTertiary }}>
                                    <Space orientation="vertical" style={{ width: '100%' }}>
                                        <Title level={5} style={{ margin: 0 }}>
                                            <ClockCircleOutlined style={{ color: token.colorPrimary }} /> Thời gian hoạt động
                                        </Title>
                                        <Text>
                                            {pitch.open24h
                                                ? <Tag color="success">Mở cửa 24/7</Tag>
                                                : `${pitch.openTime} - ${pitch.closeTime}`
                                            }
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            * Vui lòng đến trước 15 phút để nhận sân
                                        </Text>
                                    </Space>
                                </Card>
                            </Col>

                            <Col span={24}>
                                <Card size="small" bordered={false} className="info-card" style={{ boxShadow: token.boxShadowTertiary }}>
                                    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Title level={5} style={{ margin: 0 }}>
                                                <FaMapMarkerAlt style={{ color: token.colorPrimary }} /> Vị trí
                                            </Title>
                                            <Button
                                                type="link"
                                                size="small"
                                                onClick={handleOpenMap}
                                                disabled={!pitch.latitude || !pitch.longitude}
                                            >
                                                Mở Google Maps
                                            </Button>
                                        </div>
                                        <Text type="secondary">
                                            {pitch.address}
                                        </Text>
                                        {/* Nếu muốn hiện map nhỏ (iframe) có thể để ở đây */}
                                    </Space>
                                </Card>
                            </Col>

                            <Col span={24}>
                                <Card size="small" bordered={false} className="info-card" style={{ boxShadow: token.boxShadowTertiary }}>
                                    <Title level={5}>Tiện ích sân</Title>
                                    <Space wrap size={[8, 12]}>
                                        <Tag icon={<CheckCircleOutlined />} color="cyan">Wifi miễn phí</Tag>
                                        <Tag icon={<CheckCircleOutlined />} color="cyan">Bãi gửi xe</Tag>
                                        <Tag icon={<CheckCircleOutlined />} color="cyan">Nước uống</Tag>
                                        <Tag icon={<CheckCircleOutlined />} color="cyan">Đèn chiếu sáng</Tag>
                                        <Tag icon={<CheckCircleOutlined />} color="cyan">Bóng thi đấu</Tag>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>

                        <Divider />

                        <div className="footer-meta">
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Ngày tạo: {new Date(pitch.createdAt).toLocaleDateString('vi-VN')}
                            </Text>
                        </div>

                    </motion.div>
                </Content>
            </div>
        </Layout>
    );
};

export default PitchDetailsPage;