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
        desc: "Xem lịch trống và đặt sân ngay khi bạn cần.",
        color: "#007b3d",
    },
    {
        icon: <ThunderboltOutlined />,
        title: "Quản lý thông minh",
        desc: "Theo dõi lịch đặt sân, doanh thu và hoạt động một cách rõ ràng, dễ hiểu.",
        color: "#0064a8",
    },
    {
        icon: <TeamOutlined />,
        title: "Kết nối cộng đồng",
        desc: "Dễ dàng tìm người chơi cùng, lập đội hoặc tham gia các trận đấu.",
        color: "#da251c",
    },
];

const stats = [
    { value: "50+", label: "Sân đang hoạt động" },
    { value: "2K+", label: "Người dùng" },
    { value: "98%", label: "Hài lòng" },
    { value: "24/7", label: "Luôn sẵn sàng" },
];

const benefits = [
    "Nhận xác nhận qua email hoặc SMS",
    "Thanh toán an toàn và dễ sử dụng",
    "Xem lại lịch sử đặt sân bất cứ lúc nào",
    "Hủy hoặc đổi lịch khi cần",
    "Giao diện sáng / tối tùy chọn",
    "Dùng tốt trên cả điện thoại và máy tính",
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
                                <span>Đặt sân bóng dễ hơn mỗi ngày</span>
                            </motion.div>

                            <motion.h1
                                className="hp__hero-title"
                                initial="hidden" animate="visible"
                                variants={fadeUp} custom={1}
                            >
                                Đặt sân bóng<br />
                                <em className="hp__gold-text">nhanh và tiện hơn</em>
                            </motion.h1>

                            <motion.p
                                className="hp__hero-sub"
                                initial="hidden" animate="visible"
                                variants={fadeUp} custom={2}
                            >
                                Xem lịch trống, đặt sân và tham gia trận đấu chỉ trong vài bước.
                                Không cần gọi điện hay chờ đợi.
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
                                        <p className="hp__float-title">Lịch trống cập nhật liên tục</p>
                                        <span className="hp__float-sub">Dễ chọn giờ phù hợp</span>
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
                            <p className="hp__section-label">Tiện ích</p>
                            <h2 className="hp__section-title">Những điều hữu ích<br /><em>khi bạn dùng app</em></h2>
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
                <section className="hp__why hp__framed-section">
                    <div className="hp__container">
                        <div className="hp__why-panel">
                            <div className="hp__why-inner">
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
                                        <span>Xác nhận trong vài giây</span>
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
                                        Tại sao dùng hệ thống này
                                    </motion.p>
                                    <motion.h2
                                        className="hp__section-title"
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={fadeUp} custom={1}
                                    >
                                        Đặt sân<br /><em>đơn giản hơn</em>
                                    </motion.h2>
                                    <motion.p
                                        className="hp__why-desc"
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={fadeUp} custom={2}
                                    >
                                        Chúng tôi muốn việc đặt sân trở nên đơn giản nhất có thể — từ lúc chọn sân đến lúc vào chơi, mọi thứ đều rõ ràng và nhanh gọn.
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
                                            Xem danh sách sân
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════
                    CTA BANNER
                ════════════════════════════════════════════ */}
                <section className="hp__cta hp__framed-section">
                    <div className="hp__container">
                        <motion.div
                            className="hp__cta-card"
                            style={{ width: '100%', maxWidth: '100%', display: 'block' }}
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
                                Tham gia cùng mọi người
                            </motion.p>
                            <motion.h2
                                className="hp__cta-title"
                                variants={fadeUp} custom={1}
                                initial="hidden" whileInView="visible" viewport={{ once: true }}
                            >
                                Sẵn sàng chơi chưa?
                            </motion.h2>
                            <motion.p
                                className="hp__cta-sub"
                                variants={fadeUp} custom={2}
                                initial="hidden" whileInView="visible" viewport={{ once: true }}
                            >
                                Tạo tài khoản miễn phí và đặt sân trong vài bước đơn giản.
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