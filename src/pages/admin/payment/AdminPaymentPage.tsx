// AdminPaymentPage.tsx
import { Table, Tag, Space, Card, Popconfirm, Empty, Typography, Image, Button, Input } from 'antd';
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
import { FaCheck } from 'react-icons/fa6';
import { FiEye } from 'react-icons/fi';
import { PAYMENT_STATUS_META } from '../../../utils/constants/payment.constanst';
import { confirmPayment } from '../../../config/Api';
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
    const [selectedPayment, setSelectedPayment] = useState<IPayment | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const canViewPayments = usePermission('PAYMENT_VIEW_LIST');

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const handleConfirmPayment = async (id: number) => {
        try {
            setConfirmingId(id);
            const res = await confirmPayment(id);

            if (res.data.statusCode === 200) {
                toast.success('Xác nhận thanh toán thành công');
                dispatch(fetchPayments(listQuery || DEFAULT_ADMIN_LIST_QUERY));
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xác nhận thanh toán</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setConfirmingId(null);
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
                        <Popconfirm
                            title="Xác nhận thanh toán"
                            description="Bạn có chắc chắn muốn xác nhận thanh toán này không?"
                            onConfirm={() => handleConfirmPayment(record.id)}
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
