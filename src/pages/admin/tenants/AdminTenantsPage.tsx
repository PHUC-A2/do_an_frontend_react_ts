import {
    Card,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography,
    Popconfirm,
    Button,
    DatePicker,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { FaDownload } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { MdDelete } from 'react-icons/md';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { useRole } from '../../../hooks/common/useRole';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import Forbidden from '../../../pages/error/Forbbiden';
import {
    approveAdminTenant,
    assignAdminSubscription,
    createAdminTenant,
    deleteAdminTenant,
    getAdminTenant,
    getAdminTenants,
    getAdminPlans,
    rejectAdminTenant,
    updateAdminTenant,
    type IAdminPlanRow,
    type IAdminTenantRow,
} from '../../../config/Api';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import { ShopOutlined } from '@ant-design/icons';
import { IoRefreshOutline } from 'react-icons/io5';
import { type Dayjs } from 'dayjs';

const { Text, Title } = Typography;

const DEFAULT_TENANT_ID = 1;

const statusMeta: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'gold', label: 'Chờ duyệt' },
    APPROVED: { color: 'green', label: 'Đã duyệt' },
    REJECTED: { color: 'red', label: 'Từ chối' },
};

const statusOptions = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Từ chối' },
];

type ModalMode = 'create' | 'edit' | null;

