import React, { useEffect, useMemo } from 'react';
import { Layout, Typography, Row, Col, Card, Image, Tag, Empty, Pagination, Select } from 'antd';
import { motion, type Variants } from 'framer-motion';
import {
    EnvironmentOutlined,
    EyeOutlined,
    LaptopOutlined,
    ArrowRightOutlined,
    StarFilled,
    TeamOutlined,
} from '@ant-design/icons';
import './RoomsPage.scss';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { useNavigate, useSearchParams } from 'react-router';
import {
    fetchPublicAssets,
    selectClientAssetError,
    selectClientAssetLoading,
    selectClientAssetMeta,
    selectClientAssets,
} from '../../../redux/features/clientAssetSlice';
import type { IAsset } from '../../../types/asset';
import RBButton from 'react-bootstrap/Button';
import {
    buildSpringListQuery,
    parseSpringSortParam,
    serializeSpringSortParam,
    type SpringSortItem,
} from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

interface RoomsPageProps {
    theme: 'light' | 'dark';
}

/** Trang danh sách phòng tin học — dữ liệu = bảng assets (admin tạo phòng qua Quản lý tài sản). */
const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: 'easeOut' },
    },
};

const MotionCard = motion.create(Card);

const DEFAULT_PAGE_SIZE = 12;

const DEFAULT_ROOM_SORT: SpringSortItem[] = [{ property: 'id', direction: 'desc' }];

const ROOM_SORT_OPTIONS = [
    { value: 'id,desc', label: 'Mới nhất' },
    { value: 'assetName,asc', label: 'Tên A → Z' },
    { value: 'assetName,desc', label: 'Tên Z → A' },
    { value: 'capacity,asc', label: 'Sức chứa thấp → cao' },
    { value: 'capacity,desc', label: 'Sức chứa cao → thấp' },
] as const;

const parsePositiveNumber = (value: string | null, fallbackValue: number) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
};

const getRoomCoverSrc = (url?: string | null) => {
    if (!url) return '/placeholder-pitch.jpg';
    if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url;
    return url;
};

