import { Layout, ConfigProvider, theme as antdTheme } from 'antd';
import { Outlet } from 'react-router';
import type { CSSProperties } from 'react';
import Header from '../components/client/Header';
import Footer from '../components/client/Footer';
import MessageButton from '../components/client/chat/MessageButton';
import ChatBot from '../components/client/chat/ChatBot';

interface ClientLayoutProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const { Content } = Layout;

const layoutStyle = {
    minHeight: '100vh',
} as CSSProperties;

const contentStyle = {
    padding: 'var(--header-height, 70px) 24px 24px',
    background: 'transparent',
} as CSSProperties;

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
            <Layout style={layoutStyle}>
                <MessageButton />
                <ChatBot />
                <Header theme={theme} toggleTheme={toggleTheme} />
                <Content style={contentStyle}>
                    <Outlet />
                </Content>
                <Footer theme={isDark ? 'dark' : 'light'} />
            </Layout>
        </ConfigProvider>
    );
};

export default ClientLayout;
