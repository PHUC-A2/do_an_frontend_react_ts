import React, { useEffect, useMemo } from "react";
import { Layout, Typography, Row, Col, Card, Image, Tag, Button, Empty, Pagination, Select } from "antd";
import { motion, type Variants } from "framer-motion";
import {
    EnvironmentOutlined,
    ClockCircleOutlined,
    ArrowRightOutlined,
    EyeOutlined,
    AppstoreOutlined,
    CheckCircleOutlined,
    StarFilled,
} from "@ant-design/icons";
import "./PitchPage.scss";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { useNavigate, useSearchParams } from "react-router";
import { fetchPitches, selectPitchError, selectPitchLoading, selectPitchMeta, selectPitches } from "../../../redux/features/pitchSlice";
import type { IPitch } from "../../../types/pitch";
import { getPitchTypeLabel, PITCH_STATUS_META } from "../../../utils/constants/pitch.constants";
import { formatVND } from "../../../utils/format/price";
import RBButton from 'react-bootstrap/Button';
import {
    buildSpringListQuery,
    parseSpringSortParam,
    serializeSpringSortParam,
    type SpringSortItem,
} from "../../../utils/pagination/buildSpringPageQuery";
import { orFieldsInsensitiveLike } from "../../../utils/pagination/springFilterText";
const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

interface PitchPageProps {
    theme: "light" | "dark";
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

const MotionCard = motion.create(Card);

const DEFAULT_PAGE_SIZE = 12;

/** Sắp xếp mặc định (server). */
const DEFAULT_PITCH_SORT: SpringSortItem[] = [{ property: "id", direction: "desc" }];

const PITCH_SORT_OPTIONS = [
    { value: "id,desc", label: "Mới nhất" },
    { value: "name,asc", label: "Tên A → Z" },
    { value: "name,desc", label: "Tên Z → A" },
    { value: "pricePerHour,asc", label: "Giá thấp → cao" },
    { value: "pricePerHour,desc", label: "Giá cao → thấp" },
] as const;

const parsePositiveNumber = (value: string | null, fallbackValue: number) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
};

const normalizeKeyword = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

const detectPitchTypeFilter = (keyword: string): "THREE" | "SEVEN" | undefined => {
    const normalized = normalizeKeyword(keyword);
    if (!normalized) return undefined;

    if (/\b3\b/.test(normalized) || /\bthree\b/.test(normalized) || /\bsan 3\b/.test(normalized)) {
        return "THREE";
    }
    if (/\b7\b/.test(normalized) || /\bseven\b/.test(normalized) || /\bsan 7\b/.test(normalized)) {
        return "SEVEN";
    }
    return undefined;
};

const combinePitchFilter = (keyword: string): string | undefined => {
    const textFilter = orFieldsInsensitiveLike(["name", "address"], keyword);
    const pitchType = detectPitchTypeFilter(keyword);
    const pitchTypeFilter = pitchType ? `pitchType : '${pitchType}'` : undefined;

    if (textFilter && pitchTypeFilter) return `(${textFilter} or ${pitchTypeFilter})`;
    return textFilter ?? pitchTypeFilter;
};

