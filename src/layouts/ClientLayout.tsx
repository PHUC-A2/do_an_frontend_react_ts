import { Layout } from 'antd';
import { Outlet } from 'react-router';
import Header from '../components/client/Header';
import Footer from '../components/client/Footer';
import '../styles/ClientLayout.scss';
import MessageButton from '../components/client/chat/MessageButton';

interface ClientLayoutProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const { Content } = Layout;

const ClientLayout = ({ theme, toggleTheme }: ClientLayoutProps) => {
    return (
        <Layout className="client-layout-container">
            <MessageButton />
            <Header theme={theme} toggleTheme={toggleTheme} />
            <Content className="client-main-container">
                <Outlet />
            </Content>
            <Footer />
        </Layout>
    );
};

export default ClientLayout;
