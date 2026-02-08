import {
    Col,
    Collapse,
    Drawer,
    Empty,
    Popconfirm,
    Row,
    Space,
    Tag,
    Tabs,
    Button,
    Typography,
    Divider,
    theme,
    type CollapseProps,
    type PopconfirmProps
} from "antd";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { fetchBookingsClient, selectBookingsClient } from "../../../../redux/features/bookingClientSlice";
import { useEffect, useState, useMemo } from "react";
import { SHIRT_OPTION_META } from "../../../../utils/constants/booking.constants";
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
    DollarCircleOutlined
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { cancelBookingClient, deleteBookingClient } from "../../../../config/Api";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import type { IBooking } from "../../../../types/booking";

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

    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        if (isAuthenticated && openModalBookingHistory) {
            dispatch(fetchBookingsClient(""));
        }
    }, [dispatch, isAuthenticated, openModalBookingHistory]);

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
                toast.success("Hủy sân thành công");
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
            const isEnded = dayjs(booking.endDateTime).isBefore(dayjs());
            const shirtMeta = booking?.shirtOption
                ? SHIRT_OPTION_META[booking.shirtOption as keyof typeof SHIRT_OPTION_META]
                : null;

            const canUpdate = booking.status === "ACTIVE" && !isEnded;
            const canCancel = booking.status === "ACTIVE" && !isEnded;
            const canDelete = booking.status === "CANCELLED" || isEnded;

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
                    defaultActiveKey="1"
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
                        }
                    ]}
                />
            )}
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