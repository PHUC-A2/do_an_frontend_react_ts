import React, { useEffect, useMemo } from "react";
import {
    Layout,
    Typography,
    Row,
    Col,
    Image,
    Button,
    Empty,
    Pagination,
    Select,
    Rate,
    Skeleton,
} from "antd";
import { motion, type Variants } from "framer-motion";
import {
    EnvironmentOutlined,
    ClockCircleOutlined,
    ArrowRightOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    StarFilled,
    CompassOutlined,
    FilterOutlined,
} from "@ant-design/icons";
import "./PitchPage.scss";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { useNavigate, useSearchParams } from "react-router";
import {
    fetchPitches,
    selectPitchError,
    selectPitchLoading,
    selectPitchMeta,
    selectPitches,
} from "../../../redux/features/pitchSlice";
import type { IPitch } from "../../../types/pitch";
import { getPitchTypeLabel, PITCH_STATUS_META } from "../../../utils/constants/pitch.constants";
import { formatVND } from "../../../utils/format/price";
import { getPitchPricingDisplayLines } from "../../../utils/pitch/pitchPricing";
import {
    buildSpringListQuery,
    parseSpringSortParam,
    serializeSpringSortParam,
    type SpringSortItem,
} from "../../../utils/pagination/buildSpringPageQuery";
import { orFieldsInsensitiveLike } from "../../../utils/pagination/springFilterText";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

interface PitchPageProps {
    theme: "light" | "dark";
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
};

const gridStagger: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.08 },
    },
};

const cardReveal: Variants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
};

const DEFAULT_PAGE_SIZE = 12;
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

const combinePitchFilter = (keyword: string): string | undefined => {
    const normalized = normalizeKeyword(keyword);
    return orFieldsInsensitiveLike(["name", "address", "pitchType.name"], normalized);
};

interface PitchCardProps {
    pitch: IPitch;
    onView: () => void;
    onBook: () => void;
}

