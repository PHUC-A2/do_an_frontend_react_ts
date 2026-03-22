import { Table, Tag, Space, Card, Popconfirm, type PopconfirmProps, Empty, Button, Badge, Tabs, Tooltip, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableProps } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdCheckCircle, MdClose, MdDelete } from 'react-icons/md';
import {
    fetchBookings,
    selectBookingLastListQuery,
    selectBookingLoading,
    selectBookingMeta,
    selectBookings,
} from '../../../redux/features/bookingSlice';
import type { IBooking } from '../../../types/booking';
import { BOOKING_STATUS_META } from '../../../utils/constants/booking.constants';
import ModalAddBooking from './modals/ModalAddBooking';
import { approveBooking, deleteBooking, getAllBookings, getBookingById, rejectBooking } from '../../../config/Api';
import { toast } from 'react-toastify';
import ModalBookingDetails from './modals/ModalBookingDetails';
import { formatDateTimeRange } from '../../../utils/format/localdatetime';
import ModalUpdateBooking from './modals/ModalUpdateBooking';
import { usePermission } from '../../../hooks/common/usePermission';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { FaDownload } from 'react-icons/fa';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import {
    buildSpringListQuery,
    type SpringSortItem,
} from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';
import { tableSorterToSortItems } from '../../../utils/pagination/tableSorterToSpringSort';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../utils/pagination/defaultListQuery';

const BOOKING_TEXT_FIELDS = ['user.name', 'user.fullName', 'user.email', 'pitch.name', 'contactPhone'];

function combineBookingListFilter(tab: 'all' | 'pending', keyword: string): string | undefined {
    const textFilter = orFieldsInsensitiveLike(BOOKING_TEXT_FIELDS, keyword);
    if (tab === 'pending') {
        const statusPart = "status : 'PENDING'";
        return textFilter ? `${statusPart} and ${textFilter}` : statusPart;
    }
    return textFilter;
}

