import { Layout, Menu } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router';
import {
    DashboardOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    AccountBookFilled
} from '@ant-design/icons';
import { MdFeaturedPlayList, MdOutlineSecurity } from 'react-icons/md';
import { AiOutlineProduct } from 'react-icons/ai';
import { FaUserCog,  } from 'react-icons/fa';

const AdminSidebar = () => {
    const { Sider } = Layout;
    const [collapsed, setCollapsed] = useState(false);

    const items = [
        { key: '1', label: <Link to="/admin">Dashboard</Link>, icon: <DashboardOutlined /> },
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
                { key: '9', label: 'Account', icon: <AccountBookFilled /> },
                { key: '10', label: 'Log out', icon: <LogoutOutlined /> }
            ]
        }
    ];

    return (
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} className="admin-sider">
            <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
        </Sider>
    );
};

export default AdminSidebar;
