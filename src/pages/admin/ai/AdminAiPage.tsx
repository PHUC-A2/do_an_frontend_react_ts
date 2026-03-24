import { useState, useEffect } from 'react';
import {
    Card, Input, Button, Tag, Divider, Typography, Space,
    Table, Form, Select, Switch, Popconfirm, Badge, Tooltip, Empty
} from 'antd';
import { toast } from 'react-toastify';
import { RiRobot2Line } from 'react-icons/ri';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, KeyOutlined } from '@ant-design/icons';
import { adminAiChat, adminGetAiKeys, adminAddAiKey, adminToggleAiKey, adminDeleteAiKey } from '../../../config/Api';
import type { IAiKey, AiProvider } from '../../../config/Api';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import { usePermission } from '../../../hooks/common/usePermission';

const { Title, Text } = Typography;

const PROVIDER_INFO: Record<AiProvider, { color: string; label: string; limit: string; url: string }> = {
    GROQ: { color: 'blue', label: 'Groq (Primary)', limit: '30 req/phút, 14,400/ngày', url: 'console.groq.com' },
    GEMINI: { color: 'green', label: 'Google Gemini', limit: '15 req/phút, 1,500/ngày', url: 'aistudio.google.com' },
    CLOUDFLARE: { color: 'orange', label: 'Cloudflare Workers AI', limit: '10,000 neurons/ngày', url: 'dash.cloudflare.com' },
};

