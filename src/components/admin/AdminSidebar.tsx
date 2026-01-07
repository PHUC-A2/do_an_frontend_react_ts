import { Breadcrumb, Layout, Menu } from 'antd';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
    DashboardOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    AccountBookFilled
} from '@ant-design/icons';
import { MdFeaturedPlayList, MdOutlineSecurity } from 'react-icons/md';
import { AiOutlineProduct } from 'react-icons/ai';
import { FaUserCog } from 'react-icons/fa';
import { logout } from '../../config/Api';
import { useAppDispatch } from '../../redux/hooks';
import { toast } from 'react-toastify';
import { setLogout } from '../../redux/features/authSlice';

const { Header, Content, Sider } = Layout;

const AdminSidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const res = await logout();
            if (res?.data?.statusCode === 200) {
                dispatch(setLogout())
                toast.success('Đăng xuất thành công');
                navigate('/');
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div><b>Có Lỗi xảy ra!</b></div>
                    <div>{m}</div>
                </div>
            )
        }

    }
    const items = [
        { key: '1', label: <Link to="/admin" className='text-dashboard'>Dashboard</Link>, icon: <DashboardOutlined /> },
        {
            key: 'sub1',
            label: 'Feature',
            icon: <MdFeaturedPlayList />,
            children: [
                { key: '2', label: <Link to="/admin/user">QL Người Dùng</Link>, icon: <UserOutlined /> },
                { key: '3', label: <Link to="/admin/product">QL Sản Phẩm</Link>, icon: <AiOutlineProduct /> },
                { key: '4', label: <Link to="/admin/role">QL Vai Trò</Link>, icon: <FaUserCog /> },
                { key: '5', label: <Link to="/admin/permission">QL Quyền Hạn</Link>, icon: <MdOutlineSecurity /> }
            ]
        },
        {
            key: 'sub2',
            label: 'Settings',
            icon: <SettingOutlined />,
            children: [
                { key: '8', label: <Link to="/">Client</Link>, icon: <UserOutlined /> },
                { key: '9', label: <span>Tài khoản</span>, icon: <AccountBookFilled /> },
                { key: '10', label: <span onClick={handleLogout}>Đăng xuất</span>, icon: <LogoutOutlined /> }
            ]
        }
    ];

    const location = useLocation();

    // Tách path theo dấu "/"
    const pathSnippets = location.pathname.split("/").filter(i => i);

    // Tạo mảng breadcrumb (chỉ text)
    const breadcrumbItems = pathSnippets.map((snippet) => ({
        title: snippet, // chỉ text, không bọc Link
    }));

    // Chuỗi hiển thị
    const breadcrumbText = `path: ${breadcrumbItems.map(i => i.title).join(" / ")}`;

    return (
        <>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                className="admin-sider"
            >
                <Menu
                    theme="dark"
                    mode="inline"
                    items={items}
                    defaultSelectedKeys={['1']}
                />

            </Sider>

            <Layout className="admin-layout-main">
                <Header className="admin-header">
                    <h3>Chào mừng bạn đến với trang quản trị !</h3>
                    <Breadcrumb
                        // style={{ margin: '16px 10' }}
                        items={[{ title: breadcrumbText }]} />
                </Header>

                <Content className="admin-content">
                    <Outlet />
                </Content>

            </Layout>
        </>
    );
};

export default AdminSidebar;
