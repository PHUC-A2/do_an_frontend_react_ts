import { Table, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { getTenantUsers, inviteUserToTenant } from '@/config/tenantSafeApi';

const { Option } = Select;

interface TenantUser {
    id: number;
    user: {
        id: number;
        email: string;
        fullName: string;
    };
    role: {
        id: number;
        name: string;
    };
    active: boolean;
}

const TenantUsersPage = () => {
    const tenantId = useAppSelector(state => state.auth.tenantId);
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchUsers = async () => {
            if (!tenantId) return;
            try {
                const response = await getTenantUsers(tenantId);
                setUsers(response.data);
            } catch (error) {
                console.error('Failed to fetch tenant users:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [tenantId]);

    const handleInviteUser = async (values: any) => {
        if (!tenantId) return;
        try {
            await inviteUserToTenant(tenantId, values.email, values.role);
            message.success('User invited successfully');
            setInviteModalVisible(false);
            form.resetFields();
            // Refresh users list
            const response = await getTenantUsers(tenantId);
            setUsers(response.data);
        } catch (error) {
            message.error('Failed to invite user');
        }
    };

    const columns = [
        {
            title: 'Email',
            dataIndex: ['user', 'email'],
            key: 'email',
        },
        {
            title: 'Full Name',
            dataIndex: ['user', 'fullName'],
            key: 'fullName',
        },
        {
            title: 'Role',
            dataIndex: ['role', 'name'],
            key: 'role',
        },
        {
            title: 'Status',
            dataIndex: 'active',
            key: 'active',
            render: (active: boolean) => active ? 'Active' : 'Inactive',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any) => (
                <Space size="middle">
                    <Button type="link">Edit Role</Button>
                    <Button type="link" danger>Remove</Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
                <Button type="primary" onClick={() => setInviteModalVisible(true)}>
                    Invite User
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={users}
                loading={loading}
                rowKey="id"
            />
            <Modal
                title="Invite User"
                open={inviteModalVisible}
                onCancel={() => setInviteModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleInviteUser}
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Option value="MEMBER">Member</Option>
                            <Option value="ADMIN">Admin</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Invite
                            </Button>
                            <Button onClick={() => setInviteModalVisible(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TenantUsersPage;