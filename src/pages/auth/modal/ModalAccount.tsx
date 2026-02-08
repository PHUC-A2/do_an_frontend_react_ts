import { Drawer, Avatar, Descriptions, Divider, Typography, Button } from 'antd';
import { UserOutlined, MailOutlined, IdcardOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAppSelector } from '../../../redux/hooks';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

interface IProps {
    openModalAccount: boolean;
    setOpenModalAccount: (v: boolean) => void;
    onUpdateAccount?: () => void; // callback cho nút cập nhật
    theme: 'light' | 'dark'; // thêm prop theme
}

const PRIMARY_COLOR = '#faad14';

const ModalAccount = ({ openModalAccount, setOpenModalAccount, onUpdateAccount, theme }: IProps) => {
    const account = useAppSelector(state => state.account.account);
    const isDark = theme === 'dark';

    // Màu theo theme
    const drawerBg = isDark ? '#141414' : '#f0f2f5';
    const cardBg = isDark ? '#1f1f1f' : '#fff';
    const textColor = isDark ? '#fff' : '#000';
    const dividerColor = PRIMARY_COLOR;
    const avatarBg = isDark ? '#2C3E50' : '#2C3E50';

    return (
        <Drawer
            title={<Title level={4} style={{ margin: 0, color: PRIMARY_COLOR }}>Thông tin tài khoản</Title>}
            placement="right"
            closable
            onClose={() => setOpenModalAccount(false)}
            open={openModalAccount}
            size={420}
            styles={{ body: { padding: 0, backgroundColor: drawerBg } }}
        >
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4 }}
                style={{
                    padding: 24,
                    background: cardBg,
                    borderRadius: 12,
                    boxShadow: isDark ? '0 6px 18px rgba(0,0,0,0.5)' : '0 6px 18px rgba(0,0,0,0.08)',
                    margin: 16
                }}
            >
                {/* Avatar + Name */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                    <Avatar
                        size={100}
                        src={account?.avatarUrl || undefined}
                        icon={!account?.avatarUrl && <UserOutlined style={{ color: PRIMARY_COLOR }} />}
                        style={{ backgroundColor: avatarBg }}
                    />
                    <Title level={4} style={{ marginTop: 12, color: PRIMARY_COLOR, textAlign: 'center' }}>
                        {account?.name || account?.fullName || 'Chưa có tên'}
                    </Title>
                </div>

                <Divider style={{ borderColor: dividerColor, margin: '16px 0' }} />

                {/* Account Details */}
                <Descriptions column={1} size="middle" bordered>
                    {[
                        { label: <><IdcardOutlined /> ID</>, value: account?.id },
                        { label: <><MailOutlined /> Email</>, value: account?.email },
                        { label: <><PhoneOutlined /> Số điện thoại</>, value: account?.phoneNumber },
                        { label: <>Avatar URL</>, value: account?.avatarUrl },
                        { label: <>Họ và tên đầy đủ</>, value: account?.fullName },
                    ].map((item, idx) => (
                        <Descriptions.Item
                            key={idx}
                            label={<Text style={{ color: PRIMARY_COLOR }}>{item.label}</Text>}
                        >
                            <Text style={{ color: textColor }}>{item.value || 'N/A'}</Text>
                        </Descriptions.Item>
                    ))}
                </Descriptions>

                <Divider style={{ borderColor: dividerColor, margin: '16px 0' }} />

                {/* Nút cập nhật */}
                {onUpdateAccount && (
                    <Button
                        type="primary"
                        block
                        style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
                        onClick={onUpdateAccount}
                    >
                        Cập nhật tài khoản
                    </Button>
                )}
            </motion.div>
        </Drawer>
    );
};

export default ModalAccount;
