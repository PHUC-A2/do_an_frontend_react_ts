import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd';
import { UserOutlined, DashboardOutlined, TeamOutlined, SettingOutlined, CreditCardOutlined, LogoutOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAppDispatch } from '@/redux/hooks';
import { setLogout } from '@/redux/features/authSlice';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const TenantLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    // const tenantId = useAppSelector(state => state.auth.tenantId);

    const handleLogout = () => {
        dispatch(setLogout());
        navigate('/login');
    };

    const menuItems = [
        {
            key: '/app/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/app/users',
            icon: <TeamOutlined />,
            label: 'Users',
        },
        {
            key: '/app/roles',
            icon: <UserOutlined />,
            label: 'Roles',
        },
        {
            key: '/app/settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
        {
            key: '/app/billing',
            icon: <CreditCardOutlined />,
            label: 'Billing',
        },
    ];

    const userMenuItems = [
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: handleLogout,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider>
                <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Text strong style={{ color: 'white' }}>Tenant Portal</Text>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>
            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>Tenant Management</Text>
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                    >
                        <Avatar icon={<UserOutlined />} />
                    </Dropdown>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default TenantLayout;