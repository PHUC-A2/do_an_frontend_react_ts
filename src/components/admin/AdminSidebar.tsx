import { Layout, Menu, Breadcrumb, Button, Grid, Drawer, Switch, Tooltip } from 'antd';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    LoginOutlined,
} from '@ant-design/icons';
import { MdFeaturedPlayList, MdOutlineSecurity, MdPayments } from 'react-icons/md';
import { FaReact, FaUserCircle, FaUserCog } from 'react-icons/fa';
import ModalAccount from '../../pages/auth/modal/ModalAccount';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../config/Api';
import { toast } from 'react-toastify';
import { setLogout } from '../../redux/features/authSlice';
import { IoMenu, IoSunny } from 'react-icons/io5';
import { LuMoon } from 'react-icons/lu';
import { PiSoccerBallBold } from 'react-icons/pi';
import { useRole } from '../../hooks/common/useRole';
import { usePermission } from '../../hooks/common/usePermission';
import { TbBrandBooking } from 'react-icons/tb';

const { Sider, Header, Content } = Layout;
const { useBreakpoint } = Grid;

interface AdminSidebarProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ theme, toggleTheme }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [openModalAccount, setOpenModalAccount] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const screens = useBreakpoint();
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

    const isDark = theme === 'dark';
    const siderWidth = collapsed ? 80 : 200;
    const isViewRole = useRole("VIEW");
    const canViewUsers = usePermission("USER_VIEW_LIST");
    const canViewRoles = usePermission("ROLE_VIEW_LIST");
    const canViewPermissions = usePermission("PERMISSION_VIEW_LIST");
    const canViewPitches = usePermission("PITCH_VIEW_LIST");
    const canViewBookings = usePermission("BOOKING_VIEW_LIST");


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
        { key: '1', label: <Link to="/admin" style={{ textDecoration: 'none' }}>Dashboard</Link>, icon: <FaReact className='icon-spin' /> },
        {
            key: 'sub1',
            label: 'Tính năng',
            icon: <MdFeaturedPlayList />,
            children: [
                ...(!isViewRole
                    ? [
                        ...(canViewUsers ? [{
                            key: '2',
                            label: <Link to="/admin/user" style={{ textDecoration: 'none' }}>QL Người dùng</Link>,
                            icon: <UserOutlined />,
                        }] : []),

                        ...(canViewRoles ? [{
                            key: '3',
                            label: <Link to="/admin/role" style={{ textDecoration: 'none' }}>QL Vai trò</Link>,
                            icon: <FaUserCog />,
                        }] : []),

                        ...(canViewPermissions ? [{
                            key: '4',
                            label: <Link to="/admin/permission" style={{ textDecoration: 'none' }}>QL Quyền hạn</Link>,
                            icon: <MdOutlineSecurity />,
                        }] : []),

                        ...(canViewPitches ? [{
                            key: '5',
                            label: <Link to="/admin/pitch" style={{ textDecoration: 'none' }}>QL Sân</Link>,
                            icon: <PiSoccerBallBold />,
                        }] : []),

                        ...(canViewBookings ? [{
                            key: '6',
                            label: <Link to="/admin/booking" style={{ textDecoration: 'none' }}>QL Lịch đặt</Link>,
                            icon: <TbBrandBooking />,
                        }] : []),

                    ]
                    : []),

                // payment
                {
                    key: '7',
                    label: <Link to="/admin/payment" style={{ textDecoration: 'none' }}>QL thanh toán</Link>,
                    icon: <MdPayments />,
                }
            ],
        },
        {
            key: 'sub2',
            label: 'Cài đặt',
            icon: <SettingOutlined />,
            children: [
                { key: '8', label: <Link to="/" style={{ textDecoration: 'none' }}>Trang khách</Link>, icon: <UserOutlined /> },

                ...(isAuthenticated ?
                    [
                        { key: '9', label: <span onClick={() => setOpenModalAccount(true)} style={{ cursor: 'pointer' }}>Tài khoản</span>, icon: <FaUserCircle /> },
                        { key: '10', label: <span onClick={handleLogout} style={{ cursor: 'pointer' }}>Đăng xuất</span>, icon: <LogoutOutlined /> },
                    ]
                    :
                    [
                        { key: '1q', label: <span onClick={() => navigate("/login")} style={{ cursor: 'pointer' }}>Đăng nhập</span>, icon: <LoginOutlined /> },
                    ]),

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
                    closeIcon={true}
                    style={{
                        background: isDark ? '#001529' : '#fff', // set màu nền
                    }}
                    size={200}
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
                        padding: '20px 24px 24px 24px',
                        background: isDark ? '#001529' : '#fff',
                        color: isDark ? '#fff' : '#000',
                        transition: 'all 0.2s',
                        height: '90px'
                    }}
                >
                    {/* BÊN TRÁI */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: screens.md ? siderWidth : 0 }}>
                        {!screens.md && (
                            <Button
                                type="text"
                                onClick={() => setDrawerVisible(!drawerVisible)}
                                style={{ color: isDark ? '#fff' : '#000', fontSize: 24 }}
                            >
                                <Tooltip title={drawerVisible ? 'Đóng menu' : 'Mở menu'}>
                                    <IoMenu />
                                </Tooltip>
                            </Button>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h5>
                                <FaReact className='icon-spin' /> {" "}
                                Chào mừng bạn đến với trang quản trị!
                            </h5>
                            <Breadcrumb
                                items={[{ title: breadcrumbText }]}
                                style={{ color: isDark ? '#fff' : '#000', marginBottom: 0 }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tooltip placement="topLeft" title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}>
                            <Switch
                                size='small'
                                checked={isDark}
                                onChange={toggleTheme}
                                checkedChildren={<LuMoon />}
                                unCheckedChildren={<IoSunny />}
                            />
                        </Tooltip>
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
            />
        </Layout>
    );
};

export default AdminSidebar;
