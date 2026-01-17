import { Table, Tag, Space, Card, Popconfirm, message, type PopconfirmProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { fetchUsers, selectUserLoading, selectUserMeta, selectUsers } from '../../../redux/features/userSlice';
import type { IUser } from '../../../types/user';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';
import ModalAddUser from './modals/ModalAddUser';
import { deleteUser } from '../../../config/Api';
import { toast } from 'react-toastify';

type UserStatus = NonNullable<IUser['status']>;

const statusColors: Record<UserStatus, string> = {
    ACTIVE: 'green',
    INACTIVE: 'volcano',
    PENDING_VERIFICATION: 'gold',
    BANNED: 'red',
    DELETED: 'gray',
};

const AdminUserPage = () => {
    const dispatch = useAppDispatch();
    const listUsers = useAppSelector(selectUsers);
    const meta = useAppSelector(selectUserMeta);
    const loading = useAppSelector(selectUserLoading);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [openModalAddUser, setOpenModalAddUser] = useState<boolean>(false);

    const handleEdit = (user: IUser) => {
        console.log(user);
    }

    const [messageApi, holder] = message.useMessage();
    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteUser(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchUsers(""));
                messageApi.success('Xóa thành công');
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
        messageApi.error('Đã bỏ chọn');
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
            title: 'Name',
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
            title: 'Phone',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            sorter: (a, b) =>
                (a.phoneNumber ?? '').localeCompare(b.phoneNumber ?? ''),
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) =>
                (a.status ?? '').localeCompare(b.status ?? ''),
            render: (status?: IUser['status']) => (
                <Tag color={status ? statusColors[status] : 'default'}>
                    {status ?? 'UNKNOWN'}
                </Tag>
            ),
        },
        {
            title: 'Roles',
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
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: IUser) => (
                <Space>
                    <RBButton
                        variant="outline-warning"
                        onClick={() => handleEdit(record)}
                    >
                        <CiEdit />
                    </RBButton>

                    <RBButton variant="outline-info">
                        <FaArrowsToEye />
                    </RBButton>

                    {holder}

                    <Popconfirm
                        title="Xóa người dùng"
                        description="Bạn có chắc chắn muốn xóa người dùng này không?"
                        onConfirm={() => handleDelete(record.id)}
                        onCancel={cancel}
                        okText="Có"
                        cancelText="Không"
                        okButtonProps={{
                            loading: deletingId === record.id
                        }}
                    >
                        <RBButton
                            variant="outline-danger"
                            disabled={deletingId === record.id}
                        >
                            <MdDelete />
                        </RBButton>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // fetch list users
    useEffect(() => {
        dispatch(fetchUsers("page=1&pageSize=7"));
    }, [dispatch]);

    return (
        <>
            <Card
                title="Quản lý người dùng"
                extra={<RBButton variant="outline-primary"
                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                    onClick={() => setOpenModalAddUser(true)}
                >
                    <IoIosAddCircle />
                    Thêm mới
                </RBButton>}
                hoverable={false}
                style={{ width: '100%', overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
                <Table<IUser>
                    columns={columns}
                    dataSource={listUsers}
                    rowKey="id"
                    loading={loading}
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
            </Card>
            <ModalAddUser
                openModalAddUser={openModalAddUser}
                setOpenModalAddUser={setOpenModalAddUser}
            />
        </>
    );
};

export default AdminUserPage;
