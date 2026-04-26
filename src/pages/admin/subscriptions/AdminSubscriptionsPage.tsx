import { Card, Space, Table, Tag, Typography, Modal, Form, Select, Input, Tooltip, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TeamOutlined } from '@ant-design/icons';
import RBButton from 'react-bootstrap/Button';
import { IoRefreshOutline } from 'react-icons/io5';
import { MdOutlineAutorenew, MdOutlineMoveDown, MdOutlineMoveUp } from 'react-icons/md';
import { toast } from 'react-toastify';
import { useRole } from '../../../hooks/common/useRole';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import Forbidden from '../../error/Forbbiden';
import {
    downgradeAdminSubscription,
    getAdminPlans,
    getAdminSubscriptions,
    renewAdminSubscription,
    upgradeAdminSubscription,
    type IAdminPlanRow,
    type IAdminSubscriptionRow,
} from '../../../config/Api';
import { formatInstant } from '../../../utils/format/localdatetime';

const { Text, Title } = Typography;

const subStatusVn: Record<string, { text: string; color: string }> = {
    ACTIVE: { text: 'Đang hiệu lực', color: 'success' },
    EXPIRED: { text: 'Hết hạn', color: 'error' },
    PENDING: { text: 'Chờ kích hoạt', color: 'warning' },
};

