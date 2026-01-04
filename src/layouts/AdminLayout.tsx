import { Layout } from 'antd';
import '../styles/AdminLayout.scss';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout = () => {
    return (
        <Layout className="admin-layout-container">
            <AdminSidebar />
        </Layout>
    );
};

export default AdminLayout;
