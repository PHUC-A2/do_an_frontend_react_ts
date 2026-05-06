import { Card, Form, Input, Button, message, Divider } from 'antd';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { getTenantSettings, updateTenantSettings } from '@/config/tenantSafeApi';

const { TextArea } = Input;

interface TenantSettings {
    name: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
}

const TenantSettingsPage = () => {
    const tenantId = useAppSelector(state => state.auth.tenantId);
    const [, setSettings] = useState<TenantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchSettings = async () => {
            if (!tenantId) return;
            try {
                const response = await getTenantSettings(tenantId);
                setSettings(response.data);
                form.setFieldsValue(response.data);
            } catch (error) {
                console.error('Failed to fetch tenant settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [tenantId, form]);

    const handleSaveSettings = async (values: TenantSettings) => {
        if (!tenantId) return;
        setSaving(true);
        try {
            await updateTenantSettings(tenantId, values);
            message.success('Settings updated successfully');
            setSettings(values);
        } catch (error) {
            message.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <Card title="Tenant Settings" loading={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSaveSettings}
                >
                    <Form.Item
                        name="name"
                        label="Tenant Name"
                        rules={[{ required: true, message: 'Please enter tenant name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea rows={4} />
                    </Form.Item>

                    <Divider />

                    <Form.Item
                        name="contactEmail"
                        label="Contact Email"
                        rules={[{ type: 'email', message: 'Please enter a valid email' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="contactPhone"
                        label="Contact Phone"
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={saving}>
                            Save Settings
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default TenantSettingsPage;