const PitchCard: React.FC<PitchCardProps> = ({ pitch, onView, onBook }) => {
    const pricingLines = getPitchPricingDisplayLines(pitch);
    const statusMeta = PITCH_STATUS_META[pitch.status];
    const hasRating = (pitch.reviewCount ?? 0) > 0;
    const areaLabel =
        pitch.length != null && pitch.width != null
            ? `${pitch.length}×${pitch.width}m · ${(pitch.length * pitch.width).toLocaleString("vi-VN")} m²`
            : null;

    return (
        <motion.article className="pp-card" variants={cardReveal} layout>
            <div className="pp-card__media" onClick={onView} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onView()}>
                <Image
                    className="pp-card__image"
                    src={pitch.pitchUrl ?? "/placeholder-pitch.jpg"}
                    alt={pitch.name ?? "Sân bóng"}
                    preview={false}
                    fallback="/placeholder-pitch.jpg"
                />
                <motion.div className="pp-card__mediaShade" aria-hidden />
                <motion.div className="pp-card__mediaTop">
                    <span className={`pp-card__chip pp-card__chip--status pp-card__chip--${pitch.status.toLowerCase()}`}>
                        <CheckCircleOutlined />
                        {statusMeta.label}
                    </span>
                    <span className="pp-card__chip pp-card__chip--type">{getPitchTypeLabel(pitch.pitchTypeName)}</span>
                </motion.div>
                <motion.div className="pp-card__mediaBottom">
                    {hasRating ? (
                        <span className="pp-card__rating">
                            <Rate disabled allowHalf value={pitch.averageRating ?? 0} className="pp-card__ratingStars" />
                            <span className="pp-card__ratingText">
                                {(pitch.averageRating ?? 0).toFixed(1)} · {pitch.reviewCount} đánh giá
                            </span>
                        </span>
                    ) : (
                        <span className="pp-card__rating pp-card__rating--muted">
                            <StarFilled />
                            Chưa có đánh giá
                        </span>
                    )}
                </motion.div>
            </div>

            <div className="pp-card__body">
                <h3 className="pp-card__title" title={pitch.name ?? undefined}>
                    {pitch.name}
                </h3>

                <div className="pp-card__pricing">
                    {pricingLines.length > 0 ? (
                        pricingLines.slice(0, 2).map((line) => (
                            <span key={line} className="pp-card__priceTag">
                                {line}
                            </span>
                        ))
                    ) : (
                        <span className="pp-card__priceTag pp-card__priceTag--primary">
                            {formatVND(pitch.pricePerHour)} <small>/ giờ</small>
                        </span>
                    )}
                </div>

                <ul className="pp-card__meta">
                    <li>
                        <ClockCircleOutlined />
                        <span>
                            {pitch.open24h ? "Mở cửa 24/7" : `${pitch.openTime?.slice(0, 5) ?? "--"} – ${pitch.closeTime?.slice(0, 5) ?? "--"}`}
                        </span>
                    </li>
                    {areaLabel ? (
                        <li>
                            <CompassOutlined />
                            <span>{areaLabel}</span>
                        </li>
                    ) : null}
                    <li className="pp-card__metaAddress">
                        <EnvironmentOutlined className="pp-card__metaAddressIcon" />
                        <span className="pp-card__addressText">{pitch.address}</span>
                        {pitch.latitude != null && pitch.longitude != null ? (
                            <Button
                                type="link"
                                className="pp-card__maps"
                                icon={<EnvironmentOutlined />}
                                href={`https://www.google.com/maps/dir/?api=1&destination=${pitch.latitude},${pitch.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Chỉ đường
                            </Button>
                        ) : null}
                    </li>
                </ul>

                <div className="pp-card__footer">
                    <Button
                        className="pp-card__btn pp-card__btn--ghost"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onView();
                        }}
                    >
                        Chi tiết
                    </Button>
                    <Button
                        type="primary"
                        className="pp-card__btn pp-card__btn--primary"
                        icon={<ArrowRightOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onBook();
                        }}
                    >
                        Đặt sân
                    </Button>
                </div>
            </div>
        </motion.article>
    );
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
    const sortSelectValue = serializeSpringSortParam(currentSort) ?? "id,desc";

    const listQuery = useMemo(
        () =>
            buildSpringListQuery({
                page: currentPage,
                pageSize: currentPageSize,
                filter: combinePitchFilter(currentKeyword),
                sort: currentSort,
            }),
        [currentPage, currentPageSize, currentKeyword, currentSort],
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

    const summaryText = currentKeyword
        ? `${meta.total} sân khớp từ khóa`
        : meta.total > 0
          ? `${meta.total} sân sẵn sàng đặt`
          : "Chưa có sân phù hợp";

    const showSkeleton = loading && pitches.length === 0;

    return (
        <Layout className={`pitch-page pp ${isDark ? "pp--dark" : "pp--light"}`}>
            <Content className="pp__content">
                <section className="pp__hero">
                    <div className="pp__hero-bg" aria-hidden>
                        <motion.div className="pp__hero-orb pp__hero-orb--1" />
                        <motion.div className="pp__hero-orb pp__hero-orb--2" />
                        <motion.div className="pp__hero-orb pp__hero-orb--3" />
                    </div>
                    <div className="pp__container pp__hero-inner">
                        <motion.div className="pp__hero-badge" initial="hidden" animate="visible" variants={fadeInUp}>
                            <StarFilled />
                            <span>{currentKeyword ? `Tìm kiếm · “${currentKeyword}”` : "TBU Sport · Đặt sân chuyên nghiệp"}</span>
                        </motion.div>
                        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                            <Title className="pp__hero-title">
                                Khám phá <em className="pp__gold-text">sân bóng</em>
                                <br className="pp__hero-break" />
                                phù hợp với bạn
                            </Title>
                            <Paragraph className="pp__hero-desc">
                                {currentKeyword
                                    ? `Đang hiển thị kết quả lọc theo “${currentKeyword}”. Chọn sân và đặt khung giờ trong vài bước.`
                                    : "Danh sách sân trong hệ thống — xem giá, lịch mở cửa và đặt sân ngay khi bạn sẵn sàng."}
                            </Paragraph>
                        </motion.div>
                        <motion.div className="pp__hero-stats" initial="hidden" animate="visible" variants={fadeInUp}>
                            <div className="pp__stat">
                                <strong>{meta.total || "—"}</strong>
                                <span>Sân hiện có</span>
                            </div>
                            <motion.div className="pp__stat-divider" aria-hidden />
                            <div className="pp__stat">
                                <strong>24/7</strong>
                                <span>Hỗ trợ đặt online</span>
                            </div>
                            <motion.div className="pp__stat-divider" aria-hidden />
                            <div className="pp__stat">
                                <strong>Xác nhận</strong>
                                <span>Qua hệ thống</span>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <div className="pp__container">
                    <section className="pp__list">
                        <div className="pp__toolbar">
                            <div className="pp__toolbar-main">
                                <p className="pp__section-label">
                                    <FilterOutlined /> Danh sách sân
                                </p>
                                <h2 className="pp__section-title">
                                    {currentKeyword ? `Kết quả cho “${currentKeyword}”` : "Chọn sân để đặt lịch"}
                                </h2>
                                <p className="pp__toolbar-meta">{summaryText}</p>
                            </div>
                            <div className="pp__toolbar-actions">
                                <Select
                                    size="large"
                                    className="pp__sort"
                                    value={sortSelectValue}
                                    options={[...PITCH_SORT_OPTIONS]}
                                    onChange={handleSortChange}
                                    aria-label="Sắp xếp danh sách sân"
                                />
                            </div>
                        </div>

                        {error ? (
                            <div className="pp__empty">
                                <Empty description={error} />
                            </div>
                        ) : showSkeleton ? (
                            <Row className="pp__grid" gutter={[20, 20]}>
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <Col xs={24} sm={12} lg={8} xl={6} key={`sk-${index}`}>
                                        <div className="pp-card pp-card--skeleton">
                                            <Skeleton.Image active className="pp-card__skMedia" />
                                            <div className="pp-card__body">
                                                <Skeleton active paragraph={{ rows: 4 }} />
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        ) : !loading && pitches.length === 0 && meta.total === 0 ? (
                            <div className="pp__empty">
                                <Empty
                                    description={
                                        currentKeyword
                                            ? "Không có sân nào khớp từ khóa này"
                                            : "Hiện chưa có sân để hiển thị"
                                    }
                                />
                            </div>
                        ) : (
                            <>
                                <motion.div
                                    className={loading ? "pp__grid pp__grid--loading" : "pp__grid"}
                                    variants={gridStagger}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <Row gutter={[20, 20]}>
                                        {pitches.map((pitch) => (
                                            <Col xs={24} sm={12} lg={8} xl={6} key={pitch.id}>
                                                <PitchCard
                                                    pitch={pitch}
                                                    onView={() => navigate(`/pitch/${pitch.id}`)}
                                                    onBook={() =>
                                                        navigate(`/booking/${pitch.id}`, {
                                                            state: { mode: "CREATE" },
                                                        })
                                                    }
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </motion.div>

                                {meta.total > 0 ? (
                                    <div className="pp__pagination">
                                        <Pagination
                                            current={meta.page}
                                            pageSize={meta.pageSize}
                                            total={meta.total}
                                            showSizeChanger
                                            pageSizeOptions={[8, 12, 16, 24]}
                                            showTotal={(total, range) => `${range[0]}–${range[1]} / ${total} sân`}
                                            onChange={handlePaginationChange}
                                            disabled={loading}
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
