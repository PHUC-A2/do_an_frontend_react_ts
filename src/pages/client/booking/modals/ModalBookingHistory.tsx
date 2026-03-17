import {
    Col,
    Collapse,
    Drawer,
    Empty,
    Image,
    Popconfirm,
    Row,
    Space,
    Tag,
    Tabs,
    Button,
    Typography,
    Divider,
    theme,
    Table,
    type CollapseProps,
    type PopconfirmProps
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { fetchBookingsClient, selectBookingsClient } from "../../../../redux/features/bookingClientSlice";
import { useEffect, useState, useMemo } from "react";
import { SHIRT_OPTION_META } from "../../../../utils/constants/booking.constants";
import { BOOKING_EQUIPMENT_STATUS_META } from "../../../../utils/constants/bookingEquipment.constants";
import { formatVND } from "../../../../utils/format/price";
import { formatDateTimeRange, formatInstant } from "../../../../utils/format/localdatetime";
import {
    EditOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    HistoryOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
    SkinOutlined,
    UserOutlined,
    DollarCircleOutlined,
    ToolOutlined
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { cancelBookingClient, deleteBookingClient, clientGetAllMyEquipments, clientUpdateBookingEquipmentStatus, clientSoftDeleteBookingEquipment } from "../../../../config/Api";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import type { IBooking } from "../../../../types/booking";
import type { IBookingEquipment } from "../../../../types/bookingEquipment";
import { notifyBookingChanged } from "../../../../redux/features/bookingUiSlice";
import PaymentDrawer from "./PaymentDrawer";

const { Text } = Typography;

interface IProps {
    openModalBookingHistory: boolean;
    setOpenModalBookingHistory: (v: boolean) => void;
}

const ModalBookingHistory = (props: IProps) => {
    const { openModalBookingHistory, setOpenModalBookingHistory } = props;
    const { token } = theme.useToken();
    const dispatch = useAppDispatch();
    const listBookingsClient = useAppSelector(selectBookingsClient);
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
    const navigate = useNavigate();
    const [openPaymentDrawer, setOpenPaymentDrawer] = useState(false);
    const [payBookingId, setPayBookingId] = useState<number | null>(null);

    const [deletingId, setDeletingId] = useState<number | null>(null);

    // --- Equipment borrow history ---
    const [equipList, setEquipList] = useState<IBookingEquipment[]>([]);
    const [equipLoading, setEquipLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("1");
    const [updatingEquipId, setUpdatingEquipId] = useState<number | null>(null);
    const [deletingEquipId, setDeletingEquipId] = useState<number | null>(null);

    useEffect(() => {
        if (isAuthenticated && openModalBookingHistory) {
            dispatch(fetchBookingsClient(""));
        }
    }, [dispatch, isAuthenticated, openModalBookingHistory]);

    // Load toàn bộ lịch sử mượn thiết bị của user khi mở tab 3
    useEffect(() => {
        if (activeTab !== "3" || !isAuthenticated || !openModalBookingHistory) return;
        setEquipLoading(true);
        clientGetAllMyEquipments()
            .then(res => setEquipList(res.data.data ?? []))
            .catch(() => toast.error("Không tải được danh sách thiết bị"))
            .finally(() => setEquipLoading(false));
    }, [activeTab, isAuthenticated, openModalBookingHistory]);

    const handleUpdateEquipStatus = async (id: number, status: string) => {
        setUpdatingEquipId(id);
        try {
            const res = await clientUpdateBookingEquipmentStatus(id, { status: status as any });
            if (res.data.statusCode === 200) {
                const updated = res.data.data;
                toast.success("Cập nhật trạng thái thành công");
                setEquipList(prev => prev.map(e =>
                    e.id === id ? { ...e, status: status as any, penaltyAmount: updated?.penaltyAmount ?? 0 } : e
                ));
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Lỗi cập nhật");
        } finally {
            setUpdatingEquipId(null);
        }
    };

    const cancel: PopconfirmProps['onCancel'] = () => {
        toast.info('Đã bỏ chọn');
    };

    // --- Actions ---
    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteBookingClient(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchBookingsClient(""));
                toast.success('Đã xóa khỏi lịch sử');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Lỗi xóa lịch sử");
        } finally {
            setDeletingId(null);
        }
    };

    const handleCancel = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await cancelBookingClient(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchBookingsClient(""));
                dispatch(notifyBookingChanged()); //
                toast.success("Hủy sân thành công");
                // Điều hướng về booking page + báo reload
                // setOpenModalBookingHistory(false);
                // navigate(`/booking/${pitchId}`, {
                //     state: { reloadTimeline: true }
                // });
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Lỗi hủy sân");
        } finally {
            setDeletingId(null);
        }
    };

    // --- Phân loại dữ liệu ---
    const { upcomingBookings, historyBookings } = useMemo(() => {
        const now = dayjs();
        const upcoming: any[] = [];
        const history: any[] = [];

        listBookingsClient.forEach(b => {
            if (!b.deletedByUser) {
                const isEnded = dayjs(b.endDateTime).isBefore(now);
                const isCancelled = b.status === "CANCELLED";
                (isEnded || isCancelled) ? history.push(b) : upcoming.push(b);
            }
        });

        upcoming.sort((a, b) => dayjs(a.startDateTime).valueOf() - dayjs(b.startDateTime).valueOf());
        history.sort((a, b) => dayjs(b.startDateTime).valueOf() - dayjs(a.startDateTime).valueOf());

        return { upcomingBookings: upcoming, historyBookings: history };
    }, [listBookingsClient]);

    // --- Render Items cho Collapse ---
    const renderCollapseItems = (bookings: any[]): CollapseProps["items"] => {
        return bookings.map((booking: IBooking) => {
            const shirtMeta = booking?.shirtOption
                ? SHIRT_OPTION_META[booking.shirtOption as keyof typeof SHIRT_OPTION_META]
                : null;


            const isEnded = dayjs(booking.endDateTime).isBefore(dayjs());
            const isPaid = booking.status === "PAID";
            const isCancelled = booking.status === "CANCELLED";

            const canPay = booking.status === "ACTIVE" && !isEnded && !isPaid;
            const canUpdate = booking.status === "ACTIVE" && !isEnded && !isPaid;
            const canCancel = booking.status === "ACTIVE" && !isEnded && !isPaid;
            const canDelete = isPaid || isCancelled || isEnded;

            return {
                key: booking.id,
                label: (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: '100%' }}>
                        <Space>
                            <EnvironmentOutlined style={{ color: token.colorPrimary }} />
                            <Text strong>{booking.pitchName}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(booking.startDateTime).format(" HH:mm DD/MM/YYYY")}
                        </Text>
                    </div>
                ),
                children: (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ padding: '4px 0' }}
                    >
                        <Row gutter={[0, 12]}>
                            <Col span={24}>
                                <Space orientation="vertical" style={{ width: '100%', background: token.colorFillAlter, padding: 12, borderRadius: 8 }} size={8}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary"><UserOutlined /> Người đặt:</Text>
                                        <Text strong>{booking.userName}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary"><ClockCircleOutlined /> Thời gian:</Text>
                                        <Text>{formatDateTimeRange(booking.startDateTime, booking.endDateTime)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary"><ClockCircleOutlined /> Thời lượng:</Text>
                                        <Text>{booking.durationMinutes} phút</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary"><SkinOutlined /> Áo Pitch:</Text>
                                        {shirtMeta ? <Tag color={shirtMeta.color} style={{ margin: 0 }}>{shirtMeta.label}</Tag> : <Text>Không</Text>}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary"><PhoneOutlined /> Liên hệ:</Text>
                                        <Text copyable>{booking.contactPhone}</Text>
                                    </div>
                                    <Divider style={{ margin: '4px 0' }} dashed />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary"><DollarCircleOutlined /> Tổng tiền:</Text>
                                        <Text strong style={{ color: token.colorSuccess, fontSize: 16 }}>{formatVND(booking.totalPrice)}</Text>
                                    </div>
                                </Space>
                            </Col>

                            <Col span={24}>
                                <Row justify="space-between" align="middle">
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={() => {
                                            setOpenModalBookingHistory(false);
                                            navigate(`/pitch/${booking.pitchId}`)
                                        }}
                                    >
                                        Xem sân
                                    </Button>
                                    <Space
                                    // style={{ width: '100%', justifyContent: 'flex-end' }}
                                    >
                                        {canUpdate && (
                                            <Button
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={() => {
                                                    setOpenModalBookingHistory(false);
                                                    navigate(`/booking/${booking.pitchId}`, { state: { mode: "UPDATE", bookingId: booking.id } });
                                                }}
                                            >Sửa</Button>
                                        )}
                                        {canCancel && (
                                            <Popconfirm
                                                title="Hủy đặt sân?"
                                                onConfirm={() => handleCancel(booking.id)}
                                                okButtonProps={{ danger: true, loading: deletingId === booking.id }}
                                                cancelText="Không"
                                                okText="Có"
                                                placement="topLeft"
                                                onCancel={cancel}
                                            >
                                                <Button size="small" danger icon={<CloseCircleOutlined />}>Hủy</Button>
                                            </Popconfirm>
                                        )}
                                        {canDelete && (
                                            <Popconfirm
                                                title="Xóa lịch sử?"
                                                onConfirm={() => handleDelete(booking.id)}
                                                okButtonProps={{ loading: deletingId === booking.id }}
                                                cancelText="Không"
                                                okText="Có"
                                                placement="topLeft"
                                                onCancel={cancel}
                                            >
                                                <Button size="small" type="text" danger icon={<DeleteOutlined />}>Xóa</Button>
                                            </Popconfirm>
                                        )}

                                        {canPay && (
                                            <Button
                                                size="small"
                                                type="primary"
                                                icon={<DollarCircleOutlined />}
                                                onClick={() => {
                                                    setOpenModalBookingHistory(false);
                                                    setPayBookingId(booking.id);
                                                    setOpenPaymentDrawer(true);
                                                }}

                                            >
                                                Thanh toán
                                            </Button>
                                        )}

                                        {isPaid && (
                                            <Text type="success" style={{ fontSize: 12 }}>
                                                ✅ Đã thanh toán
                                            </Text>
                                        )}

                                    </Space>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Row justify="space-between">
                                    <Text type="secondary" style={{ fontSize: 10 }}>
                                        Tạo: {formatInstant(booking.createdAt)}
                                    </Text>

                                    <Text type="secondary" style={{ fontSize: 10 }}>
                                        Cập nhật: {formatInstant(booking.updatedAt)}
                                    </Text>
                                </Row>
                            </Col>
                        </Row>
                    </motion.div>
                )
            };
        });
    };

    const handleDeleteEquip = async (id: number) => {
        setDeletingEquipId(id);
        try {
            await clientSoftDeleteBookingEquipment(id);
            toast.success("Đã xóa khỏi danh sách");
            setEquipList(prev => prev.filter(e => e.id !== id));
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Lỗi xóa");
        } finally {
            setDeletingEquipId(null);
        }
    };

    const equipColumns: ColumnsType<IBookingEquipment> = [
        {
            title: "Thiết bị",
            dataIndex: "equipmentName",
            key: "equipmentName",
            render: (name: string, record: IBookingEquipment) => (
                <Space>
                    {record.equipmentImageUrl && (
                        <Image
                            src={`/storage/equipment/${record.equipmentImageUrl}`}
                            alt={name}
                            width={28}
                            height={28}
                            style={{ objectFit: "cover", borderRadius: 4 }}
                            preview={{ mask: false }}
                        />
                    )}
                    <span style={{ fontSize: 13 }}>{name}</span>
                </Space>
            ),
        },
        { title: "SL", dataIndex: "quantity", key: "quantity", width: 50 },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status: IBookingEquipment["status"], record: IBookingEquipment) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Tag color={BOOKING_EQUIPMENT_STATUS_META[status].color} style={{ margin: 0, fontSize: 11 }}>
                        {BOOKING_EQUIPMENT_STATUS_META[status].label}
                    </Tag>
                    {status === "LOST" && record.penaltyAmount > 0 && (
                        <Text type="danger" style={{ fontSize: 11 }}>
                            Đền: {formatVND(record.penaltyAmount)}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: "Cập nhật",
            key: "action",
            render: (_: any, record: IBookingEquipment) =>
                record.status === "BORROWED" ? (
                    <Space size={4}>
                        {/* Trả bình thường */}
                        <Popconfirm
                            title="Xác nhận đã trả thiết bị?"
                            okText="Đã trả"
                            cancelText="Huỷ"
                            onConfirm={() => handleUpdateEquipStatus(record.id, "RETURNED")}
                        >
                            <Button size="small" type="primary" loading={updatingEquipId === record.id}>
                                Trả
                            </Button>
                        </Popconfirm>

                        {/* Báo hỏng */}
                        <Popconfirm
                            title="Báo thiết bị bị hỏng?"
                            description="Thiết bị sẽ bị loại khỏi kho."
                            okText="Xác nhận"
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleUpdateEquipStatus(record.id, "DAMAGED")}
                        >
                            <Button size="small" danger loading={updatingEquipId === record.id}>
                                Hỏng
                            </Button>
                        </Popconfirm>

                        {/* Báo mất — hiện tiền đền trước khi confirm */}
                        <Popconfirm
                            title="Báo thiết bị bị mất?"
                            description={
                                <span>
                                    Tiền đền: <strong style={{ color: "#ff4d4f" }}>
                                        {formatVND(record.quantity * record.equipmentPrice)}
                                    </strong>
                                    <br />Khoản này sẽ được tính vào booking.
                                </span>
                            }
                            okText="Xác nhận mất"
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleUpdateEquipStatus(record.id, "LOST")}
                        >
                            <Button size="small" danger loading={updatingEquipId === record.id}>
                                Mất
                            </Button>
                        </Popconfirm>
                    </Space>
                ) : (
                    <Popconfirm
                        title="Xóa khỏi danh sách?"
                        description="Bản ghi sẽ bị xóa khỏi lịch sử của bạn, admin vẫn lưu trữ."
                        okText="Xóa"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeleteEquip(record.id)}
                    >
                        <Button
                            size="small"
                            danger
                            loading={deletingEquipId === record.id}
                        >
                            Xóa
                        </Button>
                    </Popconfirm>
                ),
        },
    ];

    return (
        <Drawer
            title={
                <Space>
                    <HistoryOutlined style={{ color: token.colorPrimary }} />
                    <span style={{ fontWeight: 700 }}>Quản lý lịch đặt</span>
                </Space>
            }
            placement="right"
            onClose={() => setOpenModalBookingHistory(false)}
            open={openModalBookingHistory}
            size={420}
            styles={{ body: { padding: '0 12px' } }}
        >
            {!isAuthenticated ? (
                <Empty description="Vui lòng đăng nhập" style={{ marginTop: 100 }} />
            ) : (
                <Tabs
                    centered
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: '1',
                            label: (
                                <Space>
                                    <ClockCircleOutlined /> Sắp đá
                                    <BadgeCount count={upcomingBookings.length} color={token.colorPrimary} />
                                </Space>
                            ),
                            children: (
                                <div style={{ paddingTop: 12 }}>
                                    {upcomingBookings.length > 0 ? (
                                        <Collapse accordion ghost items={renderCollapseItems(upcomingBookings)} />
                                    ) : <Empty description="Không có lịch sắp tới" />}
                                </div>
                            )
                        },
                        {
                            key: '2',
                            label: (
                                <Space>
                                    <HistoryOutlined /> Lịch sử
                                </Space>
                            ),
                            children: (
                                <div style={{ paddingTop: 12 }}>
                                    {historyBookings.length > 0 ? (
                                        <Collapse accordion ghost items={renderCollapseItems(historyBookings)} />
                                    ) : <Empty description="Chưa có lịch sử" />}
                                </div>
                            )
                        },
                        {
                            key: '3',
                            label: (
                                <Space>
                                    <ToolOutlined /> Thiết bị mượn
                                    <BadgeCount count={equipList.length} color={token.colorWarning} />
                                </Space>
                            ),
                            children: (
                                <div style={{ paddingTop: 12 }}>
                                    {equipList.length > 0 ? (
                                        <Table<IBookingEquipment>
                                            columns={equipColumns}
                                            dataSource={equipList}
                                            rowKey="id"
                                            size="small"
                                            loading={equipLoading}
                                            pagination={false}
                                            scroll={{ x: 'max-content' }}
                                        />
                                    ) : (
                                        <Empty description={equipLoading ? "Đang tải..." : "Chưa có thiết bị mượn"} />
                                    )}
                                </div>
                            )
                        }
                    ]}
                />
            )}

            <PaymentDrawer
                open={openPaymentDrawer}
                bookingId={payBookingId}
                onClose={() => {
                    setOpenPaymentDrawer(false);
                    setPayBookingId(null);
                }}
            />

        </Drawer>
    );
};

// Component con hỗ trợ Badge số lượng
const BadgeCount = ({ count, color }: { count: number, color: string }) => (
    <span style={{
        background: color,
        color: '#fff',
        borderRadius: 10,
        padding: '0 6px',
        fontSize: 10,
        height: 16,
        display: 'inline-flex',
        alignItems: 'center'
    }}>
        {count}
    </span>
);

export default ModalBookingHistory;