import { Table, Tag, Space, Card, Popconfirm, type PopconfirmProps, Empty, Button, Badge, Tabs, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdCheckCircle, MdClose, MdDelete } from 'react-icons/md';
import { fetchBookings, selectBookingLoading, selectBookingMeta, selectBookings } from '../../../redux/features/bookingSlice';
import type { IBooking } from '../../../types/booking';
import { BOOKING_STATUS_META, SHIRT_OPTION_META } from '../../../utils/constants/booking.constants';
import ModalAddBooking from './modals/ModalAddBooking';
import { approveBooking, deleteBooking, getAllBookings, getBookingById, rejectBooking } from '../../../config/Api';
import { toast } from 'react-toastify';
import ModalBookingDetails from './modals/ModalBookingDetails';
import { formatDateTimeRange, toUnix } from '../../../utils/format/localdatetime';
import ModalUpdateBooking from './modals/ModalUpdateBooking';
import { usePermission } from '../../../hooks/common/usePermission';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { FaDownload } from 'react-icons/fa';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
const AdminBookingPage = () => {
    const dispatch = useAppDispatch();
    const listBookings = useAppSelector(selectBookings);
    const meta = useAppSelector(selectBookingMeta);
    const loading = useAppSelector(selectBookingLoading);
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
    const canViewBookings = usePermission("BOOKING_VIEW_LIST");

    const buildBookingQuery = (page: number, pageSize: number, tab: 'all' | 'pending') => {
        const params = new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize),
        });

        if (tab === 'pending') {
            params.set('filter', "status : 'PENDING'");
        }

        return params.toString();
    };

    const loadTabCounts = async () => {
        try {
            const [allRes, pendingRes] = await Promise.all([
                getAllBookings('page=1&pageSize=1'),
                getAllBookings(buildBookingQuery(1, 1, 'pending')),
            ]);

            setAllCount(allRes.data.data?.meta?.total ?? 0);
            setPendingCount(pendingRes.data.data?.meta?.total ?? 0);
        } catch {
            setAllCount(0);
            setPendingCount(0);
        }
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
            const m = error?.response?.data?.message ?? "Không xác định";
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
    }

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteBooking(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchBookings(buildBookingQuery(1, meta.pageSize, activeTab)));
                await loadTabCounts();
                toast.success('Xóa thành công');
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xóa user</div>
                    <div>{m}</div>
                </div>
            )
        } finally {
            setDeletingId(null);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            setProcessingId(id);
            await approveBooking(id);
            await dispatch(fetchBookings(buildBookingQuery(1, meta.pageSize, activeTab)));
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
            await dispatch(fetchBookings(buildBookingQuery(1, meta.pageSize, activeTab)));
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
            render: (_: any, __: IBooking, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Người dùng(ID)',
            dataIndex: 'userId',
            key: 'userId',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Tên người đặt',
            dataIndex: 'userName',
            key: 'userName',
            sorter: (a, b) =>
                (a.userName ?? '').localeCompare(b.userName ?? ''),
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Sân (ID)',
            dataIndex: 'pitchId',
            key: 'pitchId',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Tên sân',
            dataIndex: 'pitchName',
            key: 'pitchName',
            sorter: (a, b) =>
                (a.pitchName ?? '').localeCompare(b.pitchName ?? ''),
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Giờ thi đấu',
            key: 'timeRange',
            sorter: (a, b) =>
                toUnix(a.startDateTime) - toUnix(b.startDateTime),
            render: (_: any, record: IBooking) =>
                formatDateTimeRange(
                    record.startDateTime,
                    record.endDateTime
                ),
        },

        {
            title: 'Áo pitch',
            dataIndex: 'shirtOption',
            key: 'shirtOption',
            sorter: (a, b) =>
                (a.shirtOption ?? '').localeCompare(b.shirtOption ?? ''),
            render: (shirtOption?: IBooking['shirtOption']) =>
                shirtOption ? (
                    <Tag color={SHIRT_OPTION_META[shirtOption].color}>
                        {SHIRT_OPTION_META[shirtOption].label}
                    </Tag>
                ) : (
                    <Tag>Không xác định</Tag>
                ),
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'contactPhone',
            key: 'contactPhone',
            sorter: (a, b) =>
                (a.contactPhone ?? '').localeCompare(b.contactPhone ?? ''),
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) =>
                (a.status ?? '').localeCompare(b.status ?? ''),
            render: (status?: IBooking['status']) =>
                status ? (
                    <Tag color={BOOKING_STATUS_META[status].color}>
                        {BOOKING_STATUS_META[status].label}
                    </Tag>
                ) : (
                    <Tag>Không xác định</Tag>
                ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: any, record: IBooking) => (
                <Space align="center" style={{ justifyContent: "center", width: "100%" }}>

                    <PermissionWrapper required={"BOOKING_VIEW_DETAIL"}>
                        <Tooltip title="Xem chi tiết booking">
                            <RBButton variant="outline-info" size='sm'
                                onClick={() => handleView(record.id)}
                            >
                                <FaArrowsToEye />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>

                    <PermissionWrapper required={"BOOKING_UPDATE"}>
                        <Tooltip
                            title={record.status === "CANCELLED" || record.status === "PAID"
                                ? "Không thể sửa booking đã hủy hoặc đã thanh toán"
                                : "Chỉnh sửa booking"}
                        >
                            <RBButton
                                variant="outline-warning"
                                size='sm'
                                disabled={record.status === "CANCELLED" || record.status === "PAID"}
                                onClick={() => handleEdit(record)}
                            >
                                <CiEdit />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>

                    {record.status === "PENDING" && (
                        <PermissionWrapper required={"BOOKING_UPDATE"}>
                            <>
                                <RBButton
                                    variant="outline-success"
                                    size='sm'
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
                                    size='sm'
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

                    <PermissionWrapper required={"BOOKING_DELETE"}>
                        <Popconfirm
                            title="Xóa người dùng"
                            description="Bạn có chắc chắn muốn xóa người dùng này không?"
                            onConfirm={() => handleDelete(record.id)}
                            onCancel={cancel}
                            okText="Có"
                            cancelText="Không"
                            placement="topLeft"
                            okButtonProps={{
                                loading: deletingId === record.id
                            }}
                        >
                            <Tooltip title="Xóa booking">
                                <RBButton
                                    size='sm'
                                    variant="outline-danger"
                                    disabled={deletingId === record.id}
                                >
                                    <MdDelete />
                                </RBButton>
                            </Tooltip>
                        </Popconfirm>
                    </PermissionWrapper>
                </Space>
            ),
        },
    ];

    // fetch list bookings
    useEffect(() => {
        if (!canViewBookings) return;

        dispatch(fetchBookings(buildBookingQuery(1, meta.pageSize, activeTab)));
        void loadTabCounts();
    }, [activeTab, canViewBookings, dispatch]);

    return (
        <>
            <AdminWrapper>
                <Card
                    size='small'
                    title="Quản lý lịch đặt sân (booking)"
                    extra={
                        <Space align='center' >

                            <PermissionWrapper required={"BOOKING_CREATE"}>
                                <Tooltip title="Tạo lịch đặt sân mới">
                                    <RBButton variant="outline-primary"
                                        size='sm'
                                        style={{ display: "flex", alignItems: "center", gap: 3 }}
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
                                    onClick={() =>
                                        exportTableToExcel(columns, listBookings, 'bookings')
                                    }
                                >
                                    Xuất Excel
                                </Button>
                            </Tooltip>
                        </Space>
                    }
                    hoverable={false}
                    style={{ width: '100%', overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                    <PermissionWrapper required={"BOOKING_VIEW_LIST"}
                        fallback={<Empty description="Bạn không có quyền xem danh sách lịch đặt" />}
                    >
                        <Tabs
                            activeKey={activeTab}
                            onChange={(key) => setActiveTab(key as 'all' | 'pending')}
                            items={[
                                {
                                    key: 'all',
                                    label: <Space size={8}><span>Tất cả booking</span><Badge count={allCount} color="#1677ff" /></Space>,
                                },
                                {
                                    key: 'pending',
                                    label: <Space size={8}><span>Chờ duyệt</span><Badge count={pendingCount} color="#faad14" /></Space>,
                                },
                            ]}
                        />
                        <Table<IBooking>
                            columns={columns}
                            dataSource={listBookings}
                            rowKey="id"
                            loading={loading}
                            size='small'
                            pagination={{
                                current: meta.page,
                                pageSize: meta.pageSize,
                                total: meta.total,
                                showSizeChanger: true,
                                onChange: (page, pageSize) => {
                                    dispatch(fetchBookings(buildBookingQuery(page, pageSize, activeTab)));
                                },
                            }}
                            bordered
                            scroll={{ x: 'max-content' }} // scroll ngang nếu table quá rộng
                        />
                    </PermissionWrapper>
                </Card>

                <ModalAddBooking
                    openModalAddBooking={openModalAddBooking}
                    setOpenModalAddBooking={setOpenModalAddBooking}
                />

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
