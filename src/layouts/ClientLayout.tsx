import { Layout, ConfigProvider, theme as antdTheme } from 'antd';
import { Outlet } from 'react-router';
import { useCallback, useState, type CSSProperties } from 'react';
import Header from '../components/client/Header';
import Footer from '../components/client/Footer';
import MessageButton from '../components/client/chat/MessageButton';
import ChatBot from '../components/client/chat/ChatBot';
import layoutStyles from './ClientLayout.module.scss';

interface ClientLayoutProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const { Content } = Layout;

const layoutStyle = {
    minHeight: '100vh',
} as CSSProperties;

const contentStyle: CSSProperties = {
    paddingTop: 'var(--header-height, 70px)',
    // clamp: 6px trên iPhone 5 (320px) → 24px trên desktop (800px+)
    paddingLeft: 'clamp(6px, 3vw, 24px)',
    paddingRight: 'clamp(6px, 3vw, 24px)',
    paddingBottom: '24px',
    background: 'transparent',
};

const ClientLayout = ({ theme, toggleTheme }: ClientLayoutProps) => {
    const isDark = theme === 'dark';
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [mobileNavPortalEl, setMobileNavPortalEl] = useState<HTMLDivElement | null>(null);

    const setNavSlotRef = useCallback((node: HTMLDivElement | null) => {
        setMobileNavPortalEl(node);
    }, []);

    const contentDynamicStyle: CSSProperties = {
        ...contentStyle,
        paddingTop: mobileNavOpen ? 0 : contentStyle.paddingTop,
    };

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
                <Header
                    theme={theme}
                    toggleTheme={toggleTheme}
                    mobileNavOpen={mobileNavOpen}
                    onMobileNavOpenChange={setMobileNavOpen}
                    mobileNavPortalEl={mobileNavPortalEl}
                />
                <div ref={setNavSlotRef} className={layoutStyles.mobileNavSlot} aria-live="polite" />
                <Content style={contentDynamicStyle}>
                    <Outlet />
                </Content>
                <Footer theme={isDark ? 'dark' : 'light'} />
            </Layout>
        </ConfigProvider>
    );
};

export default ClientLayout;
