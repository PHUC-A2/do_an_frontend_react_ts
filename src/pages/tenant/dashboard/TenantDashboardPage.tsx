import { Card, Col, Row, Statistic, Typography } from 'antd';
import { DollarOutlined, UserOutlined, CalendarOutlined, TrophyOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { getTenantStats } from '@/config/tenantSafeApi';

const { Title } = Typography;

interface TenantStats {
    totalRevenue: number;
    totalBookings: number;
    totalUsers: number;
    totalPitches: number;
}

const TenantDashboardPage = () => {
    const tenantId = useAppSelector(state => state.auth.tenantId);
    const [stats, setStats] = useState<TenantStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!tenantId) return;
            try {
                const response = await getTenantStats(tenantId);
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch tenant stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [tenantId]);

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>Tenant Dashboard</Title>
            <Row gutter={16}>
                <Col span={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Revenue"
                            value={stats?.totalRevenue || 0}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Bookings"
                            value={stats?.totalBookings || 0}
                            prefix={<CalendarOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Users"
                            value={stats?.totalUsers || 0}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Pitches"
                            value={stats?.totalPitches || 0}
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default TenantDashboardPage;