import React from "react";
import { Layout, Typography, Row, Col, Carousel, Button, Space } from "antd";
import { motion, type Variants } from "framer-motion";
import {
    FieldTimeOutlined,
    AppstoreOutlined,
    TeamOutlined,
    ArrowRightOutlined
} from "@ant-design/icons";
import "./HomePage.scss";
import { useNavigate } from "react-router";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

interface HomePageProps {
    theme: 'light' | 'dark';
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const HomePage: React.FC<HomePageProps> = ({ theme }) => {
    const isDark = theme === 'dark';
    const naviagte = useNavigate();

    const features = [
        { title: "Booking Real-time", desc: "Hệ thống đặt sân tức thì, xử lý nhanh chóng.", icon: <FieldTimeOutlined /> },
        { title: "Smart Dashboard", desc: "Báo cáo doanh thu và tần suất sử dụng chuyên nghiệp.", icon: <AppstoreOutlined /> },
        { title: "Networking", desc: "Kết nối cộng đồng đội bóng, tìm đối thủ dễ dàng.", icon: <TeamOutlined /> },
    ];

    return (
        <Layout className={`home-page ${isDark ? 'dark' : 'light'}`}>
            <Content className="home-content">
                <div className="container-custom">

                    {/* HERO SECTION */}
                    <section className="hero-section">
                        <Row gutter={[32, 32]} align="middle">
                            <Col xs={24} lg={12}>
                                <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                                    <Title className="hero-title">
                                        THE NEXT GEN <br />
                                        <span className="gold-text">FOOTBALL PLATFORM</span>
                                    </Title>
                                    <Paragraph className="hero-paragraph">
                                        Nền tảng quản lý và đặt sân bóng hiện đại nhất. <br className="hidden-mobile" />
                                        Đưa trải nghiệm thể thao của bạn lên tầm cao mới.
                                    </Paragraph>
                                    <Space size={16} wrap className="mt-mobile">
                                        <Button className="btn-vip-pro" size="large"
                                            onClick={() => {
                                                naviagte("/pitch");
                                            }}
                                        >
                                            Bắt đầu ngay <ArrowRightOutlined />
                                        </Button>
                                        <Button type="link" className="btn-link-gold">
                                            Xem hướng dẫn
                                        </Button>
                                    </Space>
                                </motion.div>
                            </Col>

                            <Col xs={24} lg={12}>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="carousel-wrapper"
                                >
                                    <Carousel autoplay effect="fade">
                                        <div className="img-frame">
                                            <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000" alt="Field" />
                                        </div>
                                        <div className="img-frame">
                                            <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000" alt="Field" />
                                        </div>
                                        {/* <div className="img-frame">
                                            <img src="https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80&w=1000" alt="Stadium" />
                                        </div> */}
                                    </Carousel>
                                </motion.div>
                            </Col>
                        </Row>
                    </section>

                    {/* FEATURES SECTION */}
                    <section className="features-section">
                        <Row gutter={[24, 24]}>
                            {features.map((item, index) => (
                                <Col xs={24} sm={12} md={8} key={index}>
                                    <motion.div
                                        className="feature-card-vip"
                                        whileHover={{ y: -8 }}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={fadeInUp}
                                    >
                                        <div className="icon-wrapper">{item.icon}</div>
                                        <Title level={4}>{item.title}</Title>
                                        <Paragraph>{item.desc}</Paragraph>
                                    </motion.div>
                                </Col>
                            ))}
                        </Row>
                    </section>

                    {/* CTA BANNER */}
                    <motion.div
                        className="cta-banner-pro"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                    >
                        <Title level={2}>Sẵn sàng tối ưu vận hành?</Title>
                        <Paragraph>Hợp tác cùng chúng tôi để bứt phá ngay hôm nay.</Paragraph>
                        <Button className="btn-vip-pro" size="large">Liên hệ ngay</Button>
                    </motion.div>

                </div>
            </Content>
        </Layout>
    );
};

export default HomePage;