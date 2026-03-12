import React from "react";
import { Layout, Button, Space } from "antd";
import { motion, type Variants } from "framer-motion";
import {
    CalendarOutlined,
    ThunderboltOutlined,
    TeamOutlined,
    ArrowRightOutlined,
    CheckCircleFilled,
    StarFilled,
} from "@ant-design/icons";
import "./HomePage.scss";
import { useNavigate } from "react-router";

const { Content } = Layout;

interface HomePageProps {
    theme: 'light' | 'dark';
}

// ── Animation variants ─────────────────────────────────────────
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 },
    }),
};

const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 0) => ({
        opacity: 1,
        transition: { duration: 0.8, ease: "easeOut", delay: i * 0.1 },
    }),
};

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.88 },
    visible: (i = 0) => ({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: i * 0.13 },
    }),
};


// ── Data ───────────────────────────────────────────────────────
const features = [
    {
        icon: <CalendarOutlined />,
        title: "Đặt sân tức thì",
        desc: "Xem lịch trống theo thời gian thực, xác nhận trong vài giây. Không chờ đợi, không gọi điện.",
        color: "#007b3d",
    },
    {
        icon: <ThunderboltOutlined />,
        title: "Quản lý thông minh",
        desc: "Bảng điều khiển trực quan theo dõi doanh thu, lịch đặt sân và hiệu suất hoạt động.",
        color: "#0064a8",
    },
    {
        icon: <TeamOutlined />,
        title: "Kết nối cộng đồng",
        desc: "Tìm đội bóng, kết nối đối thủ, tổ chức giải đấu ngay trên nền tảng.",
        color: "#da251c",
    },
];

const stats = [
    { value: "50+", label: "Sân bóng" },
    { value: "2K+", label: "Người dùng" },
    { value: "98%", label: "Hài lòng" },
    { value: "24/7", label: "Hỗ trợ" },
];

const benefits = [
    "Xác nhận đặt sân qua email & SMS",
    "Thanh toán an toàn, nhiều hình thức",
    "Lịch sử đặt sân chi tiết",
    "Hủy & hoàn tiền linh hoạt",
    "Giao diện tối / sáng theo sở thích",
    "Hỗ trợ cả mobile và desktop",
];

const slides = [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1400", // sân cỏ xanh
    "https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=1400", // sân bóng ban đêm
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=1400", // sân vận động toàn cảnh
];

