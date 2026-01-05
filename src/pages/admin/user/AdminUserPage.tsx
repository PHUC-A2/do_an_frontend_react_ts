import { Table, Tag, Space, Pagination, Card, Popconfirm, message, type PopconfirmProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { CiEdit } from "react-icons/ci";
import { FaArrowsToEye } from "react-icons/fa6";
import { MdDelete } from 'react-icons/md';
import Button from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';

// Kiểu dữ liệu Role
interface Role {
    id: number;
    name: string;
    description: string;
}

// Kiểu dữ liệu User
interface UserData {
    id: number;
    name: string;
    fullName: string | null;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'BANNED' | 'DELETED';
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
    roles: Role[];
}

// Mapping status -> màu
const statusColors: Record<UserData['status'], string> = {
    ACTIVE: 'green',
    INACTIVE: 'volcano',
    PENDING_VERIFICATION: 'gold',
    BANNED: 'red',
    DELETED: 'gray',
};

// Bạn dùng dữ liệu mẫu `data` như trước (15 users)...
const data: UserData[] = [
    {
        id: 1,
        name: 'Admin',
        fullName: 'Administrator',
        email: 'admin@gmail.com',
        phoneNumber: '0123456789',
        avatarUrl: null,
        status: 'ACTIVE',
        createdAt: '2025-12-29T12:16:13.610853Z',
        updatedAt: '2026-01-04T20:37:22.201192Z',
        createdBy: '',
        updatedBy: 'admin@gmail.com',
        roles: [{ id: 1, name: 'ADMIN', description: 'Admin full quyền' }],
    },
    {
        id: 2,
        name: 'user_01',
        fullName: 'Nguyen Van A',
        email: 'user_01@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'ACTIVE',
        createdAt: '2025-12-29T12:32:22.851432Z',
        updatedAt: '2025-12-29T12:48:31.154135Z',
        createdBy: 'anonymousUser',
        updatedBy: 'user_01@gmail.com',
        roles: [{ id: 2, name: 'VIEW', description: 'Chỉ xem PITCH, full BOOKING' }],
    },
    {
        id: 3,
        name: 'user_02',
        fullName: 'Tran Thi B',
        email: 'user_02@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'INACTIVE',
        createdAt: '2025-12-29T12:32:41.981495Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 2, name: 'VIEW', description: 'Chỉ xem PITCH, full BOOKING' }],
    },
    {
        id: 4,
        name: 'user_03',
        fullName: 'Le Van C',
        email: 'user_03@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'PENDING_VERIFICATION',
        createdAt: '2025-12-30T09:10:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 3, name: 'EDITOR', description: 'Chỉnh sửa nội dung' }],
    },
    {
        id: 5,
        name: 'user_04',
        fullName: 'Pham Thi D',
        email: 'user_04@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'BANNED',
        createdAt: '2025-12-30T10:20:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 2, name: 'VIEW', description: 'Chỉ xem PITCH, full BOOKING' }],
    },
    {
        id: 6,
        name: 'user_05',
        fullName: 'Nguyen Van E',
        email: 'user_05@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'DELETED',
        createdAt: '2025-12-30T11:30:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 3, name: 'EDITOR', description: 'Chỉnh sửa nội dung' }],
    },
    {
        id: 7,
        name: 'user_06',
        fullName: 'Tran Thi F',
        email: 'user_06@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'ACTIVE',
        createdAt: '2025-12-31T08:00:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 1, name: 'ADMIN', description: 'Admin full quyền' }],
    },
    {
        id: 8,
        name: 'user_07',
        fullName: 'Le Van G',
        email: 'user_07@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'INACTIVE',
        createdAt: '2025-12-31T09:00:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 2, name: 'VIEW', description: 'Chỉ xem PITCH, full BOOKING' }],
    },
    {
        id: 9,
        name: 'user_08',
        fullName: 'Pham Thi H',
        email: 'user_08@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'PENDING_VERIFICATION',
        createdAt: '2025-12-31T10:00:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 3, name: 'EDITOR', description: 'Chỉnh sửa nội dung' }],
    },
    {
        id: 10,
        name: 'user_09',
        fullName: 'Nguyen Van I',
        email: 'user_09@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'BANNED',
        createdAt: '2025-12-31T11:00:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 2, name: 'VIEW', description: 'Chỉ xem PITCH, full BOOKING' }],
    },
    {
        id: 11,
        name: 'user_10',
        fullName: 'Tran Thi J',
        email: 'user_10@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'DELETED',
        createdAt: '2025-12-31T12:00:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 3, name: 'EDITOR', description: 'Chỉnh sửa nội dung' }],
    },
    {
        id: 12,
        name: 'user_11',
        fullName: 'Le Van K',
        email: 'user_11@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'ACTIVE',
        createdAt: '2025-12-31T13:00:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 1, name: 'ADMIN', description: 'Admin full quyền' }],
    },
    {
        id: 13,
        name: 'user_12',
        fullName: 'Pham Thi L',
        email: 'user_12@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'INACTIVE',
        createdAt: '2025-12-31T14:00:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 2, name: 'VIEW', description: 'Chỉ xem PITCH, full BOOKING' }],
    },
    {
        id: 14,
        name: 'user_13',
        fullName: 'Nguyen Van M',
        email: 'user_13@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'PENDING_VERIFICATION',
        createdAt: '2025-12-31T15:00:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 3, name: 'EDITOR', description: 'Chỉnh sửa nội dung' }],
    },
    {
        id: 15,
        name: 'user_14',
        fullName: 'Tran Thi N',
        email: 'user_14@gmail.com',
        phoneNumber: null,
        avatarUrl: null,
        status: 'BANNED',
        createdAt: '2025-12-31T16:00:00.000Z',
        updatedAt: null,
        createdBy: 'anonymousUser',
        updatedBy: null,
        roles: [{ id: 2, name: 'VIEW', description: 'Chỉ xem PITCH, full BOOKING' }],
    },
];


const AdminUserPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 7;

    const handleEdit = (user: UserData) => {
        console.log(user);
    }

    const [messageApi, holder] = message.useMessage();
    const confirm: PopconfirmProps['onConfirm'] = () => {
        messageApi.success('Xóa thành công');
    };

    const cancel: PopconfirmProps['onCancel'] = () => {
        messageApi.error('Đã bỏ chọn');
    };

    const columns: ColumnsType<UserData> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: any, __: UserData, index: number) =>
                (currentPage - 1) * pageSize + index + 1,
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
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text: string) => <div style={{ wordBreak: 'break-word' }}>{text}</div>,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
            render: (text: string) => <div style={{ wordBreak: 'break-word' }}>{text}</div>,
        },
        {
            title: 'Phone',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            sorter: (a, b) => (a.phoneNumber || '').localeCompare(b.phoneNumber || ''),
            render: (text: string | null) => text || '-',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) => a.status.localeCompare(b.status),
            render: (status: UserData['status']) => (
                <Tag color={statusColors[status]}>{status}</Tag>
            ),
        },
        {
            title: 'Roles',
            dataIndex: 'roles',
            key: 'roles',
            render: (roles: Role[]) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {roles.map((role) => (
                        <Tag key={role.id} color="blue">{role.name}</Tag>
                    ))}
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: UserData) => (
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

    // Phân trang dữ liệu
    const paginatedData = data.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    return (
        <Card
            title="Quản lý người dùng"
            extra={<Button variant="outline-primary"
                style={{ display: "flex",alignItems:"center",gap:3 }}
            >
                <IoIosAddCircle />
                Thêm mới
            </Button>}
            hoverable={false}
            style={{ width: '100%', overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
            <Table
                columns={columns}
                dataSource={paginatedData}
                rowKey="id"
                pagination={false} // tắt pagination mặc định
                bordered
                scroll={{ x: 'max-content' }} // scroll ngang nếu table quá rộng
            />

            {data.length > pageSize && (
                <Pagination
                    align='end'
                    current={currentPage}
                    pageSize={pageSize}
                    total={data.length}
                    onChange={(page) => setCurrentPage(page)}
                    style={{ marginTop: 16, textAlign: 'center' }}
                />
            )}
        </Card>
    );
};

export default AdminUserPage;
