import { Card, Table, Button, Tag, message, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { getTenantSubscriptions, getAvailablePlans, subscribeToPlan } from '@/config/tenantSafeApi';

interface Subscription {
    id: number;
    plan: {
        id: number;
        name: string;
        price: number;
        durationDays: number;
    };
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
}

interface Plan {
    id: number;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    status: 'ACTIVE' | 'DISABLED';
}

const TenantBillingPage = () => {
    const tenantId = useAppSelector(state => state.auth.tenantId);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscribeModalVisible, setSubscribeModalVisible] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;
            try {
                const [subsResponse, plansResponse] = await Promise.all([
                    getTenantSubscriptions(tenantId),
                    getAvailablePlans()
                ]);
                setSubscriptions(subsResponse.data);
                setPlans(plansResponse.data);
            } catch (error) {
                console.error('Failed to fetch billing data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tenantId]);

    const handleSubscribe = async () => {
        if (!tenantId || !selectedPlan) return;
        try {
            await subscribeToPlan(tenantId, selectedPlan.id);
            message.success('Subscription request sent successfully');
            setSubscribeModalVisible(false);
            setSelectedPlan(null);
            // Refresh subscriptions
            const response = await getTenantSubscriptions(tenantId);
            setSubscriptions(response.data);
        } catch (error) {
            message.error('Failed to subscribe to plan');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'green';
            case 'EXPIRED': return 'red';
            case 'PENDING': return 'orange';
            default: return 'default';
        }
    };

    const subscriptionColumns = [
        {
            title: 'Plan',
            dataIndex: ['plan', 'name'],
            key: 'planName',
        },
        {
            title: 'Price',
            dataIndex: ['plan', 'price'],
            key: 'price',
            render: (price: number) => `$${price}`,
        },
        {
            title: 'Duration',
            dataIndex: ['plan', 'durationDays'],
            key: 'duration',
            render: (days: number) => `${days} days`,
        },
        {
            title: 'Start Date',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'End Date',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
        },
    ];

    const planColumns = [
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
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => `$${price}`,
        },
        {
            title: 'Duration',
            dataIndex: 'durationDays',
            key: 'duration',
            render: (days: number) => `${days} days`,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Plan) => (
                <Button
                    type="primary"
                    onClick={() => {
                        setSelectedPlan(record);
                        setSubscribeModalVisible(true);
                    }}
                >
                    Subscribe
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card title="Current Subscriptions" style={{ marginBottom: '24px' }}>
                <Table
                    columns={subscriptionColumns}
                    dataSource={subscriptions}
                    loading={loading}
                    rowKey="id"
                />
            </Card>

            <Card title="Available Plans">
                <Table
                    columns={planColumns}
                    dataSource={plans.filter(plan => plan.status === 'ACTIVE')}
                    loading={loading}
                    rowKey="id"
                />
            </Card>

            <Modal
                title="Confirm Subscription"
                open={subscribeModalVisible}
                onOk={handleSubscribe}
                onCancel={() => {
                    setSubscribeModalVisible(false);
                    setSelectedPlan(null);
                }}
                okText="Subscribe"
                cancelText="Cancel"
            >
                {selectedPlan && (
                    <div>
                        <p><strong>Plan:</strong> {selectedPlan.name}</p>
                        <p><strong>Price:</strong> ${selectedPlan.price}</p>
                        <p><strong>Duration:</strong> {selectedPlan.durationDays} days</p>
                        <p><strong>Description:</strong> {selectedPlan.description}</p>
                        <p>Are you sure you want to subscribe to this plan?</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default TenantBillingPage;