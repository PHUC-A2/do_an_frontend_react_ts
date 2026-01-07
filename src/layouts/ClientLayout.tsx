import { Layout, ConfigProvider, theme as antdTheme } from 'antd';
import { Outlet } from 'react-router';
import Header from '../components/client/Header';
import Footer from '../components/client/Footer';
import MessageButton from '../components/client/chat/MessageButton';

interface ClientLayoutProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const { Content } = Layout;

const ClientLayout = ({ theme, toggleTheme }: ClientLayoutProps) => {
    const isDark = theme === 'dark';

    return (
        <ConfigProvider
            theme={{
                algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                token: {
                    colorPrimary: '#faad14',
                    borderRadius: 8,
                },
            }}
        >
            <Layout style={{ minHeight: '100vh' }}>
                <MessageButton />
                <Header theme={theme} toggleTheme={toggleTheme} />
                <Content style={{ padding: 24, marginTop: 64, background: 'transparent' }}>
                    <Outlet />
                </Content>
                <Footer theme={isDark ? 'dark' : 'light'} />
            </Layout>
        </ConfigProvider>
    );
};


export default ClientLayout;
