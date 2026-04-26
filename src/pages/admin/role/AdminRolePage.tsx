import {
    Badge, Button, Card, Drawer, Empty, Form, Input,
    Modal, Popconfirm, Space, Spin, Table, Tag, Tooltip, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableProps } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
    fetchRoles, selectRoleLoading, selectRoleMeta, selectRoles,
} from '../../../redux/features/roleSlice';
import type { IRole } from '../../../types/role';
import type { IPermission } from '../../../types/permission';
import { splitPermission } from '../../../utils/constants/permission.utils';
import { PERMISSION_ACTION_COLOR } from '../../../utils/constants/permission-ui.constants';
import {
    createRole,
    deleteRole,
    getRoleById,
    updateRole,
} from '../../../config/Api';
import AdminModalAssignPermission from './modals/AdminModalAssignPermisison';
import { toast } from 'react-toastify';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import {
    buildSpringListQuery,
    type SpringSortItem,
} from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';
import { tableSorterToSortItems } from '../../../utils/pagination/tableSorterToSpringSort';
import { SafetyOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons';
import { IoIosAddCircle } from 'react-icons/io';
import { FaDownload } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { MdDelete, MdSecurity } from 'react-icons/md';
import RBButton from 'react-bootstrap/Button';

const { Title, Text } = Typography;

/** Subset of IPermission returned when embedded inside a role response */
type RolePermission = Pick<IPermission, 'id' | 'name'> & { description?: string | null };

// ─── ROLE tab ─────────────────────────────────────────────────────────────────
const RolesTab = () => {
    const dispatch = useAppDispatch();
    const roles = useAppSelector(selectRoles);
    const loading = useAppSelector(selectRoleLoading);
    const meta = useAppSelector(selectRoleMeta);

    // CRUD modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<IRole | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    // Assign permission drawer
    const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
    const [assignDrawerRole, setAssignDrawerRole] = useState<IRole | null>(null);

    // Delete
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // View detail drawer
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [viewRole, setViewRole] = useState<IRole | null>(null);
    const [viewPerms, setViewPerms] = useState<RolePermission[]>([]);
    const [loadingView, setLoadingView] = useState(false);

    const openView = async (r: IRole) => {
        setViewRole(r);
        setViewDrawerOpen(true);
        setLoadingView(true);
        try {
            const res = await getRoleById(r.id);
            setViewPerms((res.data.data?.permissions ?? []) as RolePermission[]);
        } catch {
            toast.error('Không tải được chi tiết vai trò');
        } finally {
            setLoadingView(false);
        }
    };

    // permCountMap: roleId → số permissions
    const [permCountMap, setPermCountMap] = useState<Record<number, number>>({});

    const canView = usePermission('ROLE_VIEW_LIST');

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const filterStr = useMemo(
        () => orFieldsInsensitiveLike(['name', 'description'], debouncedSearch),
        [debouncedSearch]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(fetchRoles(buildSpringListQuery({ page, pageSize, filter: filterStr, sort })));
        },
        [dispatch, filterStr]
    );

    useEffect(() => {
        if (!canView) return;
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canView, debouncedSearch, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<IRole>['onChange'] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const refreshRoleList = useCallback(() => {
        dispatch(
            fetchRoles(
                buildSpringListQuery({
                    page: meta.page,
                    pageSize: meta.pageSize,
                    filter: filterStr,
                    sort: sortItems,
                })
            )
        );
    }, [dispatch, meta.page, meta.pageSize, filterStr, sortItems]);

    // Sau khi roles load, fetch permissions count cho từng role
    useEffect(() => {
        if (!roles.length) return;
        const fetchCounts = async () => {
            const entries = await Promise.all(
                roles.map(async (r) => {
                    try {
                        const res = await getRoleById(r.id);
                        return [r.id, res.data.data?.permissions?.length ?? 0] as [number, number];
                    } catch {
                        return [r.id, 0] as [number, number];
                    }
                })
            );
            setPermCountMap(Object.fromEntries(entries));
        };
        void fetchCounts();
    }, [roles]);

    // ── CRUD ──
    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (r: IRole) => {
        setEditing(r);
        setModalOpen(true);
    };

    useEffect(() => {
        if (!modalOpen) return;
        if (editing) {
            form.setFieldsValue({ name: editing.name, description: editing.description ?? '' });
        } else {
            form.resetFields();
        }
    }, [modalOpen, editing, form]);

    const handleSave = async () => {
        try {
            const vals = await form.validateFields();
            setSubmitting(true);
            if (editing) {
                await updateRole(editing.id, vals);
                toast.success('Cập nhật vai trò thành công');
            } else {
                await createRole(vals);
                toast.success('Tạo vai trò thành công');
            }
            setModalOpen(false);
            refreshRoleList();
        } catch (err: any) {
            if (err?.errorFields) return; // form validation
            toast.error(err?.response?.data?.message ?? 'Thao tác thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            await deleteRole(id);
            toast.success('Đã xóa vai trò');
            refreshRoleList();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Xóa thất bại');
        } finally {
            setDeletingId(null);
        }
    };

    // ── Assign permission drawer ──
    const openAssign = (r: IRole) => {
        setAssignDrawerRole(r);
        setAssignDrawerOpen(true);
    };

    const columns: ColumnsType<IRole> = [
        {
            title: 'STT', width: 55,
            render: (_: any, __: IRole, i: number) => (meta.page - 1) * meta.pageSize + i + 1,
        },
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60, sorter: true },
        {
            title: 'Phạm vi',
            key: 'scope',
            width: 120,
            render: (_: unknown, r: IRole) =>
                r.tenantId == null || r.tenantId === undefined ? (
                    <Tag color="gold">Hệ thống</Tag>
                ) : (
                    <Tag color="geekblue">Shop #{r.tenantId}</Tag>
                ),
        },
        {
            title: 'Vai trò', dataIndex: 'name', key: 'name',
            sorter: true,
            render: (name: string, r: IRole) => {
                const globalAdmin = name === 'ADMIN' && (r.tenantId == null || r.tenantId === undefined);
                return (
                    <Tag color={globalAdmin ? 'warning' : 'blue'} style={{ fontWeight: 600 }}>
                        {name}
                    </Tag>
                );
            },
        },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', sorter: true, render: (t) => t || <Text type="secondary">—</Text> },
        {
            title: 'Số quyền', width: 90, align: 'center' as const,
            render: (_: any, r: IRole) => {
                const count = permCountMap[r.id] ?? 0;
                return (
                    <Badge
                        count={count}
                        showZero
                        color={count > 0 ? '#52c41a' : '#d9d9d9'}
                    />
                );
            },
        },
        {
            title: 'Hành động', width: 190, align: 'center' as const,
            render: (_: any, r: IRole) => (
                <Space size={4}>
                    <PermissionWrapper required="ROLE_VIEW_DETAIL">
                        <Tooltip title="Xem chi tiết">
                            <RBButton variant="outline-info" size="sm" onClick={() => openView(r)}>
                                <EyeOutlined />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>
                    <PermissionWrapper required="ROLE_ASSIGN_PERMISSION">
                        <Tooltip title="Gắn quyền">
                            <RBButton variant="outline-secondary" size="sm" onClick={() => openAssign(r)}>
                                <MdSecurity />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>
                    <PermissionWrapper required="ROLE_UPDATE">
                        <Tooltip title="Chỉnh sửa">
                            <RBButton variant="outline-warning" size="sm" onClick={() => openEdit(r)}>
                                <CiEdit />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>
                    <PermissionWrapper required="ROLE_DELETE">
                        <Popconfirm
                            title={`Xóa vai trò "${r.name}"?`}
                            description="Hành động này không thể hoàn tác."
                            onConfirm={() => handleDelete(r.id)}
                            okText="Xóa" cancelText="Hủy"
                            okButtonProps={{ danger: true, loading: deletingId === r.id }}
                        >
                            <RBButton variant="outline-danger" size="sm" disabled={deletingId === r.id}>
                                <MdDelete />
                            </RBButton>
                        </Popconfirm>
                    </PermissionWrapper>
                </Space>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text strong style={{ fontSize: 15 }}>
                    <TeamOutlined style={{ marginRight: 6 }} />
                    Danh sách vai trò
                </Text>
                <Space wrap>
                    <Input.Search
                        allowClear
                        placeholder="Tìm tên / mô tả"
                        style={{ width: 200 }}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <PermissionWrapper required="ROLE_CREATE">
                        <RBButton
                            variant="outline-primary" size="sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={openCreate}
                        >
                            <IoIosAddCircle /> Thêm mới
                        </RBButton>
                    </PermissionWrapper>
                    <Button
                        icon={<FaDownload />} size="small"
                        onClick={() => exportTableToExcel(columns, roles, 'roles')}
                    >
                        Xuất Excel
                    </Button>
                </Space>
            </div>

            <PermissionWrapper
                required="ROLE_VIEW_LIST"
                fallback={<Empty description="Bạn không có quyền xem danh sách vai trò" />}
            >
                <Table<IRole>
                    columns={columns} dataSource={roles} rowKey="id"
                    loading={loading} size="small" bordered
                    scroll={{ x: 'max-content' }}
                    onChange={handleTableChange}
                    pagination={{
                        current: meta.page,
                        pageSize: meta.pageSize,
                        total: meta.total,
                        showSizeChanger: true,
                        showTotal: (t) => `Tổng ${t} bản ghi`,
                    }}
                />
            </PermissionWrapper>

            {/* View detail drawer */}
            <Drawer
                open={viewDrawerOpen}
                onClose={() => setViewDrawerOpen(false)}
                title={
                    <Space>
                        <EyeOutlined />
                        <span>Chi tiết vai trò: <Tag color={viewRole?.name === 'ADMIN' && (viewRole.tenantId == null || viewRole.tenantId === undefined) ? 'warning' : 'blue'}>{viewRole?.name}</Tag></span>
                    </Space>
                }
                styles={{ body: { padding: '16px 20px' }, wrapper: { width: 480 } }}
            >
                <Spin spinning={loadingView}>
                    {viewRole?.description && (
                        <div style={{ marginBottom: 12 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>{viewRole.description}</Text>
                        </div>
                    )}
                    <Text strong style={{ fontSize: 13 }}>Danh sách quyền ({viewPerms.length})</Text>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {viewPerms.length === 0 && !loadingView && (
                            <Empty description="Chưa có quyền nào" />
                        )}
                        {viewPerms.map((p) => {
                            const { resource, action } = splitPermission(p.name);
                            const actionColor = action === 'ALL' ? 'volcano' : PERMISSION_ACTION_COLOR[action as keyof typeof PERMISSION_ACTION_COLOR];
                            return (
                                <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px', borderRadius: 8,
                                    background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)',
                                }}>
                                    <Space size={6}>
                                        <Tag color="geekblue" style={{ margin: 0, minWidth: 80 }}>{resource}</Tag>
                                        <Tag color={actionColor} style={{ margin: 0, minWidth: 56 }}>{action}</Tag>
                                        {p.description && <Text type="secondary" style={{ fontSize: 11 }}>{p.description}</Text>}
                                    </Space>
                                </div>
                            );
                        })}
                    </div>
                </Spin>
            </Drawer>

            {/* Create / Edit modal */}
            <Modal
                open={modalOpen}
                title={
                    <Space>
                        <TeamOutlined />
                        {editing ? `Sửa vai trò: ${editing.name}` : 'Tạo vai trò mới'}
                    </Space>
                }
                onOk={handleSave}
                onCancel={() => setModalOpen(false)}
                confirmLoading={submitting}
                okText={editing ? 'Lưu thay đổi' : 'Tạo mới'}
                cancelText="Hủy"
                destroyOnHidden
            >
                <Form form={form} layout="vertical" autoComplete="off">
                    <Form.Item
                        name="name" label="Tên vai trò"
                        rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
                    >
                        <Input placeholder="VD: ADMIN, STAFF, USER" />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={2} placeholder="Mô tả vai trò (tuỳ chọn)" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Assign permissions drawer */}
            <AdminModalAssignPermission
                openModalAssignPermisison={assignDrawerOpen}
                setOpenModalAssignPermisison={setAssignDrawerOpen}
                roleAssignPermission={assignDrawerRole}
            />
        </>
    );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
const AdminRolePage = () => (
    <AdminWrapper>
        <Card
            style={{ borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
            styles={{ body: { padding: '0 24px 24px' } }}
            title={
                <Space>
                    <SafetyOutlined style={{ color: '#faad14' }} />
                    <Title level={4} style={{ margin: 0 }}>Quản lý Vai trò</Title>
                </Space>
            }
        >
            <RolesTab />
        </Card>
    </AdminWrapper>
);

export default AdminRolePage;
