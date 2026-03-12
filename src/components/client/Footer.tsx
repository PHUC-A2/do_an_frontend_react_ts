import { Layout, Row, Col, Typography, Space, Divider } from "antd";
import { AiFillTikTok, AiFillYoutube } from "react-icons/ai";
import { BiLogoFacebookCircle } from "react-icons/bi";
import { SiZalo } from "react-icons/si";
import { MdLocationOn, MdPhone, MdEmail } from "react-icons/md";
import { FiHome, FiMapPin, FiInfo, FiFileText } from "react-icons/fi";
import { Link } from "react-router";
import LogoGlow from "../logo-glow/LogoGlow";

const { Footer: AntFooter } = Layout;
const { Title, Text, Paragraph } = Typography;

interface FooterProps {
    theme: 'light' | 'dark';
}

const Footer = ({ theme }: FooterProps) => {
    const isDark = theme === 'dark';

    const bg = isDark ? 'rgba(15, 28, 43, 0.86)' : 'rgba(248, 250, 252, 0.88)';
    const topBorder = isDark ? '1px solid rgba(250, 173, 20, 0.14)' : '1px solid rgba(15, 23, 42, 0.12)';
    const dividerColor = isDark ? 'rgba(250, 173, 20, 0.12)' : 'rgba(15, 23, 42, 0.10)';
    const gold = '#faad14';
    const linkBlue = '#1677ff';
    const headingColor = isDark ? '#e2e8f0' : '#1a2733';
    const subColor = isDark ? '#64748b' : '#94a3b8';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const navLinkStyle: React.CSSProperties = {
        textDecoration: 'none',
        color: textColor,
        fontSize: '0.88rem',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        lineHeight: '1.9',
        width: '100%',
        transition: 'color 0.18s',
    };

    const socialIconStyle: React.CSSProperties = {
        color: subColor,
        fontSize: 22,
        display: 'inline-flex',
        transition: 'color 0.18s, transform 0.18s',
    };

    const contactItems = [
        { icon: <MdLocationOn size={15} />, text: 'Đường Đặng Thai Mai, Phường Tô Hiệu, Sơn La' },
        { icon: <MdPhone size={15} />, text: '0123 456 789' },
        { icon: <MdEmail size={15} />, text: 'phucban297@gmail.com' },
    ];

    const quickLinks = [
        { to: '/', label: 'Trang chủ', icon: <FiHome size={14} /> },
        { to: '/pitch', label: 'Sân bóng', icon: <FiMapPin size={14} /> },
        { to: '/about', label: 'Về chúng tôi', icon: <FiInfo size={14} /> },
        { to: '/terms', label: 'Điều khoản dịch vụ', icon: <FiFileText size={14} /> },
    ];

    const socials = [
        { href: 'https://facebook.com', icon: <BiLogoFacebookCircle />, label: 'Facebook' },
        { href: 'https://chat.zalo.me', icon: <SiZalo />, label: 'Zalo' },
        { href: 'https://tiktok.com', icon: <AiFillTikTok />, label: 'TikTok' },
        { href: 'https://youtube.com', icon: <AiFillYoutube />, label: 'YouTube' },
    ];

    return (
        <AntFooter style={{ padding: 0, background: 'transparent', borderTop: 'none' }}>
            <style>{`
                .fp-footer a.fp-nav-link:hover { color: ${linkBlue} !important; }
                .fp-footer .fp-social-icon:hover { color: ${gold} !important; transform: translateY(-3px); }
                .fp-footer-shell {
                    padding: 52px 28px 32px;
                    background: ${bg};
                    border-top: ${topBorder};
                    overflow-x: hidden;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
                @media (max-width: 768px) {
                    .fp-footer-shell { padding: 40px 16px 24px; }
                }
            `}</style>

            <div className="fp-footer fp-footer-shell">
                <Row gutter={[{ xs: 20, sm: 28, md: 48 }, 40]}>

                    {/* ── Brand column ──────────────────────────────── */}
                    <Col xs={24} md={8}>
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 14, minWidth: 0 }}>
                                <LogoGlow variant="header" />
                                <span style={{
                                    fontSize: '1.08rem',
                                    fontWeight: 800,
                                    letterSpacing: '-0.04em',
                                    lineHeight: 1.05,
                                    color: headingColor,
                                }}>
                                    UTB <span style={{ color: gold }}>Sport</span>
                                </span>
                            </div>
                        </Link>

                        <Paragraph style={{
                            color: textColor,
                            fontSize: '0.875rem',
                            lineHeight: 1.75,
                            marginBottom: 20,
                            maxWidth: 280,
                        }}>
                            Nền tảng đặt sân bóng đá hiện đại — kết nối người chơi, quản lý lịch thi đấu và đặt sân nhanh chóng, tiện lợi.
                        </Paragraph>

                        <Space size={14}>
                            {socials.map(s => (
                                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                                    aria-label={s.label} className="fp-social-icon" style={socialIconStyle}>
                                    {s.icon}
                                </a>
                            ))}
                        </Space>
                    </Col>

                    {/* ── Quick links ───────────────────────────────── */}
                    <Col xs={24} sm={12} md={6}>
                        <Title level={5} style={{ color: headingColor, marginBottom: 16, fontWeight: 700 }}>
                            Liên kết nhanh
                        </Title>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {quickLinks.map(link => (
                                <Link key={link.to} to={link.to} className="fp-nav-link" style={navLinkStyle}>
                                    <span style={{ display: 'inline-flex', color: 'currentColor' }}>{link.icon}</span>
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </Col>

                    {/* ── Contact ───────────────────────────────────── */}
                    <Col xs={24} sm={12} md={10}>
                        <Title level={5} style={{ color: headingColor, marginBottom: 16, fontWeight: 700 }}>
                            Liên hệ
                        </Title>
                        <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                            {contactItems.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <span style={{ color: gold, marginTop: 2, flexShrink: 0 }}>{item.icon}</span>
                                    <Text style={{ color: textColor, fontSize: '0.875rem', lineHeight: 1.6 }}>
                                        {item.text}
                                    </Text>
                                </div>
                            ))}
                        </Space>
                    </Col>

                </Row>

                <Divider style={{ borderColor: dividerColor, margin: '36px 0 20px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <Text style={{ color: subColor, fontSize: '0.83rem' }}>
                        © {new Date().getFullYear()}{' '}
                        <span style={{ color: headingColor, fontWeight: 600 }}>UTB Sport</span>.
                        {' '}Tất cả quyền được bảo lưu.
                    </Text>
                    <Text style={{ color: subColor, fontSize: '0.78rem' }}>
                        Bản quyền © {new Date().getFullYear()} Bàn Văn Phúc
                    </Text>
                    <Text style={{ color: subColor, fontSize: '0.78rem' }}>
                        Được xây dựng với ❤️ tại Sơn La
                    </Text>
                </div>
            </div>
        </AntFooter>
    );
};

export default Footer;