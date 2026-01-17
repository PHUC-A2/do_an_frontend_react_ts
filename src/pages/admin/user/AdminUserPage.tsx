import { Table, Tag, Space, Card, Popconfirm, message, type PopconfirmProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { fetchUsers, selectUserLoading, selectUserMeta, selectUsers } from '../../../redux/features/userSlice';
import type { IUser } from '../../../types/user';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';

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

    const handleEdit = (user: IUser) => {
        console.log(user);
    }

    const [messageApi, holder] = message.useMessage();
    const confirm: PopconfirmProps['onConfirm'] = () => {
        messageApi.success('Xóa thành công');
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
                    <Button variant="outline-warning"
                        onClick={() => handleEdit(record)}
                    >
                        <CiEdit />
                    </Button>
                    <Button variant="outline-info">
                        <FaArrowsToEye />
                    </Button>
                    {holder}
                    <Popconfirm
                        title="Xóa người dùng"
                        description="Bạn có chắc chắn muốn xóa người dùng này không?"
                        onConfirm={confirm}
                        onCancel={cancel}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button variant="outline-danger">
                            <MdDelete />
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // const columns: ColumnsType<IUser> = [
    //     {
    //         title: 'STT',
    //         render: (_: any, __: UserData, index: number) =>
    //             (meta.page - 1) * meta.pageSize + index + 1,
    //     },
    //     {
    //         title: 'ID',
    //         dataIndex: 'id',
    //         key: 'id',
    //         sorter: (a, b) => a.id - b.id,
    //     },
    //     {
    //         title: 'Name',
    //         dataIndex: 'name',
    //         key: 'name',
    //         sorter: (a, b) => a.name.localeCompare(b.name),
    //         render: (text: string) => <div style={{ wordBreak: 'break-word' }}>{text}</div>,
    //     },
    //     {
    //         title: 'Email',
    //         dataIndex: 'email',
    //         key: 'email',
    //         sorter: (a, b) => a.email.localeCompare(b.email),
    //         render: (text: string) => <div style={{ wordBreak: 'break-word' }}>{text}</div>,
    //     },
    //     {
    //         title: 'Phone',
    //         dataIndex: 'phoneNumber',
    //         key: 'phoneNumber',
    //         sorter: (a, b) => (a.phoneNumber || '').localeCompare(b.phoneNumber || ''),
    //         render: (text: string | null) => text || '-',
    //     },
    //     {
    //         title: 'Status',
    //         dataIndex: 'status',
    //         key: 'status',
    //         sorter: (a, b) => a.status.localeCompare(b.status),
    //         render: (status: UserData['status']) => (
    //             <Tag color={statusColors[status]}>{status}</Tag>
    //         ),
    //     },
    //     {
    //         title: 'Roles',
    //         dataIndex: 'roles',
    //         key: 'roles',
    //         render: (roles: Role[]) => (
    //             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
    //                 {roles.map((role) => (
    //                     <Tag key={role.id} color="blue">{role.name}</Tag>
    //                 ))}
    //             </div>
    //         ),
    //     },
    //     {
    //         title: 'Actions',
    //         key: 'actions',
    //         render: (_: any, record: UserData) => (
    //             <Space>
    //                 <Button variant="outline-warning"
    //                     onClick={() => handleEdit(record)}
    //                 >
    //                     <CiEdit />
    //                 </Button>
    //                 <Button variant="outline-info">
    //                     <FaArrowsToEye />
    //                 </Button>
    //                 {holder}
    //                 <Popconfirm
    //                     title="Xóa người dùng"
    //                     description="Bạn có chắc chắn muốn xóa người dùng này không?"
    //                     onConfirm={confirm}
    //                     onCancel={cancel}
    //                     okText="Có"
    //                     cancelText="Không"
    //                 >
    //                     <Button variant="outline-danger">
    //                         <MdDelete />
    //                     </Button>
    //                 </Popconfirm>
    //             </Space>
    //         ),
    //     },
    // ];

    // // Phân trang dữ liệu
    // const paginatedData = data.slice(
    //     (currentPage - 1) * pageSize,
    //     currentPage * pageSize,
    // );

    // fetch list users
    useEffect(() => {
        dispatch(fetchUsers("page=1&pageSize=7"));
    }, [dispatch]);

    return (
        <Card
            title="Quản lý người dùng"
            extra={<Button variant="outline-primary"
                style={{ display: "flex", alignItems: "center", gap: 3 }}
            >
                <IoIosAddCircle />
                Thêm mới
            </Button>}
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
                // pagination={false} // tắt pagination mặc định
                bordered
                scroll={{ x: 'max-content' }} // scroll ngang nếu table quá rộng
            />
        </Card>
    );
};

export default AdminUserPage;
