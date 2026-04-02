import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
    Card, Row, Col, Typography, Tag, Divider, Space,
    Button, Form, Input, Tooltip, Badge, Spin, Select,
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
import { useAppSelector } from '../../../redux/hooks';
import { hasPermission } from '../../../utils/permission';
import type { SupportIssueSeverity } from '../../../types/supportPage';
import type { ISupportContact, ISupportIssueGuide, ISupportMaintenanceItem, ISupportResourceLink } from '../../../types/supportPage';
import {
    adminCreateSupportContact,
    adminCreateSupportIssueGuide,
    adminCreateSupportMaintenanceItem,
    adminCreateSupportResourceLink,
    adminDeleteSupportContact,
    adminDeleteSupportIssueGuide,
    adminDeleteSupportMaintenanceItem,
    adminDeleteSupportResourceLink,
    adminGetSupportContacts,
    adminGetSupportIssueGuides,
    adminGetSupportMaintenanceItems,
    adminGetSupportResourceLinks,
    adminUpdateSupportContact,
    adminUpdateSupportIssueGuide,
    adminUpdateSupportMaintenanceItem,
    adminUpdateSupportResourceLink,
} from '../../../config/Api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const severityOptions: { value: SupportIssueSeverity; label: string }[] = [
    { value: 'HIGH', label: 'Nghiêm trọng' },
    { value: 'MEDIUM', label: 'Trung bình' },
    { value: 'LOW', label: 'Thấp' },
];

const severityConfig: Record<
    SupportIssueSeverity,
    { color: string; label: string; icon: ReactNode }
> = {
    HIGH: { color: 'red', label: 'Nghiêm trọng', icon: <WarningOutlined /> },
    MEDIUM: { color: 'orange', label: 'Trung bình', icon: <ToolOutlined /> },
    LOW: { color: 'blue', label: 'Thấp', icon: <CheckCircleOutlined /> },
};

const categoryIcons = [
    { icon: <FaServer size={20} />, label: 'Server', color: '#1677ff' },
    { icon: <FaDatabase size={20} />, label: 'Database', color: '#52c41a' },
    { icon: <FaNetworkWired size={20} />, label: 'Network', color: '#faad14' },
    { icon: <MdBugReport size={20} />, label: 'Bug / Lỗi', color: '#ff4d4f' },
    { icon: <MdOutlineHandyman size={20} />, label: 'Bảo trì', color: '#722ed1' },
    { icon: <MdOutlineSupportAgent size={20} />, label: 'Hỗ trợ', color: '#13c2c2' },
];

const stepsToText = (steps: string[]) => steps.join('\n');
const textToSteps = (text: string) =>
    text
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

