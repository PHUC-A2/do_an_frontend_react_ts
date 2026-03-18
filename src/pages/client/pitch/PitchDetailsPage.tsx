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
    List,
    Collapse,
} from "antd";
import { motion, type Variants } from "framer-motion";
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
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { MdMergeType } from "react-icons/md";
import RBButton from 'react-bootstrap/Button';
import { clientGetPitchEquipments, getPitchById } from "../../../config/Api";
import type { IPitch } from "../../../types/pitch";
import type { IPitchEquipment } from "../../../types/pitchEquipment";
import {
    getPitchTypeLabel,
    PITCH_STATUS_META
} from "../../../utils/constants/pitch.constants";
import { formatVND } from "../../../utils/format/price";

import "./PitchDetailsPage.scss";
import { formatDateTime } from "../../../utils/format/localdatetime";

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

const PitchDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pitch, setPitch] = useState<IPitch | null>(null);
    const [pitchEquipments, setPitchEquipments] = useState<IPitchEquipment[]>([]);
    const [loading, setLoading] = useState(false);

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

    if (loading) {
        return <Spin fullscreen tip="Đang tải dữ liệu sân..." />;
    }


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
                            preview={{
                                cover: (
                                    <div className="mask-content">
                                        <GlobalOutlined /> Xem toàn cảnh
                                    </div>
                                ),
                            }}
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
                                                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
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
                                                </Space>
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
                                        {
                                            key: "equipment",
                                            label: (
                                                <Space>
                                                    <ToolOutlined />
                                                    <span>Thiết bị của sân</span>
                                                </Space>
                                            ),
                                            children: pitchEquipments.length > 0 ? (
                                                <List
                                                    dataSource={pitchEquipments}
                                                    renderItem={(item) => (
                                                        <List.Item className="pitch-equipment-item">
                                                            <List.Item.Meta
                                                                avatar={
                                                                    <Image
                                                                        width={56}
                                                                        height={56}
                                                                        style={{ borderRadius: 8, objectFit: 'cover' }}
                                                                        src={getEquipmentImageSrc(item.equipmentImageUrl)}
                                                                        fallback="/placeholder-pitch.jpg"
                                                                        preview={{ mask: 'Xem' }}
                                                                    />
                                                                }
                                                                title={
                                                                    <Space size={6} wrap>
                                                                        <Text strong>{item.equipmentName}</Text>
                                                                        <Tag color="processing">SL: {item.quantity}</Tag>
                                                                    </Space>
                                                                }
                                                                description={
                                                                    <Space orientation="vertical" size={2}>
                                                                        <Text type="secondary">Mã thiết bị: {item.equipmentId}</Text>
                                                                        <Text>{item.specification ? `Thông số: ${item.specification}` : 'Thông số: chưa cập nhật'}</Text>
                                                                        <Text>{item.note ? `Ghi chú: ${item.note}` : 'Ghi chú: chưa cập nhật'}</Text>
                                                                    </Space>
                                                                }
                                                            />
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <Text type="secondary">Sân chưa cập nhật thiết bị cố định</Text>
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
                </Col>
            </Row>
        </Layout>
    );
};

export default PitchDetailsPage;