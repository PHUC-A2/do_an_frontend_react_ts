import { Layout } from 'antd';
import '../styles/AdminLayout.scss';
import { Outlet } from 'react-router';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout = () => {
    const { Header, Content, Footer } = Layout;

    return (
        <Layout className="admin-layout-container">
            <AdminSidebar />
            <Layout className="admin-layout-main">
                <Header className="admin-header">
                    <h3>Chào mừng bạn đến với trang quản trị !</h3>
                </Header>
                <Content className="admin-content">
                    <Outlet />
                </Content>
                <Footer className="admin-footer">
                    Trang quản trị ©{new Date().getFullYear()}. Mọi quyền được bảo lưu
                </Footer>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;