const AdminSupportPage = () => {
    const account = useAppSelector(s => s.account.account);
    const canManageSupport = hasPermission(account, 'SUPPORT_MANAGE');

    const [loading, setLoading] = useState(true);
    const [contacts, setContacts] = useState<ISupportContact[]>([]);
    const [issues, setIssues] = useState<ISupportIssueGuide[]>([]);
    const [resourceLinks, setResourceLinks] = useState<ISupportResourceLink[]>([]);
    const [maintenanceItems, setMaintenanceItems] = useState<ISupportMaintenanceItem[]>([]);

    const [editingContactId, setEditingContactId] = useState<number | null>(null);
    const [contactForm] = Form.useForm();
    const [addingContact, setAddingContact] = useState(false);
    const [newContactForm] = Form.useForm();

    const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
    const [issueForm] = Form.useForm();
    const [addingIssue, setAddingIssue] = useState(false);
    const [newIssueForm] = Form.useForm();

    const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
    const [linkForm] = Form.useForm();
    const [addingLink, setAddingLink] = useState(false);
    const [newLinkForm] = Form.useForm();

    const [editingMaintId, setEditingMaintId] = useState<number | null>(null);
    const [maintForm] = Form.useForm();
    const [addingMaint, setAddingMaint] = useState(false);
    const [newMaintForm] = Form.useForm();

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [cRes, iRes, lRes, mRes] = await Promise.all([
                adminGetSupportContacts(),
                adminGetSupportIssueGuides(),
                adminGetSupportResourceLinks(),
                adminGetSupportMaintenanceItems(),
            ]);
            if (cRes.data.statusCode === 200) setContacts(cRes.data.data ?? []);
            if (iRes.data.statusCode === 200) setIssues(iRes.data.data ?? []);
            if (lRes.data.statusCode === 200) setResourceLinks(lRes.data.data ?? []);
            if (mRes.data.statusCode === 200) setMaintenanceItems(mRes.data.data ?? []);
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(msg ?? 'Không tải được dữ liệu trang hỗ trợ');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    const handleEditContact = (c: ISupportContact) => {
        setEditingContactId(c.id);
        contactForm.setFieldsValue({
            name: c.name,
            role: c.role,
            phone: c.phone ?? '',
            email: c.email ?? '',
            note: c.note ?? '',
        });
    };

    const handleSaveContact = async () => {
        if (editingContactId == null) return;
        const values = contactForm.getFieldsValue();
        try {
            const res = await adminUpdateSupportContact(editingContactId, {
                name: values.name,
                role: values.role,
                phone: values.phone,
                email: values.email,
                note: values.note,
            });
            if (res.data.statusCode === 200) {
                setEditingContactId(null);
                toast.success('Đã lưu thông tin liên hệ');
                await loadAll();
            }
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(msg ?? 'Lưu thất bại');
        }
    };

    const handleDeleteContact = async (id: number) => {
        try {
            const res = await adminDeleteSupportContact(id);
            if (res.data.statusCode === 200) {
                toast.success('Đã xóa');
                await loadAll();
            }
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(msg ?? 'Xóa thất bại');
        }
    };

    const handleAddContact = () => {
        newContactForm.validateFields().then(async values => {
            try {
                const res = await adminCreateSupportContact({
                    name: values.name,
                    role: values.role,
                    phone: values.phone,
                    email: values.email,
                    note: values.note,
                });
                if (res.data.statusCode === 200 || res.data.statusCode === 201) {
                    newContactForm.resetFields();
                    setAddingContact(false);
                    toast.success('Đã thêm liên hệ mới');
                    await loadAll();
                }
            } catch (e: unknown) {
                const msg =
                    e && typeof e === 'object' && 'response' in e
                        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                        : undefined;
                toast.error(msg ?? 'Thêm thất bại');
            }
        });
    };

    const handleEditIssue = (g: ISupportIssueGuide) => {
        setEditingIssueId(g.id);
        issueForm.setFieldsValue({
            title: g.title,
            severity: g.severity,
            stepsText: stepsToText(g.steps),
        });
    };

    const handleSaveIssue = async () => {
        if (editingIssueId == null) return;
        const values = issueForm.getFieldsValue();
        const steps = textToSteps(values.stepsText ?? '');
        if (steps.length === 0) {
            toast.warning('Cần ít nhất một bước xử lý (mỗi dòng một bước)');
            return;
        }
        try {
            const res = await adminUpdateSupportIssueGuide(editingIssueId, {
                title: values.title,
                severity: values.severity,
                steps,
            });
            if (res.data.statusCode === 200) {
                setEditingIssueId(null);
                toast.success('Đã lưu hướng dẫn');
                await loadAll();
            }
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(msg ?? 'Lưu thất bại');
        }
    };

    const handleDeleteIssue = async (id: number) => {
        try {
            const res = await adminDeleteSupportIssueGuide(id);
            if (res.data.statusCode === 200) {
                toast.success('Đã xóa');
                await loadAll();
            }
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(msg ?? 'Xóa thất bại');
        }
    };

    const handleAddIssue = () => {
        newIssueForm.validateFields().then(async values => {
            const steps = textToSteps(values.stepsText ?? '');
            if (steps.length === 0) {
                toast.warning('Cần ít nhất một bước xử lý (mỗi dòng một bước)');
                return;
            }
            try {
                const res = await adminCreateSupportIssueGuide({
                    title: values.title,
                    severity: values.severity,
                    steps,
                });
                if (res.data.statusCode === 200 || res.data.statusCode === 201) {
                    newIssueForm.resetFields();
                    setAddingIssue(false);
                    toast.success('Đã thêm hướng dẫn');
                    await loadAll();
                }
            } catch (e: unknown) {
                const msg =
                    e && typeof e === 'object' && 'response' in e
                        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                        : undefined;
                toast.error(msg ?? 'Thêm thất bại');
            }
        });
    };

    const handleEditLink = (l: ISupportResourceLink) => {
        setEditingLinkId(l.id);
        linkForm.setFieldsValue({
            label: l.label,
            url: l.url,
            color: l.color ?? '',
        });
    };

    const handleSaveLink = async () => {
        if (editingLinkId == null) return;
        const values = linkForm.getFieldsValue();
        try {
            const res = await adminUpdateSupportResourceLink(editingLinkId, {
                label: values.label,
                url: values.url,
                color: values.color || undefined,
            });
            if (res.data.statusCode === 200) {
                setEditingLinkId(null);
                toast.success('Đã lưu liên kết');
                await loadAll();
            }
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(msg ?? 'Lưu thất bại');
        }
    };

    const handleDeleteLink = async (id: number) => {
        try {
            const res = await adminDeleteSupportResourceLink(id);
            if (res.data.statusCode === 200) {
                toast.success('Đã xóa');
                await loadAll();
            }
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(msg ?? 'Xóa thất bại');
        }
    };

    const handleAddLink = () => {
        newLinkForm.validateFields().then(async values => {
            try {
                const res = await adminCreateSupportResourceLink({
                    label: values.label,
                    url: values.url,
                    color: values.color || undefined,
                });
                if (res.data.statusCode === 200 || res.data.statusCode === 201) {
                    newLinkForm.resetFields();
                    setAddingLink(false);
                    toast.success('Đã thêm liên kết');
                    await loadAll();
                }
            } catch (e: unknown) {
                const msg =
                    e && typeof e === 'object' && 'response' in e
                        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                        : undefined;
                toast.error(msg ?? 'Thêm thất bại');
            }
        });
    };

    const handleEditMaint = (m: ISupportMaintenanceItem) => {
        setEditingMaintId(m.id);
        maintForm.setFieldsValue({
            label: m.label,
            frequencyText: m.frequencyText,
            color: m.color ?? '',
        });
    };

    const handleSaveMaint = async () => {
        if (editingMaintId == null) return;
        const values = maintForm.getFieldsValue();
        try {
            const res = await adminUpdateSupportMaintenanceItem(editingMaintId, {
                label: values.label,
                frequencyText: values.frequencyText,
                color: values.color || undefined,
            });
            if (res.data.statusCode === 200) {
                setEditingMaintId(null);
                toast.success('Đã lưu ghi chú bảo trì');
                await loadAll();
            }
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(msg ?? 'Lưu thất bại');
        }
    };

    const handleDeleteMaint = async (id: number) => {
        try {
            const res = await adminDeleteSupportMaintenanceItem(id);
            if (res.data.statusCode === 200) {
                toast.success('Đã xóa');
                await loadAll();
            }
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(msg ?? 'Xóa thất bại');
        }
    };

    const handleAddMaint = () => {
        newMaintForm.validateFields().then(async values => {
            try {
                const res = await adminCreateSupportMaintenanceItem({
                    label: values.label,
                    frequencyText: values.frequencyText,
                    color: values.color || undefined,
                });
                if (res.data.statusCode === 200 || res.data.statusCode === 201) {
                    newMaintForm.resetFields();
                    setAddingMaint(false);
                    toast.success('Đã thêm ghi chú');
                    await loadAll();
                }
            } catch (e: unknown) {
                const msg =
                    e && typeof e === 'object' && 'response' in e
                        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                        : undefined;
                toast.error(msg ?? 'Thêm thất bại');
            }
        });
    };

    return (
        <RoleWrapper>
            <div style={{ padding: '0 4px' }}>
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MdOutlineSupportAgent size={28} color="#faad14" />
                    <Title level={3} style={{ margin: 0 }}>Hỗ trợ & Bảo trì Hệ thống</Title>
                </div>

                <Spin spinning={loading}>
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
                                    canManageSupport ? (
                                        <Button
                                            size="small"
                                            icon={<PlusOutlined />}
                                            onClick={() => setAddingContact(true)}
                                            type="dashed"
                                        >
                                            Thêm
                                        </Button>
                                    ) : null
                                }
                            >
                                {addingContact && canManageSupport && (
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

                                {!loading && contacts.length === 0 && (
                                    <Text type="secondary" style={{ fontSize: 13 }}>Chưa có liên hệ. {canManageSupport ? 'Nhấn Thêm để tạo mới.' : ''}</Text>
                                )}

                                {contacts.map((c, idx) => (
                                    <div key={c.id}>
                                        {idx > 0 && <Divider style={{ margin: '10px 0' }} />}
                                        {editingContactId === c.id && canManageSupport ? (
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
                                                    <Button size="small" type="primary" icon={<SaveOutlined />} onClick={() => void handleSaveContact()}>Lưu</Button>
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
                                                        {c.phone ? (
                                                            <Text style={{ fontSize: 12 }}>
                                                                <PhoneOutlined style={{ marginRight: 5, color: '#52c41a' }} />
                                                                <Text copyable style={{ fontSize: 12 }}>{c.phone}</Text>
                                                            </Text>
                                                        ) : null}
                                                        {c.email ? (
                                                            <Text style={{ fontSize: 12 }}>
                                                                <MailOutlined style={{ marginRight: 5, color: '#1677ff' }} />
                                                                <Text copyable style={{ fontSize: 12 }}>{c.email}</Text>
                                                            </Text>
                                                        ) : null}
                                                        {c.note ? (
                                                            <Badge color="orange" text={<Text type="secondary" style={{ fontSize: 11 }}>{c.note}</Text>} />
                                                        ) : null}
                                                    </Space>
                                                </div>
                                                {canManageSupport ? (
                                                    <Space size={4}>
                                                        <Tooltip title="Chỉnh sửa">
                                                            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEditContact(c)} />
                                                        </Tooltip>
                                                        <Tooltip title="Xóa">
                                                            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => void handleDeleteContact(c.id)} />
                                                        </Tooltip>
                                                    </Space>
                                                ) : null}
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
                                extra={
                                    canManageSupport ? (
                                        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => setAddingLink(true)}>Thêm</Button>
                                    ) : null
                                }
                            >
                                {addingLink && canManageSupport && (
                                    <Form form={newLinkForm} layout="vertical" size="small" style={{ marginBottom: 12, padding: '10px 12px', border: '1px dashed rgba(22,119,255,0.35)', borderRadius: 8 }}>
                                        <Form.Item name="label" label="Nhãn" rules={[{ required: true }]}><Input /></Form.Item>
                                        <Form.Item name="url" label="URL" rules={[{ required: true }]}><Input placeholder="https://..." /></Form.Item>
                                        <Form.Item name="color" label="Màu (hex)"><Input placeholder="#1677ff" /></Form.Item>
                                        <Space>
                                            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleAddLink}>Lưu</Button>
                                            <Button size="small" icon={<CloseOutlined />} onClick={() => { setAddingLink(false); newLinkForm.resetFields(); }}>Hủy</Button>
                                        </Space>
                                    </Form>
                                )}
                                {!loading && resourceLinks.length === 0 && (
                                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Chưa có liên kết.</Text>
                                )}
                                <Space orientation="vertical" style={{ width: '100%' }} size={6}>
                                    {resourceLinks.map(link => (
                                        <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                                            {editingLinkId === link.id && canManageSupport ? (
                                                <div style={{ flex: 1 }}>
                                                    <Form form={linkForm} layout="vertical" size="small">
                                                        <Form.Item name="label" label="Nhãn"><Input /></Form.Item>
                                                        <Form.Item name="url" label="URL"><Input /></Form.Item>
                                                        <Form.Item name="color" label="Màu"><Input /></Form.Item>
                                                        <Space>
                                                            <Button size="small" type="primary" onClick={() => void handleSaveLink()}>Lưu</Button>
                                                            <Button size="small" onClick={() => setEditingLinkId(null)}>Hủy</Button>
                                                        </Space>
                                                    </Form>
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: link.color || '#1677ff', flexShrink: 0 }} />
                                                        <a href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>{link.label}</a>
                                                    </div>
                                                    {canManageSupport ? (
                                                        <Space size={0}>
                                                            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditLink(link)} />
                                                            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => void handleDeleteLink(link.id)} />
                                                        </Space>
                                                    ) : null}
                                                </>
                                            )}
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
                                extra={
                                    canManageSupport ? (
                                        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => {
                                            newIssueForm.setFieldsValue({ severity: 'MEDIUM', stepsText: '' });
                                            setAddingIssue(true);
                                        }}>Thêm</Button>
                                    ) : null
                                }
                            >
                                {addingIssue && canManageSupport && (
                                    <Card size="small" style={{ marginBottom: 12 }} styles={{ body: { padding: 12 } }}>
                                        <Form form={newIssueForm} layout="vertical" size="small">
                                            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
                                            <Form.Item name="severity" label="Mức độ" rules={[{ required: true }]}>
                                                <Select options={severityOptions} />
                                            </Form.Item>
                                            <Form.Item
                                                name="stepsText"
                                                label="Các bước (mỗi dòng một bước)"
                                                rules={[{ required: true, message: 'Nhập ít nhất một dòng' }]}
                                            >
                                                <TextArea rows={5} placeholder="Dòng 1&#10;Dòng 2" />
                                            </Form.Item>
                                            <Space>
                                                <Button type="primary" size="small" icon={<SaveOutlined />} onClick={handleAddIssue}>Lưu</Button>
                                                <Button size="small" icon={<CloseOutlined />} onClick={() => { setAddingIssue(false); newIssueForm.resetFields(); }}>Hủy</Button>
                                            </Space>
                                        </Form>
                                    </Card>
                                )}
                                {!loading && issues.length === 0 && (
                                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Chưa có hướng dẫn sự cố.</Text>
                                )}
                                <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                                    {issues.map(issue => {
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
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                            <Tag color={sev.color} icon={sev.icon} style={{ margin: 0, fontSize: 10 }}>
                                                                {sev.label}
                                                            </Tag>
                                                            <Text strong style={{ fontSize: 13 }}>{issue.title}</Text>
                                                        </div>
                                                        {canManageSupport && editingIssueId !== issue.id ? (
                                                            <Space size={0}>
                                                                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditIssue(issue)} />
                                                                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => void handleDeleteIssue(issue.id)} />
                                                            </Space>
                                                        ) : null}
                                                    </div>
                                                }
                                            >
                                                {editingIssueId === issue.id && canManageSupport ? (
                                                    <Form form={issueForm} layout="vertical" size="small">
                                                        <Form.Item name="title" label="Tiêu đề"><Input /></Form.Item>
                                                        <Form.Item name="severity" label="Mức độ"><Select options={severityOptions} /></Form.Item>
                                                        <Form.Item name="stepsText" label="Các bước (mỗi dòng một bước)"><TextArea rows={5} /></Form.Item>
                                                        <Space>
                                                            <Button type="primary" size="small" onClick={() => void handleSaveIssue()}>Lưu</Button>
                                                            <Button size="small" onClick={() => setEditingIssueId(null)}>Hủy</Button>
                                                        </Space>
                                                    </Form>
                                                ) : (
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
                                                )}
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
                                extra={
                                    canManageSupport ? (
                                        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => setAddingMaint(true)}>Thêm</Button>
                                    ) : null
                                }
                            >
                                {addingMaint && canManageSupport && (
                                    <Form form={newMaintForm} layout="vertical" size="small" style={{ marginBottom: 12, padding: '10px 12px', border: '1px dashed rgba(114,46,209,0.35)', borderRadius: 8 }}>
                                        <Form.Item name="label" label="Công việc" rules={[{ required: true }]}><Input /></Form.Item>
                                        <Form.Item name="frequencyText" label="Tần suất / mô tả" rules={[{ required: true }]}><Input placeholder="Hàng tuần — Chủ nhật" /></Form.Item>
                                        <Form.Item name="color" label="Màu (hex)"><Input placeholder="#52c41a" /></Form.Item>
                                        <Space>
                                            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleAddMaint}>Lưu</Button>
                                            <Button size="small" icon={<CloseOutlined />} onClick={() => { setAddingMaint(false); newMaintForm.resetFields(); }}>Hủy</Button>
                                        </Space>
                                    </Form>
                                )}
                                {!loading && maintenanceItems.length === 0 && (
                                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Chưa có ghi chú bảo trì.</Text>
                                )}
                                <Row gutter={[10, 10]}>
                                    {maintenanceItems.map(item => (
                                        <Col xs={24} sm={12} key={item.id}>
                                            {editingMaintId === item.id && canManageSupport ? (
                                                <Form form={maintForm} layout="vertical" size="small" style={{ padding: 10, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
                                                    <Form.Item name="label" label="Công việc"><Input /></Form.Item>
                                                    <Form.Item name="frequencyText" label="Tần suất"><Input /></Form.Item>
                                                    <Form.Item name="color" label="Màu"><Input /></Form.Item>
                                                    <Space>
                                                        <Button size="small" type="primary" onClick={() => void handleSaveMaint()}>Lưu</Button>
                                                        <Button size="small" onClick={() => setEditingMaintId(null)}>Hủy</Button>
                                                    </Space>
                                                </Form>
                                            ) : (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    padding: '8px 12px',
                                                    borderRadius: 8,
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color || '#722ed1', flexShrink: 0 }} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <Text strong style={{ fontSize: 12, display: 'block' }}>{item.label}</Text>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>{item.frequencyText}</Text>
                                                    </div>
                                                    {canManageSupport ? (
                                                        <Space size={0}>
                                                            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditMaint(item)} />
                                                            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => void handleDeleteMaint(item.id)} />
                                                        </Space>
                                                    ) : null}
                                                </div>
                                            )}
                                        </Col>
                                    ))}
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </Spin>
            </div>
        </RoleWrapper>
    );
};

export default AdminSupportPage;