const AdminBookingPage = () => {
    const dispatch = useAppDispatch();
    const listBookings = useAppSelector(selectBookings);
    const meta = useAppSelector(selectBookingMeta);
    const loading = useAppSelector(selectBookingLoading);
    const listQuery = useAppSelector(selectBookingLastListQuery);

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
    const [allCount, setAllCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);

    const [openModalAddBooking, setOpenModalAddBooking] = useState<boolean>(false);
    const [openModalUpdateBooking, setOpenModalUpdateBooking] = useState<boolean>(false);
    const [openModalBookingDetails, setOpenModalBookingDetails] = useState<boolean>(false);
    const [booking, setBooking] = useState<IBooking | null>(null);
    const [bookingEdit, setBookingEdit] = useState<IBooking | null>(null);
    const canViewBookings = usePermission('BOOKING_VIEW_LIST');

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const filterStr = useMemo(
        () => combineBookingListFilter(activeTab, debouncedSearch),
        [activeTab, debouncedSearch]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(
                fetchBookings(
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

    const loadTabCounts = useCallback(async () => {
        try {
            const [allRes, pendingRes] = await Promise.all([
                getAllBookings(
                    buildSpringListQuery({
                        page: 1,
                        pageSize: 1,
                        filter: combineBookingListFilter('all', debouncedSearch),
                    })
                ),
                getAllBookings(
                    buildSpringListQuery({
                        page: 1,
                        pageSize: 1,
                        filter: combineBookingListFilter('pending', debouncedSearch),
                    })
                ),
            ]);

            setAllCount(allRes.data.data?.meta?.total ?? 0);
            setPendingCount(pendingRes.data.data?.meta?.total ?? 0);
        } catch {
            setAllCount(0);
            setPendingCount(0);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        if (!canViewBookings) return;
        fetchPage(1, meta.pageSize, sortRef.current);
        void loadTabCounts();
    }, [canViewBookings, activeTab, debouncedSearch, fetchPage, loadTabCounts, meta.pageSize]);

    const handleTableChange: TableProps<IBooking>['onChange'] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const handleView = async (id: number) => {
        setBooking(null);
        setIsLoading(true);
        setOpenModalBookingDetails(true);

        try {
            const res = await getBookingById(id);

            if (Number(res.data.statusCode) === 200) {
                setBooking(res.data.data ?? null);
            } else {
                setBooking(null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi tải chi tiết người dùng</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (data: IBooking) => {
        setOpenModalUpdateBooking(true);
        setBookingEdit(data);
    };

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteBooking(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchBookings(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                await loadTabCounts();
                toast.success('Xóa thành công');
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xóa user</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setDeletingId(null);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            setProcessingId(id);
            await approveBooking(id);
            await dispatch(fetchBookings(listQuery || DEFAULT_ADMIN_LIST_QUERY));
            await loadTabCounts();
            toast.success('Đã xác nhận booking');
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Xác nhận booking thất bại');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        try {
            setProcessingId(id);
            await rejectBooking(id);
            await dispatch(fetchBookings(listQuery || DEFAULT_ADMIN_LIST_QUERY));
            await loadTabCounts();
            toast.success('Đã từ chối booking');
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Từ chối booking thất bại');
        } finally {
            setProcessingId(null);
        }
    };

    const cancel: PopconfirmProps['onCancel'] = () => {
        toast.error('Đã bỏ chọn');
    };

    const columns: ColumnsType<IBooking> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: unknown, __: IBooking, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: true,
        },
        {
            title: 'Người dùng(ID)',
            dataIndex: 'userId',
            key: 'user.id',
            sorter: true,
        },
        {
            title: 'Tên người đặt',
            dataIndex: 'userName',
            key: 'user.fullName',
            sorter: true,
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Sân (ID)',
            dataIndex: 'pitchId',
            key: 'pitch.id',
            sorter: true,
        },
        {
            title: 'Tên sân',
            dataIndex: 'pitchName',
            key: 'pitch.name',
            sorter: true,
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Giờ thi đấu',
            key: 'startDateTime',
            sorter: true,
            render: (_: unknown, record: IBooking) =>
                formatDateTimeRange(record.startDateTime, record.endDateTime),
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'contactPhone',
            key: 'contactPhone',
            sorter: true,
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (status?: IBooking['status']) =>
                status ? (
                    <Tag color={BOOKING_STATUS_META[status].color}>{BOOKING_STATUS_META[status].label}</Tag>
                ) : (
                    <Tag>Không xác định</Tag>
                ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: unknown, record: IBooking) => (
                <Space align="center" style={{ justifyContent: 'center', width: '100%' }}>
                    <PermissionWrapper required={'BOOKING_VIEW_DETAIL'}>
                        <Tooltip title="Xem chi tiết booking">
                            <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                                <FaArrowsToEye />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>

                    <PermissionWrapper required={'BOOKING_UPDATE'}>
                        <Tooltip
                            title={
                                record.status === 'CANCELLED' || record.status === 'PAID'
                                    ? 'Không thể sửa booking đã hủy hoặc đã thanh toán'
                                    : 'Chỉnh sửa booking'
                            }
                        >
                            <RBButton
                                variant="outline-warning"
                                size="sm"
                                disabled={record.status === 'CANCELLED' || record.status === 'PAID'}
                                onClick={() => handleEdit(record)}
                            >
                                <CiEdit />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>

                    {record.status === 'PENDING' && (
                        <PermissionWrapper required={'BOOKING_UPDATE'}>
                            <>
                                <RBButton
                                    variant="outline-success"
                                    size="sm"
                                    disabled={processingId === record.id}
                                    onClick={() => handleApprove(record.id)}
                                >
                                    <Tooltip title="Xác nhận booking chờ duyệt">
                                        <span style={{ display: 'inline-flex' }}>
                                            <MdCheckCircle />
                                        </span>
                                    </Tooltip>
                                </RBButton>
                                <RBButton
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={processingId === record.id}
                                    onClick={() => handleReject(record.id)}
                                >
                                    <Tooltip title="Từ chối booking chờ duyệt">
                                        <span style={{ display: 'inline-flex' }}>
                                            <MdClose />
                                        </span>
                                    </Tooltip>
                                </RBButton>
                            </>
                        </PermissionWrapper>
                    )}

                    <PermissionWrapper required={'BOOKING_DELETE'}>
                        <Popconfirm
                            title="Xóa người dùng"
                            description="Bạn có chắc chắn muốn xóa người dùng này không?"
                            onConfirm={() => handleDelete(record.id)}
                            onCancel={cancel}
                            okText="Có"
                            cancelText="Không"
                            placement="topLeft"
                            okButtonProps={{
                                loading: deletingId === record.id,
                            }}
                        >
                            <Tooltip title="Xóa booking">
                                <RBButton size="sm" variant="outline-danger" disabled={deletingId === record.id}>
                                    <MdDelete />
                                </RBButton>
                            </Tooltip>
                        </Popconfirm>
                    </PermissionWrapper>
                </Space>
            ),
        },
    ];

    return (
        <>
            <AdminWrapper>
                <Card
                    size="small"
                    title="Quản lý lịch đặt sân (booking)"
                    extra={
                        <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Email, tên, sân, SĐT…"
                                style={{ width: 260 }}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <PermissionWrapper required={'BOOKING_CREATE'}>
                                <Tooltip title="Tạo lịch đặt sân mới">
                                    <RBButton
                                        variant="outline-primary"
                                        size="sm"
                                        style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                                        onClick={() => setOpenModalAddBooking(true)}
                                    >
                                        <IoIosAddCircle />
                                        Thêm mới
                                    </RBButton>
                                </Tooltip>
                            </PermissionWrapper>

                            <Tooltip title="Xuất danh sách booking ra file Excel">
                                <Button
                                    icon={<FaDownload />}
                                    onClick={() => exportTableToExcel(columns, listBookings, 'bookings')}
                                >
                                    Xuất Excel
                                </Button>
                            </Tooltip>
                        </Space>
                    }
                    hoverable={false}
                    style={{
                        width: '100%',
                        overflowX: 'auto',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                >
                    <PermissionWrapper
                        required={'BOOKING_VIEW_LIST'}
                        fallback={<Empty description="Bạn không có quyền xem danh sách lịch đặt" />}
                    >
                        <Tabs
                            activeKey={activeTab}
                            onChange={(key) => setActiveTab(key as 'all' | 'pending')}
                            items={[
                                {
                                    key: 'all',
                                    label: (
                                        <Space size={8}>
                                            <span>Tất cả booking</span>
                                            <Badge count={allCount} color="#1677ff" />
                                        </Space>
                                    ),
                                },
                                {
                                    key: 'pending',
                                    label: (
                                        <Space size={8}>
                                            <span>Chờ duyệt</span>
                                            <Badge count={pendingCount} color="#faad14" />
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                        <Table<IBooking>
                            columns={columns}
                            dataSource={listBookings}
                            rowKey="id"
                            loading={loading}
                            size="small"
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

                <ModalAddBooking openModalAddBooking={openModalAddBooking} setOpenModalAddBooking={setOpenModalAddBooking} />

                <ModalBookingDetails
                    openModalBookingDetails={openModalBookingDetails}
                    setOpenModalBookingDetails={setOpenModalBookingDetails}
                    booking={booking}
                    isLoading={isLoading}
                />

                <ModalUpdateBooking
                    openModalUpdateBooking={openModalUpdateBooking}
                    setOpenModalUpdateBooking={setOpenModalUpdateBooking}
                    bookingEdit={bookingEdit}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminBookingPage;