const RoomsPage: React.FC<RoomsPageProps> = ({ theme }) => {
    const isDark = theme === 'dark';
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const assets = useAppSelector(selectClientAssets);
    const meta = useAppSelector(selectClientAssetMeta);
    const loading = useAppSelector(selectClientAssetLoading);
    const error = useAppSelector(selectClientAssetError);

    const currentKeyword = (searchParams.get('keyword') ?? '').trim();
    const currentPage = parsePositiveNumber(searchParams.get('page'), 1);
    const currentPageSize = parsePositiveNumber(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);
    const sortFromUrl = parseSpringSortParam(searchParams.get('sort'));
    const currentSort = sortFromUrl.length ? sortFromUrl : DEFAULT_ROOM_SORT;
    const sortSelectValue = serializeSpringSortParam(currentSort) ?? 'id,desc';

    const listQuery = useMemo(
        () =>
            buildSpringListQuery({
                page: currentPage,
                pageSize: currentPageSize,
                filter: orFieldsInsensitiveLike(['assetName', 'location'], currentKeyword),
                sort: currentSort,
            }),
        [currentPage, currentPageSize, currentKeyword, currentSort]
    );

    useEffect(() => {
        dispatch(fetchPublicAssets(listQuery));
    }, [listQuery, dispatch]);

    const handlePaginationChange = (page: number, pageSize: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', value);
        params.set('page', '1');
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Layout className={`room-page ${isDark ? 'dark' : 'light'}`}>
            <Content className="room-content">
                <section className="hero-section">
                    <div className="pitch-hero-bg" aria-hidden>
                        <div className="pitch-hero-orb pitch-hero-orb--1" />
                        <div className="pitch-hero-orb pitch-hero-orb--2" />
                        <div className="pitch-hero-orb pitch-hero-orb--3" />
                    </div>
                    <div className="container-custom hero-inner">
                        <motion.div
                            className="hero-badge"
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                        >
                            <StarFilled style={{ color: '#faad14', fontSize: 11 }} />
                            <span>
                                {currentKeyword
                                    ? `Kết quả cho “${currentKeyword}”`
                                    : 'Phòng tin học · CSVC · TBU Sport'}
                            </span>
                        </motion.div>
                        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                            <Title className="hero-title">
                                DANH SÁCH <br />
                                <span className="gold-text">PHÒNG TIN HỌC</span>
                            </Title>
                            <Paragraph className="hero-paragraph">
                                {currentKeyword
                                    ? 'Đang hiển thị các phòng phù hợp với từ khóa.'
                                    : 'Mỗi phòng được quản trị viên cấu hình đầy đủ thông tin — xem chi tiết và đặt phòng theo quy trình hệ thống.'}
                            </Paragraph>
                        </motion.div>
                    </div>
                </section>

                <div className="container-custom">
                    <section className="room-list-section">
                        <div className="room-summaryBar">
                            <div>
                                <p className="room-summaryLabel">Danh mục phòng</p>
                                <h2 className="room-summaryTitle">
                                    {currentKeyword ? `Kết quả cho “${currentKeyword}”` : 'Chọn phòng phù hợp'}
                                </h2>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 12,
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <div className="room-summaryMeta">
                                    {currentKeyword
                                        ? `${meta.total} phòng khớp (theo tên / vị trí)`
                                        : meta.total > 0
                                          ? `${meta.total} phòng`
                                          : 'Không có kết quả phù hợp'}
                                </div>
                                <Select
                                    size="middle"
                                    className="room-sortSelect"
                                    value={sortSelectValue}
                                    options={[...ROOM_SORT_OPTIONS]}
                                    onChange={handleSortChange}
                                    aria-label="Sắp xếp danh sách phòng"
                                    style={{ minWidth: 200 }}
                                />
                            </div>
                        </div>

                        {error ? (
                            <div className="room-emptyState">
                                <Empty description={error} />
                            </div>
                        ) : !loading && assets.length === 0 && meta.total === 0 ? (
                            <div className="room-emptyState">
                                <Empty
                                    description={
                                        currentKeyword
                                            ? 'Không tìm thấy phòng phù hợp với từ khóa hiện tại'
                                            : 'Chưa có phòng nào — quản trị viên thêm phòng tại mục Tài sản.'
                                    }
                                />
                            </div>
                        ) : (
                            <>
                                <Row
                                    className="room-cardGrid"
                                    gutter={[{ xs: 12, sm: 16, md: 24 }, { xs: 12, sm: 16, md: 24 }]}
                                >
                                    {assets.map((asset: IAsset) => (
                                        <Col xs={24} sm={12} md={8} lg={6} key={asset.id}>
                                            <MotionCard
                                                className="room-card"
                                                hoverable
                                                loading={loading}
                                                whileHover={{ y: -8 }}
                                                transition={{ type: 'spring', stiffness: 200 }}
                                                cover={
                                                    <Image
                                                        className="room-card-image"
                                                        src={getRoomCoverSrc(asset.assetsUrl)}
                                                        alt={asset.assetName ?? 'Phòng'}
                                                        height={180}
                                                        width="100%"
                                                        preview
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                }
                                            >
                                                <Title level={5} ellipsis className="room-card-title">
                                                    {asset.assetName}
                                                </Title>

                                                <div className="room-card-tags" style={{ marginBottom: 8 }}>
                                                    <Tag color="blue">
                                                        <LaptopOutlined className="room-inlineIcon" /> Phòng tin học
                                                    </Tag>
                                                    {asset.capacity != null ? (
                                                        <Tag color="processing" icon={<TeamOutlined />}>
                                                            Sức chứa ~{asset.capacity}
                                                        </Tag>
                                                    ) : null}
                                                </div>

                                                <Text type="warning" className="room-card-address" style={{ marginTop: 4 }}>
                                                    <span>
                                                        <EnvironmentOutlined />{' '}
                                                        {asset.location || 'Chưa cập nhật vị trí'}
                                                    </span>
                                                </Text>

                                                <div className="room-card-actions">
                                                    <RBButton
                                                        variant="outline-secondary"
                                                        className="room-card-actionButton"
                                                        title="Xem chi tiết phòng"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/rooms/${asset.id}`);
                                                        }}
                                                    >
                                                        <EyeOutlined className="room-card-actionIcon" />
                                                        <span className="room-card-actionText">Xem</span>
                                                    </RBButton>
                                                    <RBButton
                                                        variant="outline-warning"
                                                        className="room-card-actionButton"
                                                        title="Đặt phòng ngay"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/rooms/booking/${asset.id}`);
                                                        }}
                                                    >
                                                        <ArrowRightOutlined className="room-card-actionIcon" />
                                                        <span className="room-card-actionText">Đặt</span>
                                                    </RBButton>
                                                </div>
                                            </MotionCard>
                                        </Col>
                                    ))}
                                </Row>

                                {meta.total > 0 ? (
                                    <div className="room-paginationWrap">
                                        <Pagination
                                            current={meta.page}
                                            pageSize={meta.pageSize}
                                            total={meta.total}
                                            showSizeChanger
                                            pageSizeOptions={[8, 12, 16, 24]}
                                            showTotal={(total, range) => `${range[0]}-${range[1]} / ${total} phòng`}
                                            onChange={handlePaginationChange}
                                        />
                                    </div>
                                ) : null}
                            </>
                        )}
                    </section>
                </div>
            </Content>
        </Layout>
    );
};

export default RoomsPage;
