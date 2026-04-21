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
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { BOOKING_EQUIPMENT_STATUS_META } from "../../../../utils/constants/bookingEquipment.constants";
import { openBookingEquipmentHandoverPrint } from "../../../../utils/bookingEquipmentHandoverPrint";
import { normalizeBookingEquipmentFromApi, normalizeBookingEquipmentListFromApi } from "../../../../utils/bookingEquipmentNormalize";
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
    UserOutlined,
    DollarCircleOutlined,
    ToolOutlined,
    PrinterOutlined
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { cancelBookingClient, deleteBookingClient, clientGetAllMyEquipments, clientUpdateBookingEquipmentStatus, clientSoftDeleteBookingEquipment } from "../../../../config/Api";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import type { IBooking } from "../../../../types/booking";
import type { IBookingEquipment, IUpdateBookingEquipmentStatusReq } from "../../../../types/bookingEquipment";
import { notifyBookingChanged } from "../../../../redux/features/bookingUiSlice";
import PaymentDrawer from "./PaymentDrawer";
import { ClientReturnEquipmentModal } from "./ClientReturnEquipmentModal";

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

    const [allMyEquips, setAllMyEquips] = useState<IBookingEquipment[]>([]);
    const [returnModal, setReturnModal] = useState<{
        booking: IBooking | null;
        record: IBookingEquipment;
        preset: "full" | "lost" | "damaged";
    } | null>(null);

    const refreshMyEquips = useCallback(() => {
        clientGetAllMyEquipments()
            .then(res => setAllMyEquips(normalizeBookingEquipmentListFromApi(res.data.data ?? [])))
            .catch(() => { });
    }, []);

    // --- Equipment borrow history ---
    const [equipList, setEquipList] = useState<IBookingEquipment[]>([]);
    const [equipLoading, setEquipLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("1");
    const [activeCollapseKey, setActiveCollapseKey] = useState<string | string[]>();
    const [targetEquipmentId, setTargetEquipmentId] = useState<number | null>(null);
    const [highlightedEquipmentId, setHighlightedEquipmentId] = useState<number | null>(null);
    const [updatingEquipId, setUpdatingEquipId] = useState<number | null>(null);
    const [deletingEquipId, setDeletingEquipId] = useState<number | null>(null);
    const equipmentTabRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isAuthenticated && openModalBookingHistory) {
            dispatch(fetchBookingsClient(""));
            refreshMyEquips();
        }
    }, [dispatch, isAuthenticated, openModalBookingHistory, refreshMyEquips]);

    // Load toàn bộ lịch sử mượn thiết bị của user khi mở tab 3
    useEffect(() => {
        if (activeTab !== "3" || !isAuthenticated || !openModalBookingHistory) return;
        setEquipLoading(true);
        clientGetAllMyEquipments()
            .then(res => {
                const data = normalizeBookingEquipmentListFromApi(res.data.data ?? []);
                setEquipList(data);
                setAllMyEquips(data);
            })
            .catch(() => toast.error("Không tải được danh sách thiết bị"))
            .finally(() => setEquipLoading(false));
    }, [activeTab, isAuthenticated, openModalBookingHistory]);

    const handleUpdateEquipStatus = async (id: number, body: IUpdateBookingEquipmentStatusReq): Promise<IBookingEquipment | null> => {
        setUpdatingEquipId(id);
        try {
            const res = await clientUpdateBookingEquipmentStatus(id, body);
            if (Number(res.data.statusCode) === 200) {
                const updated = res.data.data != null ? normalizeBookingEquipmentFromApi(res.data.data) : null;
                toast.success("Cập nhật trạng thái thành công");
                const patch = (e: IBookingEquipment) =>
                    e.id === id && updated ? { ...e, ...updated } : e;
                setEquipList(prev => prev.map(patch));
                setAllMyEquips(prev => prev.map(patch));
                return updated ?? null;
            }
            return null;
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Lỗi cập nhật");
            return null;
        } finally {
            setUpdatingEquipId(null);
        }
    };

    const openClientReturnModal = (
        booking: IBooking | null,
        record: IBookingEquipment,
        preset: "full" | "lost" | "damaged"
    ) => {
        setReturnModal({ booking, record, preset });
    };

    const handleClientReturnSubmit = async (
        booking: IBooking | null,
        record: IBookingEquipment,
        req: IUpdateBookingEquipmentStatusReq,
        meta: {
            returnNote: string;
            g: number;
            l: number;
            d: number;
            returnReportPrintOptIn: boolean;
            borrowerSign: string;
            staffSign: string;
        }
    ) => {
        const updated = await handleUpdateEquipStatus(record.id, req);
        if (!updated) {
            throw new Error("keep-open");
        }
        if (meta.returnReportPrintOptIn && booking) {
            const { g, l, d, returnNote } = meta;
            const bSign = l + d > 0 ? meta.borrowerSign : "";
            const sSign = l + d > 0 ? meta.staffSign : "";
            const lineForPrint: IBookingEquipment = {
                ...record,
                ...updated,
                quantityReturnedGood: updated.quantityReturnedGood ?? g,
                quantityLost: updated.quantityLost ?? l,
                quantityDamaged: updated.quantityDamaged ?? d,
                borrowerSignName: updated.borrowerSignName ?? (bSign || null),
                staffSignName: updated.staffSignName ?? (sSign || null),
                returnConditionNote: returnNote || updated.returnConditionNote || null,
                status: updated.status,
                penaltyAmount: updated.penaltyAmount,
            };
            const list = allMyEquips
                .filter(e => e.bookingId === booking.id && !e.deletedByClient)
                .map(e => (e.id === record.id ? lineForPrint : e));
            openBookingEquipmentHandoverPrint(booking, list);
        }
        setReturnModal(null);
        dispatch(fetchBookingsClient(""));
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

    const equipsByBookingId = useMemo(() => {
        const m = new Map<number, IBookingEquipment[]>();
        for (const e of allMyEquips) {
            if (e.deletedByClient) continue;
            const arr = m.get(e.bookingId) ?? [];
            arr.push(e);
            m.set(e.bookingId, arr);
        }
        return m;
    }, [allMyEquips]);

    const openBookingFromEquipment = useCallback((bookingId: number) => {
        const booking = listBookingsClient.find(item => item.id === bookingId && !item.deletedByUser);
        if (!booking) {
            toast.error("Không tìm thấy lịch đặt tương ứng");
            return;
        }

        const isHistory = booking.status === "CANCELLED" || dayjs(booking.endDateTime).isBefore(dayjs());
        setActiveTab(isHistory ? "2" : "1");
        setActiveCollapseKey(String(bookingId));
    }, [listBookingsClient]);

    const openEquipmentFromBooking = useCallback((equipmentId: number) => {
        setTargetEquipmentId(equipmentId);
        setActiveTab("3");
    }, []);

    useEffect(() => {
        if (activeTab !== "3" || equipLoading || targetEquipmentId == null) return;

        const timer = window.setTimeout(() => {
            const row = equipmentTabRef.current?.querySelector(`tr[data-row-key="${targetEquipmentId}"]`) as HTMLElement | null;
            if (!row) return;
            row.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedEquipmentId(targetEquipmentId);
        }, 120);

        return () => window.clearTimeout(timer);
    }, [activeTab, equipLoading, targetEquipmentId, equipList.length]);

    useEffect(() => {
        if (highlightedEquipmentId == null) return;
        const timer = window.setTimeout(() => setHighlightedEquipmentId(null), 1800);
        return () => window.clearTimeout(timer);
    }, [highlightedEquipmentId]);

    // --- Render Items cho Collapse ---
    const renderCollapseItems = (bookings: any[]): CollapseProps["items"] => {
        return bookings.map((booking: IBooking) => {
            const bookingEquips = equipsByBookingId.get(booking.id) ?? [];

            const isEnded = dayjs(booking.endDateTime).isBefore(dayjs());
            const isPending = booking.status === "PENDING";
            const isPaid = booking.status === "PAID";
            const isCancelled = booking.status === "CANCELLED";
            const isActive = booking.status === "ACTIVE" || booking.status === "CONFIRMED";

            // Đang trong khung giờ đá
            const isPlaying = dayjs(booking.startDateTime).isBefore(dayjs())
                && dayjs(booking.endDateTime).isAfter(dayjs())
                && !isCancelled && booking.status !== "NO_SHOW";

            // Bỏ !isEnded → lịch sử ACTIVE/CONFIRMED chưa thanh toán vẫn hiện nút thanh toán
            const canPay = isActive && !isPaid;
            const canUpdate = (isActive || isPending) && !isEnded && !isPaid;
            const canCancel = (isActive || isPending) && !isEnded && !isPaid;
            const canDelete = isPaid || isCancelled || isEnded;

            return {
                key: booking.id,
                label: (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: '100%' }}>
                        <Space>
                            <EnvironmentOutlined style={{ color: isPlaying ? '#16A34A' : token.colorPrimary }} />
                            <Text strong style={{ color: isPlaying ? '#15803D' : undefined }}>{booking.pitchName}</Text>
                            {isPlaying && (
                                <Tag color="success" style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                                    ⚽ Đang đá
                                </Tag>
                            )}
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
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <Text type="secondary"><ToolOutlined /> Thiết bị mượn (kèm booking)</Text>
                                            {bookingEquips.length > 0 && (
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    icon={<PrinterOutlined />}
                                                    onClick={() => openBookingEquipmentHandoverPrint(booking, bookingEquips)}
                                                    style={{ padding: 0, height: 'auto' }}
                                                >
                                                    In
                                                </Button>
                                            )}
                                        </div>
                                        {bookingEquips.length === 0 ? (
                                            <Text type="secondary" style={{ fontSize: 12 }}>Không có thiết bị mượn qua hệ thống</Text>
                                        ) : (
                                            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                                                {bookingEquips.map(eq => (
                                                    <div
                                                        key={eq.id}
                                                        onClick={() => openEquipmentFromBooking(eq.id)}
                                                        style={{
                                                            fontSize: 12,
                                                            padding: '6px 8px',
                                                            borderRadius: 6,
                                                            background: 'rgba(0,0,0,0.04)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                                            <Text strong style={{ fontSize: 12 }}>{eq.equipmentName}</Text>
                                                            <Tag color={BOOKING_EQUIPMENT_STATUS_META[eq.status].color} style={{ margin: 0, fontSize: 11 }}>
                                                                {BOOKING_EQUIPMENT_STATUS_META[eq.status].label}
                                                            </Tag>
                                                        </div>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>SL: {eq.quantity}</Text>
                                                        {eq.borrowConditionNote ? (
                                                            <div style={{ fontSize: 11 }}>Mượn: {eq.borrowConditionNote}</div>
                                                        ) : null}
                                                        {eq.returnConditionNote ? (
                                                            <div style={{ fontSize: 11 }}>Trả: {eq.returnConditionNote}</div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </Space>
                                        )}
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
                                    {isPlaying && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            background: '#DCFCE7', borderRadius: 6, padding: '6px 10px',
                                        }}>
                                            <motion.span
                                                animate={{ opacity: [1, 0.2, 1] }}
                                                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                                                style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: '#16A34A', display: 'inline-block',
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <Text style={{ color: '#15803D', fontWeight: 600, fontSize: 13 }}>
                                                ⚽ Đang trong khung giờ đá
                                            </Text>
                                        </div>
                                    )}
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

                                        {isPending && (
                                            <Text type="warning" style={{ fontSize: 12 }}>
                                                ⏳ Đang chờ admin xác nhận
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
            setAllMyEquips(prev => prev.filter(e => e.id !== id));
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
            title: "Trả tốt",
            key: "qtyG",
            width: 52,
            render: (_: unknown, r: IBookingEquipment) =>
                r.status === "BORROWED" ? <Text type="secondary">—</Text> : (r.quantityReturnedGood ?? 0),
        },
        {
            title: "Mất",
            key: "qtyL",
            width: 44,
            render: (_: unknown, r: IBookingEquipment) =>
                r.status === "BORROWED" ? <Text type="secondary">—</Text> : (r.quantityLost ?? 0),
        },
        {
            title: "Hỏng",
            key: "qtyD",
            width: 44,
            render: (_: unknown, r: IBookingEquipment) =>
                r.status === "BORROWED" ? <Text type="secondary">—</Text> : (r.quantityDamaged ?? 0),
        },
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
            render: (_: any, record: IBookingEquipment) => (
                <Space size={4} wrap>
                    <Button size="small" onClick={() => openBookingFromEquipment(record.bookingId)}>
                        Xem lịch đặt
                    </Button>
                    {record.status === "BORROWED" ? (
                        <>
                            <Button
                                size="small"
                                type="primary"
                                loading={updatingEquipId === record.id}
                                onClick={() => {
                                    const b = listBookingsClient.find(x => x.id === record.bookingId);
                                    openClientReturnModal(b ?? null, record, "full");
                                }}
                            >
                                Trả
                            </Button>

                            <Button
                                size="small"
                                danger
                                loading={updatingEquipId === record.id}
                                onClick={() => {
                                    const b = listBookingsClient.find(x => x.id === record.bookingId);
                                    openClientReturnModal(b ?? null, record, "damaged");
                                }}
                            >
                                Hỏng
                            </Button>

                            <Button
                                size="small"
                                danger
                                loading={updatingEquipId === record.id}
                                onClick={() => {
                                    const b = listBookingsClient.find(x => x.id === record.bookingId);
                                    openClientReturnModal(b ?? null, record, "lost");
                                }}
                            >
                                Mất
                            </Button>
                        </>
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
                    )}
                </Space>
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
                                        <Collapse
                                            accordion
                                            ghost
                                            activeKey={activeTab === "1" ? activeCollapseKey : undefined}
                                            onChange={(key) => setActiveCollapseKey(key)}
                                            items={renderCollapseItems(upcomingBookings)}
                                        />
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
                                        <Collapse
                                            accordion
                                            ghost
                                            activeKey={activeTab === "2" ? activeCollapseKey : undefined}
                                            onChange={(key) => setActiveCollapseKey(key)}
                                            items={renderCollapseItems(historyBookings)}
                                        />
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
                                <div ref={equipmentTabRef} style={{ paddingTop: 12 }}>
                                    {equipList.length > 0 ? (
                                        <Table<IBookingEquipment>
                                            columns={equipColumns}
                                            dataSource={equipList}
                                            rowKey="id"
                                            size="small"
                                            loading={equipLoading}
                                            pagination={false}
                                            scroll={{ x: 'max-content' }}
                                            onRow={(record) => ({
                                                style: record.id === highlightedEquipmentId
                                                    ? {
                                                        background: 'rgba(22, 163, 74, 0.12)',
                                                        boxShadow: `inset 3px 0 0 ${token.colorPrimary}`,
                                                        transition: 'background-color 0.3s ease',
                                                    }
                                                    : {},
                                            })}
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

            <ClientReturnEquipmentModal
                open={!!returnModal}
                booking={returnModal?.booking ?? null}
                record={returnModal?.record ?? null}
                preset={returnModal?.preset ?? "full"}
                confirmLoading={returnModal != null && updatingEquipId === returnModal.record.id}
                onCancel={() => setReturnModal(null)}
                onSubmit={handleClientReturnSubmit}
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