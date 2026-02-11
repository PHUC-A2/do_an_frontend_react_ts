import { Table, Tag, Space, Card, Popconfirm, type PopconfirmProps, Tooltip, Empty, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { fetchUsers, selectUserLoading, selectUserMeta, selectUsers } from '../../../redux/features/userSlice';
import type { IUser } from '../../../types/user';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdDelete, MdSecurity } from 'react-icons/md';
import ModalAddUser from './modals/ModalAddUser';
import { deleteUser, getUserById } from '../../../config/Api';
import { toast } from 'react-toastify';
import ModalUserDetails from './modals/ModalUserDetails';
import ModalUpdateUser from './modals/ModalUpdateUser';
import { USER_STATUS_META } from '../../../utils/constants/user.constants';
import AdminModalAssignRole from './modals/AdminModalAssignRole';
import { fetchRoles } from '../../../redux/features/roleSlice';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { FaDownload } from 'react-icons/fa';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';

const AdminUserPage = () => {
    const dispatch = useAppDispatch();
    const listUsers = useAppSelector(selectUsers);
    const meta = useAppSelector(selectUserMeta);
    const loading = useAppSelector(selectUserLoading);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [openModalAddUser, setOpenModalAddUser] = useState<boolean>(false);
    const [openModalUpdateUser, setOpenModalUpdateUser] = useState<boolean>(false);
    const [openModalUserDetails, setOpenModalUserDetails] = useState<boolean>(false);
    const [user, setUser] = useState<IUser | null>(null);
    const [userEdit, setUserEdit] = useState<IUser | null>(null);
    const [userAssignRole, setUserAssignRole] = useState<IUser | null>(null);
    const [openModalAssignRole, setOpenModalAssignRole] = useState<boolean>(false);
    const canViewUsers = usePermission("USER_VIEW_LIST");

    // assign role
    const handleAssignRole = async (data: IUser) => {
        setUserAssignRole(data);
        setOpenModalAssignRole(true);
        await dispatch(fetchRoles("")).unwrap();
    }

    const handleView = async (id: number) => {
        setUser(null);
        setIsLoading(true);
        setOpenModalUserDetails(true);

        try {
            const res = await getUserById(id);

            if (Number(res.data.statusCode) === 200) {
                setUser(res.data.data ?? null);
            } else {
                setUser(null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi tải chi tiết người dùng</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (data: IUser) => {
        setOpenModalUpdateUser(true);
        setUserEdit(data);
    }

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteUser(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchUsers(""));
                toast.success('Xóa thành công');
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xóa user</div>
                    <div>{m}</div>
                </div>
            )
        } finally {
            setDeletingId(null);
        }
    };


    const cancel: PopconfirmProps['onCancel'] = () => {
        toast.error('Đã bỏ chọn');
    };
    const columns: ColumnsType<IUser> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: any, __: IUser, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) =>
                (a.name ?? '').localeCompare(b.name ?? ''),
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'SĐT',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            sorter: (a, b) =>
                (a.phoneNumber ?? '').localeCompare(b.phoneNumber ?? ''),
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) =>
                (a.status ?? '').localeCompare(b.status ?? ''),
            // render: (status?: IUser['status']) => (
            //     <Tag color={status ? statusColors[status] : 'default'}>
            //         {status ?? 'Không xác định'}
            //     </Tag>
            // ),
            render: (status?: IUser['status']) =>
                status ? (
                    <Tag color={USER_STATUS_META[status].color}>
                        {USER_STATUS_META[status].label}
                    </Tag>
                ) : (
                    <Tag>Không xác định</Tag>
                ),

        },
        {
            title: 'Vai trò',
            dataIndex: 'roles',
            key: 'roles',
            render: (roles?: IUser['roles']) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {roles?.length
                        ? roles.map(role => (
                            <Tag key={role.id} color="blue">
                                {role.name}
                            </Tag>
                        ))
                        : '-'}
                </div>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: any, record: IUser) => (
                <Space align="center" style={{ justifyContent: "center", width: "100%" }}>

                    <PermissionWrapper required={"USER_VIEW_DETAIL"}>
                        <RBButton variant="outline-info" size='sm'
                            onClick={() => handleView(record.id)}
                        >
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required={"USER_UPDATE"}>
                        <RBButton
                            variant="outline-warning"
                            size='sm'
                            onClick={() => handleEdit(record)}
                        >
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required={"USER_DELETE"}>
                        <Popconfirm
                            title="Xóa người dùng"
                            description="Bạn có chắc chắn muốn xóa người dùng này không?"
                            onConfirm={() => handleDelete(record.id)}
                            onCancel={cancel}
                            okText="Có"
                            cancelText="Không"
                            placement="topLeft"
                            okButtonProps={{
                                loading: deletingId === record.id
                            }}
                        >
                            <RBButton
                                size='sm'
                                variant="outline-danger"
                                disabled={deletingId === record.id}
                            >
                                <MdDelete />
                            </RBButton>
                        </Popconfirm>
                    </PermissionWrapper>

                    <PermissionWrapper required={"USER_ASSIGN_ROLE"}>
                        <Tooltip placement="left" title="Gắn quyền">
                            <RBButton size="sm" variant="outline-secondary"
                                onClick={() => handleAssignRole(record)}
                            >
                                <MdSecurity />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>
                </Space>
            ),
        },
    ];

    // fetch list users
    // useEffect(() => {
    //     dispatch(fetchUsers(""));
    // }, [dispatch]);
    useEffect(() => {
        if (!canViewUsers) return;

        dispatch(fetchUsers(""));
    }, [canViewUsers, dispatch]);

    return (
        <>
            <AdminWrapper>
                <Card
                    size='small'
                    title="Quản lý người dùng (User)"
                    extra={
                       <Space align='center'>
                            <PermissionWrapper required={"USER_CREATE"}>
                                <RBButton variant="outline-primary"
                                    size='sm'
                                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                                    onClick={() => setOpenModalAddUser(true)}
                                >
                                    <IoIosAddCircle />
                                    Thêm mới
                                </RBButton>
                            </PermissionWrapper>

                            <Button
                                icon={<FaDownload />}
                                onClick={() =>
                                    exportTableToExcel(columns, listUsers, 'users')
                                }
                            >
                                Xuất Excel
                            </Button>
                       </Space>
                    }
                    hoverable={false}
                    style={{ width: '100%', overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                    <PermissionWrapper required={"USER_VIEW_LIST"}
                        fallback={<Empty description="Bạn không có quyền xem danh sách người dùng" />}
                    >
                        <Table<IUser>
                            columns={columns}
                            dataSource={listUsers}
                            rowKey="id"
                            loading={loading}
                            size='small'
                            pagination={{
                                current: meta.page,
                                pageSize: meta.pageSize,
                                total: meta.total,
                                showSizeChanger: true,
                                onChange: (page, pageSize) => {
                                    dispatch(fetchUsers(`page=${page}&pageSize=${pageSize}`));
                                },
                            }}
                            bordered
                            scroll={{ x: 'max-content' }} // scroll ngang nếu table quá rộng
                        />
                    </PermissionWrapper>
                </Card>
                <ModalAddUser
                    openModalAddUser={openModalAddUser}
                    setOpenModalAddUser={setOpenModalAddUser}
                />

                <ModalUserDetails
                    setOpenModalUserDetails={setOpenModalUserDetails}
                    openModalUserDetails={openModalUserDetails}
                    user={user}
                    isLoading={isLoading}
                />

                <ModalUpdateUser
                    openModalUpdateUser={openModalUpdateUser}
                    setOpenModalUpdateUser={setOpenModalUpdateUser}
                    userEdit={userEdit}
                />

                <AdminModalAssignRole
                    openModalAssignRole={openModalAssignRole}
                    setOpenModalAssignRole={setOpenModalAssignRole}
                    userAssignRole={userAssignRole}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminUserPage;
