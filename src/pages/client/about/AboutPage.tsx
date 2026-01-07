import { Layout, Typography, Row, Col, Card } from "antd";
import { motion, type Variants } from "framer-motion";
import { TeamOutlined, FieldTimeOutlined, AppstoreOutlined } from "@ant-design/icons";
import './AboutPage.scss'

const { Content } = Layout;
const { Title, Paragraph } = Typography;

interface AboutPageProps {
    theme: 'light' | 'dark';
}

// Animation variants
const pageVariants: Variants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.1 } },
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } },
};

const AboutPage: React.FC<AboutPageProps> = ({ theme }) => {
    const isDark = theme === 'dark';

    const features = [
        { id: 1, title: "Đặt sân nhanh chóng", description: "Chỉ vài thao tác là có thể đặt sân cho học viên hoặc đội bóng.", icon: <FieldTimeOutlined /> },
        { id: 2, title: "Quản lý lịch thi đấu", description: "Giáo viên và quản lý dễ dàng theo dõi lịch thi đấu và đặt sân.", icon: <AppstoreOutlined /> },
        { id: 3, title: "Đội ngũ hỗ trợ", description: "Hỗ trợ sinh viên và cán bộ qua thông báo trực tuyến và chat.", icon: <TeamOutlined /> },
    ];

    return (
        <Layout
            className={`page-about ${isDark ? 'dark' : 'light'}`}
            style={{ background: isDark ? '#001529' : '#fff' }}
        >
            <Content className="page-about-content" style={{ color: isDark ? '#fff' : '#000' }}>
                {/* Tiêu đề */}
                <motion.div variants={pageVariants} initial="initial" animate="animate" className="page-title">
                    <Title level={1} style={{ color: isDark ? '#faad14' : '#001529' }}>
                        HỆ THỐNG ĐẶT SÂN BÓNG ĐẠI HỌC TÂY BẮC
                    </Title>
                    <Paragraph>
                        Nền tảng giúp sinh viên, giảng viên và đội bóng quản lý lịch và đặt sân một cách nhanh chóng, thuận tiện và minh bạch.
                    </Paragraph>
                </motion.div>

                {/* Các tính năng */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <Row gutter={[24, 24]} justify="center" className="section-features">
                        {features.map(feature => (
                            <Col xs={24} sm={12} md={8} key={feature.id}>
                                <motion.div variants={itemVariants} whileHover={{ y: -5, boxShadow: `0 10px 20px ${isDark ? '#faad1440' : '#00152940'}` }}>
                                    <Card
                                        className="card-feature"
                                        hoverable
                                        style={{
                                            background: isDark ? '#001529' : '#fff',
                                            color: isDark ? '#fff' : '#000',
                                        }}
                                    >
                                        <div className="feature-icon" style={{ color: isDark ? '#faad14' : '#001529' }}>
                                            {feature.icon}
                                        </div>
                                        <Title level={4} style={{ color: isDark ? '#faad14' : '#001529' }}>{feature.title}</Title>
                                        <Paragraph>{feature.description}</Paragraph>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </motion.div>
            </Content>
        </Layout>
    );
};

export default AboutPage;
