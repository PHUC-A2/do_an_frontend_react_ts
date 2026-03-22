import { Layout } from "antd";
import {
    InfoCircleOutlined,
    UserOutlined,
    SafetyOutlined,
    EditOutlined,
    CustomerServiceOutlined,
} from "@ant-design/icons";
import { motion, type Variants } from "framer-motion";
import "../home/HomePage.scss";
import "./TermsOfService.scss";

const { Content } = Layout;

interface TermsOfServiceProps {
    theme: "light" | "dark";
}

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 },
    }),
};

const terms = [
    {
        title: "Giới thiệu",
        icon: <InfoCircleOutlined />,
        text: "Hệ thống đặt sân bóng Đại học Tây Bắc cung cấp nền tảng giúp sinh viên và giảng viên dễ dàng đặt sân, theo dõi lịch thi đấu và quản lý hoạt động thể thao."
    },
    {
        title: "Quyền và trách nhiệm của người dùng",
        icon: <UserOutlined />,
        text: "Người dùng phải cung cấp thông tin chính xác khi đăng ký tài khoản và bảo mật thông tin đăng nhập của mình."
    },
    {
        title: "Quyền và trách nhiệm của hệ thống",
        icon: <SafetyOutlined />,
        text: "Chúng tôi cam kết bảo mật dữ liệu, đảm bảo hệ thống hoạt động ổn định và hỗ trợ người dùng khi cần thiết."
    },
    {
        title: "Thay đổi điều khoản",
        icon: <EditOutlined />,
        text: "Các điều khoản có thể được cập nhật theo thời gian. Người dùng nên thường xuyên kiểm tra để nắm rõ các thay đổi."
    },
    {
        title: "Liên hệ hỗ trợ",
        icon: <CustomerServiceOutlined />,
        text: "Nếu có thắc mắc vui lòng liên hệ bộ phận quản trị hệ thống để được hỗ trợ."
    }
];

const TermsOfService: React.FC<TermsOfServiceProps> = ({ theme }) => {

    const isDark = theme === "dark";

    return (
        <Layout className={`hp ${isDark ? "hp--dark" : "hp--light"}`}>
            <Content className="hp__content">

                {/* HERO */}
                <section className="hp__hero">

                    <div className="hp__hero-bg">
                        <div className="hp__hero-orb hp__hero-orb--1" />
                        <div className="hp__hero-orb hp__hero-orb--2" />
                        <div className="hp__hero-orb hp__hero-orb--3" />
                    </div>

                    <div className="hp__container hp__hero-inner terms-hero">

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                        >
                            <p className="hp__section-label">Điều khoản sử dụng</p>

                            <h1 className="hp__hero-title">
                                Điều khoản & <em className="hp__gold-text">Dịch vụ</em>
                            </h1>

                            <p className="hp__hero-sub">
                                Vui lòng đọc kỹ các điều khoản trước khi sử dụng hệ thống
                                đặt sân bóng của Đại học Tây Bắc.
                            </p>
                        </motion.div>

                    </div>
                </section>


                {/* CONTENT */}
                <section className="terms-section">

                    <div className="hp__container">

                        <motion.div
                            className="hp__section-head"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                        >
                            <p className="hp__section-label">Quy định hệ thống</p>
                            <h2 className="hp__section-title">
                                Các điều khoản <em>quan trọng</em>
                            </h2>
                        </motion.div>


                        <div className="terms-grid">

                            {terms.map((t, i) => (
                                <motion.div
                                    key={i}
                                    className="terms-card"
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                    custom={i}
                                >
                                    <div className="terms-card-icon">{t.icon}</div>
                                    <h3>{i + 1}. {t.title}</h3>
                                    <p>{t.text}</p>
                                </motion.div>
                            ))}

                        </div>

                    </div>

                </section>

            </Content>
        </Layout>
    );
};

export default TermsOfService;