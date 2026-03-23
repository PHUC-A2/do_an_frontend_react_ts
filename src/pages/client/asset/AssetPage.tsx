import React, { useEffect, useMemo } from 'react';
import { Layout, Typography, Row, Col, Card, Image, Tag, Empty, Pagination, Select } from 'antd';
import { motion, type Variants } from 'framer-motion';
import {
    EnvironmentOutlined,
    EyeOutlined,
    AppstoreOutlined,
    StarFilled,
    TeamOutlined,
} from '@ant-design/icons';
import '../pitch/PitchPage.scss';
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

interface AssetPageProps {
    theme: 'light' | 'dark';
}

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

const DEFAULT_ASSET_SORT: SpringSortItem[] = [{ property: 'id', direction: 'desc' }];

const ASSET_SORT_OPTIONS = [
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

const getAssetCoverSrc = (url?: string | null) => {
    if (!url) return '/placeholder-pitch.jpg';
    if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url;
    return url;
};

const AssetPage: React.FC<AssetPageProps> = ({ theme }) => {
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
    const currentSort = sortFromUrl.length ? sortFromUrl : DEFAULT_ASSET_SORT;
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
        <Layout className={`pitch-page ${isDark ? 'dark' : 'light'}`}>
            <Content className="pitch-content">
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
                                {currentKeyword ? `Kết quả cho “${currentKeyword}”` : 'Không gian · Phòng học · TBU Sport'}
                            </span>
                        </motion.div>
                        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                            <Title className="hero-title">
                                DANH SÁCH <br />
                                <span className="gold-text">TÀI SẢN</span>
                            </Title>
                            <Paragraph className="hero-paragraph">
                                {currentKeyword
                                    ? 'Đang hiển thị các tài sản phù hợp với từ khóa bạn tìm từ Header.'
                                    : 'Xem thông tin phòng, kho và không gian — đồng bộ giao diện với trang sân bóng.'}
                            </Paragraph>
                        </motion.div>
                    </div>
                </section>

                <div className="container-custom">
                    <section className="pitch-list-section">
                        <div className="pitch-summaryBar">
                            <div>
                                <p className="pitch-summaryLabel">Danh mục tài sản</p>
                                <h2 className="pitch-summaryTitle">
                                    {currentKeyword ? `Kết quả cho “${currentKeyword}”` : 'Khám phá không gian'}
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
                                <div className="pitch-summaryMeta">
                                    {currentKeyword
                                        ? `${meta.total} tài sản khớp (theo tên / vị trí)`
                                        : meta.total > 0
                                          ? `${meta.total} tài sản`
                                          : 'Không có kết quả phù hợp'}
                                </div>
                                <Select
                                    size="middle"
                                    className="pitch-sortSelect"
                                    value={sortSelectValue}
                                    options={[...ASSET_SORT_OPTIONS]}
                                    onChange={handleSortChange}
                                    aria-label="Sắp xếp danh sách tài sản"
                                    style={{ minWidth: 200 }}
                                />
                            </div>
                        </div>

                        {error ? (
                            <div className="pitch-emptyState">
                                <Empty description={error} />
                            </div>
                        ) : !loading && assets.length === 0 && meta.total === 0 ? (
                            <div className="pitch-emptyState">
                                <Empty
                                    description={
                                        currentKeyword
                                            ? 'Không tìm thấy tài sản phù hợp với từ khóa hiện tại'
                                            : 'Chưa có tài sản để hiển thị'
                                    }
                                />
                            </div>
                        ) : (
                            <>
                                <Row
                                    className="pitch-cardGrid"
                                    gutter={[{ xs: 12, sm: 16, md: 24 }, { xs: 12, sm: 16, md: 24 }]}
                                >
                                    {assets.map((asset: IAsset) => (
                                        <Col xs={24} sm={12} md={8} lg={6} key={asset.id}>
                                            <MotionCard
                                                className="pitch-card"
                                                hoverable
                                                loading={loading}
                                                whileHover={{ y: -8 }}
                                                transition={{ type: 'spring', stiffness: 200 }}
                                                cover={
                                                    <Image
                                                        className="pitch-card-image"
                                                        src={getAssetCoverSrc(asset.assetsUrl)}
                                                        alt={asset.assetName ?? 'Tài sản'}
                                                        height={180}
                                                        width="100%"
                                                        preview
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                }
                                            >
                                                <Title level={5} ellipsis className="pitch-card-title">
                                                    {asset.assetName}
                                                </Title>

                                                <div className="pitch-card-tags" style={{ marginBottom: 8 }}>
                                                    <Tag color="blue">
                                                        <AppstoreOutlined className="pitch-inlineIcon" /> Tài sản
                                                    </Tag>
                                                    {asset.capacity != null ? (
                                                        <Tag color="processing" icon={<TeamOutlined />}>
                                                            Sức chứa ~{asset.capacity}
                                                        </Tag>
                                                    ) : null}
                                                </div>

                                                <Text type="warning" className="pitch-card-address" style={{ marginTop: 4 }}>
                                                    <span>
                                                        <EnvironmentOutlined /> {asset.location || 'Chưa cập nhật vị trí'}
                                                    </span>
                                                </Text>

                                                <div className="pitch-card-actions">
                                                    <RBButton
                                                        variant="outline-secondary"
                                                        className="pitch-card-actionButton"
                                                        title="Xem chi tiết tài sản"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/asset/${asset.id}`);
                                                        }}
                                                    >
                                                        <EyeOutlined className="pitch-card-actionIcon" />
                                                        <span className="pitch-card-actionText">Xem</span>
                                                    </RBButton>
                                                </div>
                                            </MotionCard>
                                        </Col>
                                    ))}
                                </Row>

                                {meta.total > 0 ? (
                                    <div className="pitch-paginationWrap">
                                        <Pagination
                                            current={meta.page}
                                            pageSize={meta.pageSize}
                                            total={meta.total}
                                            showSizeChanger
                                            pageSizeOptions={[8, 12, 16, 24]}
                                            showTotal={(total, range) => `${range[0]}-${range[1]} / ${total} tài sản`}
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

export default AssetPage;