const PitchPage: React.FC<PitchPageProps> = ({ theme }) => {
    const isDark = theme === "dark";
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const pitches = useAppSelector(selectPitches);
    const meta = useAppSelector(selectPitchMeta);
    const loading = useAppSelector(selectPitchLoading);
    const error = useAppSelector(selectPitchError);

    const currentKeyword = (searchParams.get("keyword") ?? "").trim();
    const currentPage = parsePositiveNumber(searchParams.get("page"), 1);
    const currentPageSize = parsePositiveNumber(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);
    const sortFromUrl = parseSpringSortParam(searchParams.get("sort"));
    const currentSort = sortFromUrl.length ? sortFromUrl : DEFAULT_PITCH_SORT;
    const sortSelectValue =
        serializeSpringSortParam(currentSort) ?? "id,desc";

    const listQuery = useMemo(
        () =>
            buildSpringListQuery({
                page: currentPage,
                pageSize: currentPageSize,
                filter: combinePitchFilter(currentKeyword),
                sort: currentSort,
            }),
        [currentPage, currentPageSize, currentKeyword, currentSort]
    );

    useEffect(() => {
        dispatch(fetchPitches(listQuery));
    }, [listQuery, dispatch]);

    const handlePaginationChange = (page: number, pageSize: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("sort", value);
        params.set("page", "1");
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <Layout className={`pitch-page ${isDark ? "dark" : "light"}`}>
            <Content className="pitch-content">

                {/* HERO — full-width with orb background */}
                <section className="hero-section">
                    <div className="pitch-hero-bg" aria-hidden>
                        <div className="pitch-hero-orb pitch-hero-orb--1" />
                        <div className="pitch-hero-orb pitch-hero-orb--2" />
                        <div className="pitch-hero-orb pitch-hero-orb--3" />
                    </div>
                    <div className="container-custom hero-inner">
                        <motion.div
                            className="hero-badge"
                            initial="hidden" animate="visible"
                            variants={fadeInUp}
                        >
                            <StarFilled style={{ color: '#faad14', fontSize: 11 }} />
                            <span>{currentKeyword ? `Kết quả cho “${currentKeyword}”` : 'Tất cả sân bóng · TBU Sport'}</span>
                        </motion.div>
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                        >
                            <Title className="hero-title">
                                <span className="gold-text">Danh sách sân bóng</span>
                            </Title>
                            <Paragraph className="hero-paragraph">
                                {currentKeyword ? `Kết quả theo từ khóa: ${currentKeyword}` : 'Chọn sân và đặt ngay.'}
                            </Paragraph>
                        </motion.div>
                    </div>
                </section>

                {/* LIST PITCHES */}
                <div className="container-custom">
                    <section className="pitch-list-section">
                        <div className="pitch-summaryBar">
                            <div>
                                <p className="pitch-summaryLabel">Danh sách sân</p>
                                <h2 className="pitch-summaryTitle">
                                    {currentKeyword ? `Kết quả tìm kiếm cho “${currentKeyword}”` : 'Khám phá sân phù hợp'}
                                </h2>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 12,
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <div className="pitch-summaryMeta">
                                    {currentKeyword
                                        ? `${meta.total} sân khớp (theo tên / địa chỉ)`
                                        : meta.total > 0
                                            ? `${meta.total} sân khả dụng`
                                            : "Không có kết quả phù hợp"}
                                </div>
                                <Select
                                    size="middle"
                                    className="pitch-sortSelect"
                                    value={sortSelectValue}
                                    options={[...PITCH_SORT_OPTIONS]}
                                    onChange={handleSortChange}
                                    aria-label="Sắp xếp danh sách sân"
                                    style={{ minWidth: 200 }}
                                />
                            </div>
                        </div>

                        {error ? (
                            <div className="pitch-emptyState">
                                <Empty description={error} />
                            </div>
                        ) : !loading && pitches.length === 0 && meta.total === 0 ? (
                            <div className="pitch-emptyState">
                                <Empty description={currentKeyword ? 'Không tìm thấy sân phù hợp với từ khóa hiện tại' : 'Chưa có sân nào để hiển thị'} />
                            </div>
                        ) : (
                            <>
                                <Row className="pitch-cardGrid" gutter={[{ xs: 12, sm: 16, md: 24 }, { xs: 12, sm: 16, md: 24 }]}>
                                    {pitches.map((pitch: IPitch) => (
                                        <Col xs={24} sm={12} md={8} lg={6} key={pitch.id}>
                                            <MotionCard
                                                className="pitch-card"
                                                hoverable
                                                loading={loading}
                                                whileHover={{ y: -8 }}
                                                transition={{ type: "spring", stiffness: 200 }}
                                                cover={
                                                    <Image
                                                        className="pitch-card-image"
                                                        src={pitch.pitchUrl ?? "/placeholder-pitch.jpg"}
                                                        alt={pitch.name ?? "Pitch"}
                                                        height={180}
                                                        width="100%"
                                                        preview={true}
                                                        style={{ objectFit: "cover" }}
                                                    />
                                                }
                                            >
                                                <Title level={5} ellipsis className="pitch-card-title">
                                                    {pitch.name}
                                                </Title>

                                                <div className="pitch-card-tags" style={{ marginBottom: 8 }}>
                                                    <Tag color="blue">
                                                        <AppstoreOutlined className="pitch-inlineIcon" /> {getPitchTypeLabel(pitch.pitchType)}
                                                    </Tag>
                                                    <Tag color={PITCH_STATUS_META[pitch.status].color}>
                                                        <CheckCircleOutlined className="pitch-inlineIcon" /> {PITCH_STATUS_META[pitch.status].label}
                                                    </Tag>
                                                </div>

                                                <Text strong type="warning" className="pitch-card-price" style={{ display: "block" }}>
                                                    <Tag color={"success"}>{formatVND(pitch.pricePerHour)} / giờ</Tag>
                                                </Text>

                                                <Text type="warning" className="pitch-card-time" style={{ display: "block", marginTop: 4 }}>
                                                    <ClockCircleOutlined />{" "}
                                                    {pitch.open24h
                                                        ? "Mở cửa 24/7"
                                                        : `${pitch.openTime} - ${pitch.closeTime}`}
                                                </Text>

                                                {(pitch.length != null || pitch.width != null) && (
                                                    <Text type="warning" style={{ display: "block", marginTop: 4 }}>
                                                        Kích thước: {pitch.length ?? '--'}m x {pitch.width ?? '--'}m
                                                        {pitch.length != null && pitch.width != null
                                                            ? ` (${(pitch.length * pitch.width).toLocaleString('vi-VN')} m2)`
                                                            : ''}
                                                    </Text>
                                                )}

                                                <Text type="warning" className="pitch-card-address" style={{ marginTop: 4 }}>
                                                    <span>
                                                        <EnvironmentOutlined /> {pitch.address}
                                                    </span>
                                                    <Button
                                                        type="link"
                                                        onClick={() => {
                                                            if (pitch?.latitude == null || pitch?.longitude == null) return;

                                                            const url = `https://www.google.com/maps/dir/?api=1&destination=${pitch.latitude},${pitch.longitude}`;
                                                            window.open(url, "_blank");
                                                        }}
                                                        disabled={pitch?.latitude == null || pitch?.longitude == null}
                                                    >
                                                        <EnvironmentOutlined />
                                                        <span>Google Maps</span>
                                                    </Button>
                                                </Text>
                                                <div className="pitch-card-actions">
                                                    <RBButton
                                                        variant="outline-secondary"
                                                        className="pitch-card-actionButton"
                                                        title="Xem chi tiết sân"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/pitch/${pitch.id}`);
                                                        }}
                                                    >
                                                        <EyeOutlined className="pitch-card-actionIcon" />
                                                        <span className="pitch-card-actionText">Xem</span>
                                                    </RBButton>

                                                    <RBButton
                                                        variant="outline-warning"
                                                        className="pitch-card-actionButton"
                                                        title="Đặt sân ngay"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/booking/${pitch.id}`, {
                                                                state: { mode: "CREATE" },
                                                            });
                                                        }}
                                                    >
                                                        <ArrowRightOutlined className="pitch-card-actionIcon" />
                                                        <span className="pitch-card-actionText">Đặt</span>
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
                                            showTotal={(total, range) => `${range[0]}-${range[1]} / ${total} sân`}
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

export default PitchPage;
