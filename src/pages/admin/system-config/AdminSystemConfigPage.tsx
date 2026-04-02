import { useEffect, useMemo, useState } from 'react';
import { Card, Empty, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, Typography, Grid } from 'antd';
import { toast } from 'react-toastify';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { CiEdit } from 'react-icons/ci';
import { MdDelete, MdOutlineSettingsSuggest } from 'react-icons/md';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import {
    adminCreateBankAccountConfig,
    adminCreateEmailSenderConfig,
    adminDeleteBankAccountConfig,
    adminDeleteEmailSenderConfig,
    adminDeleteMessengerConfig,
    adminGetBankAccountConfigs,
    adminGetEmailSenderConfigs,
    adminGetMessengerConfigs,
    adminGetSecuritySettings,
    adminPatchSecuritySettings,
    adminUpdateBankAccountConfig,
    adminUpdateEmailSenderConfig,
    adminUpdateMessengerConfig,
    adminCreateMessengerConfig,
} from '../../../config/Api';
import type { IAdminBankAccountConfig, IAdminEmailSenderConfig, IAdminMessengerConfig, ISecuritySettings } from '../../../types/systemConfig';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AdminSystemConfigPage = () => {
    const [loading, setLoading] = useState(false);
    const [emails, setEmails] = useState<IAdminEmailSenderConfig[]>([]);
    const [banks, setBanks] = useState<IAdminBankAccountConfig[]>([]);
    const [messengers, setMessengers] = useState<IAdminMessengerConfig[]>([]);
    const [openEmailModal, setOpenEmailModal] = useState(false);
    const [openBankModal, setOpenBankModal] = useState(false);
    const [openMessengerModal, setOpenMessengerModal] = useState(false);
    const [editingEmail, setEditingEmail] = useState<IAdminEmailSenderConfig | null>(null);
    const [editingBank, setEditingBank] = useState<IAdminBankAccountConfig | null>(null);
    const [editingMessenger, setEditingMessenger] = useState<IAdminMessengerConfig | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [emailForm] = Form.useForm();
    const [bankForm] = Form.useForm();
    const [messengerForm] = Form.useForm();
    const screens = useBreakpoint();
    const modalWidth = useMemo(() => (screens.md ? 560 : '92%'), [screens.md]);

    const canViewMail = usePermission('SYSTEM_CONFIG_MAIL_VIEW_LIST');
    const canCreateMail = usePermission('SYSTEM_CONFIG_MAIL_CREATE');
    const canUpdateMail = usePermission('SYSTEM_CONFIG_MAIL_UPDATE');
    const canDeleteMail = usePermission('SYSTEM_CONFIG_MAIL_DELETE');
    const canViewBank = usePermission('SYSTEM_CONFIG_BANK_VIEW_LIST');
    const canCreateBank = usePermission('SYSTEM_CONFIG_BANK_CREATE');
    const canUpdateBank = usePermission('SYSTEM_CONFIG_BANK_UPDATE');
    const canDeleteBank = usePermission('SYSTEM_CONFIG_BANK_DELETE');
    const canViewMessenger = usePermission('SYSTEM_CONFIG_MESSENGER_VIEW_LIST');
    const canCreateMessenger = usePermission('SYSTEM_CONFIG_MESSENGER_CREATE');
    const canUpdateMessenger = usePermission('SYSTEM_CONFIG_MESSENGER_UPDATE');
    const canDeleteMessenger = usePermission('SYSTEM_CONFIG_MESSENGER_DELETE');
    const canViewSecurity = usePermission('SYSTEM_CONFIG_SECURITY_VIEW_LIST');
    const canUpdateSecurity = usePermission('SYSTEM_CONFIG_SECURITY_UPDATE');

    const canAccessPage = usePermission([
        'SYSTEM_CONFIG_MAIL_VIEW_LIST',
        'SYSTEM_CONFIG_MAIL_CREATE',
        'SYSTEM_CONFIG_MAIL_UPDATE',
        'SYSTEM_CONFIG_MAIL_DELETE',
        'SYSTEM_CONFIG_BANK_VIEW_LIST',
        'SYSTEM_CONFIG_BANK_CREATE',
        'SYSTEM_CONFIG_BANK_UPDATE',
        'SYSTEM_CONFIG_BANK_DELETE',
        'SYSTEM_CONFIG_MESSENGER_VIEW_LIST',
        'SYSTEM_CONFIG_MESSENGER_CREATE',
        'SYSTEM_CONFIG_MESSENGER_UPDATE',
        'SYSTEM_CONFIG_MESSENGER_DELETE',
        'SYSTEM_CONFIG_SECURITY_VIEW_LIST',
        'SYSTEM_CONFIG_SECURITY_UPDATE',
    ]);

    const [securitySettings, setSecuritySettings] = useState<ISecuritySettings | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [emailRes, bankRes, messengerRes, secRes] = await Promise.all([
                canViewMail ? adminGetEmailSenderConfigs() : Promise.resolve(null),
                canViewBank ? adminGetBankAccountConfigs() : Promise.resolve(null),
                canViewMessenger ? adminGetMessengerConfigs() : Promise.resolve(null),
                canViewSecurity ? adminGetSecuritySettings() : Promise.resolve(null),
            ]);
            setEmails(emailRes?.data?.data ?? []);
            setBanks(bankRes?.data?.data ?? []);
            setMessengers(messengerRes?.data?.data ?? []);
            setSecuritySettings(secRes?.data?.data ?? null);
        } catch {
            toast.error('Không thể tải dữ liệu cấu hình');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, [canViewMail, canViewBank, canViewMessenger, canViewSecurity]);

    const submitEmail = async (values: { email: string; password: string; active: boolean }) => {
        setSubmitting(true);
        try {
            if (editingEmail) {
                await adminUpdateEmailSenderConfig(editingEmail.id, values);
                toast.success('Cập nhật cấu hình email thành công');
            } else {
                await adminCreateEmailSenderConfig(values);
                toast.success('Thêm cấu hình email thành công');
            }
            setOpenEmailModal(false);
            setEditingEmail(null);
            emailForm.resetFields();
            void fetchData();
        } catch {
            toast.error('Không thể lưu cấu hình email');
        } finally {
            setSubmitting(false);
        }
    };

    const submitBank = async (values: { bankCode: string; accountNo: string; accountName: string; active: boolean }) => {
        setSubmitting(true);
        try {
            if (editingBank) {
                await adminUpdateBankAccountConfig(editingBank.id, values);
                toast.success('Cập nhật tài khoản ngân hàng thành công');
            } else {
                await adminCreateBankAccountConfig(values);
                toast.success('Thêm tài khoản ngân hàng thành công');
            }
            setOpenBankModal(false);
            setEditingBank(null);
            bankForm.resetFields();
            void fetchData();
        } catch {
            toast.error('Không thể lưu tài khoản ngân hàng');
        } finally {
            setSubmitting(false);
        }
    };

    const submitMessenger = async (values: { pageId: string; active: boolean }) => {
        setSubmitting(true);
        try {
            if (editingMessenger) {
                await adminUpdateMessengerConfig(editingMessenger.id, values);
                toast.success('Cập nhật cấu hình messenger thành công');
            } else {
                await adminCreateMessengerConfig(values);
                toast.success('Thêm cấu hình messenger thành công');
            }
            setOpenMessengerModal(false);
            setEditingMessenger(null);
            messengerForm.resetFields();
            void fetchData();
        } catch {
            toast.error('Không thể lưu cấu hình messenger');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminWrapper>
            <Card
                style={{ borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
                styles={{ body: { padding: '0 24px 24px' } }}
                title={
                    <Space>
                        <MdOutlineSettingsSuggest style={{ color: '#faad14' }} />
                        <Title level={4} style={{ margin: 0 }}>Quản lý cấu hình hệ thống</Title>
                    </Space>
                }
            >
                {!canAccessPage && <Empty description="Bạn không có quyền truy cập chức năng này" />}

                <PermissionWrapper required="SYSTEM_CONFIG_MAIL_VIEW_LIST">
                    <Card
                        size="small"
                        style={{ marginBottom: 20 }}
                        title="Cấu hình email gửi OTP"
                        extra={canCreateMail ? (
                            <RBButton
                                variant="outline-primary"
                                size="sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => {
                                    setEditingEmail(null);
                                    emailForm.setFieldsValue({ active: true });
                                    setOpenEmailModal(true);
                                }}
                            >
                                <IoIosAddCircle /> Thêm mới
                            </RBButton>
                        ) : null}
                    >
                    <Table<IAdminEmailSenderConfig>
                        rowKey="id"
                        loading={loading}
                        dataSource={emails}
                        pagination={false}
                        size="small"
                        bordered
                        scroll={{ x: 'max-content' }}
                        columns={[
                            { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
                            { title: 'Email', dataIndex: 'email', key: 'email' },
                            { title: 'Mật khẩu', dataIndex: 'passwordMasked', key: 'passwordMasked' },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'active',
                                key: 'active',
                                render: (active: boolean) => <Tag color={active ? 'green' : 'red'}>{active ? 'Đang bật' : 'Đang tắt'}</Tag>,
                            },
                            {
                                title: 'Hành động',
                                key: 'action',
                                render: (_, record) => (
                                    <Space>
                                        <PermissionWrapper required="SYSTEM_CONFIG_MAIL_UPDATE">
                                            <RBButton
                                                variant="outline-warning"
                                                size="sm"
                                                onClick={() => {
                                                    if (!canUpdateMail) return;
                                                    setEditingEmail(record);
                                                    emailForm.setFieldsValue({
                                                        email: record.email,
                                                        password: '',
                                                        active: record.active,
                                                    });
                                                    setOpenEmailModal(true);
                                                }}
                                            >
                                                <CiEdit />
                                            </RBButton>
                                        </PermissionWrapper>
                                        <PermissionWrapper required="SYSTEM_CONFIG_MAIL_DELETE">
                                            <Popconfirm
                                                title="Xóa cấu hình email?"
                                                okText="Xóa"
                                                cancelText="Hủy"
                                                onConfirm={async () => {
                                                    if (!canDeleteMail) return;
                                                    await adminDeleteEmailSenderConfig(record.id);
                                                    toast.success('Đã xóa cấu hình email');
                                                    void fetchData();
                                                }}
                                            >
                                                <RBButton variant="outline-danger" size="sm">
                                                    <MdDelete />
                                                </RBButton>
                                            </Popconfirm>
                                        </PermissionWrapper>
                                    </Space>
                                ),
                            },
                        ]}
                    />
                    </Card>
                </PermissionWrapper>

                <PermissionWrapper required="SYSTEM_CONFIG_BANK_VIEW_LIST">
                    <Card
                        size="small"
                        title="Tài khoản ngân hàng nhận thanh toán booking"
                        extra={canCreateBank ? (
                            <RBButton
                                variant="outline-primary"
                                size="sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => {
                                    setEditingBank(null);
                                    bankForm.setFieldsValue({ active: true });
                                    setOpenBankModal(true);
                                }}
                            >
                                <IoIosAddCircle /> Thêm mới
                            </RBButton>
                        ) : null}
                    >
                    <Table<IAdminBankAccountConfig>
                        rowKey="id"
                        loading={loading}
                        dataSource={banks}
                        pagination={false}
                        size="small"
                        bordered
                        scroll={{ x: 'max-content' }}
                        columns={[
                            { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
                            { title: 'Ngân hàng', dataIndex: 'bankCode', key: 'bankCode' },
                            { title: 'Số tài khoản', dataIndex: 'accountNoMasked', key: 'accountNoMasked' },
                            { title: 'Tên tài khoản', dataIndex: 'accountNameMasked', key: 'accountNameMasked' },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'active',
                                key: 'active',
                                render: (active: boolean) => <Tag color={active ? 'green' : 'red'}>{active ? 'Đang bật' : 'Đang tắt'}</Tag>,
                            },
                            {
                                title: 'Hành động',
                                key: 'action',
                                render: (_, record) => (
                                    <Space>
                                        <PermissionWrapper required="SYSTEM_CONFIG_BANK_UPDATE">
                                            <RBButton
                                                variant="outline-warning"
                                                size="sm"
                                                onClick={() => {
                                                    if (!canUpdateBank) return;
                                                    setEditingBank(record);
                                                    bankForm.setFieldsValue({
                                                        bankCode: record.bankCode,
                                                        accountNo: '',
                                                        accountName: '',
                                                        active: record.active,
                                                    });
                                                    setOpenBankModal(true);
                                                }}
                                            >
                                                <CiEdit />
                                            </RBButton>
                                        </PermissionWrapper>
                                        <PermissionWrapper required="SYSTEM_CONFIG_BANK_DELETE">
                                            <Popconfirm
                                                title="Xóa tài khoản ngân hàng?"
                                                okText="Xóa"
                                                cancelText="Hủy"
                                                onConfirm={async () => {
                                                    if (!canDeleteBank) return;
                                                    await adminDeleteBankAccountConfig(record.id);
                                                    toast.success('Đã xóa tài khoản ngân hàng');
                                                    void fetchData();
                                                }}
                                            >
                                                <RBButton variant="outline-danger" size="sm">
                                                    <MdDelete />
                                                </RBButton>
                                            </Popconfirm>
                                        </PermissionWrapper>
                                    </Space>
                                ),
                            },
                        ]}
                    />
                    </Card>
                </PermissionWrapper>

                <PermissionWrapper required="SYSTEM_CONFIG_MESSENGER_VIEW_LIST">
                    <Card
                        size="small"
                        style={{ marginTop: 20 }}
                        title="Cấu hình Messenger cho FE"
                        extra={canCreateMessenger ? (
                            <RBButton
                                variant="outline-primary"
                                size="sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => {
                                    setEditingMessenger(null);
                                    messengerForm.setFieldsValue({ active: true });
                                    setOpenMessengerModal(true);
                                }}
                            >
                                <IoIosAddCircle /> Thêm mới
                            </RBButton>
                        ) : null}
                    >
                        <Table<IAdminMessengerConfig>
                            rowKey="id"
                            loading={loading}
                            dataSource={messengers}
                            pagination={false}
                            size="small"
                            bordered
                            scroll={{ x: 'max-content' }}
                            columns={[
                                { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
                                { title: 'Messenger Page ID', dataIndex: 'pageIdMasked', key: 'pageIdMasked' },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'active',
                                    key: 'active',
                                    render: (active: boolean) => <Tag color={active ? 'green' : 'red'}>{active ? 'Đang bật' : 'Đang tắt'}</Tag>,
                                },
                                {
                                    title: 'Hành động',
                                    key: 'action',
                                    render: (_, record) => (
                                        <Space>
                                            <PermissionWrapper required="SYSTEM_CONFIG_MESSENGER_UPDATE">
                                                <RBButton
                                                    variant="outline-warning"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (!canUpdateMessenger) return;
                                                        setEditingMessenger(record);
                                                        messengerForm.setFieldsValue({
                                                            pageId: '',
                                                            active: record.active,
                                                        });
                                                        setOpenMessengerModal(true);
                                                    }}
                                                >
                                                    <CiEdit />
                                                </RBButton>
                                            </PermissionWrapper>
                                            <PermissionWrapper required="SYSTEM_CONFIG_MESSENGER_DELETE">
                                                <Popconfirm
                                                    title="Xóa cấu hình messenger?"
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                    onConfirm={async () => {
                                                        if (!canDeleteMessenger) return;
                                                        await adminDeleteMessengerConfig(record.id);
                                                        toast.success('Đã xóa cấu hình messenger');
                                                        void fetchData();
                                                    }}
                                                >
                                                    <RBButton variant="outline-danger" size="sm">
                                                        <MdDelete />
                                                    </RBButton>
                                                </Popconfirm>
                                            </PermissionWrapper>
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </PermissionWrapper>

                <PermissionWrapper required="SYSTEM_CONFIG_SECURITY_VIEW_LIST">
                    <Card
                        size="small"
                        style={{ marginTop: 20 }}
                        title="Bảo mật bổ sung — PIN xác nhận thanh toán"
                    >
                        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                            <Text type="secondary">
                                Khi bật, mỗi tài khoản có quyền xác nhận thanh toán phải tự đặt PIN 6 số; admin không xem và không quản lý PIN của user.
                            </Text>
                            <Space align="center" wrap>
                                <Text strong>Bắt buộc nhập PIN khi xác nhận thanh toán</Text>
                                <Switch
                                    checked={Boolean(securitySettings?.paymentConfirmationPinRequired)}
                                    loading={loading}
                                    disabled={!canUpdateSecurity}
                                    onChange={async (checked) => {
                                        if (!canUpdateSecurity) return;
                                        setSubmitting(true);
                                        try {
                                            const res = await adminPatchSecuritySettings({
                                                paymentConfirmationPinRequired: checked,
                                            });
                                            setSecuritySettings(res.data?.data ?? { paymentConfirmationPinRequired: checked });
                                            toast.success('Đã cập nhật cấu hình bảo mật');
                                        } catch {
                                            toast.error('Không thể cập nhật cấu hình');
                                        } finally {
                                            setSubmitting(false);
                                        }
                                    }}
                                />
                            </Space>
                        </Space>
                    </Card>
                </PermissionWrapper>
            </Card>

            <Modal
                title={editingEmail ? 'Cập nhật email gửi' : 'Thêm email gửi'}
                open={openEmailModal}
                forceRender
                width={modalWidth}
                maskClosable={false}
                onCancel={() => {
                    setOpenEmailModal(false);
                    setEditingEmail(null);
                    emailForm.resetFields();
                }}
                okText={editingEmail ? 'Cập nhật' : 'Thêm mới'}
                cancelText="Hủy"
                confirmLoading={submitting}
                onOk={() => emailForm.submit()}
                destroyOnHidden
            >
                <Form form={emailForm} layout="vertical" onFinish={submitEmail}>
                    <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }]}>
                        <Input placeholder="Ví dụ: phucbv.k63cntt-b@utb.edu.vn" />
                    </Form.Item>
                    <Form.Item name="password" label="App Password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu ứng dụng' }]}>
                        <Input.Password placeholder="Nhập app password do Google cấp" />
                    </Form.Item>
                    <Form.Item name="active" label="Bật sử dụng" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={editingBank ? 'Cập nhật tài khoản ngân hàng' : 'Thêm tài khoản ngân hàng'}
                open={openBankModal}
                forceRender
                width={modalWidth}
                maskClosable={false}
                onCancel={() => {
                    setOpenBankModal(false);
                    setEditingBank(null);
                    bankForm.resetFields();
                }}
                okText={editingBank ? 'Cập nhật' : 'Thêm mới'}
                cancelText="Hủy"
                confirmLoading={submitting}
                onOk={() => bankForm.submit()}
                destroyOnHidden
            >
                <Form form={bankForm} layout="vertical" onFinish={submitBank}>
                    <Form.Item name="bankCode" label="Tên ngân hàng" rules={[{ required: true, message: 'Vui lòng nhập tên ngân hàng' }]}>
                        <Input placeholder="Ví dụ: Agribank, MB Bank, Vietcombank..." />
                    </Form.Item>
                    <Form.Item name="accountNo" label="Số tài khoản" rules={[{ required: true, message: 'Vui lòng nhập số tài khoản' }]}>
                        <Input placeholder="Ví dụ: 8888819336651" />
                    </Form.Item>
                    <Form.Item name="accountName" label="Tên tài khoản" rules={[{ required: true, message: 'Vui lòng nhập tên tài khoản' }]}>
                        <Input placeholder="Ví dụ: BAN VAN PHUC" />
                    </Form.Item>
                    <Form.Item name="active" label="Bật sử dụng" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={editingMessenger ? 'Cập nhật Messenger Page ID' : 'Thêm Messenger Page ID'}
                open={openMessengerModal}
                forceRender
                width={modalWidth}
                maskClosable={false}
                onCancel={() => {
                    setOpenMessengerModal(false);
                    setEditingMessenger(null);
                    messengerForm.resetFields();
                }}
                okText={editingMessenger ? 'Cập nhật' : 'Thêm mới'}
                cancelText="Hủy"
                confirmLoading={submitting}
                onOk={() => messengerForm.submit()}
                destroyOnHidden
            >
                <Form form={messengerForm} layout="vertical" onFinish={submitMessenger}>
                    <Form.Item name="pageId" label="Messenger Page ID" rules={[{ required: true, message: 'Vui lòng nhập Messenger Page ID' }]}>
                        <Input placeholder="Ví dụ: 886239791243320" />
                    </Form.Item>
                    <Form.Item name="active" label="Bật sử dụng" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminWrapper>
    );
};

export default AdminSystemConfigPage;
