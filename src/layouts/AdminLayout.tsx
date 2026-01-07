import { Layout, ConfigProvider, theme as antdTheme } from 'antd';
import { useState } from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
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
