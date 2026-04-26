// AdminPaymentPage.tsx
import {
    Table,
    Tag,
    Space,
    Card,
    Popconfirm,
    Empty,
    Typography,
    Image,
    Button,
    Input,
    Modal,
    Form,
    Tooltip,
    Alert,
    theme,
} from 'antd';
import {
    CheckOutlined,
    CloseOutlined,
    ExclamationCircleOutlined,
    LockOutlined,
    MailOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TableProps } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RBButton from 'react-bootstrap/Button';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
    fetchPayments,
    selectPaymentLastListQuery,
    selectPaymentLoading,
    selectPaymentMeta,
    selectPayments,
} from '../../../redux/features/paymentSlice';
import type { IPayment } from '../../../types/payment';
import { toast } from 'react-toastify';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import ModalPaymentDetails from './modals/ModalPaymentDetails';
import ModalForgotPaymentPin from './modals/ModalForgotPaymentPin';
import { FaCheck } from 'react-icons/fa6';
import { FiEye } from 'react-icons/fi';
import { MdDeleteOutline } from 'react-icons/md';
import { FaXmark } from 'react-icons/fa6';
import { PAYMENT_STATUS_META } from '../../../utils/constants/payment.constanst';
import { confirmPayment, deleteBookingFromPayment, rejectPayment, setAccountPaymentPin } from '../../../config/Api';
import { fetchAccount } from '../../../redux/features/accountSlice';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import { FaDownload } from 'react-icons/fa';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import {
    buildSpringListQuery,
    type SpringSortItem,
} from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';
import { tableSorterToSortItems } from '../../../utils/pagination/tableSorterToSpringSort';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../utils/pagination/defaultListQuery';

const { Text } = Typography;

const PAYMENT_SEARCH_FIELDS = [
    'paymentCode',
    'content',
    'booking.pitch.name',
    'booking.user.name',
    'booking.user.email',
    'booking.user.fullName',
];

