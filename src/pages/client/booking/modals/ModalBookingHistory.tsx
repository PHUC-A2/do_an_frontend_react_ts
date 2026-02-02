import { Col, Collapse, Descriptions, Drawer, Popconfirm, Row, Tag, type CollapseProps, type PopconfirmProps } from "antd";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { fetchBookingsClient, selectBookingsClient } from "../../../../redux/features/bookingClientSlice";
import { useEffect } from "react";
import { SHIRT_OPTION_META } from "../../../../utils/constants/booking.constants";
import { formatVND } from "../../../../utils/format/price";
import { formatDateTime, formatDateTimeRange, formatInstant } from "../../../../utils/format/localdatetime";
import RBButton from 'react-bootstrap/Button';
import { CiEdit } from "react-icons/ci";
import { IoMdCloseCircle } from "react-icons/io";
import { toast } from "react-toastify";

interface IProps {
    openModalBookingHistory: boolean;
    setOpenModalBookingHistory: (v: boolean) => void;

}

const ModalBookingHistory = (props: IProps) => {
    const { openModalBookingHistory, setOpenModalBookingHistory } = props;
    const dispatch = useAppDispatch();
    const listBookingsClient = useAppSelector(selectBookingsClient);

    useEffect(() => {
        dispatch(fetchBookingsClient("page=1&pageSize=7"));
    }, [dispatch]);

    const cancel: PopconfirmProps['onCancel'] = () => {
        toast.info('Đã bỏ chọn');
    };

    const items: CollapseProps["items"] = listBookingsClient.map((booking) => ({
        key: booking.id,
        label: (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                    🏟️ {booking.pitchName}
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
                        <Col span={24}>
                            <RBButton
                                variant="outline-warning"
                                size="sm"
                                style={{ width: "100%" }}
                            >
                                <CiEdit /> Cập nhật lịch đặt
                            </RBButton>
                        </Col>

                        <Col span={24}>
                            <Popconfirm
                                title="Hủy đặt sân"
                                placement="topLeft"
                                description="Bạn có chắc chắn muốn hủy đặt sân không?"
                                okText="Có"
                                cancelText="Không"
                                onCancel={cancel}
                            // onConfirm={}
                            >
                                <RBButton
                                    variant="outline-danger"
                                    size="sm"
                                    style={{ width: "100%" }}
                                >
                                    <IoMdCloseCircle /> Hủy
                                </RBButton>
                            </Popconfirm>
                        </Col>
                    </Row>
                </Descriptions.Item>
            </Descriptions>
        ),
    }));

    return (
        <Drawer
            title="Lịch sử đặt sân"
            placement="right"
            closable={false}
            onClose={() => setOpenModalBookingHistory(false)}
            open={openModalBookingHistory}
            size={420}
        >
            <Collapse accordion items={items} />
        </Drawer>
    );
};

export default ModalBookingHistory;
