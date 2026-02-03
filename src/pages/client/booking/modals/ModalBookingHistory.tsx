import { Col, Collapse, Descriptions, Drawer, Popconfirm, Row, Space, Tag, type CollapseProps, type PopconfirmProps } from "antd";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { fetchBookingsClient, selectBookingsClient } from "../../../../redux/features/bookingClientSlice";
import { useEffect, useState } from "react";
import { SHIRT_OPTION_META } from "../../../../utils/constants/booking.constants";
import { formatVND } from "../../../../utils/format/price";
import { formatDateTime, formatDateTimeRange, formatInstant } from "../../../../utils/format/localdatetime";
import RBButton from 'react-bootstrap/Button';
import { CiEdit } from "react-icons/ci";
import { IoMdClock, IoMdCloseCircle } from "react-icons/io";
import { toast } from "react-toastify";
import { TbSoccerField } from "react-icons/tb";
import { useNavigate } from "react-router";
import { cancelBookingClient, deleteBookingClient } from "../../../../config/Api";
import dayjs from "dayjs";

interface IProps {
    openModalBookingHistory: boolean;
    setOpenModalBookingHistory: (v: boolean) => void;

}

const ModalBookingHistory = (props: IProps) => {
    const { openModalBookingHistory, setOpenModalBookingHistory } = props;
    const dispatch = useAppDispatch();
    const listBookingsClient = useAppSelector(selectBookingsClient);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(fetchBookingsClient("page=1&pageSize=7"));
    }, [dispatch]);

    const cancel: PopconfirmProps['onCancel'] = () => {
        toast.info('Đã bỏ chọn');
    };

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteBookingClient(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchBookingsClient(""));
                toast.success('Hủy sân thành công');
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
    const handleCancel = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await cancelBookingClient(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchBookingsClient(""));
                toast.success("Hủy sân thành công");
            }
        } catch (error: any) {
            console.log(error);
            toast.error(error?.response?.data?.message ?? "Có lỗi xảy ra");
        } finally {
            setDeletingId(null);
        }
    };

    const items: CollapseProps["items"] = listBookingsClient.map((booking) => {

        const now = dayjs();

        const isEnded = dayjs(booking.endDateTime).isBefore(now);

        const canUpdateBooking =
            booking.status === "ACTIVE" &&
            !booking.deletedByUser &&
            !isEnded;

        const canCancelBooking =
            booking.status === "ACTIVE" &&
            !isEnded;

        const canDeleteBooking =
            !booking.deletedByUser &&
            (booking.status === "CANCELLED" || isEnded);


        return {
            key: booking.id,
            label: (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                        <TbSoccerField size={20} style={{ marginBottom: 2 }} /> {booking.pitchName}
                    </span>
                    <span>
                        {formatDateTime(booking.startDateTime)}
                        {/* {dayjs(booking.startDateTime).format("DD/MM/YYYY HH:mm")} */}
                    </span>
                </div>
            ),
            children: (
                <Descriptions
                    size="small"
                    column={1}
                    bordered
                >

                    <Descriptions.Item label="Người đặt sân">
                        <Tag color="gold">
                            {booking.userName}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Giờ thi đấu">
                        {formatDateTimeRange(
                            booking?.startDateTime,
                            booking?.endDateTime
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Thời lượng">
                        {booking.durationMinutes} phút
                    </Descriptions.Item>

                    <Descriptions.Item label="Áo pitch">
                        {
                            booking?.shirtOption ? (
                                <Tag color={SHIRT_OPTION_META[booking?.shirtOption].color}>
                                    {SHIRT_OPTION_META[booking?.shirtOption].label}
                                </Tag>
                            ) : (
                                <Tag>N/A</Tag>
                            )
                        }
                    </Descriptions.Item>

                    <Descriptions.Item label="Tổng tiền">
                        <Tag color="green">
                            {formatVND(booking?.totalPrice)}
                        </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="SĐT liên hệ">
                        {booking.contactPhone}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày đặt sân">
                        {formatInstant(booking?.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">
                        {formatInstant(booking?.updatedAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thao tác">
                        <Row gutter={[0, 8]}>

                            {/* ===== UPDATE ===== */}
                            {canUpdateBooking && (
                                <Col span={24}>
                                    <RBButton
                                        variant="outline-warning"
                                        size="sm"
                                        style={{ width: "100%" }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenModalBookingHistory(false);
                                            navigate(`/booking/${booking.pitchId}`, {
                                                state: {
                                                    mode: "UPDATE",
                                                    bookingId: booking.id
                                                }
                                            });
                                        }}
                                    >
                                        <CiEdit /> Cập nhật lịch đặt
                                    </RBButton>
                                </Col>
                            )}

                            {/* ===== HỦY SÂN (chỉ ACTIVE) ===== */}
                            {canCancelBooking && (
                                <Col span={24}>
                                    <Popconfirm
                                        placement="topLeft"
                                        title="Hủy đặt sân"
                                        description="Bạn có chắc chắn muốn hủy đặt sân không?"
                                        onConfirm={() => handleCancel(booking.id)}
                                        okButtonProps={{ loading: deletingId === booking.id }}
                                        onCancel={cancel}
                                        okText="Có"
                                        cancelText="Không"
                                    >
                                        <RBButton
                                            variant="outline-danger"
                                            size="sm"
                                            style={{ width: "100%" }}
                                        >
                                            <IoMdCloseCircle /> Hủy sân
                                        </RBButton>
                                    </Popconfirm>
                                </Col>
                            )}

                            {/* ===== XÓA KHỎI LỊCH SỬ ===== */}
                            {canDeleteBooking && (
                                <Col span={24}>
                                    <Popconfirm
                                        placement="topLeft"
                                        title="Xóa khỏi lịch sử"
                                        description="Lịch đặt sẽ không hiển thị lại, bạn chắc chứ?"
                                        onConfirm={() => handleDelete(booking.id)}
                                        okButtonProps={{ loading: deletingId === booking.id }}
                                        onCancel={cancel}
                                        okText="Có"
                                        cancelText="Không"
                                    >
                                        <RBButton
                                            variant="outline-secondary"
                                            size="sm"
                                            style={{ width: "100%" }}
                                        >
                                            🗑️ Xóa khỏi lịch sử
                                        </RBButton>
                                    </Popconfirm>
                                </Col>
                            )}
                        </Row>
                    </Descriptions.Item>
                </Descriptions>
            ),
        }
    });

    return (
        <Drawer
            title={
                <Space>
                    <IoMdClock size={20} style={{ marginBottom: 2 }} />
                    <span>Lịch sử đặt sân</span>
                </Space>}
            placement="right"
            // closable={false}
            onClose={() => setOpenModalBookingHistory(false)}
            open={openModalBookingHistory}
            // size={250}
        >
            <Collapse accordion items={items} />
        </Drawer>
    );
};

export default ModalBookingHistory;