const AdminTenantsPage = () => {
    const isSystemAdmin = useRole('ADMIN');
    const [rows, setRows] = useState<IAdminTenantRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<number | null>(null);
    const [formModal] = Form.useForm();
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [fetchingEditId, setFetchingEditId] = useState<number | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignTenant, setAssignTenant] = useState<IAdminTenantRow | null>(null);
    const [assignForm] = Form.useForm();
    const [planOptions, setPlanOptions] = useState<IAdminPlanRow[]>([]);
    const [assignLoading, setAssignLoading] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const filteredRows = useMemo(() => {
        if (!debouncedSearch) {
            return rows;
        }
        const q = debouncedSearch.toLowerCase();
        return rows.filter((r) =>
            [
                r.name,
                r.slug,
                r.status,
                r.ownerName,
                r.ownerEmail,
                r.contactPhone,
                r.contactEmail,
                r.description,
                r.ownerUserId != null ? String(r.ownerUserId) : '',
                String(r.id),
            ]
                .filter((x) => x != null && x !== '')
                .some((f) => String(f).toLowerCase().includes(q)),
        );
    }, [rows, debouncedSearch]);

    const exportColumns: ColumnsType<IAdminTenantRow> = useMemo(
        () => [
            { title: 'ID', dataIndex: 'id', key: 'ex-id', width: 60 },
            { title: 'Tên tenant', dataIndex: 'name', key: 'ex-name' },
            { title: 'Slug', dataIndex: 'slug', key: 'ex-slug' },
            { title: 'Trạng thái', dataIndex: 'status', key: 'ex-st' },
            { title: 'Tên chủ sân', dataIndex: 'ownerName', key: 'ex-on' },
            { title: 'Email chủ sân', dataIndex: 'ownerEmail', key: 'ex-oe' },
            { title: 'SĐT (tenant)', dataIndex: 'contactPhone', key: 'ex-cp' },
            { title: 'Email (tenant)', dataIndex: 'contactEmail', key: 'ex-ce' },
        ],
        [],
    );

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminTenants();
            const data = res.data?.data;
            setRows(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            const m =
                (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không tải được danh sách';
            toast.error(m);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const openAssignPlan = async (t: IAdminTenantRow) => {
        setAssignTenant(t);
        assignForm.resetFields();
        setAssignOpen(true);
        setAssignLoading(true);
        try {
            const res = await getAdminPlans();
            const list = res.data?.data;
            setPlanOptions(Array.isArray(list) ? list.filter((p) => p.status === 'ACTIVE') : []);
        } catch {
            setPlanOptions([]);
            toast.error('Không tải được danh sách gói');
        } finally {
            setAssignLoading(false);
        }
    };

    const submitAssignPlan = async () => {
        if (!assignTenant) return;
        const v = await assignForm.validateFields();
        setAssignLoading(true);
        try {
            const start: Dayjs | undefined = v.startDate;
            await assignAdminSubscription({
                tenantId: assignTenant.id,
                planId: v.planId,
                startDate: start ? start.toDate().toISOString() : undefined,
            });
            toast.success('Đã gán gói dịch vụ cho tenant');
            setAssignOpen(false);
            setAssignTenant(null);
            assignForm.resetFields();
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gán gói thất bại';
            toast.error(m);
        } finally {
            setAssignLoading(false);
        }
    };

    useEffect(() => {
        if (isSystemAdmin) {
            void load();
        }
    }, [isSystemAdmin, load]);

    const doApprove = async (id: number) => {
        setActingId(id);
        try {
            await approveAdminTenant(id);
            toast.success('Đã duyệt yêu cầu chủ sân');
            await load();
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Duyệt thất bại';
            toast.error(m);
        } finally {
            setActingId(null);
        }
    };

    const doReject = async (id: number) => {
        setActingId(id);
        try {
            await rejectAdminTenant(id);
            toast.success('Đã từ chối yêu cầu');
            await load();
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Từ chối thất bại';
            toast.error(m);
        } finally {
            setActingId(null);
        }
    };

    const doDelete = async (id: number) => {
        setActingId(id);
        try {
            await deleteAdminTenant(id);
            toast.success('Đã xóa tenant');
            await load();
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Xóa thất bại';
            toast.error(m);
        } finally {
            setActingId(null);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setModalMode('create');
        formModal.resetFields();
        formModal.setFieldsValue({ status: 'PENDING' });
    };

    const openEdit = async (id: number) => {
        formModal.resetFields();
        setFetchingEditId(id);
        setModalLoading(true);
        try {
            const res = await getAdminTenant(id);
            const t = res.data?.data;
            if (!t) {
                toast.error('Không tải được thông tin tenant');
                return;
            }
            setEditingId(id);
            setModalMode('edit');
            formModal.setFieldsValue({
                name: t.name,
                slug: t.slug,
                contactPhone: t.contactPhone ?? undefined,
                contactEmail: t.contactEmail ?? undefined,
                description: t.description ?? undefined,
                status: t.status,
            });
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Lỗi tải tenant';
            toast.error(m);
        } finally {
            setModalLoading(false);
            setFetchingEditId(null);
        }
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingId(null);
        formModal.resetFields();
    };

    const onSubmitModal = async () => {
        try {
            const v = await formModal.validateFields();
            setModalLoading(true);
            if (modalMode === 'create') {
                await createAdminTenant({
                    name: v.name?.trim() ?? '',
                    slug: (v.slug as string | undefined)?.trim() || undefined,
                    contactPhone: (v.contactPhone as string | undefined)?.trim() || undefined,
                    contactEmail: (v.contactEmail as string | undefined)?.trim() || undefined,
                    description: (v.description as string | undefined)?.trim() || undefined,
                    status: v.status as 'PENDING' | 'APPROVED' | 'REJECTED',
                    ownerUserId: Number(v.ownerUserId),
                });
                toast.success('Đã tạo tenant mới');
            } else if (modalMode === 'edit' && editingId != null) {
                await updateAdminTenant(editingId, {
                    name: v.name?.trim() ?? '',
                    slug: (v.slug as string)?.trim() ?? '',
                    contactPhone: (v.contactPhone as string | undefined)?.trim() || undefined,
                    contactEmail: (v.contactEmail as string | undefined)?.trim() || undefined,
                    description: (v.description as string | undefined)?.trim() || undefined,
                    status: v.status as 'PENDING' | 'APPROVED' | 'REJECTED',
                });
                toast.success('Đã cập nhật tenant');
            }
            closeModal();
            await load();
        } catch (e: unknown) {
            if ((e as { errorFields?: unknown })?.errorFields) {
                return;
            }
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Thao tác thất bại';
            toast.error(m);
        } finally {
            setModalLoading(false);
        }
    };

    const columns: ColumnsType<IAdminTenantRow> = [
        {
            title: 'STT',
            width: 55,
            key: 'stt',
            render: (_: unknown, __: IAdminTenantRow, i: number) => i + 1,
        },
        { title: 'Mã', dataIndex: 'id', key: 'id', width: 64 },
        {
            title: 'Tên sân / thương hiệu',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            width: 130,
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (s: string) => {
                const m = statusMeta[s];
                return m ? <Tag color={m.color}>{m.label}</Tag> : <Tag>{s}</Tag>;
            },
        },
        {
            title: 'Chủ sân (OWNER)',
            dataIndex: 'ownerName',
            key: 'owner',
            width: 200,
            render: (name: string | undefined, r) => (
                <div>
                    <Text style={{ fontSize: 13 }}>{name || r.ownerEmail || '—'}</Text>
                    {r.ownerUserId != null && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                Mã tài khoản: {r.ownerUserId}
                            </Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Liên hệ (tenant)',
            dataIndex: 'contactPhone',
            key: 'contact',
            width: 180,
            render: (_: unknown, r) => (
                <span style={{ fontSize: 13 }}>
                    {r.contactPhone && <div>{r.contactPhone}</div>}
                    {r.contactEmail && <div>{r.contactEmail}</div>}
                    {!r.contactPhone && !r.contactEmail ? <Text type="secondary">—</Text> : null}
                </span>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 280,
            align: 'center' as const,
            fixed: 'right',
            render: (_: unknown, r) => {
                const isDefault = r.id === DEFAULT_TENANT_ID;
                return (
                    <Space size={4} wrap>
                        <Tooltip title="Sửa">
                            <RBButton
                                variant="outline-warning"
                                size="sm"
                                disabled={fetchingEditId === r.id}
                                onClick={() => void openEdit(r.id)}
                            >
                                {fetchingEditId === r.id ? <Spin size="small" /> : <CiEdit />}
                            </RBButton>
                        </Tooltip>
                        {isDefault ? (
                            <Tooltip title="Mặc định">
                                <RBButton variant="outline-danger" size="sm" disabled>
                                    <MdDelete />
                                </RBButton>
                            </Tooltip>
                        ) : (
                            <Popconfirm
                                title={`Xóa “${r.name}”?`}
                                description="Chỉ khi chưa có sân. Không hoàn tác."
                                onConfirm={() => doDelete(r.id)}
                                okText="Xóa"
                                okButtonProps={{ danger: true, loading: actingId === r.id }}
                                cancelText="Hủy"
                            >
                                <span>
                                    <RBButton variant="outline-danger" size="sm" disabled={actingId === r.id}>
                                        <MdDelete />
                                    </RBButton>
                                </span>
                            </Popconfirm>
                        )}
                        {r.status === 'PENDING' && (
                            <>
                                <Popconfirm
                                    title="Duyệt hồ sơ?"
                                    description="Chuyển sang Đã duyệt."
                                    onConfirm={() => doApprove(r.id)}
                                    okText="Duyệt"
                                    okButtonProps={{ loading: actingId === r.id }}
                                    cancelText="Hủy"
                                >
                                    <span>
                                        <RBButton variant="outline-success" size="sm" disabled={actingId === r.id}>
                                            <IoCheckmarkCircleOutline size={16} />
                                        </RBButton>
                                    </span>
                                </Popconfirm>
                                <Popconfirm
                                    title="Từ chối?"
                                    onConfirm={() => doReject(r.id)}
                                    okText="Từ chối"
                                    okButtonProps={{ danger: true, loading: actingId === r.id }}
                                    cancelText="Hủy"
                                >
                                    <span>
                                        <RBButton variant="outline-danger" size="sm" disabled={actingId === r.id}>
                                            <IoCloseCircleOutline size={16} />
                                        </RBButton>
                                    </span>
                                </Popconfirm>
                            </>
                        )}
                        {r.status === 'APPROVED' && !isDefault && (
                            <Tooltip title="Gán gói dịch vụ cho cửa hàng này">
                                <RBButton
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => void openAssignPlan(r)}
                                >
                                    Gán gói
                                </RBButton>
                            </Tooltip>
                        )}
                    </Space>
                );
            },
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
                        <ShopOutlined style={{ color: '#faad14' }} />
                        <Title level={4} style={{ margin: 0 }}>
                            Quản lý cửa hàng (chủ sân)
                        </Title>
                    </Space>
                }
                extra={
                    <Space wrap>
                        <Input.Search
                            allowClear
                            placeholder="Tìm tên, mã, slug, trạng thái, email…"
                            style={{ width: 280 }}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
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
                        <Button
                            icon={<FaDownload />}
                            size="small"
                            onClick={() => exportTableToExcel(exportColumns, filteredRows, 'tenants')}
                        >
                            Xuất Excel
                        </Button>
                    </Space>
                }
            >
                <Table<IAdminTenantRow>
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={filteredRows}
                    size="small"
                    bordered
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        showSizeChanger: true,
                        showTotal: (t) => `Tổng ${t} bản ghi`,
                        defaultPageSize: 10,
                    }}
                />
            </Card>

            <Modal
                title={modalMode === 'create' ? 'Thêm tenant' : 'Sửa tenant'}
                open={modalMode != null}
                onCancel={closeModal}
                onOk={() => void onSubmitModal()}
                okText="Lưu"
                cancelText="Đóng"
                confirmLoading={modalLoading}
                width={640}
                destroyOnClose
            >
                <Form form={formModal} layout="vertical" style={{ marginTop: 8 }}>
                    {modalMode === 'edit' && editingId != null && (
                        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                            Mã {editingId}: OWNER giữ nguyên; cập nhật hiển thị & trạng thái.
                        </Text>
                    )}
                    <Form.Item
                        name="name"
                        label="Tên sân / thương hiệu"
                        rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                    >
                        <Input maxLength={255} showCount placeholder="Nhập tên hiển thị" />
                    </Form.Item>
                    <Form.Item
                        name="slug"
                        label="Slug (đường dẫn, duy nhất)"
                        rules={[
                            ...(modalMode === 'edit' ? ([{ required: true, message: 'Vui lòng nhập slug' }] as const) : []),
                            { pattern: /^[a-z0-9-]*$/, message: 'Chỉ chữ thường, số, dấu gạch (không dấu cách)' },
                        ]}
                        extra={modalMode === 'create' ? 'Trống: tạo tự từ tên' : 'Duy nhất toàn hệ thống'}
                    >
                        <Input maxLength={120} placeholder={modalMode === 'create' ? 'Có thể bỏ trống' : undefined} />
                    </Form.Item>
                    {modalMode === 'create' && (
                        <Form.Item
                            name="ownerUserId"
                            label="Mã tài khoản chủ sân (user id)"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mã người dùng' },
                                { type: 'number', min: 1, message: 'Mã phải là số dương' },
                            ]}
                        >
                            <InputNumber style={{ width: '100%' }} min={1} step={1} placeholder="Ví dụ: 2" />
                        </Form.Item>
                    )}
                    <Form.Item name="contactPhone" label="Số điện thoại (liên hệ tenant)">
                        <Input maxLength={64} placeholder="Tùy chọn" />
                    </Form.Item>
                    <Form.Item name="contactEmail" label="Email (liên hệ tenant)">
                        <Input type="email" maxLength={255} placeholder="Tùy chọn" />
                    </Form.Item>
                    <Form.Item name="description" label="Ghi chú / mô tả">
                        <Input.TextArea rows={3} maxLength={2000} showCount placeholder="Tùy chọn" />
                    </Form.Item>
                    <Form.Item
                        name="status"
                        label="Trạng thái"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                    >
                        <Select options={statusOptions} placeholder="Chọn trạng thái" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Gán gói dịch vụ"
                open={assignOpen}
                onCancel={() => {
                    setAssignOpen(false);
                    setAssignTenant(null);
                    assignForm.resetFields();
                }}
                onOk={() => void submitAssignPlan()}
                confirmLoading={assignLoading}
                okText="Gán"
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    Tenant: {assignTenant?.name} (id {assignTenant?.id})
                </Text>
                <Form form={assignForm} layout="vertical">
                    <Form.Item name="planId" label="Gói" rules={[{ required: true, message: 'Chọn gói' }]}>
                        <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Chọn gói"
                            options={planOptions.map((p) => ({
                                value: p.id,
                                label: `${p.name} — ${p.durationDays} ngày`,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item name="startDate" label="Bắt đầu (tùy chọn, mặc định: ngay bây giờ)">
                        <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminWrapper>
    );
};

export default AdminTenantsPage;
