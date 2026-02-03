import { Layout, Menu, Drawer, Button, Dropdown, Space, Switch, Tooltip, Grid } from 'antd';
import { MenuOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AiFillHome, AiOutlineLogin, AiOutlineLogout, AiOutlineUserAdd, AiFillDashboard, AiFillCodepenCircle } from 'react-icons/ai';
import { MdAccountCircle, MdWorkHistory } from 'react-icons/md';
import { FaInfoCircle } from 'react-icons/fa';
import ModalAccount from '../../pages/auth/modal/ModalAccount';
import type { MenuProps } from 'antd';
import { LuMoon } from 'react-icons/lu';
import { IoSunny } from 'react-icons/io5';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../config/Api';
import { setLogout } from '../../redux/features/authSlice';
import { toast } from 'react-toastify';
import ModalBookingHistory from '../../pages/client/booking/modals/ModalBookingHistory';

const { Header: AntHeader } = Layout;
const { useBreakpoint } = Grid;

type MenuItem = Required<MenuProps>['items'][number];

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Header = ({ theme, toggleTheme }: HeaderProps) => {
    const [current, setCurrent] = useState('home');
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [openModalAccount, setOpenModalAccount] = useState(false);
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [openModalBookingHistory, setOpenModalBookingHistory] = useState<boolean>(false);

    const isDark = theme === 'dark';
    const screens = useBreakpoint();

    // logout
    const handleLogout = async () => {
        try {
            const res = await logout();
            if (res?.data?.statusCode === 200) {
                dispatch(setLogout());
                toast.success('Đăng xuất thành công');
                navigate('/');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    const handleClick: MenuProps['onClick'] = (e) => {
        setCurrent(e.key);
        if (!screens.md) setDrawerVisible(false);
    };

    const linkStyle = { textDecoration: 'none', color: isDark ? '#fff' : '#000' };

    const mainMenuItems: MenuItem[] = [
        { label: <Link to="/" style={linkStyle}>Trang chủ</Link>, key: 'home', icon: <AiFillHome /> },
        { label: <Link to="/pitch" style={linkStyle}>Sân bóng</Link>, key: 'pitch', icon: <AiFillCodepenCircle /> },
        { label: <Link to="/about" style={linkStyle}>Về chúng tôi</Link>, key: 'about', icon: <FaInfoCircle /> },
    ];

    const settingsMenu: MenuProps['items'] = [
        ...(isAuthenticated ?
            [
                { label: <Link to="#" onClick={() => setOpenModalAccount(true)} style={linkStyle}>Tài khoản</Link>, key: 'account', icon: <MdAccountCircle /> },
                { label: <Link to="#" style={linkStyle} onClick={handleLogout}>Đăng xuất</Link>, key: 'logout', icon: <AiOutlineLogout /> },
                { label: <Link to="/admin" style={linkStyle}>Trang quản trị</Link>, key: 'admin', icon: <AiFillDashboard /> },
            ]
            :
            [
                { label: <Link to="/login" style={linkStyle}>Đăng nhập</Link>, key: 'login', icon: <AiOutlineLogin /> },
                { label: <Link to="/register" style={linkStyle}>Đăng ký</Link>, key: 'register', icon: <AiOutlineUserAdd /> },
            ]),
    ];

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        position: 'fixed' as const,
        width: '100%',
        zIndex: 1000,
        background: isDark ? '#001529' : '#fff',
    };

    const menuStyle = {
        background: 'transparent',
        borderBottom: 'none',
    };

    // CSS hover/selected cho dark mode
    const menuItemDarkCss = `
    .ant-menu-dark .ant-menu-item-selected {
      background: transparent !important;
      border-bottom: 2px solid #faad14;
    }
    .ant-menu-dark .ant-menu-item:hover {
      background: transparent !important;
      border-bottom: 2px solid #faad14;
    }
  `;

    return (
        <>
            <AntHeader style={headerStyle}>
                {/* Inject style cho dark mode */}
                {isDark && <style>{menuItemDarkCss}</style>}

                {/* Menu chính */}
                {screens.md ? (
                    <Menu
                        onClick={handleClick}
                        selectedKeys={[current]}
                        mode="horizontal"
                        theme={isDark ? 'dark' : 'light'}
                        items={mainMenuItems}
                        style={{ ...menuStyle, flex: 1 }}
                    />
                ) : (
                    <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)} />
                )}

                {/* Right controls */}
                <Space size="middle">

                    {isAuthenticated && (
                        <Tooltip title="Quản lý lịch đặt">
                            <MdWorkHistory
                                size={25}
                                onClick={() => setOpenModalBookingHistory(true)}
                                style={{ cursor: "pointer" }}
                            />
                        </Tooltip>
                    )}

                    <Tooltip title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}>
                        <Switch checked={isDark} onChange={toggleTheme} checkedChildren={<LuMoon />} unCheckedChildren={<IoSunny />} />
                    </Tooltip>

                    <Dropdown menu={{ items: settingsMenu }} placement="bottomRight">
                        <Button type="text" icon={<UserOutlined />}>Cài đặt</Button>
                    </Dropdown>
                </Space>

                {/* Drawer mobile */}
                <Drawer
                    title="Menu"
                    placement="left"
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    size="default"
                    styles={{ body: { padding: 0, background: isDark ? '#001529' : '#fff' } }}
                    mask={false}
                >
                    <Menu
                        onClick={handleClick}
                        selectedKeys={[current]}
                        mode="inline"
                        theme={isDark ? 'dark' : 'light'}
                        items={mainMenuItems}
                        style={{ background: 'transparent' }}
                    />
                </Drawer>

                <ModalAccount openModalAccount={openModalAccount} setOpenModalAccount={setOpenModalAccount} theme={theme} />
            </AntHeader>
            <ModalBookingHistory
                openModalBookingHistory={openModalBookingHistory}
                setOpenModalBookingHistory={setOpenModalBookingHistory}
            />
        </>
    );
};

export default Header;