const AdminSubscriptionsPage = () => {
    const isSystemAdmin = useRole('ADMIN');
    const [rows, setRows] = useState<IAdminSubscriptionRow[]>([]);
    const [plans, setPlans] = useState<IAdminPlanRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionRow, setActionRow] = useState<IAdminSubscriptionRow | null>(null);
    const [actionType, setActionType] = useState<'upgrade' | 'downgrade' | null>(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [renewingId, setRenewingId] = useState<number | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [subRes, planRes] = await Promise.all([getAdminSubscriptions(), getAdminPlans()]);
            if (subRes.data?.statusCode === 200 && Array.isArray(subRes.data.data)) {
                setRows(subRes.data.data);
            } else {
                setRows([]);
            }
            if (planRes.data?.statusCode === 200 && Array.isArray(planRes.data.data)) {
                setPlans(planRes.data.data.filter((p) => p.status === 'ACTIVE'));
            } else {
                setPlans([]);
            }
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không tải được dữ liệu';
            toast.error(m);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isSystemAdmin) void load();
    }, [isSystemAdmin, load]);

    const displayRows = useMemo(() => {
        const q = searchInput.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (r) =>
                String(r.id).includes(q) ||
                String(r.tenantId).includes(q) ||
                (r.tenantName && r.tenantName.toLowerCase().includes(q)) ||
                (r.planName && r.planName.toLowerCase().includes(q)) ||
                (subStatusVn[r.status]?.text && subStatusVn[r.status].text.toLowerCase().includes(q)),
        );
    }, [rows, searchInput]);

    const doRenew = async (r: IAdminSubscriptionRow) => {
        setRenewingId(r.id);
        try {
            const res = await renewAdminSubscription({ subscriptionId: r.id });
            if (res.data?.statusCode === 200 || res.data?.statusCode === 204) {
                toast.success('Đã gia hạn theo số ngày của gói');
                await load();
            } else {
                toast.error((res.data as { message?: string })?.message ?? 'Gia hạn thất bại');
            }
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gia hạn thất bại';
            toast.error(m);
        } finally {
            setRenewingId(null);
        }
    };

    const openPlanChange = (r: IAdminSubscriptionRow, t: 'upgrade' | 'downgrade') => {
        setActionRow(r);
        setActionType(t);
        form.setFieldsValue({ newPlanId: undefined });
    };

    const submitPlanChange = async () => {
        if (!actionRow || !actionType) return;
        const v = await form.validateFields();
        const newPlanId = v.newPlanId as number;
        if (newPlanId === actionRow.planId) {
            toast.error('Chọn gói khác với gói hiện tại');
            return;
        }
        setSubmitting(true);
        try {
            if (actionType === 'upgrade') {
                await upgradeAdminSubscription({ tenantId: actionRow.tenantId, newPlanId });
            } else {
                await downgradeAdminSubscription({ tenantId: actionRow.tenantId, newPlanId });
            }
            toast.success('Đã đổi gói; thuê bao mới tính từ thời điểm hiện tại');
            setActionRow(null);
            setActionType(null);
            form.resetFields();
            await load();
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Thao tác thất bại';
            toast.error(m);
        } finally {
            setSubmitting(false);
        }
    };

    const columns: ColumnsType<IAdminSubscriptionRow> = [
        {
            title: 'STT',
            key: 'stt',
            width: 55,
            render: (_: unknown, __: IAdminSubscriptionRow, i: number) => (page - 1) * pageSize + i + 1,
        },
        { title: 'Mã', dataIndex: 'id', key: 'id', width: 64 },
        {
            title: 'Cửa hàng',
            dataIndex: 'tenantName',
            key: 'tenantName',
            width: 220,
            ellipsis: true,
        },
        { title: 'Gói dịch vụ', dataIndex: 'planName', key: 'planName', width: 140, ellipsis: true },
        {
            title: 'Bắt đầu',
            dataIndex: 'startDate',
            key: 'start',
            width: 158,
            render: (d: string) => formatInstant(d, 'DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Kết thúc',
            dataIndex: 'endDate',
            key: 'end',
            width: 158,
            render: (d: string) => formatInstant(d, 'DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (s: string) => {
                const m = subStatusVn[s] ?? { text: s, color: 'default' };
                return <Tag color={m.color}>{m.text}</Tag>;
            },
        },
        {
            title: 'Hành động',
            key: 'a',
            width: 200,
            align: 'center' as const,
            fixed: 'right' as const,
            render: (_: unknown, r) => (
                <Space size={4} wrap>
                    <Tooltip title="Gia hạn thêm một chu kỳ theo gói hiện tại">
                        <RBButton
                            variant="outline-info"
                            size="sm"
                            disabled={renewingId === r.id}
                            onClick={() => void doRenew(r)}
                        >
                            {renewingId === r.id ? <Spin size="small" /> : <MdOutlineAutorenew size={18} />}
                        </RBButton>
                    </Tooltip>
                    <Tooltip title="Nâng cấp gói (áp từ hiện tại)">
                        <RBButton
                            variant="outline-success"
                            size="sm"
                            onClick={() => openPlanChange(r, 'upgrade')}
                        >
                            <MdOutlineMoveUp size={18} />
                        </RBButton>
                    </Tooltip>
                    <Tooltip title="Hạ gói (áp từ hiện tại)">
                        <RBButton
                            variant="outline-warning"
                            size="sm"
                            onClick={() => openPlanChange(r, 'downgrade')}
                        >
                            <MdOutlineMoveDown size={18} />
                        </RBButton>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    if (!isSystemAdmin) {
        return <Forbidden />;
    }

    return (
        <AdminWrapper>
            <Card
                style={{ borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
                styles={{ body: { padding: '0 24px 24px' } }}
                title={
                    <Space>
                        <TeamOutlined style={{ color: '#faad14' }} />
                        <Title level={4} style={{ margin: 0 }}>
                            Thuê bao dịch vụ
                        </Title>
                    </Space>
                }
                extra={
                    <Space wrap>
                        <Input.Search
                            allowClear
                            placeholder="Tìm cửa hàng, gói, mã, trạng thái…"
                            style={{ width: 280 }}
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                setPage(1);
                            }}
                        />
                        <RBButton
                            variant="outline-secondary"
                            size="sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => void load()}
                        >
                            <IoRefreshOutline size={16} />
                            Làm mới
                        </RBButton>
                    </Space>
                }
            >
                <Table<IAdminSubscriptionRow>
                    rowKey="id"
                    loading={loading}
                    dataSource={displayRows}
                    columns={columns}
                    size="small"
                    bordered
                    scroll={{ x: 'max-content' }}
                    onChange={(p) => {
                        setPage(p.current ?? 1);
                        setPageSize(p.pageSize ?? 10);
                    }}
                    pagination={{
                        current: page,
                        pageSize,
                        total: displayRows.length,
                        showSizeChanger: true,
                        showTotal: (t) => `Tổng ${t} bản ghi`,
                    }}
                />
            </Card>

            <Modal
                title={actionType === 'upgrade' ? 'Nâng cấp gói' : 'Hạ gói dịch vụ'}
                open={actionType != null && actionRow != null}
                onCancel={() => {
                    setActionType(null);
                    setActionRow(null);
                    form.resetFields();
                }}
                onOk={() => void submitPlanChange()}
                confirmLoading={submitting}
                okText="Xác nhận"
                cancelText="Hủy"
                width={480}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    Cửa hàng: <b>{actionRow?.tenantName}</b> (mã {actionRow?.tenantId})
                </Text>
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="newPlanId"
                        label="Chọn gói mới"
                        rules={[{ required: true, message: 'Chọn một gói' }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Gói đang mở (đang dùng)"
                            options={plans.map((p) => ({
                                value: p.id,
                                label: `${p.name} — ${p.durationDays} ngày/chu kỳ`,
                            }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminWrapper>
    );
};

export default AdminSubscriptionsPage;
