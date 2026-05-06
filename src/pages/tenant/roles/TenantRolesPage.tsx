import { Table, Button, Space, Modal, Form, Input, Checkbox, message } from 'antd';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { getTenantRoles, createTenantRole, updateTenantRole } from '@/config/tenantSafeApi';

const { TextArea } = Input;

interface Permission {
    id: number;
    name: string;
    description: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
    permissions: Permission[];
}

const TenantRolesPage = () => {
    const tenantId = useAppSelector(state => state.auth.tenantId);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;
            try {
                const [rolesResponse, permissionsResponse] = await Promise.all([
                    getTenantRoles(tenantId),
                    getPermissions() // Assume this API exists
                ]);
                setRoles(rolesResponse.data);
                setPermissions(permissionsResponse.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tenantId]);

    const handleCreateOrUpdateRole = async (values: any) => {
        if (!tenantId) return;
        try {
            const roleData = {
                ...values,
                permissions: permissions.filter(p => values.permissions.includes(p.id))
            };

            if (editingRole) {
                await updateTenantRole(tenantId, editingRole.id, roleData);
                message.success('Role updated successfully');
            } else {
                await createTenantRole(tenantId, roleData);
                message.success('Role created successfully');
            }

            setModalVisible(false);
            form.resetFields();
            setEditingRole(null);

            // Refresh roles
            const response = await getTenantRoles(tenantId);
            setRoles(response.data);
        } catch (error) {
            message.error('Failed to save role');
        }
    };

    const handleEditRole = (role: Role) => {
        setEditingRole(role);
        form.setFieldsValue({
            name: role.name,
            description: role.description,
            permissions: role.permissions.map(p => p.id)
        });
        setModalVisible(true);
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Permissions',
            dataIndex: 'permissions',
            key: 'permissions',
            render: (permissions: Permission[]) => permissions.map(p => p.name).join(', '),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Role) => (
                <Space size="middle">
                    <Button type="link" onClick={() => handleEditRole(record)}>
                        Edit
                    </Button>
                    <Button type="link" danger>
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
                <Button type="primary" onClick={() => setModalVisible(true)}>
                    Create Role
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={roles}
                loading={loading}
                rowKey="id"
            />
            <Modal
                title={editingRole ? "Edit Role" : "Create Role"}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingRole(null);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateOrUpdateRole}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ required: true }]}
                    >
                        <TextArea />
                    </Form.Item>
                    <Form.Item
                        name="permissions"
                        label="Permissions"
                        rules={[{ required: true }]}
                    >
                        <Checkbox.Group>
                            {permissions.map(permission => (
                                <Checkbox key={permission.id} value={permission.id}>
                                    {permission.name}
                                </Checkbox>
                            ))}
                        </Checkbox.Group>
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingRole ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={() => {
                                setModalVisible(false);
                                setEditingRole(null);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

// Placeholder for getPermissions API
const getPermissions = async () => {
    // This should be implemented in tenantSafeApi.ts
    return { data: [] };
};

export default TenantRolesPage;