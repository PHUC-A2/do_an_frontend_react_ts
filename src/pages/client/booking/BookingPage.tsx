import {
    Card,
    Col,
    DatePicker,
    Row,
    Typography,
    Tag,
    Space,
    message,
    Spin,
    Form,
    Select,
    Input,
    Button
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import "./BookingPage.scss";
import { PiSoccerBallFill } from "react-icons/pi";
import { IoMdClock } from "react-icons/io";
import { useParams } from "react-router";
import type { IPitchTimeline } from "../../../types/timeline";
import { createBookingClient, getTimeline } from "../../../config/Api";
import type { ICreateBookingClientReq, ShirtOptionEnum } from "../../../types/booking";
import { SHIRT_OPTION_OPTIONS } from "../../../utils/constants/booking.constants";
import { toast } from "react-toastify";
import { formatDateTime } from "../../../utils/format/localdatetime";

const { Title, Text } = Typography;

interface BookingPageProps {
    theme: "light" | "dark";
}

type BookingFormValues = {
    userId: number;
    pitchId: number;
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
    dateTimeRange: [Dayjs, Dayjs];
};

const BookingPage: React.FC<BookingPageProps> = ({ theme }) => {
    const isDark = theme === "dark";
    const { pitchId } = useParams<{ pitchId: string }>();
    const pitchIdNumber = Number(pitchId);

    const [bookingDate, setBookingDate] = useState<Dayjs | null>(dayjs());
    const [timeline, setTimeline] = useState<IPitchTimeline | null>(null);
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [form] = Form.useForm<BookingFormValues>();

    /* ===== FETCH TIMELINE ===== */
    useEffect(() => {
        if (!bookingDate || !pitchIdNumber) return;

        setTimelineLoading(true);
        getTimeline(pitchIdNumber, bookingDate.format("YYYY-MM-DD"))
            .then(res => setTimeline(res.data.data ?? null))
            .catch(() => message.error("Không lấy được timeline"))
            .finally(() => setTimelineLoading(false));
    }, [bookingDate, pitchIdNumber]);


    const handleBooking = async (values: BookingFormValues) => {
        setBookingLoading(true);
        const [start, end] = values.dateTimeRange;

        const payload: ICreateBookingClientReq = {
            pitchId: pitchIdNumber,
            shirtOption: values.shirtOption,
            contactPhone: values.contactPhone,
            startDateTime: start.format("YYYY-MM-DDTHH:mm:ss"),
            endDateTime: end.format("YYYY-MM-DDTHH:mm:ss"),
        };

        try {
            const res = await createBookingClient(payload);
            if (res.data.statusCode === 201) {
                toast.success("Đặt sân thành công");
                form.resetFields();
            }
            // refresh timeline
            getTimeline(pitchIdNumber, bookingDate!.format("YYYY-MM-DD"))
                .then(res => {
                    if (res.data.statusCode === 200) {
                        setTimeline(res.data.data ?? null)
                    }
                });
        } catch (e: any) {
            const m = e?.response?.data?.message ?? "Khung giờ không hợp lệ";
            toast.error(
                <div>
                    <div><strong>Có lỗi xảy ra!</strong></div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setBookingLoading(false);
        }
    };


    return (
        <div className={`luxury-card-wrapper ${isDark ? "dark" : "light"}`}>
            <Card
                className="booking-card"
                title={
                    <Space>
                        <PiSoccerBallFill size={24} />
                        <span>Lịch trống sân</span>
                    </Space>
                }
            >
                <Row gutter={[24, 24]}>

                    {/* ===== LEFT: TIMELINE ===== */}
                    <Col xs={24} lg={16}>
                        <Title level={5}>
                            <Space>
                                <IoMdClock size={22} />
                                <span>Timeline</span>
                            </Space>
                        </Title>

                        <Space style={{ marginBottom: 12 }}>
                            <Tag color="green">Trống</Tag>
                            <Tag color="red">Đã đặt</Tag>
                        </Space>

                        {timelineLoading ? (
                            <Spin />
                        ) : (
                            <div className="time-grid-wrapper">
                                <div className="time-grid">
                                    {timeline?.slots.map(slot => {
                                        const isBusy = slot.status === "BUSY";

                                        return (
                                            <div
                                                key={slot.start}
                                                className={`time-slot luxury ${isBusy ? "booked" : "free"}`}
                                            >
                                                <div className="slot-inner">
                                                    <div className="time">
                                                        {formatDateTime(slot.start, "HH:mm")}
                                                    </div>
                                                    <div className="label">
                                                        {isBusy ? "ĐÃ ĐẶT" : "TRỐNG"}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Col>

                    {/* ===== RIGHT: INFO ===== */}
                    <Col xs={24} lg={8}>
                        <Title level={5}>📅 Chọn ngày để xem các khung giờ còn trống!</Title>

                        <DatePicker
                            style={{ width: "100%" }}
                            value={bookingDate}
                            onChange={setBookingDate}
                            format="DD/MM/YYYY"
                        />

                        <div style={{ marginTop: 24 }}>
                            <Text type="warning">
                                ⏱ Slot: {timeline?.slotMinutes} phút
                            </Text>
                            <br />
                            <Text type="warning">
                                🕒 Giờ mở cửa: {timeline?.openTime} – {timeline?.closeTime}
                            </Text>
                        </div>
                    </Col>

                </Row>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleBooking}
                    style={{ marginTop: 24 }}
                >

                    <Form.Item
                        label="Thời gian đặt sân"
                        name="dateTimeRange"
                        rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
                    >
                        <DatePicker.RangePicker
                            showTime={{ format: "HH:mm" }}
                            format="YYYY-MM-DD HH:mm"
                            style={{ width: "100%" }}
                            minuteStep={5}
                            placeholder={["Thời gian bắt đầu", "Thời gian kết thúc"]}
                            disabledDate={d => d.isBefore(dayjs().startOf("day"))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Áo pitch"
                        name="shirtOption"
                        rules={[{ required: true }]}
                    >
                        <Select options={SHIRT_OPTION_OPTIONS} />
                    </Form.Item>

                    <Form.Item label="Số điện thoại" name="contactPhone">
                        <Input />
                    </Form.Item>

                    <Button type="primary" block loading={bookingLoading} htmlType="submit">
                        Đặt sân
                    </Button>
                </Form>

            </Card>
        </div>
    );
};

export default BookingPage;
