import { Layout, Row, Col, Typography, Space } from "antd";
import { AiFillTikTok, AiFillYoutube } from "react-icons/ai";
import { BiLogoFacebookCircle } from "react-icons/bi";
import { SiZalo } from "react-icons/si";
import { Link } from "react-router";

const { Footer: AntFooter } = Layout;
const { Title, Text, Paragraph } = Typography;

const Footer = () => {
    // Dùng trực tiếp CSS variables để theme light/dark
    const styles = {
        backgroundColor: 'var(--footer-bg)',
        color: 'var(--text-color)',
        gold: 'var(--luxury-gold)',
        padding: "50px 60px",
        borderTop: `1px solid var(--footer-border)`
    };

    return (
        <AntFooter style={{ backgroundColor: styles.backgroundColor, color: styles.color, padding: styles.padding, borderTop: styles.borderTop }}>
            <Row gutter={[32, 32]}>
                {/* Cột 1: Về chúng tôi */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={4} style={{ color: styles.gold, marginBottom: 16, fontWeight: 700 }}>
                        Về chúng tôi
                    </Title>
                    <Paragraph style={{ color: styles.color }}>
                        Football Pro là nền tảng đặt sân bóng đá hiện đại, tốc độ và thân thiện, mang đến trải nghiệm tuyệt vời cho người hâm mộ túc cầu.
                    </Paragraph>
                </Col>

                {/* Cột 2: Liên hệ */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={4} style={{ color: styles.gold, marginBottom: 16, fontWeight: 700 }}>
                        Liên hệ
                    </Title>
                    <Space orientation="vertical" size="small">
                        <Text style={{ color: styles.color }}>📍 Đường Đặng Thai Mai, Phường Tô Hiệu, Tỉnh Sơn La.</Text>
                        <Text style={{ color: styles.color }}>📞 0123 456 789</Text>
                        <Text style={{ color: styles.color }}>✉️ admin@email.com</Text>
                    </Space>
                </Col>

                {/* Cột 3: Liên kết nhanh */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={4} style={{ color: styles.gold, marginBottom: 16, fontWeight: 700 }}>
                        Liên kết nhanh
                    </Title>
                    <Space orientation="vertical" size="small">
                        <Link to="/" style={{ color: styles.color }}>Trang chủ</Link>
                        <Link to="/booking" style={{ color: styles.color }}>Đặt sân</Link>
                        <Link to="/about" style={{ color: styles.color }}>Về chúng tôi</Link>
                        <Link to="/contact" style={{ color: styles.color }}>Liên hệ</Link>
                        <Link to="/admin" style={{ color: styles.color }}>Trang quản trị</Link>
                    </Space>
                </Col>

                {/* Cột 4: Mạng xã hội */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={4} style={{ color: styles.gold, marginBottom: 16, fontWeight: 700 }}>
                        Theo dõi
                    </Title>
                    <Space size="middle" style={{ fontSize: 28 }}>
                        <a href="https://web.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: styles.gold }}><BiLogoFacebookCircle /></a>
                        <a href="https://chat.zalo.me/" target="_blank" rel="noopener noreferrer" style={{ color: styles.gold }}><SiZalo /></a>
                        <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" style={{ color: styles.gold }}><AiFillTikTok /></a>
                        <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" style={{ color: styles.gold }}><AiFillYoutube /></a>
                    </Space>
                </Col>
            </Row>

            <hr style={{ borderColor: styles.gold, opacity: 0.3, margin: "30px 0" }} />

            <div style={{ textAlign: "center", color: styles.color }}>
                © {new Date().getFullYear()} Football Pro.
                <span style={{ color: styles.gold }}> Tất cả quyền được bảo lưu.</span>
            </div>
        </AntFooter>
    );
};

export default Footer;