const AdminPaymentPage = () => {
    const dispatch = useAppDispatch();
    const listPayments = useAppSelector(selectPayments);
    const meta = useAppSelector(selectPaymentMeta);
    const loading = useAppSelector(selectPaymentLoading);
    const listQuery = useAppSelector(selectPaymentLastListQuery);

    const [confirmingId, setConfirmingId] = useState<number | null>(null);
    const [pinModalForId, setPinModalForId] = useState<number | null>(null);
    const [paymentPinInput, setPaymentPinInput] = useState('');
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<IPayment | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const canViewPayments = usePermission('PAYMENT_VIEW_LIST');
    const canUpdatePayment = usePermission('PAYMENT_UPDATE');
    const account = useAppSelector((s) => s.account.account);
    const [pinForm] = Form.useForm();
    const [pinSaving, setPinSaving] = useState(false);
    const [pinConfigModalOpen, setPinConfigModalOpen] = useState(false);
    const [warnSetupPinPaymentId, setWarnSetupPinPaymentId] = useState<number | null>(null);
    const [pendingConfirmAfterPinSetup, setPendingConfirmAfterPinSetup] = useState<number | null>(null);
    const [forgotPaymentPinOpen, setForgotPaymentPinOpen] = useState(false);
    const { token } = theme.useToken();

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    useEffect(() => {
        if (canViewPayments || canUpdatePayment) {
            void dispatch(fetchAccount());
        }
    }, [dispatch, canViewPayments, canUpdatePayment]);

    useEffect(() => {
        if (!account?.paymentConfirmationPinRequiredBySystem) {
            setPinConfigModalOpen(false);
            setForgotPaymentPinOpen(false);
        }
    }, [account?.paymentConfirmationPinRequiredBySystem]);

    const submitPaymentPinConfig = async () => {
        const v = await pinForm.validateFields();
        if (v.newPin !== v.confirmPin) {
            toast.error('Nhập lại PIN mới không khớp');
            return;
        }
        setPinSaving(true);
        try {
            await setAccountPaymentPin({
                pin: v.newPin,
                currentPin: account?.paymentPinConfigured ? v.currentPin : undefined,
            });
            pinForm.resetFields();
            setPinConfigModalOpen(false);
            void dispatch(fetchAccount());
            const resumeId = pendingConfirmAfterPinSetup;
            setPendingConfirmAfterPinSetup(null);
            if (resumeId != null) {
                setPaymentPinInput('');
                setPinModalForId(resumeId);
                toast.success('Đã lưu PIN. Vui lòng nhập PIN để hoàn tất xác nhận thanh toán.');
            } else {
                toast.success('Đã cập nhật PIN xác nhận thanh toán');
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không lưu được PIN';
            toast.error(m);
        } finally {
            setPinSaving(false);
        }
    };

    const openPinConfigModal = () => {
        setPendingConfirmAfterPinSetup(null);
        pinForm.resetFields();
        setPinConfigModalOpen(true);
    };

    const closePinConfigModal = () => {
        setPinConfigModalOpen(false);
        setPendingConfirmAfterPinSetup(null);
        pinForm.resetFields();
    };

    const requestConfirmPaymentClick = (recordId: number) => {
        if (!account?.paymentConfirmationPinRequiredBySystem) return;
        if (!account?.paymentPinConfigured) {
            setWarnSetupPinPaymentId(recordId);
            return;
        }
        setPaymentPinInput('');
        setPinModalForId(recordId);
    };

    const handleConfirmPayment = async (id: number, pin?: string): Promise<boolean> => {
        try {
            setConfirmingId(id);
            const res = await confirmPayment(id, pin ? { pin } : {});

            if (res.data.statusCode === 200) {
                toast.success('Xác nhận thanh toán thành công');
                dispatch(fetchPayments(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                void dispatch(fetchAccount());
                return true;
            }
            return false;
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xác nhận thanh toán</div>
                    <div>{m}</div>
                </div>
            );
            return false;
        } finally {
            setConfirmingId(null);
        }
    };

    const handleRejectPayment = async (id: number) => {
        try {
            setRejectingId(id);
            const res = await rejectPayment(id);
            if (res.data.statusCode === 200) {
                toast.success('Từ chối xác nhận thanh toán thành công');
                dispatch(fetchPayments(listQuery || DEFAULT_ADMIN_LIST_QUERY));
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi từ chối thanh toán</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setRejectingId(null);
        }
    };

    const handleDeleteBookingFromPayment = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteBookingFromPayment(id);
            if (res.data.statusCode === 200) {
                toast.success('Xóa booking thành công');
                dispatch(fetchPayments(listQuery || DEFAULT_ADMIN_LIST_QUERY));
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xóa booking</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setDeletingId(null);
        }
    };

    const columns: ColumnsType<IPayment> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: unknown, __: IPayment, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: true,
        },
        {
            title: 'Booking ID',
            dataIndex: 'bookingId',
            key: 'booking.id',
            sorter: true,
        },
        {
            title: 'Mã thanh toán',
            dataIndex: 'paymentCode',
            key: 'paymentCode',
            sorter: true,
            render: (code: string) => (
                <Text copyable style={{ fontWeight: 500 }}>
                    {code}
                </Text>
            ),
        },
        {
            title: 'Nội dung',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            render: (text?: string) => text || '-',
        },
        {
            title: 'Phương thức',
            dataIndex: 'method',
            key: 'method',
            sorter: true,
            render: (method: IPayment['method']) => (
                <Tag color={method === 'BANK_TRANSFER' ? 'blue' : 'gold'}>
                    {method === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                </Tag>
            ),
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            sorter: true,
            render: (amount: number) => amount.toLocaleString('vi-VN') + ' ₫',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (status: IPayment['status']) => (
                <Tag color={PAYMENT_STATUS_META[status].color}>{PAYMENT_STATUS_META[status].label}</Tag>
            ),
        },
        {
            title: 'Ảnh minh chứng',
            dataIndex: 'proofUrl',
            key: 'proofUrl',
            align: 'center',
            render: (url?: string | null) =>
                url ? (
                    <Image
                        width={48}
                        height={48}
                        src={url}
                        style={{
                            objectFit: 'cover',
                            borderRadius: 6,
                            cursor: 'pointer',
                        }}
                        preview={{
                            cover: (
                                <div
                                    style={{
                                        color: '#fff',
                                        fontSize: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                    }}
                                >
                                    Xem ảnh
                                </div>
                            ),
                        }}
                    />
                ) : (
                    <Text type="secondary" italic>
                        Không có
                    </Text>
                ),
        },
        {
            title: 'Đã thanh toán lúc',
            dataIndex: 'paidAt',
            key: 'paidAt',
            sorter: true,
            render: (date?: string | null) => (date ? new Date(date).toLocaleString('vi-VN') : '-'),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            render: (date: string) => new Date(date).toLocaleString('vi-VN'),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: unknown, record: IPayment) => (
                <Space align="center" style={{ justifyContent: 'center', width: '100%' }}>
                    <RBButton
                        size="sm"
                        variant="outline-info"
                        onClick={() => {
                            setSelectedPayment(record);
                            setDetailOpen(true);
                        }}
                        title="Xem chi tiết"
                    >
                        <FiEye />
                    </RBButton>
                    <PermissionWrapper required={'PAYMENT_UPDATE'}>
                        {account?.paymentConfirmationPinRequiredBySystem ? (
                            <RBButton
                                size="sm"
                                variant="outline-success"
                                disabled={record.status === 'PAID'}
                                onClick={() => requestConfirmPaymentClick(record.id)}
                            >
                                <FaCheck />
                            </RBButton>
                        ) : (
                            <Popconfirm
                                title="Xác nhận thanh toán"
                                description="Bạn có chắc chắn muốn xác nhận thanh toán này không?"
                                onConfirm={() => {
                                    void handleConfirmPayment(record.id);
                                }}
                                okText="Xác nhận"
                                cancelText="Hủy"
                                placement="topLeft"
                                okButtonProps={{
                                    loading: confirmingId === record.id,
                                }}
                                disabled={record.status === 'PAID'}
                            >
                                <RBButton size="sm" variant="outline-success" disabled={record.status === 'PAID'}>
                                    <FaCheck />
                                </RBButton>
                            </Popconfirm>
                        )}
                    </PermissionWrapper>
                    <PermissionWrapper required={'PAYMENT_UPDATE'}>
                        <Popconfirm
                            title="Từ chối xác nhận thanh toán"
                            description="Bạn có chắc chắn muốn từ chối thanh toán này không?"
                            onConfirm={() => handleRejectPayment(record.id)}
                            okText="Từ chối"
                            cancelText="Hủy"
                            placement="topLeft"
                            okButtonProps={{ danger: true, loading: rejectingId === record.id }}
                            disabled={record.status !== 'PENDING'}
                        >
                            <RBButton size="sm" variant="outline-warning" disabled={record.status !== 'PENDING'}>
                                <FaXmark />
                            </RBButton>
                        </Popconfirm>
                    </PermissionWrapper>
                    <PermissionWrapper required={'BOOKING_DELETE'}>
                        <Popconfirm
                            title="Xóa booking từ payment"
                            description="Thao tác này sẽ xóa payment và booking liên quan. Bạn chắc chắn chứ?"
                            onConfirm={() => handleDeleteBookingFromPayment(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            placement="topLeft"
                            okButtonProps={{ danger: true, loading: deletingId === record.id }}
                        >
                            <RBButton size="sm" variant="outline-danger" disabled={deletingId === record.id}>
                                <MdDeleteOutline />
                            </RBButton>
                        </Popconfirm>
                    </PermissionWrapper>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const filterStr = useMemo(
        () => orFieldsInsensitiveLike(PAYMENT_SEARCH_FIELDS, debouncedSearch),
        [debouncedSearch]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(
                fetchPayments(
                    buildSpringListQuery({
                        page,
                        pageSize,
                        filter: filterStr,
                        sort,
                    })
                )
            );
        },
        [dispatch, filterStr]
    );

    useEffect(() => {
        if (!canViewPayments) return;
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canViewPayments, debouncedSearch, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<IPayment>['onChange'] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    return (
        <>
            <ModalPaymentDetails open={detailOpen} onClose={() => setDetailOpen(false)} payment={selectedPayment} />
            <Modal
                title={
                    <Space align="center">
                        <LockOutlined style={{ color: token.colorPrimary }} />
                        <span>Nhập PIN xác nhận thanh toán</span>
                    </Space>
                }
                open={pinModalForId !== null}
                destroyOnHidden
                forceRender
                okText="Xác nhận thanh toán"
                cancelText="Hủy"
                okButtonProps={{ icon: <CheckOutlined /> }}
                cancelButtonProps={{ icon: <CloseOutlined /> }}
                confirmLoading={pinModalForId !== null && confirmingId === pinModalForId}
                onCancel={() => {
                    setPinModalForId(null);
                    setPaymentPinInput('');
                }}
                onOk={async () => {
                    const id = pinModalForId;
                    if (id == null) return;
                    const pin = paymentPinInput.replace(/\D/g, '');
                    if (pin.length !== 6) {
                        toast.warning('Vui lòng nhập đủ 6 chữ số PIN');
                        throw new Error('pin');
                    }
                    const ok = await handleConfirmPayment(id, pin);
                    if (ok) {
                        setPinModalForId(null);
                        setPaymentPinInput('');
                    } else {
                        throw new Error('confirm');
                    }
                }}
            >
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    title="Xác nhận bằng PIN cá nhân"
                    description="Nhập đúng 6 chữ số PIN bạn đã lưu. Hệ thống không hiển thị lại PIN sau khi lưu."
                />
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        PIN xác nhận (6 số)
                    </Text>
                    <Input.Password
                        maxLength={6}
                        inputMode="numeric"
                        placeholder="Nhập 6 chữ số"
                        value={paymentPinInput}
                        onChange={(e) =>
                            setPaymentPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        autoComplete="off"
                        prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
                        size="large"
                    />
                </div>
            </Modal>

            <Modal
                open={warnSetupPinPaymentId !== null}
                title={
                    <Space align="center">
                        <ExclamationCircleOutlined style={{ color: token.colorWarning }} />
                        <span>Chưa thiết lập PIN xác nhận thanh toán</span>
                    </Space>
                }
                onCancel={() => setWarnSetupPinPaymentId(null)}
                footer={[
                    <Button
                        key="cancel"
                        icon={<CloseOutlined />}
                        onClick={() => setWarnSetupPinPaymentId(null)}
                    >
                        Hủy
                    </Button>,
                    <Button
                        key="setup"
                        type="primary"
                        icon={<LockOutlined />}
                        onClick={() => {
                            const id = warnSetupPinPaymentId;
                            setWarnSetupPinPaymentId(null);
                            if (id != null) {
                                setPendingConfirmAfterPinSetup(id);
                            }
                            pinForm.resetFields();
                            setPinConfigModalOpen(true);
                        }}
                    >
                        Tạo PIN ngay
                    </Button>,
                ]}
                destroyOnHidden
            >
                <Alert
                    type="warning"
                    showIcon
                    title="Không thể xác nhận thanh toán"
                    description="Hệ thống đang bật bắt buộc PIN. Bạn cần tạo PIN 6 số trước — chỉ dùng trên trang quản lý thanh toán này, không liên quan giao diện khách (VIEW)."
                />
            </Modal>

            <Modal
                title={
                    <Space align="center">
                        <LockOutlined style={{ color: token.colorPrimary }} />
                        <span>{account?.paymentPinConfigured ? 'Đổi PIN xác nhận thanh toán' : 'Tạo PIN xác nhận thanh toán'}</span>
                    </Space>
                }
                open={pinConfigModalOpen}
                onCancel={closePinConfigModal}
                destroyOnHidden
                forceRender
                width={440}
                footer={
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button icon={<CloseOutlined />} onClick={closePinConfigModal}>
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={pinSaving}
                            onClick={() => pinForm.submit()}
                        >
                            Lưu PIN
                        </Button>
                    </Space>
                }
            >
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    title="PIN 6 số cá nhân"
                    description="Khi cấu hình bật bắt buộc PIN, dùng mã này lúc xác nhận đã nhận tiền. Bạn có thể cập nhật PIN trên trang này khi cần."
                />
                <Form form={pinForm} layout="vertical" onFinish={() => void submitPaymentPinConfig()} requiredMark="optional">
                    {account?.paymentPinConfigured ? (
                        <>
                            <div style={{ marginBottom: 12 }}>
                                <Button
                                    type="link"
                                    icon={<MailOutlined />}
                                    style={{ padding: 0, height: 'auto' }}
                                    onClick={() => {
                                        setPinConfigModalOpen(false);
                                        setForgotPaymentPinOpen(true);
                                    }}
                                >
                                    Quên PIN? Gửi OTP qua email để đặt PIN mới
                                </Button>
                            </div>
                            <Form.Item
                                name="currentPin"
                                label="PIN hiện tại"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập PIN hiện tại' },
                                    { pattern: /^\d{6}$/, message: 'Đúng 6 chữ số' },
                                ]}
                            >
                                <Input.Password
                                    maxLength={6}
                                    inputMode="numeric"
                                    placeholder="6 chữ số"
                                    autoComplete="off"
                                />
                            </Form.Item>
                        </>
                    ) : null}
                    <Form.Item
                        name="newPin"
                        label="PIN mới (6 số)"
                        rules={[
                            { required: true, message: 'Vui lòng nhập PIN' },
                            { pattern: /^\d{6}$/, message: 'Đúng 6 chữ số' },
                        ]}
                    >
                        <Input.Password
                            maxLength={6}
                            inputMode="numeric"
                            placeholder="6 chữ số"
                            autoComplete="new-password"
                        />
                    </Form.Item>
                    <Form.Item
                        name="confirmPin"
                        label="Nhập lại PIN mới"
                        rules={[
                            { required: true, message: 'Vui lòng nhập lại PIN' },
                            { pattern: /^\d{6}$/, message: 'Đúng 6 chữ số' },
                        ]}
                    >
                        <Input.Password
                            maxLength={6}
                            inputMode="numeric"
                            placeholder="6 chữ số"
                            autoComplete="new-password"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <ModalForgotPaymentPin
                open={forgotPaymentPinOpen && Boolean(account?.paymentConfirmationPinRequiredBySystem)}
                onClose={() => setForgotPaymentPinOpen(false)}
                userEmail={account?.email ?? ''}
                onSuccess={() => void dispatch(fetchAccount())}
            />

            <AdminWrapper>
                <Card
                    size="small"
                    title="Quản lý thanh toán (payment)"
                    hoverable={false}
                    extra={
                        <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Mã GD, nội dung, sân, user…"
                                style={{ width: 260 }}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            {canUpdatePayment && account?.paymentConfirmationPinRequiredBySystem ? (
                                <Tooltip title="Đặt hoặc đổi PIN xác nhận thanh toán (6 số)">
                                    <Button
                                        type="default"
                                        icon={<LockOutlined style={{ color: token.colorPrimary }} />}
                                        onClick={openPinConfigModal}
                                        aria-label="Đặt hoặc đổi PIN xác nhận thanh toán"
                                    />
                                </Tooltip>
                            ) : null}
                            {canUpdatePayment &&
                                account?.paymentConfirmationPinRequiredBySystem &&
                                account?.paymentPinConfigured ? (
                                <Tooltip title="Quên PIN — nhận OTP qua email để đặt PIN mới">
                                    <Button
                                        type="text"
                                        icon={<MailOutlined style={{ color: token.colorWarning }} />}
                                        onClick={() => setForgotPaymentPinOpen(true)}
                                        aria-label="Quên PIN xác nhận thanh toán"
                                    />
                                </Tooltip>
                            ) : null}
                            <Button
                                icon={<FaDownload />}
                                onClick={() => exportTableToExcel(columns, listPayments, 'payments')}
                            >
                                Xuất Excel
                            </Button>
                        </Space>
                    }
                    style={{
                        width: '100%',
                        overflowX: 'auto',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                >
                    <PermissionWrapper
                        required={'PAYMENT_VIEW_LIST'}
                        fallback={<Empty description="Bạn không có quyền xem danh sách payment chờ xác nhận" />}
                    >
                        <Table<IPayment>
                            columns={columns}
                            dataSource={listPayments}
                            rowKey="id"
                            loading={loading}
                            size="small"
                            locale={{ emptyText: 'Không có dữ liệu thanh toán' }}
                            onChange={handleTableChange}
                            pagination={{
                                current: meta.page,
                                pageSize: meta.pageSize,
                                total: meta.total,
                                showSizeChanger: true,
                                showTotal: (t) => `Tổng ${t} bản ghi`,
                            }}
                            bordered
                            scroll={{ x: 'max-content' }}
                        />
                    </PermissionWrapper>
                </Card>
            </AdminWrapper>
        </>
    );
};

export default AdminPaymentPage;
