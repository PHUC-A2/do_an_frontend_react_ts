import { useState } from 'react';
import {
    Card, Row, Col, Typography, Tag, Divider, Space,
    Button, Form, Input, Tooltip, Badge,
} from 'antd';
import { toast } from 'react-toastify';
import {
    PhoneOutlined, MailOutlined, GlobalOutlined,
    ToolOutlined, WarningOutlined, CheckCircleOutlined,
    EditOutlined, SaveOutlined, CloseOutlined, PlusOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { MdOutlineSupportAgent, MdBugReport, MdOutlineHandyman } from 'react-icons/md';
import { FaServer, FaDatabase, FaNetworkWired } from 'react-icons/fa';
import RoleWrapper from '../../../components/wrapper/AdminWrapper';
import AdminReviewManager from './AdminReviewManager';

const { Title, Text, Paragraph } = Typography;

interface ContactEntry {
    id: number;
    name: string;
    role: string;
    phone: string;
    email: string;
    note: string;
}

interface IssueStep {
    id: number;
    title: string;
    steps: string[];
    severity: 'low' | 'medium' | 'high';
}

const defaultContacts: ContactEntry[] = [
    {
        id: 1,
        name: 'Bàn Văn Phúc',
        role: 'Fullstack Developer · DevOps · DBA · Owner',
        phone: '— (cập nhật)',
        email: '— (cập nhật)',
        note: 'Người phát triển & vận hành toàn bộ hệ thống',
    },
];

const defaultIssues: IssueStep[] = [
    {
        id: 1,
        title: 'Server không phản hồi / 502 Bad Gateway',
        severity: 'high',
        steps: [
            'Kiểm tra trạng thái server tại cổng quản trị hosting',
            'Restart service backend (Spring Boot): sudo systemctl restart tbusport-backend',
            'Kiểm tra log: journalctl -u tbusport-backend -n 100',
            'Nếu vẫn lỗi: liên hệ DevOps (Lê Văn C)',
        ],
    },
    {
        id: 2,
        title: 'Lỗi kết nối Database',
        severity: 'high',
        steps: [
            'Kiểm tra MySQL/PostgreSQL đang chạy: sudo systemctl status mysql',
            'Kiểm tra thông tin kết nối trong application.properties',
            'Xem log kết nối: tail -f /var/log/mysql/error.log',
            'Liên hệ Quản trị CSDL (Trần Thị B)',
        ],
    },
    {
        id: 3,
        title: 'Thanh toán / Payment Gateway lỗi',
        severity: 'medium',
        steps: [
            'Kiểm tra webhook payment tại dashboard cổng thanh toán',
            'Xác nhận API key còn hiệu lực và chưa hết hạn',
            'Kiểm tra log giao dịch trong trang Quản lý Thanh toán',
            'Liên hệ nhà cung cấp cổng thanh toán nếu vấn đề từ phía họ',
        ],
    },
    {
        id: 4,
        title: 'Thông báo Push / Firebase không gửi được',
        severity: 'low',
        steps: [
            'Kiểm tra Firebase project còn hoạt động tại console.firebase.google.com',
            'Xác nhận file google-services.json / service account key còn hiệu lực',
            'Kiểm tra quota FCM trong Google Cloud Console',
            'Restart service để reload Firebase config',
        ],
    },
    {
        id: 5,
        title: 'Frontend không load / Màn hình trắng',
        severity: 'medium',
        steps: [
            'Kiểm tra Nginx / web server đang chạy: sudo systemctl status nginx',
            'Xem log Nginx: tail -f /var/log/nginx/error.log',
            'Build lại frontend nếu vừa deploy: npm run build',
            'Kiểm tra CORS config nếu API gọi bị blocked',
        ],
    },
];

const severityConfig = {
    high: { color: 'red', label: 'Nghiêm trọng', icon: <WarningOutlined /> },
    medium: { color: 'orange', label: 'Trung bình', icon: <ToolOutlined /> },
    low: { color: 'blue', label: 'Thấp', icon: <CheckCircleOutlined /> },
};

const categoryIcons = [
    { icon: <FaServer size={20} />, label: 'Server', color: '#1677ff' },
    { icon: <FaDatabase size={20} />, label: 'Database', color: '#52c41a' },
    { icon: <FaNetworkWired size={20} />, label: 'Network', color: '#faad14' },
    { icon: <MdBugReport size={20} />, label: 'Bug / Lỗi', color: '#ff4d4f' },
    { icon: <MdOutlineHandyman size={20} />, label: 'Bảo trì', color: '#722ed1' },
    { icon: <MdOutlineSupportAgent size={20} />, label: 'Hỗ trợ', color: '#13c2c2' },
];

const AdminSupportPage = () => {
    const [contacts, setContacts] = useState<ContactEntry[]>(defaultContacts);
    const [issues] = useState<IssueStep[]>(defaultIssues);
    const [editingContactId, setEditingContactId] = useState<number | null>(null);
    const [contactForm] = Form.useForm();
    const [addingContact, setAddingContact] = useState(false);
    const [newContactForm] = Form.useForm();

    const handleEditContact = (c: ContactEntry) => {
        setEditingContactId(c.id);
        contactForm.setFieldsValue(c);
    };

    const handleSaveContact = () => {
        const values = contactForm.getFieldsValue();
        setContacts(prev => prev.map(c => c.id === editingContactId ? { ...c, ...values } : c));
        setEditingContactId(null);
        toast.success('Đã lưu thông tin liên hệ');
    };

    const handleDeleteContact = (id: number) => {
        setContacts(prev => prev.filter(c => c.id !== id));
        toast.success('Đã xóa');
    };

    const handleAddContact = () => {
        newContactForm.validateFields().then(values => {
            const newId = Math.max(0, ...contacts.map(c => c.id)) + 1;
            setContacts(prev => [...prev, { id: newId, ...values }]);
            newContactForm.resetFields();
            setAddingContact(false);
            toast.success('Đã thêm liên hệ mới');
        });
    };

    return (
        <RoleWrapper>
            <div style={{ padding: '0 4px' }}>
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MdOutlineSupportAgent size={28} color="#faad14" />
                    <Title level={3} style={{ margin: 0 }}>Hỗ trợ & Bảo trì Hệ thống</Title>
                </div>

                {/* STATUS QUICK VIEW */}
                <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
                    {categoryIcons.map((cat, i) => (
                        <Col xs={12} sm={8} md={4} key={i}>
                            <Card size="small" variant="borderless" styles={{ body: { padding: '12px 14px' } }}>
                                <Space>
                                    <span style={{ color: cat.color }}>{cat.icon}</span>
                                    <Text style={{ fontSize: 12, fontWeight: 600 }}>{cat.label}</Text>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Row gutter={[16, 16]}>
                    {/* CONTACTS */}
                    <Col xs={24} lg={10}>
                        <Card
                            title={
                                <Space>
                                    <PhoneOutlined style={{ color: '#faad14' }} />
                                    <span>Liên hệ Hỗ trợ Kỹ thuật</span>
                                </Space>
                            }
                            size="small"
                            variant="borderless"
                            extra={
                                <Button
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() => setAddingContact(true)}
                                    type="dashed"
                                >
                                    Thêm
                                </Button>
                            }
                        >
                            {addingContact && (
                                <Form form={newContactForm} layout="vertical" size="small" style={{ marginBottom: 12, padding: '10px 12px', border: '1px dashed rgba(250,173,20,0.4)', borderRadius: 8 }}>
                                    <Row gutter={8}>
                                        <Col span={12}>
                                            <Form.Item name="name" label="Họ tên" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                                <Input placeholder="Nguyễn Văn A" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="role" label="Vai trò" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                                <Input placeholder="Kỹ thuật viên" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="phone" label="Điện thoại" style={{ marginBottom: 8 }}>
                                                <Input placeholder="09xx xxx xxx" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="email" label="Email" style={{ marginBottom: 8 }}>
                                                <Input placeholder="email@domain.vn" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item name="note" label="Ghi chú" style={{ marginBottom: 8 }}>
                                                <Input placeholder="Giờ hành chính, 24/7..." />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Space>
                                        <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleAddContact}>Lưu</Button>
                                        <Button size="small" icon={<CloseOutlined />} onClick={() => { setAddingContact(false); newContactForm.resetFields(); }}>Hủy</Button>
                                    </Space>
                                </Form>
                            )}

                            {contacts.map((c, idx) => (
                                <div key={c.id}>
                                    {idx > 0 && <Divider style={{ margin: '10px 0' }} />}
                                    {editingContactId === c.id ? (
                                        <Form form={contactForm} layout="vertical" size="small">
                                            <Row gutter={8}>
                                                <Col span={12}>
                                                    <Form.Item name="name" label="Họ tên" style={{ marginBottom: 8 }}>
                                                        <Input />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item name="role" label="Vai trò" style={{ marginBottom: 8 }}>
                                                        <Input />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item name="phone" label="Điện thoại" style={{ marginBottom: 8 }}>
                                                        <Input />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item name="email" label="Email" style={{ marginBottom: 8 }}>
                                                        <Input />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item name="note" label="Ghi chú" style={{ marginBottom: 8 }}>
                                                        <Input />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Space>
                                                <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSaveContact}>Lưu</Button>
                                                <Button size="small" icon={<CloseOutlined />} onClick={() => setEditingContactId(null)}>Hủy</Button>
                                            </Space>
                                        </Form>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    <Text strong style={{ fontSize: 13 }}>{c.name}</Text>
                                                    <Tag color="gold" style={{ fontSize: 10, margin: 0 }}>{c.role}</Tag>
                                                </div>
                                                <Space orientation="vertical" size={2}>
                                                    {c.phone && (
                                                        <Text style={{ fontSize: 12 }}>
                                                            <PhoneOutlined style={{ marginRight: 5, color: '#52c41a' }} />
                                                            <Text copyable style={{ fontSize: 12 }}>{c.phone}</Text>
                                                        </Text>
                                                    )}
                                                    {c.email && (
                                                        <Text style={{ fontSize: 12 }}>
                                                            <MailOutlined style={{ marginRight: 5, color: '#1677ff' }} />
                                                            <Text copyable style={{ fontSize: 12 }}>{c.email}</Text>
                                                        </Text>
                                                    )}
                                                    {c.note && (
                                                        <Badge color="orange" text={<Text type="secondary" style={{ fontSize: 11 }}>{c.note}</Text>} />
                                                    )}
                                                </Space>
                                            </div>
                                            <Space size={4}>
                                                <Tooltip title="Chỉnh sửa">
                                                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEditContact(c)} />
                                                </Tooltip>
                                                <Tooltip title="Xóa">
                                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteContact(c.id)} />
                                                </Tooltip>
                                            </Space>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </Card>

                        {/* USEFUL LINKS */}
                        <Card
                            title={
                                <Space>
                                    <GlobalOutlined style={{ color: '#1677ff' }} />
                                    <span>Tài nguyên & Công cụ</span>
                                </Space>
                            }
                            size="small"
                            variant="borderless"
                            style={{ marginTop: 16 }}
                        >
                            <Space orientation="vertical" style={{ width: '100%' }} size={6}>
                                {[
                                    { label: 'Firebase Console', url: 'https://console.firebase.google.com', color: '#ff7a00' },
                                    { label: 'Google Cloud Console', url: 'https://console.cloud.google.com', color: '#1677ff' },
                                    { label: 'Groq API Dashboard', url: 'https://console.groq.com', color: '#722ed1' },
                                    { label: 'Google AI Studio (Gemini)', url: 'https://aistudio.google.com', color: '#52c41a' },
                                    { label: 'Cloudflare Dashboard', url: 'https://dash.cloudflare.com', color: '#fa8c16' },
                                ].map((link, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: link.color, flexShrink: 0 }} />
                                        <a href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>{link.label}</a>
                                    </div>
                                ))}
                            </Space>
                        </Card>
                    </Col>

                    {/* TROUBLESHOOTING */}
                    <Col xs={24} lg={14}>
                        <Card
                            title={
                                <Space>
                                    <MdBugReport size={16} color="#ff4d4f" />
                                    <span>Hướng dẫn Khắc phục Sự cố</span>
                                </Space>
                            }
                            size="small"
                            variant="borderless"
                        >
                            <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                                {issues.map((issue) => {
                                    const sev = severityConfig[issue.severity];
                                    return (
                                        <Card
                                            key={issue.id}
                                            size="small"
                                            styles={{
                                                body: { padding: '10px 14px' },
                                                header: { padding: '8px 14px', minHeight: 'unset' },
                                            }}
                                            title={
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <Tag color={sev.color} icon={sev.icon} style={{ margin: 0, fontSize: 10 }}>
                                                        {sev.label}
                                                    </Tag>
                                                    <Text strong style={{ fontSize: 13 }}>{issue.title}</Text>
                                                </div>
                                            }
                                        >
                                            <ol style={{ margin: 0, paddingLeft: 18 }}>
                                                {issue.steps.map((step, si) => (
                                                    <li key={si} style={{ marginBottom: 4 }}>
                                                        <Paragraph
                                                            copyable={{ text: step }}
                                                            style={{ margin: 0, fontSize: 13 }}
                                                        >
                                                            {step}
                                                        </Paragraph>
                                                    </li>
                                                ))}
                                            </ol>
                                        </Card>
                                    );
                                })}
                            </Space>
                        </Card>

                        {/* MAINTENANCE NOTES */}
                        <Card
                            title={
                                <Space>
                                    <MdOutlineHandyman size={16} color="#722ed1" />
                                    <span>Ghi chú Bảo trì Định kỳ</span>
                                </Space>
                            }
                            size="small"
                            variant="borderless"
                            style={{ marginTop: 16 }}
                        >
                            <Row gutter={[10, 10]}>
                                {[
                                    { label: 'Backup CSDL', freq: 'Hàng ngày — 02:00 AM', color: '#52c41a' },
                                    { label: 'Xóa log cũ', freq: 'Hàng tuần — Chủ nhật', color: '#1677ff' },
                                    { label: 'Cập nhật SSL', freq: 'Mỗi 90 ngày', color: '#faad14' },
                                    { label: 'Kiểm tra dependency', freq: 'Hàng tháng', color: '#722ed1' },
                                    { label: 'Rotate API Keys AI', freq: 'Khi hết quota', color: '#ff7a00' },
                                    { label: 'Review quyền hạn', freq: 'Hàng quý', color: '#13c2c2' },
                                ].map((item, i) => (
                                    <Col xs={24} sm={12} key={i}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '8px 12px', borderRadius: 8,
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            background: 'rgba(255,255,255,0.02)',
                                        }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                            <div>
                                                <Text strong style={{ fontSize: 12, display: 'block' }}>{item.label}</Text>
                                                <Text type="secondary" style={{ fontSize: 11 }}>{item.freq}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    </Col>
                </Row>

                <AdminReviewManager />
            </div>
        </RoleWrapper>
    );
};

export default AdminSupportPage;
