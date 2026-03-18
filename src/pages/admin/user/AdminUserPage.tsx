import {
    Avatar, Badge, Button, Card, Drawer, Empty, Popconfirm, Space,
    Spin, Switch, Table, Tag, Tooltip, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { FaDownload } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdDelete, MdSecurity, MdBlock } from 'react-icons/md';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { fetchUsers, selectUserLoading, selectUserMeta, selectUsers } from '../../../redux/features/userSlice';
import { fetchRoles, selectRoles } from '../../../redux/features/roleSlice';
import type { IUser } from '../../../types/user';
import { assignRole, deleteUser, getUserById } from '../../../config/Api';
import { toast } from 'react-toastify';
import { USER_STATUS_META } from '../../../utils/constants/user.constants';
import ModalAddUser from './modals/ModalAddUser';
import ModalUserDetails from './modals/ModalUserDetails';
import ModalUpdateUser from './modals/ModalUpdateUser';
import ModalBanUser from './modals/ModalBanUser';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import { UserOutlined, SafetyOutlined, TeamOutlined } from '@ant-design/icons';

const { Text } = Typography;

const AdminUserPage = () => {
    const dispatch = useAppDispatch();
    const listUsers = useAppSelector(selectUsers);
    const meta = useAppSelector(selectUserMeta);
    const loading = useAppSelector(selectUserLoading);
    const allRoles = useAppSelector(selectRoles);

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Modals
    const [openModalAddUser, setOpenModalAddUser] = useState(false);
    const [openModalUpdateUser, setOpenModalUpdateUser] = useState(false);
    const [openModalUserDetails, setOpenModalUserDetails] = useState(false);
    const [user, setUser] = useState<IUser | null>(null);
    const [userEdit, setUserEdit] = useState<IUser | null>(null);
    const [userBan, setUserBan] = useState<IUser | null>(null);
    const [openModalBanUser, setOpenModalBanUser] = useState(false);

    // Assign role drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerUser, setDrawerUser] = useState<IUser | null>(null);
    const [enabledRoleIds, setEnabledRoleIds] = useState<Set<number>>(new Set());
    const [loadingDrawer, setLoadingDrawer] = useState(false);
    const [savingRoles, setSavingRoles] = useState(false);

    const canViewUsers = usePermission('USER_VIEW_LIST');

    useEffect(() => {
        if (!canViewUsers) return;
        dispatch(fetchUsers(''));
        dispatch(fetchRoles(''));
    }, [canViewUsers, dispatch]);

    // ── View details ──
    const handleView = async (id: number) => {
        setUser(null);
        setIsLoading(true);
        setOpenModalUserDetails(true);
        try {
            const res = await getUserById(id);
            setUser(res.data.data ?? null);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Không tải được thông tin người dùng');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Delete ──
    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            await deleteUser(id);
            toast.success('Đã xóa người dùng');
            dispatch(fetchUsers(''));
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Xóa thất bại');
        } finally {
            setDeletingId(null);
        }
    };

    // ── Assign role drawer ──
    const openAssignRole = async (u: IUser) => {
        setDrawerUser(u);
        setDrawerOpen(true);
        setLoadingDrawer(true);
        try {
            await dispatch(fetchRoles('')).unwrap();
            const res = await getUserById(u.id);
            const current: number[] = (res.data.data?.roles ?? []).map((r: any) => r.id);
            setEnabledRoleIds(new Set(current));
        } catch {
            toast.error('Không tải được thông tin vai trò');
        } finally {
            setLoadingDrawer(false);
        }
    };

    const handleToggleRole = (id: number, checked: boolean) => {
        setEnabledRoleIds(prev => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleSaveRoles = async () => {
        if (!drawerUser) return;
        setSavingRoles(true);
        try {
            await assignRole(drawerUser.id, { roleIds: Array.from(enabledRoleIds) });
            toast.success('Đã cập nhật vai trò cho người dùng');
            dispatch(fetchUsers(''));
            setDrawerOpen(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Lưu thất bại');
        } finally {
            setSavingRoles(false);
        }
    };

    const columns: ColumnsType<IUser> = [
        {
            title: 'STT', width: 55,
            render: (_: any, __: IUser, i: number) => (meta.page - 1) * meta.pageSize + i + 1,
        },
        { title: 'ID', dataIndex: 'id', width: 60, sorter: (a, b) => a.id - b.id },
        {
            title: 'Người dùng', width: 200,
            render: (_: any, r: IUser) => (
                <Space size={8}>
                    <Avatar
                        size={32}
                        src={r.avatarUrl || undefined}
                        icon={!r.avatarUrl && <UserOutlined />}
                        style={{ background: '#2C3E50', flexShrink: 0 }}
                    />
                    <div>
                        <Text strong style={{ fontSize: 13, display: 'block', lineHeight: '1.2' }}>
                            {r.name || r.fullName || '—'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{r.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'SĐT', dataIndex: 'phoneNumber', width: 120,
            render: (t) => t || <Text type="secondary">—</Text>,
        },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 130,
            sorter: (a, b) => (a.status ?? '').localeCompare(b.status ?? ''),
            render: (status?: IUser['status']) => status
                ? <Tag color={USER_STATUS_META[status].color}>{USER_STATUS_META[status].label}</Tag>
                : <Tag>Không xác định</Tag>,
        },
        {
            title: 'Vai trò',
            render: (_: any, r: IUser) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {r.roles?.length
                        ? r.roles.map(role => <Tag key={role.id} color="blue">{role.name}</Tag>)
                        : <Text type="secondary">—</Text>}
                </div>
            ),
        },
        {
            title: 'Hành động', width: 180, align: 'center' as const,
            render: (_: any, record: IUser) => (
                <Space size={4}>
                    <PermissionWrapper required="USER_VIEW_DETAIL">
                        <Tooltip title="Xem chi tiết">
                            <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                                <FaArrowsToEye />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>

                    <PermissionWrapper required="USER_UPDATE">
                        <Tooltip title="Chỉnh sửa">
                            <RBButton variant="outline-warning" size="sm" onClick={() => { setUserEdit(record); setOpenModalUpdateUser(true); }}>
                                <CiEdit />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>

                    <PermissionWrapper required="USER_DELETE">
                        <Popconfirm
                            title={`Xóa người dùng "${record.name ?? record.email}"?`}
                            description="Hành động này không thể hoàn tác."
                            onConfirm={() => handleDelete(record.id)}
                            okText="Xóa" cancelText="Hủy"
                            okButtonProps={{ danger: true, loading: deletingId === record.id }}
                        >
                            <RBButton variant="outline-danger" size="sm" disabled={deletingId === record.id}>
                                <MdDelete />
                            </RBButton>
                        </Popconfirm>
                    </PermissionWrapper>

                    <PermissionWrapper required="USER_ASSIGN_ROLE">
                        <Tooltip title="Gắn vai trò">
                            <RBButton variant="outline-secondary" size="sm" onClick={() => openAssignRole(record)}>
                                <MdSecurity />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>

                    <PermissionWrapper required="USER_UPDATE">
                        <Tooltip title={record.status === 'BANNED' ? 'Mở khóa' : 'Khóa tài khoản'}>
                            <RBButton
                                size="sm"
                                variant={record.status === 'BANNED' ? 'outline-success' : 'outline-danger'}
                                onClick={() => { setUserBan(record); setOpenModalBanUser(true); }}
                            >
                                <MdBlock />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>
                </Space>
            ),
        },
    ];

    return (
        <AdminWrapper>
            <Card
                style={{ borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
                styles={{ body: { padding: '0 24px 24px' } }}
                title={
                    <Space>
                        <TeamOutlined style={{ color: '#faad14' }} />
                        <Typography.Title level={4} style={{ margin: 0 }}>Quản lý người dùng</Typography.Title>
                    </Space>
                }
                extra={
                    <Space>
                        <PermissionWrapper required="USER_CREATE">
                            <RBButton
                                variant="outline-primary" size="sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => setOpenModalAddUser(true)}
                            >
                                <IoIosAddCircle /> Thêm mới
                            </RBButton>
                        </PermissionWrapper>
                        <Button
                            icon={<FaDownload />} size="small"
                            onClick={() => exportTableToExcel(columns, listUsers, 'users')}
                        >
                            Xuất Excel
                        </Button>
                    </Space>
                }
            >
                <PermissionWrapper
                    required="USER_VIEW_LIST"
                    fallback={<Empty description="Bạn không có quyền xem danh sách người dùng" />}
                >
                    <Table<IUser>
                        columns={columns} dataSource={listUsers} rowKey="id"
                        loading={loading} size="small" bordered
                        scroll={{ x: 'max-content' }}
                        pagination={{
                            current: meta.page, pageSize: meta.pageSize, total: meta.total,
                            showSizeChanger: true,
                            onChange: (page, pageSize) =>
                                dispatch(fetchUsers(`page=${page}&pageSize=${pageSize}`)),
                        }}
                    />
                </PermissionWrapper>
            </Card>

            {/* Assign role drawer */}
            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={
                    <Space>
                        <SafetyOutlined />
                        <span>
                            Gắn vai trò:{' '}
                            <Tag color="blue">{drawerUser?.name ?? drawerUser?.email}</Tag>
                        </span>
                    </Space>
                }
                styles={{ body: { padding: '16px 20px' }, wrapper: { width: 480 } }}
                extra={
                    <Button type="primary" loading={savingRoles} onClick={handleSaveRoles}>
                        Lưu
                    </Button>
                }
            >
                <Spin spinning={loadingDrawer}>
                    <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Bật/tắt từng vai trò để phân quyền cho người dùng này.
                        </Text>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {allRoles.map(role => {
                            const on = enabledRoleIds.has(role.id);
                            return (
                                <div
                                    key={role.id}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        borderRadius: 10,
                                        background: on ? 'rgba(82,196,26,0.06)' : 'rgba(0,0,0,0.02)',
                                        border: `1px solid ${on ? 'rgba(82,196,26,0.3)' : 'rgba(0,0,0,0.06)'}`,
                                        transition: 'all 0.18s',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => handleToggleRole(role.id, !on)}
                                >
                                    <Space size={10}>
                                        <Badge
                                            dot
                                            color={on ? '#52c41a' : '#d9d9d9'}
                                            style={{ marginTop: 2 }}
                                        />
                                        <div>
                                            <Text strong style={{ fontSize: 13, display: 'block', lineHeight: '1.2' }}>
                                                <Tag color={role.name === 'ADMIN' ? 'warning' : 'blue'} style={{ margin: 0 }}>
                                                    {role.name}
                                                </Tag>
                                            </Text>
                                            {role.description && (
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {role.description}
                                                </Text>
                                            )}
                                        </div>
                                    </Space>
                                    <Switch
                                        size="small"
                                        checked={on}
                                        onChange={(checked, e) => {
                                            e.stopPropagation();
                                            handleToggleRole(role.id, checked);
                                        }}
                                    />
                                </div>
                            );
                        })}
                        {allRoles.length === 0 && !loadingDrawer && (
                            <Empty description="Chưa có vai trò nào" />
                        )}
                    </div>
                </Spin>
            </Drawer>

            <ModalAddUser
                openModalAddUser={openModalAddUser}
                setOpenModalAddUser={setOpenModalAddUser}
            />
            <ModalUserDetails
                openModalUserDetails={openModalUserDetails}
                setOpenModalUserDetails={setOpenModalUserDetails}
                user={user}
                isLoading={isLoading}
            />
            <ModalUpdateUser
                openModalUpdateUser={openModalUpdateUser}
                setOpenModalUpdateUser={setOpenModalUpdateUser}
                userEdit={userEdit}
            />
            <ModalBanUser
                open={openModalBanUser}
                onCancel={() => setOpenModalBanUser(false)}
                user={userBan}
                onSuccess={() => dispatch(fetchUsers(''))}
            />
        </AdminWrapper>
    );
};

export default AdminUserPage;
