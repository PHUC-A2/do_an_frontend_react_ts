import { Layout, Row, Col, Typography, Space } from "antd";
import { AiFillTikTok, AiFillYoutube } from "react-icons/ai";
import { BiLogoFacebookCircle } from "react-icons/bi";
import { SiZalo } from "react-icons/si";
import { Link } from "react-router";

const { Footer: AntFooter } = Layout;
const { Title, Text } = Typography;

interface FooterProps {
    theme: 'light' | 'dark';
}

const Footer = ({ theme }: FooterProps) => {
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#001529' : '#fff';
    const textColor = isDark ? '#fff' : '#000';
    const goldColor = '#faad14';

    const linkStyle = {
        textDecoration: 'none',
        color: textColor,
    };

    const linkHoverCss = `
    a.footer-link:hover {
      color: ${goldColor} !important;
    }
  `;

    return (
        <AntFooter style={{ padding: '50px 60px', background: bgColor, color: textColor }}>
            {/* Inject hover style */}
            <style>{linkHoverCss}</style>

            <Row gutter={[32, 32]}>
                <Col xs={24} sm={12} md={6}>
                    <Title level={4} style={{ color: goldColor }}>Về chúng tôi</Title>
                    <Text style={{ color: textColor }}>
                        Football Pro là nền tảng đặt sân bóng đá hiện đại, tốc độ và thân thiện.
                    </Text>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Title level={4} style={{ color: goldColor }}>Liên hệ</Title>
                    <Space orientation="vertical">
                        <Text style={{ color: textColor }}>📍 Đường Đặng Thai Mai, Phường Tô Hiệu, Sơn La</Text>
                        <Text style={{ color: textColor }}>📞 0123 456 789</Text>
                        <Text style={{ color: textColor }}>✉️ admin@email.com</Text>
                    </Space>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Title level={4} style={{ color: goldColor }}>Liên kết nhanh</Title>
                    <Space orientation="vertical">
                        <Link to="/" className="footer-link" style={linkStyle}>Trang chủ</Link>
                        <Link to="/booking" className="footer-link" style={linkStyle}>Đặt sân</Link>
                        <Link to="/about" className="footer-link" style={linkStyle}>Về chúng tôi</Link>
                        <Link to="/contact" className="footer-link" style={linkStyle}>Liên hệ</Link>
                        <Link to="/admin" className="footer-link" style={linkStyle}>Trang quản trị</Link>
                    </Space>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Title level={4} style={{ color: goldColor }}>Theo dõi</Title>
                    <Space size="middle" style={{ fontSize: 28 }}>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: goldColor }}><BiLogoFacebookCircle /></a>
                        <a href="https://chat.zalo.me" target="_blank" rel="noopener noreferrer" style={{ color: goldColor }}><SiZalo /></a>
                        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" style={{ color: goldColor }}><AiFillTikTok /></a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ color: goldColor }}><AiFillYoutube /></a>
                    </Space>
                </Col>
            </Row>

            <div style={{ textAlign: 'center', marginTop: 30, color: textColor }}>
                © {new Date().getFullYear()} Football Pro. <span style={{ color: goldColor }}>Tất cả quyền được bảo lưu.</span>
            </div>
        </AntFooter>
    );
};

export default Footer;
