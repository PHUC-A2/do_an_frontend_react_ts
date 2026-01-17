import { Layout, ConfigProvider, theme as antdTheme } from 'antd';
import AdminSidebar from '../components/admin/AdminSidebar';

interface AdminLayoutProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const AdminLayout = ({ theme, toggleTheme }: AdminLayoutProps) => {
    const isDark = theme === 'dark';

    return (
        <ConfigProvider
            theme={{
                algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                token: { colorPrimary: '#faad14', borderRadius: 8 },
            }}
        >
            <Layout style={{ minHeight: '100vh' }}>
                <AdminSidebar theme={theme} toggleTheme={toggleTheme} />
            </Layout>
        </ConfigProvider>
    );
};

export default AdminLayout;