const AdminAiPage = () => {
    const [keys, setKeys] = useState<IAiKey[]>([]);
    const [loadingKeys, setLoadingKeys] = useState(false);
    const [testMsg, setTestMsg] = useState('');
    const [testReply, setTestReply] = useState('');
    const [testing, setTesting] = useState(false);
    const [addForm] = Form.useForm();
    const [adding, setAdding] = useState(false);
    const canViewAiKeys = usePermission('AI_VIEW_LIST');
    const canCreateAiKey = usePermission('AI_CREATE');
    const canUpdateAiKey = usePermission('AI_UPDATE');
    const canDeleteAiKey = usePermission('AI_DELETE');
    const canChatAiAdmin = usePermission('AI_CHAT_ADMIN');
    const canAccessAiPage = usePermission(['AI_VIEW_LIST', 'AI_CREATE', 'AI_UPDATE', 'AI_DELETE', 'AI_CHAT_ADMIN']);

    const fetchKeys = async () => {
        if (!canViewAiKeys) return;
        setLoadingKeys(true);
        try {
            const res = await adminGetAiKeys();
            setKeys(res.data?.data ?? []);
        } catch {
            toast.error('Không thể tải danh sách key');
        } finally {
            setLoadingKeys(false);
        }
    };

    useEffect(() => { fetchKeys(); }, [canViewAiKeys]);

    const handleAdd = async (values: { provider: AiProvider; apiKey: string; label?: string }) => {
        if (!canCreateAiKey) {
            toast.error('Bạn không có quyền thêm AI key');
            return;
        }
        setAdding(true);
        try {
            await adminAddAiKey(values);
            toast.success('Đã thêm key thành công!');
            addForm.resetFields();
            fetchKeys();
        } catch {
            toast.error('Thêm key thất bại');
        } finally {
            setAdding(false);
        }
    };

    const handleToggle = async (id: number) => {
        if (!canUpdateAiKey) {
            toast.error('Bạn không có quyền cập nhật AI key');
            return;
        }
        try {
            const res = await adminToggleAiKey(id);
            const updated = res.data?.data;
            setKeys(prev => prev.map(k => k.id === id ? { ...k, active: updated?.active ?? k.active } : k));
        } catch {
            toast.error('Cập nhật thất bại');
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDeleteAiKey) {
            toast.error('Bạn không có quyền xóa AI key');
            return;
        }
        try {
            await adminDeleteAiKey(id);
            toast.success('Đã xóa key');
            setKeys(prev => prev.filter(k => k.id !== id));
        } catch {
            toast.error('Xóa thất bại');
        }
    };

    const handleTest = async () => {
        if (!canChatAiAdmin) {
            toast.error('Bạn không có quyền sử dụng AI chat admin');
            return;
        }
        if (!testMsg.trim()) return;
        setTesting(true);
        setTestReply('');
        try {
            const res = await adminAiChat({ message: testMsg, history: [] });
            const data = res.data?.data;
            setTestReply(`[${data?.provider}] ${data?.reply}`);
        } catch {
            setTestReply('Lỗi kết nối AI');
        } finally {
            setTesting(false);
        }
    };

    // Nhóm key theo provider
    const keysByProvider = (provider: AiProvider) => keys.filter(k => k.provider === provider);
    const activeCount = (provider: AiProvider) => keysByProvider(provider).filter(k => k.active).length;

    const columns = [
        {
            title: 'Provider',
            dataIndex: 'provider',
            key: 'provider',
            width: 140,
            render: (p: AiProvider) => (
                <Tag color={PROVIDER_INFO[p]?.color}>{PROVIDER_INFO[p]?.label}</Tag>
            ),
        },
        {
            title: 'Label',
            dataIndex: 'label',
            key: 'label',
            render: (v: string | null) => v || <Text type="secondary">—</Text>,
        },
        {
            title: 'Key',
            dataIndex: 'apiKeyMasked',
            key: 'apiKeyMasked',
            render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code>,
        },
        {
            title: 'Lượt dùng',
            dataIndex: 'usageCount',
            key: 'usageCount',
            width: 90,
            align: 'right' as const,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'active',
            key: 'active',
            width: 100,
            render: (active: boolean, record: IAiKey) => (
                <PermissionWrapper required="AI_UPDATE" fallback={<Text type="secondary">Không có quyền</Text>}>
                    <Tooltip title={active ? 'Đang hoạt động — nhấn để tắt' : 'Đang tắt — nhấn để bật'}>
                        <Switch
                            checked={active}
                            size="small"
                            onChange={() => handleToggle(record.id)}
                        />
                    </Tooltip>
                </PermissionWrapper>
            ),
        },
        {
            title: '',
            key: 'action',
            width: 50,
            render: (_: unknown, record: IAiKey) => (
                <PermissionWrapper required="AI_DELETE">
                    <Popconfirm
                        title="Xóa key này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </PermissionWrapper>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Space align="center" style={{ marginBottom: 24 }}>
                <RiRobot2Line size={28} color="#faad14" />
                <Title level={3} style={{ margin: 0 }}>Quản lý AI</Title>
            </Space>

            {!canAccessAiPage && <Empty description="Bạn không có quyền truy cập chức năng AI" />}

            <PermissionWrapper required="AI_VIEW_LIST">
                {/* Provider status */}
                <Card title="Trạng thái các AI Provider" style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        {(Object.keys(PROVIDER_INFO) as AiProvider[]).map(p => {
                            const active = activeCount(p);
                            const total = keysByProvider(p).length;
                            const info = PROVIDER_INFO[p];
                            return (
                                <div key={p} style={{ flex: '1 1 220px', minWidth: 200 }}>
                                    <Space>
                                        <Tag color={info.color}>{info.label}</Tag>
                                        <Badge
                                            count={active}
                                            showZero
                                            color={active > 0 ? '#52c41a' : '#ff4d4f'}
                                            title={`${active}/${total} key active`}
                                        />
                                    </Space>
                                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                                        {info.limit} · <a href={`https://${info.url}`} target="_blank" rel="noreferrer">{info.url}</a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Thứ tự fallback: <b>Groq → Gemini → Cloudflare</b>.
                        Key DB được ưu tiên hơn key trong file <code>.env</code>.
                        Khi key hết hạn, hệ thống tự chuyển key tiếp theo và gửi thông báo cho bạn.
                    </Text>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper required="AI_CREATE">
                {/* Thêm key mới */}
                <Card
                    title={<Space><KeyOutlined /><span>Thêm API Key mới</span></Space>}
                    style={{ marginBottom: 20 }}
                >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
                        <Form form={addForm} layout="inline" onFinish={handleAdd}
                            style={{ display: 'contents' }}>
                            <Form.Item name="provider" rules={[{ required: true, message: 'Chọn provider' }]}
                                style={{ marginBottom: 8, minWidth: 170 }}>
                                <Select placeholder="Provider" style={{ width: '100%' }}>
                                    {(Object.keys(PROVIDER_INFO) as AiProvider[]).map(p => (
                                        <Select.Option key={p} value={p}>
                                            <Tag color={PROVIDER_INFO[p].color} style={{ margin: 0 }}>{PROVIDER_INFO[p].label}</Tag>
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item name="apiKey" rules={[{ required: true, message: 'Nhập API key' }]}
                                style={{ marginBottom: 8, flex: '1 1 200px', minWidth: 200 }}>
                                <Input.Password placeholder="API Key / Token" />
                            </Form.Item>
                            <Form.Item name="label" style={{ marginBottom: 8, minWidth: 140 }}>
                                <Input placeholder="Nhãn (tuỳ chọn)" />
                            </Form.Item>
                            <Form.Item style={{ marginBottom: 8 }}>
                                <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={adding}>
                                    Thêm
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper required="AI_VIEW_LIST">
                {/* Danh sách key */}
                <Card
                    title="Danh sách API Keys"
                    extra={
                        <Button icon={<ReloadOutlined />} size="small" onClick={fetchKeys} loading={loadingKeys}>
                            Làm mới
                        </Button>
                    }
                    style={{ marginBottom: 20 }}
                >
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <Table
                            dataSource={keys}
                            columns={columns}
                            rowKey="id"
                            loading={loadingKeys}
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content' }}
                            locale={{ emptyText: 'Chưa có key nào. Thêm key ở trên để bắt đầu.' }}
                        />
                    </div>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper required="AI_CHAT_ADMIN">
                {/* Test chat */}
                <Card title="Test AI Chat">
                    <Space.Compact style={{ width: '100%' }}>
                        <Input
                            value={testMsg}
                            onChange={e => setTestMsg(e.target.value)}
                            placeholder="Nhập câu hỏi test..."
                            onPressEnter={handleTest}
                        />
                        <Button type="primary" onClick={handleTest} loading={testing}>Gửi</Button>
                    </Space.Compact>
                    {testReply && (
                        <div style={{
                            marginTop: 12,
                            padding: '10px 14px',
                            background: 'rgba(0,0,0,0.04)',
                            borderRadius: 8,
                            fontSize: 13,
                            whiteSpace: 'pre-wrap'
                        }}>
                            {testReply}
                        </div>
                    )}
                </Card>
            </PermissionWrapper>
        </div>
    );
};

export default AdminAiPage;
