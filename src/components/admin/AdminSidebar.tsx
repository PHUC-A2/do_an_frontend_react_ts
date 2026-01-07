import { Layout, Menu, Breadcrumb, Button, Grid, Drawer } from 'antd';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
    DashboardOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    AccountBookFilled,
} from '@ant-design/icons';
import { MdFeaturedPlayList, MdOutlineSecurity } from 'react-icons/md';
import { AiOutlineProduct } from 'react-icons/ai';
import { FaUserCog } from 'react-icons/fa';
import ModalAccount from '../../pages/auth/modal/ModalAccount';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../config/Api';
import { toast } from 'react-toastify';
import { setLogout } from '../../redux/features/authSlice';

const { Sider, Header, Content } = Layout;
const { useBreakpoint } = Grid;

interface AdminSidebarProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const AdminSidebar = ({ theme, toggleTheme }: AdminSidebarProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [openModalAccount, setOpenModalAccount] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const screens = useBreakpoint();

    const isDark = theme === 'dark';
    const siderWidth = collapsed ? 80 : 200;

    const handleLogout = async () => {
        try {
            const res = await logout();
            if (res?.data?.statusCode === 200) {
                dispatch(setLogout());
                toast.success('Đăng xuất thành công');
                navigate('/');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    const menuItems = [
        { key: '1', label: <Link to="/admin" style={{ textDecoration: 'none' }}>Dashboard</Link>, icon: <DashboardOutlined /> },
        {
            key: 'sub1',
            label: 'Feature',
            icon: <MdFeaturedPlayList />,
            children: [
                { key: '2', label: <Link to="/admin/user" style={{ textDecoration: 'none' }}>QL Người Dùng</Link>, icon: <UserOutlined /> },
                { key: '3', label: <Link to="/admin/product" style={{ textDecoration: 'none' }}>QL Sản Phẩm</Link>, icon: <AiOutlineProduct /> },
                { key: '4', label: <Link to="/admin/role" style={{ textDecoration: 'none' }}>QL Vai Trò</Link>, icon: <FaUserCog /> },
                { key: '5', label: <Link to="/admin/permission" style={{ textDecoration: 'none' }}>QL Quyền Hạn</Link>, icon: <MdOutlineSecurity /> },
            ],
        },
        {
            key: 'sub2',
            label: 'Settings',
            icon: <SettingOutlined />,
            children: [
                { key: '8', label: <Link to="/" style={{ textDecoration: 'none' }}>Client</Link>, icon: <UserOutlined /> },
                { key: '9', label: <span onClick={() => setOpenModalAccount(true)} style={{ cursor: 'pointer' }}>Tài khoản</span>, icon: <AccountBookFilled /> },
                { key: '10', label: <span onClick={handleLogout} style={{ cursor: 'pointer' }}>Đăng xuất</span>, icon: <LogoutOutlined /> },
            ],
        },
    ];

    const breadcrumbText = location.pathname.split('/').filter(Boolean).join(' / ');

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Desktop Sider */}
            {screens.md && (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    theme={isDark ? 'dark' : 'light'}
                    style={{ position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0, zIndex: 100 }}
                >
                    <Menu
                        theme={isDark ? 'dark' : 'light'}
                        mode="inline"
                        items={menuItems}
                        defaultSelectedKeys={['1']}
                        style={{ borderRight: 0 }}
                    />
                </Sider>
            )}

            {/* Mobile Drawer */}
            {!screens.md && (
                <Drawer
                    title="Menu"
                    placement="left"
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    styles={{
                        body: {
                            padding: 0
                        }
                    }}
                    style={{
                        background: isDark ? '#001529' : '#fff', // set màu nền
                    }}
                    mask={false} // tắt overlay để vẫn tương tác với body
                >
                    <Menu
                        mode="inline"
                        items={menuItems}
                        theme={isDark ? 'dark' : 'light'}
                        onClick={() => setDrawerVisible(false)}
                    />
                </Drawer>
            )}

            {/* Main Layout */}
            <Layout style={{ marginLeft: screens.md ? siderWidth : 0, transition: 'all 0.2s' }}>
                {/* Header */}
                <Header
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        zIndex: 99,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '40px 24px 24px 24px',
                        background: isDark ? '#001529' : '#fff',
                        color: isDark ? '#fff' : '#000',
                        transition: 'all 0.2s',
                        height: "90px"
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: screens.md ? siderWidth : 0 }}>
                        <h5>Chào mừng bạn đến với trang quản trị!</h5>
                        <Breadcrumb items={[{ title: breadcrumbText }]} style={{ color: isDark ? '#fff' : '#000', marginBottom: "0px" }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!screens.md && (
                            <Button type="text" onClick={() => setDrawerVisible(true)}>
                                ☰
                            </Button>
                        )}
                        <Button onClick={toggleTheme}>{isDark ? '🌞 Light' : '🌙 Dark'}</Button>
                    </div>
                </Header>

                {/* Content */}
                <Content
                    style={{
                        marginTop: 80,
                        padding: 24,
                        background: isDark ? '#141414' : '#f0f2f5',
                        minHeight: 'calc(100vh - 64px)',
                        marginLeft: screens.md ? 0 : 0,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>

            {/* Modal Account */}
            <ModalAccount
                openModalAccount={openModalAccount}
                setOpenModalAccount={setOpenModalAccount}
                theme={theme}
            />
        </Layout>
    );
};

export default AdminSidebar;
