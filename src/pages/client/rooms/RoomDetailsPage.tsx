import React, { useEffect, useState } from 'react';
import {
    Layout,
    Typography,
    Row,
    Col,
    Image,
    Spin,
    Button,
    Divider,
    Space,
    Card,
    Collapse,
    Tag,
} from 'antd';
import { motion, type Variants } from 'framer-motion';
import {
    ArrowLeftOutlined,
    EnvironmentOutlined,
    GlobalOutlined,
    InfoCircleOutlined,
    TeamOutlined,
    LaptopOutlined,
    ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import RBButton from 'react-bootstrap/Button';
import { getPublicAssetById } from '../../../config/Api';
import type { IAsset } from '../../../types/asset';
import './RoomDetailsPage.scss';
import { formatDateTime } from '../../../utils/format/localdatetime';

import RoomTimelinePanel from './components/RoomTimelinePanel';

const { Content } = Layout;
const { Title, Text } = Typography;

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

const getRoomHeroSrc = (url?: string | null) => {
    if (!url) return '/placeholder-pitch.jpg';
    if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url;
    return url;
};

/** Chi tiết phòng — cùng API public asset (phòng = bản ghi Asset). */
const RoomDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [asset, setAsset] = useState<IAsset | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getPublicAssetById(Number(id))
            .then((res) => {
                if (res.data.statusCode === 200) {
                    setAsset(res.data.data ?? null);
                }
            })
            .catch(() => setAsset(null))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <Spin fullscreen tip="Đang tải thông tin phòng..." />;
    }

    if (!asset) return null;

    return (
        <Layout className="room-details-page">
            <Row gutter={[0, 0]} className="main-row">
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
                            src={getRoomHeroSrc(asset.assetsUrl)}
                            className="room-hero-image"
                            preview={{
                                cover: (
                                    <div className="mask-content">
                                        <GlobalOutlined /> Xem toàn cảnh
                                    </div>
                                ),
                            }}
                        />
                        <div className="status-overlay">
                            <Tag color="gold" className="status-tag-vip" icon={<LaptopOutlined />}>
                                Phòng tin học
                            </Tag>
                        </div>
                    </motion.div>
                </Col>

                <Col xs={24} lg={12} className="content-section">
                    <Content className="scroll-content">
                        <motion.div variants={containerVariants} initial="hidden" animate="visible">
                            <motion.div variants={itemVariants} className="header-box">
                                <Tag color="processing" icon={<LaptopOutlined />}>
                                    Phòng tin học (CSVC)
                                </Tag>
                                <Title level={1} className="room-title">
                                    {asset.assetName}
                                </Title>
                                <Space className="address-line">
                                    <EnvironmentOutlined />
                                    <Text type="secondary">{asset.location || 'Chưa cập nhật vị trí'}</Text>
                                </Space>
                            </motion.div>

                            <motion.div variants={itemVariants} className="booking-card-wrapper">
                                <Card className="booking-card-glass">
                                    <Row align="middle" justify="space-between">
                                        <Col>
                                            <Text strong className="price-label">
                                                SỨC CHỨA ƯỚC TÍNH
                                            </Text>
                                            <div className="price-value-big">
                                                {asset.capacity != null ? (
                                                    <>
                                                        {asset.capacity}
                                                        <small> chỗ</small>
                                                    </>
                                                ) : (
                                                    <Text type="secondary">Chưa cập nhật</Text>
                                                )}
                                            </div>
                                        </Col>
                                        <Col>
                                            <Space align="center" size={8}>
                                                <TeamOutlined style={{ fontSize: 22, color: '#faad14' }} />
                                            </Space>
                                        </Col>
                                        <Col>
                                            <RBButton
                                                variant="outline-warning"
                                                className="btn-book-now"
                                                onClick={() => navigate(`/rooms/booking/${asset.id}`)}
                                            >
                                                ĐẶT PHÒNG NGAY <ArrowRightOutlined />
                                            </RBButton>
                                        </Col>
                                    </Row>
                                </Card>
                            </motion.div>

                            <motion.div variants={itemVariants} style={{ marginTop: 16 }}>
                                <RoomTimelinePanel assetId={asset.id} />
                            </motion.div>

                            <Divider titlePlacement="left">Thông tin phòng</Divider>

                            <motion.div variants={itemVariants}>
                                <Collapse
                                    className="room-detail-collapse"
                                    defaultActiveKey={['overview']}
                                    items={[
                                        {
                                            key: 'overview',
                                            label: (
                                                <Space>
                                                    <InfoCircleOutlined />
                                                    <span>Chi tiết &amp; quản lý</span>
                                                </Space>
                                            ),
                                            children: (
                                                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                                                    <div className="detail-line">
                                                        <Text strong>Mã phòng:</Text> <Text code>#{asset.id}</Text>
                                                    </div>
                                                    <div className="detail-line">
                                                        <Text strong>Tên phòng:</Text> <Text>{asset.assetName}</Text>
                                                    </div>
                                                    <div className="detail-line">
                                                        <Text strong>Vị trí / tòa:</Text>{' '}
                                                        <Text>{asset.location || 'Chưa cập nhật'}</Text>
                                                    </div>
                                                    <div className="detail-line">
                                                        <Text strong>Sức chứa:</Text>{' '}
                                                        <Text>
                                                            {asset.capacity != null
                                                                ? `${asset.capacity} (ước tính)`
                                                                : 'Chưa cập nhật'}
                                                        </Text>
                                                    </div>
                                                    <Text type="secondary">
                                                        Phòng được thêm trong Quản trị. Người dùng đặt phòng theo lịch khi đã đăng nhập.
                                                    </Text>
                                                </Space>
                                            ),
                                        },
                                    ]}
                                />
                            </motion.div>

                            <div className="meta-footer">
                                <Divider dashed />
                                <Text disabled>
                                    Cập nhật lần cuối:{' '}
                                    {formatDateTime(asset.updatedAt ?? asset.createdAt)}
                                </Text>
                            </div>
                        </motion.div>
                    </Content>
                </Col>
            </Row>
        </Layout>
    );
};

export default RoomDetailsPage;
