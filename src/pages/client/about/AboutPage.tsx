import { Layout } from "antd";
import { motion, type Variants } from "framer-motion";
import {
    TeamOutlined,
    FieldTimeOutlined,
    AppstoreOutlined,
    CheckCircleFilled,
    StarFilled,
} from "@ant-design/icons";
import '../home/HomePage.scss';
import './AboutPage.scss';
import { Link } from "react-router";

const { Content } = Layout;

interface AboutPageProps {
    theme: 'light' | 'dark';
}

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 },
    }),
};

const features = [
    {
        id: 1,
        title: "Đặt sân nhanh chóng",
        desc: "Chỉ vài thao tác là có thể đặt sân, xem lịch trống và xác nhận trong vài giây. Không chờ đợi, không gọi điện.",
        icon: <FieldTimeOutlined />,
        color: "#007b3d",
    },
    {
        id: 2,
        title: "Quản lý lịch thi đấu",
        desc: "Bảng điều khiển trực quan giúp giáo viên và quản lý theo dõi lịch, trạng thái sân và hoạt động thể thao toàn trường.",
        icon: <AppstoreOutlined />,
        color: "#0064a8",
    },
    {
        id: 3,
        title: "Đội ngũ hỗ trợ",
        desc: "Hỗ trợ sinh viên và cán bộ mọi lúc qua thông báo trực tuyến, hệ thống chat và tổng đài hỗ trợ.",
        icon: <TeamOutlined />,
        color: "#da251c",
    },
];

const highlights = [
    "Xác nhận đặt sân qua email & SMS",
    "Lịch sử đặt sân chi tiết, dễ tra cứu",
    "Hủy & hoàn tiền linh hoạt",
    "Giao diện tối / sáng theo sở thích",
];

const AboutPage: React.FC<AboutPageProps> = ({ theme }) => {
    const isDark = theme === 'dark';

    return (
        <Layout className={`hp ${isDark ? 'hp--dark' : 'hp--light'}`}>
            <Content className="hp__content">

                {/* ─── HERO ─── */}
                <section className="hp__hero">
                    <div className="hp__hero-bg" aria-hidden>
                        <div className="hp__hero-orb hp__hero-orb--1" />
                        <div className="hp__hero-orb hp__hero-orb--2" />
                        <div className="hp__hero-orb hp__hero-orb--3" />
                    </div>
                    <div className="hp__container about-hero-inner">
                        <motion.div
                            className="hp__hero-badge"
                            initial="hidden" animate="visible"
                            variants={fadeUp} custom={0}
                        >
                            <StarFilled style={{ color: '#faad14', fontSize: 11 }} />
                            <span>Đại học Tây Bắc · TBU Sport</span>
                        </motion.div>

                        <motion.h1
                            className="hp__hero-title"
                            initial="hidden" animate="visible"
                            variants={fadeUp} custom={1}
                        >
                            Hệ thống đặt sân<br />
                            <em className="hp__gold-text">hiện nhanh chóng và tiện lợi</em>
                        </motion.h1>

                        <motion.p
                            className="hp__hero-sub"
                            initial="hidden" animate="visible"
                            variants={fadeUp} custom={2}
                        >
                            Nền tảng giúp sinh viên, giảng viên và đội bóng quản lý lịch và đặt sân
                            một cách nhanh chóng, thuận tiện và minh bạch tại Trường Đại học Tây Bắc.
                        </motion.p>
                    </div>
                </section>

                {/* ─── FEATURES ─── */}
                <section className="hp__features">
                    <div className="hp__container">
                        <motion.div
                            className="hp__section-head"
                            initial="hidden" whileInView="visible"
                            viewport={{ once: true }} variants={fadeUp}
                        >
                            <p className="hp__section-label">Tính năng nổi bật</p>
                            <h2 className="hp__section-title">
                                Những điều <em>chúng tôi mang lại</em>
                            </h2>
                        </motion.div>

                        <div className="hp__features-grid">
                            {features.map((f, i) => (
                                <motion.div
                                    key={f.id}
                                    className="hp__feat-card"
                                    style={{ '--feat-color': f.color } as React.CSSProperties}
                                    initial="hidden" whileInView="visible"
                                    viewport={{ once: true }} variants={fadeUp} custom={i}
                                >
                                    <div className="hp__feat-icon">{f.icon}</div>
                                    <p className="hp__feat-title">{f.title}</p>
                                    <p className="hp__feat-desc">{f.desc}</p>
                                    <div className="hp__feat-line" style={{ background: f.color }} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── WHY / HIGHLIGHTS ─── */}
                <section className="hp__why">
                    <div className="hp__container">
                        <div className="about-why-inner">
                            <motion.div
                                initial="hidden" whileInView="visible"
                                viewport={{ once: true }} variants={fadeUp}
                            >
                                <p className="hp__section-label">Tại sao chọn chúng tôi</p>
                                <h2 className="hp__section-title">
                                    Trải nghiệm <em>vượt trội</em>
                                </h2>
                                <p className="hp__why-desc">
                                    Chúng tôi không ngừng cải thiện để mang đến nền tảng đặt sân
                                    tốt nhất cho cộng đồng thể thao Đại học Tây Bắc.
                                </p>
                                <div className="hp__benefits">
                                    {highlights.map((h) => (
                                        <div key={h} className="hp__benefit-item">
                                            <CheckCircleFilled className="hp__benefit-icon" />
                                            <span>{h}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                className="about-terms-note"
                                initial="hidden" whileInView="visible"
                                viewport={{ once: true }} variants={fadeUp} custom={1}
                            >
                                <p>
                                    Bằng việc sử dụng nền tảng, bạn đồng ý với các{' '}
                                    <Link to="/terms" className="about-terms-link">
                                        Điều khoản và Dịch vụ
                                    </Link>{' '}
                                    của chúng tôi.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

            </Content>
        </Layout>
    );
};

export default AboutPage;
