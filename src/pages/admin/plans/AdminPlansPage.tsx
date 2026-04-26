import {
    Card,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    Popconfirm,
    Descriptions,
    Tooltip,
    Button,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { IoRefreshOutline } from 'react-icons/io5';
import { FaArrowsToEye } from 'react-icons/fa6';
import { CiEdit } from 'react-icons/ci';
import { MdDelete, MdSecurity } from 'react-icons/md';
import { toast } from 'react-toastify';
import { useRole } from '../../../hooks/common/useRole';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import Forbidden from '../../error/Forbbiden';
import {
    createAdminPlan,
    deleteAdminPlan,
    getAdminPlans,
    updateAdminPlan,
    type IAdminPlanRow,
} from '../../../config/Api';
import PlanPermissionDrawer from './PlanPermissionDrawer';

const { Text, Title } = Typography;
const { TextArea } = Input;

const planStatusLabel: Record<IAdminPlanRow['status'], { text: string; color: string }> = {
    ACTIVE: { text: 'Đang dùng', color: 'success' },
    DISABLED: { text: 'Đang tắt', color: 'default' },
};

type ModalMode = 'create' | 'edit' | null;

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n));

const AdminPlansPage = () => {
    const isSystemAdmin = useRole('ADMIN');
    const [rows, setRows] = useState<IAdminPlanRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [modal, setModal] = useState<ModalMode>(null);
    const [editing, setEditing] = useState<IAdminPlanRow | null>(null);
    const [saving, setSaving] = useState(false);
    const [drawer, setDrawer] = useState<{ id: number; name: string } | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [detail, setDetail] = useState<IAdminPlanRow | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminPlans();
            if (res.data?.statusCode === 200 && Array.isArray(res.data.data)) {
                setRows(res.data.data);
            } else {
                setRows([]);
            }
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không tải được danh sách gói dịch vụ';
            toast.error(m);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isSystemAdmin) void load();
    }, [isSystemAdmin, load]);

    const filtered = useMemo(() => {
        const q = searchInput.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (r) =>
                String(r.id).includes(q) ||
                (r.name && r.name.toLowerCase().includes(q)) ||
                (r.description && r.description.toLowerCase().includes(q)) ||
                planStatusLabel[r.status].text.toLowerCase().includes(q),
        );
    }, [rows, searchInput]);

    const openCreate = () => {
        setEditing(null);
        setModal('create');
        form.setFieldsValue({
            name: '',
            description: '',
            price: 0,
            durationDays: 30,
            status: 'ACTIVE',
        });
    };

    const openEdit = (r: IAdminPlanRow) => {
        setEditing(r);
        setModal('edit');
        form.setFieldsValue({
            name: r.name,
            description: r.description ?? '',
            price: r.price,
            durationDays: r.durationDays,
            status: r.status,
        });
    };

    const closeModal = () => {
        setModal(null);
        setEditing(null);
        form.resetFields();
    };

    const onSubmit = async () => {
        const v = await form.validateFields();
        setSaving(true);
        try {
            if (modal === 'create') {
                const res = await createAdminPlan({
                    name: v.name,
                    description: (v.description as string) || undefined,
                    price: Number(v.price),
                    durationDays: Number(v.durationDays),
                    status: v.status,
                });
                if (res.data?.statusCode === 200 || res.data?.statusCode === 201) {
                    toast.success('Đã tạo gói dịch vụ');
                    closeModal();
                    await load();
                } else {
                    toast.error((res.data as { message?: string })?.message ?? 'Thao tác thất bại');
                }
            } else if (modal === 'edit' && editing) {
                const res = await updateAdminPlan(editing.id, {
                    name: v.name,
                    description: (v.description as string) || undefined,
                    price: Number(v.price),
                    durationDays: Number(v.durationDays),
                    status: v.status,
                });
                if (res.data?.statusCode === 200) {
                    toast.success('Đã cập nhật gói dịch vụ');
                    closeModal();
                    await load();
                } else {
                    toast.error((res.data as { message?: string })?.message ?? 'Cập nhật thất bại');
                }
            }
        } catch (e: unknown) {
            if ((e as { errorFields?: unknown })?.errorFields) {
                return;
            }
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Có lỗi xảy ra';
            toast.error(m);
        } finally {
            setSaving(false);
        }
    };

    const doDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await deleteAdminPlan(id);
            toast.success('Đã xóa gói dịch vụ');
            if (detail?.id === id) setDetail(null);
            await load();
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể xóa gói';
            toast.error(m);
        } finally {
            setDeletingId(null);
        }
    };

    const columns: ColumnsType<IAdminPlanRow> = [
        {
            title: 'STT',
            key: 'stt',
            width: 55,
            render: (_: unknown, __: IAdminPlanRow, i: number) => (page - 1) * pageSize + i + 1,
        },
        { title: 'Mã', dataIndex: 'id', key: 'id', width: 64 },
        {
            title: 'Tên gói',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            width: 150,
            render: (n: number) => <Text strong style={{ fontSize: 13 }}>{formatVnd(n)}</Text>,
        },
        {
            title: 'Thời hạn (ngày)',
            dataIndex: 'durationDays',
            key: 'durationDays',
            width: 120,
            render: (d: number) => `${d} ngày`,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (s: IAdminPlanRow['status']) => {
                const m = planStatusLabel[s];
                return <Tag color={m.color === 'success' ? 'success' : 'default'}>{m.text}</Tag>;
            },
        },
        {
            title: 'Hành động',
            key: 'a',
            width: 200,
            align: 'center' as const,
            fixed: 'right' as const,
            render: (_: unknown, r) => (
                <Space size={4}>
                    <Tooltip title="Xem chi tiết">
                        <RBButton variant="outline-info" size="sm" onClick={() => setDetail(r)}>
                            <FaArrowsToEye />
                        </RBButton>
                    </Tooltip>
                    <Tooltip title="Phân quyền theo gói">
                        <RBButton
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setDrawer({ id: r.id, name: r.name })}
                        >
                            <MdSecurity />
                        </RBButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <RBButton variant="outline-warning" size="sm" onClick={() => openEdit(r)}>
                            <CiEdit />
                        </RBButton>
                    </Tooltip>
                    <Popconfirm
                        title="Xóa gói dịch vụ?"
                        description="Chỉ khi gói chưa từng gắn thuê bao."
                        onConfirm={() => void doDelete(r.id)}
                        okText="Xóa"
                        okButtonProps={{ danger: true, loading: deletingId === r.id }}
                        cancelText="Hủy"
                    >
                        <Tooltip title="Xóa">
                            <span>
                                <RBButton variant="outline-danger" size="sm" disabled={deletingId === r.id}>
                                    <MdDelete />
                                </RBButton>
                            </span>
                        </Tooltip>
                    </Popconfirm>
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
                        <SafetyCertificateOutlined style={{ color: '#faad14' }} />
                        <Title level={4} style={{ margin: 0 }}>
                            Quản lý gói dịch vụ
                        </Title>
                    </Space>
                }
                extra={
                    <Space wrap>
                        <Input.Search
                            allowClear
                            placeholder="Tìm tên, mã, mô tả, trạng thái…"
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
                        <RBButton
                            variant="outline-primary"
                            size="sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={openCreate}
                        >
                            <IoIosAddCircle /> Thêm mới
                        </RBButton>
                    </Space>
                }
            >
                <Table<IAdminPlanRow>
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={filtered}
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
                        total: filtered.length,
                        showSizeChanger: true,
                        showTotal: (t) => `Tổng ${t} bản ghi`,
                    }}
                />
            </Card>

            <Modal
                title={modal === 'create' ? 'Tạo gói dịch vụ mới' : 'Cập nhật gói dịch vụ'}
                open={modal != null}
                onCancel={closeModal}
                onOk={() => void onSubmit()}
                confirmLoading={saving}
                okText="Lưu"
                cancelText="Đóng"
                destroyOnClose
                width={560}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item
                        name="name"
                        label="Tên gói"
                        rules={[{ required: true, message: 'Nhập tên gói' }]}
                        extra="Ví dụ: Cơ bản, Chuyên nghiệp, Cao cấp…"
                    >
                        <Input placeholder="Nhập tên hiển thị" maxLength={64} showCount />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={2} maxLength={2000} showCount placeholder="Ghi chú gói (không bắt buộc)" />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label="Giá (₫)"
                        rules={[{ required: true, message: 'Nhập giá' }]}
                    >
                        <InputNumber min={0} style={{ width: '100%' }} step={1000} />
                    </Form.Item>
                    <Form.Item
                        name="durationDays"
                        label="Thời hạn áp dụng (số ngày)"
                        rules={[{ required: true, message: 'Nhập số ngày' }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="Mỗi lần gia hạn / gán gói" />
                    </Form.Item>
                    <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Chọn trạng thái' }]}>
                        <Select
                            options={[
                                { value: 'ACTIVE', label: 'Đang dùng' },
                                { value: 'DISABLED', label: 'Đang tắt' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Chi tiết gói dịch vụ"
                open={detail != null}
                onCancel={() => setDetail(null)}
                footer={[
                    <Button key="c" onClick={() => setDetail(null)}>
                        Đóng
                    </Button>,
                    <Button
                        key="e"
                        type="primary"
                        onClick={() => {
                            if (detail) {
                                setDetail(null);
                                openEdit(detail);
                            }
                        }}
                    >
                        Sửa gói
                    </Button>,
                ]}
                width={520}
            >
                {detail && (
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Mã gói">{detail.id}</Descriptions.Item>
                        <Descriptions.Item label="Tên gói">{detail.name}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả">{detail.description?.trim() ? detail.description : '—'}</Descriptions.Item>
                        <Descriptions.Item label="Giá">{formatVnd(detail.price)}</Descriptions.Item>
                        <Descriptions.Item label="Thời hạn mỗi chu kỳ">{detail.durationDays} ngày</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={planStatusLabel[detail.status].color === 'success' ? 'success' : 'default'}>
                                {planStatusLabel[detail.status].text}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            <PlanPermissionDrawer
                open={drawer != null}
                onClose={() => setDrawer(null)}
                planId={drawer?.id ?? null}
                planName={drawer?.name ?? ''}
                onSaved={() => void load()}
            />
        </AdminWrapper>
    );
};

export default AdminPlansPage;