// ── Component ──────────────────────────────────────────────────
const HomePage: React.FC<HomePageProps> = ({ theme }) => {
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const [activeSlide, setActiveSlide] = React.useState(0);

    // Auto-rotate hero image
    React.useEffect(() => {
        const id = setInterval(() => setActiveSlide(p => (p + 1) % slides.length), 4500);
        return () => clearInterval(id);
    }, []);

    return (
        <Layout className={`hp ${isDark ? 'hp--dark' : 'hp--light'}`}>
            <Content className="hp__content">

                {/* ════════════════════════════════════════════
                    HERO
                ════════════════════════════════════════════ */}
                <section className="hp__hero">
                    {/* Background mesh */}
                    <div className="hp__hero-bg" aria-hidden>
                        <div className="hp__hero-orb hp__hero-orb--1" />
                        <div className="hp__hero-orb hp__hero-orb--2" />
                        <div className="hp__hero-orb hp__hero-orb--3" />
                    </div>

                    <div className="hp__container hp__hero-inner">
                        {/* Text side */}
                        <div className="hp__hero-text">
                            <motion.div
                                initial="hidden" animate="visible"
                                variants={fadeIn} custom={0}
                                className="hp__hero-badge"
                            >
                                <StarFilled style={{ color: '#faad14', fontSize: 11 }} />
                                <span>Nền tảng thể thao #1 Tây Bắc</span>
                            </motion.div>

                            <motion.h1
                                className="hp__hero-title"
                                initial="hidden" animate="visible"
                                variants={fadeUp} custom={1}
                            >
                                Đặt sân bóng<br />
                                <em className="hp__gold-text">nhanh &amp; dễ dàng</em>
                            </motion.h1>

                            <motion.p
                                className="hp__hero-sub"
                                initial="hidden" animate="visible"
                                variants={fadeUp} custom={2}
                            >
                                Quản lý lịch thi đấu, kết nối cộng đồng và trải nghiệm đặt sân
                                hiện đại chưa từng có tại Trường Đại học Tây Bắc.
                            </motion.p>

                            <motion.div
                                initial="hidden" animate="visible"
                                variants={fadeUp} custom={3}
                                className="hp__hero-actions"
                            >
                                <Button
                                    className="hp__btn-primary"
                                    size="large"
                                    icon={<ArrowRightOutlined />}
                                    iconPlacement="end"
                                    onClick={() => navigate("/pitch")}
                                >
                                    Đặt sân ngay
                                </Button>
                                <Button
                                    className="hp__btn-ghost"
                                    size="large"
                                    onClick={() => navigate("/about")}
                                >
                                    Tìm hiểu thêm
                                </Button>
                            </motion.div>

                            {/* Mini stats */}
                            <motion.div
                                className="hp__hero-stats"
                                initial="hidden" animate="visible"
                                variants={fadeIn} custom={4}
                            >
                                {stats.map((s, i) => (
                                    <div key={i} className="hp__hero-stat">
                                        <strong>{s.value}</strong>
                                        <span>{s.label}</span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Image side */}
                        <motion.div
                            className="hp__hero-visual"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        >
                            <div className="hp__img-stack">
                                {slides.map((src, i) => (
                                    <motion.img
                                        key={src}
                                        src={src}
                                        alt={`Sân bóng ${i + 1}`}
                                        className="hp__img-slide"
                                        animate={{
                                            opacity: activeSlide === i ? 1 : 0,
                                            scale: activeSlide === i ? 1 : 1.04,
                                        }}
                                        transition={{ duration: 1.1, ease: "easeInOut" }}
                                    />
                                ))}
                                {/* Dot nav */}
                                <div className="hp__img-dots">
                                    {slides.map((_, i) => (
                                        <button
                                            key={i}
                                            className={`hp__img-dot${activeSlide === i ? ' active' : ''}`}
                                            onClick={() => setActiveSlide(i)}
                                            aria-label={`Ảnh ${i + 1}`}
                                        />
                                    ))}
                                </div>
                                {/* Floating card */}
                                <motion.div
                                    className="hp__float-card"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <CalendarOutlined style={{ color: '#faad14' }} />
                                    <div>
                                        <p className="hp__float-title">Lịch đặt theo thời gian thực</p>
                                        <span className="hp__float-sub">Cập nhật trạng thái tức thì</span>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════
                    FEATURES
                ════════════════════════════════════════════ */}
                <section className="hp__features">
                    <div className="hp__container">
                        <motion.div
                            className="hp__section-head"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-60px" }}
                            variants={fadeUp}
                        >
                            <p className="hp__section-label">Tính năng nổi bật</p>
                            <h2 className="hp__section-title">Mọi thứ bạn cần<br /><em>trong một nền tảng</em></h2>
                        </motion.div>

                        <div className="hp__features-grid">
                            {features.map((f, i) => (
                                <motion.div
                                    key={i}
                                    className="hp__feat-card"
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-40px" }}
                                    variants={scaleIn}
                                    custom={i}
                                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                >
                                    <div className="hp__feat-icon" style={{ '--feat-color': f.color } as any}>
                                        {f.icon}
                                    </div>
                                    <h3 className="hp__feat-title">{f.title}</h3>
                                    <p className="hp__feat-desc">{f.desc}</p>
                                    <div className="hp__feat-line" style={{ background: f.color }} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════
                    WHY US — Split layout
                ════════════════════════════════════════════ */}
                <section className="hp__why">
                    <div className="hp__container hp__why-inner">
                        {/* Visual */}
                        <motion.div
                            className="hp__why-visual"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1553778263-73a83bab9b0c?q=80&w=900"
                                alt="Sân vận động"
                                className="hp__why-img"
                            />
                            <div className="hp__why-badge">
                                <ThunderboltOutlined />
                                <span>Xác nhận &lt; 5 giây</span>
                            </div>
                        </motion.div>

                        {/* Text */}
                        <div className="hp__why-text">
                            <motion.p
                                className="hp__section-label"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp} custom={0}
                            >
                                Tại sao chọn chúng tôi
                            </motion.p>
                            <motion.h2
                                className="hp__section-title"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp} custom={1}
                            >
                                Trải nghiệm đặt sân<br /><em>hoàn toàn mới</em>
                            </motion.h2>
                            <motion.p
                                className="hp__why-desc"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp} custom={2}
                            >
                                Chúng tôi xây dựng hệ thống tập trung vào trải nghiệm người dùng — từ lúc chọn sân đến khi bước vào thi đấu, mọi bước đều mượt mà và minh bạch.
                            </motion.p>

                            <motion.div
                                className="hp__benefits"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeIn} custom={3}
                            >
                                {benefits.map((b, i) => (
                                    <motion.div
                                        key={i}
                                        className="hp__benefit-item"
                                        variants={fadeUp}
                                        custom={i * 0.5 + 3}
                                    >
                                        <CheckCircleFilled className="hp__benefit-icon" />
                                        <span>{b}</span>
                                    </motion.div>
                                ))}
                            </motion.div>

                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp} custom={5}
                            >
                                <Button
                                    className="hp__btn-primary"
                                    size="large"
                                    onClick={() => navigate("/pitch")}
                                >
                                    Khám phá sân bóng
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════
                    CTA BANNER
                ════════════════════════════════════════════ */}
                <section className="hp__cta">
                    <div className="hp__container">
                        <motion.div
                            className="hp__cta-card"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="hp__cta-bg" aria-hidden />
                            <motion.p
                                className="hp__section-label hp__section-label--light"
                                variants={fadeUp} initial="hidden"
                                whileInView="visible" viewport={{ once: true }}
                            >
                                Bắt đầu ngay hôm nay
                            </motion.p>
                            <motion.h2
                                className="hp__cta-title"
                                variants={fadeUp} custom={1}
                                initial="hidden" whileInView="visible" viewport={{ once: true }}
                            >
                                Sẵn sàng thi đấu?
                            </motion.h2>
                            <motion.p
                                className="hp__cta-sub"
                                variants={fadeUp} custom={2}
                                initial="hidden" whileInView="visible" viewport={{ once: true }}
                            >
                                Đăng ký miễn phí, đặt sân trong 30 giây.
                            </motion.p>
                            <motion.div
                                variants={fadeUp} custom={3}
                                initial="hidden" whileInView="visible" viewport={{ once: true }}
                            >
                                <Space size={12} wrap>
                                    <Button
                                        className="hp__btn-primary hp__btn-primary--white"
                                        size="large"
                                        onClick={() => navigate("/pitch")}
                                    >
                                        Đặt sân ngay
                                    </Button>
                                    <Button
                                        className="hp__btn-ghost hp__btn-ghost--light"
                                        size="large"
                                        onClick={() => navigate("/about")}
                                    >
                                        Liên hệ chúng tôi
                                    </Button>
                                </Space>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

            </Content>
        </Layout>
    );
};

export default HomePage;