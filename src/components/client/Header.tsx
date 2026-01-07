import { Menu, Layout, Drawer, Button, Dropdown, Switch, Space, Tooltip } from 'antd';
import { CloseOutlined, MailOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import { IoMdFootball } from "react-icons/io";
import type { MenuProps } from 'antd';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { AiFillDashboard, AiFillHome, AiOutlineLogin, AiOutlineLogout, AiOutlineUserAdd } from 'react-icons/ai';
import { MdAccountCircle } from 'react-icons/md';
import { FaInfoCircle } from 'react-icons/fa';
import ModalAccount from '../../pages/auth/modal/ModalAccount';

const { Header: AntHeader } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Header = ({ theme, toggleTheme }: HeaderProps) => {
    const [current, setCurrent] = useState('home');
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [openModalAccount, setOpenModalAccount] = useState<boolean>(false);
    const isDark = theme === 'dark';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleClick: MenuProps['onClick'] = (e) => {
        setCurrent(e.key);
        if (isMobile) setDrawerVisible(false);
    };

    // Menu chính
    const mainMenuItems: MenuItem[] = [
        { label: <Link className='text-decoration-none' to="/">Trang chủ</Link>, key: 'home', icon: <AiFillHome /> },
        { label: <Link className='text-decoration-none' to="/booking">Đặt sân</Link>, key: 'booking', icon: <IoMdFootball /> },
        { label: <Link className='text-decoration-none' to="/about">Về chúng tôi</Link>, key: 'about', icon: <FaInfoCircle /> },
        { label: <Link className='text-decoration-none' to="/contact">Liên hệ</Link>, key: 'contact', icon: <MailOutlined /> },

    ];

    // Dropdown cài đặt bên phải
    const settingsMenu: MenuProps['items'] = [
        { label: <Link className='text-decoration-none' to="/login">Đăng nhập</Link>, key: 'login', icon: <AiOutlineLogin /> },
        { label: <Link className='text-decoration-none' to="/register">Đăng ký</Link>, key: 'register', icon: <AiOutlineUserAdd /> },

        { label: <Link className='text-decoration-none' to="#" onClick={() => setOpenModalAccount(true)}>Tài khoản</Link>, key: 'account', icon: <MdAccountCircle /> },
        { label: <Link className='text-decoration-none' to="#">Đăng xuất</Link>, key: 'logout', icon: <AiOutlineLogout /> },

        { label: <Link className='text-decoration-none' to="/admin">Trang quản trị</Link>, key: 'admin', icon: <AiFillDashboard /> },
    ];

    return (
        <AntHeader
            style={{
                backgroundColor: 'var(--header-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
            }}
        >
            {/* Menu chính */}
            {isMobile ? (
                <Tooltip title="Mở thanh bên">
                    <Button
                        type="text"
                        icon={<MenuOutlined style={{ color: 'var(--menu-text)' }} />}
                        onClick={() => setDrawerVisible(true)}
                    />
                </Tooltip>
            ) : (
                <Menu
                    onClick={handleClick}
                    selectedKeys={[current]}
                    mode="horizontal"
                    items={mainMenuItems}
                    theme={undefined} // tắt theme mặc định
                    style={{ backgroundColor: 'var(--menu-bg)', borderBottom: 'none' }}
                    className="custom-menu"
                />
            )}

            {/* Right controls */}
            <Space size="middle">
                <Tooltip title={isDark ? "Giao diện sáng" : "Giao diện tối"}>
                    <Switch
                        checked={isDark}
                        onChange={toggleTheme}
                        checkedChildren="🌙"
                        unCheckedChildren="☀️"
                    />
                </Tooltip>
                <Dropdown menu={{ items: settingsMenu }} placement="bottomRight">
                    <Button type="text" icon={<UserOutlined />} style={{ fontSize: "16px", fontWeight: 600, color: 'var(--menu-text)' }}>
                        Cài đặt
                    </Button>
                </Dropdown>
            </Space>

            {/* Drawer mobile */}
            {isMobile && (
                <Drawer
                    title="Menu"
                    placement="left"
                    onClose={() => setDrawerVisible(false)}
                    closeIcon={
                        <Tooltip title="Đóng thanh bên">
                            <CloseOutlined />
                        </Tooltip>
                    }
                    open={drawerVisible}
                    size={300}
                    style={{
                        // zIndex:999,
                        height: "100vh"
                    }}
                    styles={{
                        header: { backgroundColor: 'var(--header-bg)', color: 'var(--menu-text)' },
                        body: { backgroundColor: 'var(--menu-bg)', overflowX: "hidden" }
                    }}
                    mask={false} // tắt overlay để vẫn tương tác với body
                    getContainer={false} // Drawer sẽ render trực tiếp trong bod
                >
                    <Menu
                        onClick={handleClick}
                        selectedKeys={[current]}
                        mode="inline"
                        items={mainMenuItems}
                        theme={undefined}
                        style={{ backgroundColor: 'var(--menu-bg)', border: 'none' }}
                        className="custom-menu"
                    />
                </Drawer>
            )}
            <ModalAccount
                openModalAccount={openModalAccount}
                setOpenModalAccount={setOpenModalAccount}
            />
        </AntHeader>
    );
};

export default Header;
