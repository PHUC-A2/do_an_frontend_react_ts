import {
    Drawer,
    Avatar,
    Descriptions,
    Divider,
    Typography,
    Button,
    Space,
    theme,
    Tag,
    Image
} from 'antd';
import {
    UserOutlined,
    MailOutlined,
    IdcardOutlined,
    PhoneOutlined,
    EditOutlined,
    CameraOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { motion } from 'framer-motion';
import ModalUpdateAccount from './ModalUpdateAccount';
import { useState } from 'react';
import { setMessengerButtonHidden } from '../../../redux/features/messengerButtonUiSlice';

const { Text } = Typography;

interface IProps {
    openModalAccount: boolean;
    setOpenModalAccount: (v: boolean) => void;
}

const ModalAccount = ({ openModalAccount, setOpenModalAccount }: IProps) => {
    const { token } = theme.useToken();
    const account = useAppSelector(state => state.account.account);
    const [openModalUpdateAccount, setOpenModalUpdateAccount] = useState<boolean>(false);
    const dispatch = useAppDispatch();


    return (
        <>
            <Drawer
                title={
                    <Space>
                        <UserOutlined style={{ color: token.colorPrimary }} />
                        <span style={{ fontWeight: 700 }}>Thông tin cá nhân</span>
                    </Space>
                }
                placement="right"
                onClose={() => {
                    setOpenModalAccount(false);
                    dispatch(setMessengerButtonHidden(false)); // hiện lại
                }}

                afterOpenChange={(open) => {
                    // CHÌA KHOÁ
                    dispatch(setMessengerButtonHidden(open));
                }}

                open={openModalAccount}
                size={420}
                styles={{
                    body: { padding: '24px 20px' },
                    footer: { textAlign: 'right', padding: '12px 20px' }
                }}
                footer={
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        loading={false}
                        onClick={() => setOpenModalUpdateAccount(true)}
                    >
                        Chỉnh sửa thông tin
                    </Button>
                }
            >
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Profile Image Section - Đồng bộ ModalUpdateAccount */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                        <div style={{
                            width: 104,
                            height: 104,
                            padding: 4,
                            border: `1px dashed ${token.colorBorder}`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8,
                            position: 'relative'
                        }}>
                            {account?.avatarUrl ? (
                                <div
                                    style={{
                                        width: 90,
                                        height: 90,
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Image
                                        width={90}
                                        height={90}
                                        src={account.avatarUrl}
                                        style={{
                                            objectFit: 'cover',
                                            borderRadius: '50%',
                                        }}
                                        preview={{
                                            cover: (
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        borderRadius: '50%',
                                                        background: 'rgba(0,0,0,0.45)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                        fontSize: 12,
                                                        gap: 6,
                                                    }}
                                                >
                                                    <CameraOutlined />
                                                    Xem ảnh
                                                </div>
                                            ),
                                        }}
                                    />
                                </div>

                            ) : (
                                <Avatar size={90} icon={<UserOutlined />} style={{ backgroundColor: token.colorFillSecondary, color: token.colorTextTertiary }} />
                            )}

                            <Tag
                                color="gold"
                                style={{
                                    position: 'absolute',
                                    bottom: -5,
                                    margin: 0,
                                    borderRadius: 10,
                                    fontSize: '10px',
                                    fontWeight: 'bold'
                                }}
                            >
                                MEMBER
                            </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Ảnh đại diện của bạn</Text>
                    </div>

                    {/* Section: THÔNG TIN CƠ BẢN */}
                    <Divider titlePlacement="start" plain>
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                            THÔNG TIN TÀI KHOẢN
                        </Text>
                    </Divider>

                    <div style={{ padding: '0 4px' }}>
                        <Descriptions column={1} layout="vertical" colon={false}>

                            <Descriptions.Item label={<Space><IdcardOutlined /> <Text strong>Tên đăng nhập / ID</Text></Space>}>
                                <div style={{ padding: '8px 12px', background: token.colorFillAlter, borderRadius: 8, width: '100%' }}>
                                    <Text>{account?.name || 'N/A'}</Text>
                                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>(ID: {account?.id})</Text>
                                </div>
                            </Descriptions.Item>

                            <Descriptions.Item label={<Space><UserOutlined /> <Text strong>Họ và tên</Text></Space>}>
                                <div style={{ padding: '8px 12px', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, width: '100%' }}>
                                    {account?.fullName || <Text type="secondary" italic>Chưa cập nhật</Text>}
                                </div>
                            </Descriptions.Item>

                            <Descriptions.Item label={<Space><MailOutlined /> <Text strong>Email liên hệ</Text></Space>}>
                                <div style={{ padding: '8px 12px', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, width: '100%' }}>
                                    {account?.email}
                                </div>
                            </Descriptions.Item>

                            <Descriptions.Item label={<Space><PhoneOutlined /> <Text strong>Số điện thoại</Text></Space>}>
                                <div style={{ padding: '8px 12px', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, width: '100%' }}>
                                    {account?.phoneNumber ? (
                                        <Text copyable>{account.phoneNumber}</Text>
                                    ) : (
                                        <Text type="secondary" italic>Chưa cập nhật</Text>
                                    )}
                                </div>
                            </Descriptions.Item>

                            {/* <Descriptions.Item label={<Space><GlobalOutlined /> <Text strong>Trạng thái tài khoản</Text></Space>}>
                                <Tag color="success" icon={<GlobalOutlined />}>Đang hoạt động</Tag>
                            </Descriptions.Item> */}

                        </Descriptions>
                    </div>

                    {/* <Divider dashed style={{ margin: '24px 0 12px 0' }} /> */}

                    {/* <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                            Tham gia từ: {new Date().toLocaleDateString('vi-VN')}
                        </Text>
                    </div> */}

                </motion.div>
            </Drawer>

            <ModalUpdateAccount
                openModalUpdateAccount={openModalUpdateAccount}
                setOpenModalUpdateAccount={setOpenModalUpdateAccount}
            />
        </>
    );
};

export default ModalAccount;