import { Descriptions, Drawer, Spin, Tag } from "antd";
import type { IBooking } from "../../../../types/booking";
import { BOOKING_STATUS_META, SHIRT_OPTION_META } from "../../../../utils/constants/booking.constants";
import {formatDateTimeRange, formatInstant } from "../../../../utils/format/localdatetime";
import { formatVND } from "../../../../utils/format/price";
interface IProps {
    setOpenModalBookingDetails: (v: boolean) => void;
    openModalBookingDetails: boolean;
    booking: IBooking | null;
    isLoading: boolean;
}

const ModalBookingDetails = (props: IProps) => {

    const {
        openModalBookingDetails,
        setOpenModalBookingDetails,
        booking,
        isLoading
    } = props;

    return (
        <Drawer
            title="Chi tiết lịch đặt sân"
            placement="right"
            closable={false}
            onClose={() => setOpenModalBookingDetails(false)}
            open={openModalBookingDetails}
        >
            <Spin spinning={isLoading}>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="ID đặt sân">{booking?.id}</Descriptions.Item>
                    <Descriptions.Item label="ID người đặt">{booking?.userId}</Descriptions.Item>
                    <Descriptions.Item label="Tên người đặt">{booking?.userName ?? "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="ID sân">{booking?.pitchId}</Descriptions.Item>
                    <Descriptions.Item label="Tên sân">{booking?.pitchName ?? "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại liên hệ">{booking?.contactPhone ?? "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Giờ thi đấu">
                        {formatDateTimeRange(
                            booking?.startDateTime,
                            booking?.endDateTime
                        )}
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

                    <Descriptions.Item label="Thời lượng">
                        {booking?.durationMinutes
                            ? `${booking.durationMinutes} phút`
                            : "N/A"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tổng tiền">
                        <Tag color="green">
                            {formatVND(booking?.totalPrice)}
                        </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {
                            booking?.status ? (
                                <Tag color={BOOKING_STATUS_META[booking.status].color}>
                                    {BOOKING_STATUS_META[booking.status].label}
                                </Tag>
                            ) : (
                                <Tag>N/A</Tag>
                            )
                        }
                    </Descriptions.Item>



                    <Descriptions.Item label="Người tạo">
                        {booking?.createdBy ? booking.createdBy : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                        {formatInstant(booking?.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {booking?.updatedBy ? booking.updatedBy : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">
                        {formatInstant(booking?.updatedAt)}
                    </Descriptions.Item>

                </Descriptions>
            </Spin>
        </Drawer>
    )
}

export default ModalBookingDetails;