import {
    Card,
    Col,
    DatePicker,
    Row,
    Typography,
    Tag,
    Space,
    message,
    Spin
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import "./BookingPage.scss";
import { PiSoccerBallFill } from "react-icons/pi";
import { IoMdClock } from "react-icons/io";
import { useParams } from "react-router";
import type { IPitchTimeline } from "../../../types/timeline";
import { getTimeline } from "../../../config/Api";

const { Title, Text } = Typography;

interface BookingPageProps {
    theme: "light" | "dark";
}

const BookingPage: React.FC<BookingPageProps> = ({ theme }) => {
    const isDark = theme === "dark";
    const { pitchId } = useParams<{ pitchId: string }>();
    const pitchIdNumber = Number(pitchId);

    const [bookingDate, setBookingDate] = useState<Dayjs | null>(dayjs());
    const [timeline, setTimeline] = useState<IPitchTimeline | null>(null);
    const [loading, setLoading] = useState(false);

    /* ===== FETCH TIMELINE ===== */
    useEffect(() => {
        if (!bookingDate || !pitchIdNumber) return;

        setLoading(true);
        getTimeline(pitchIdNumber, bookingDate.format("YYYY-MM-DD"))
            .then(res => setTimeline(res.data.data ?? null))
            .catch(() => message.error("Không lấy được timeline"))
            .finally(() => setLoading(false));
    }, [bookingDate, pitchIdNumber]);

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

                        {loading ? (
                            <Spin />
                        ) : (
                            <div className="time-grid-wrapper">
                                <div className="time-grid">
                                    {timeline?.slots.map(slot => {
                                        const isBusy = slot.status === "BUSY";

                                        return (
                                            <div
                                                key={slot.start}
                                                className={`time-slot luxury ${isBusy ? "booked" : "free"
                                                    }`}
                                            >
                                                <div className="slot-inner">
                                                    <div className="time">
                                                        {dayjs(slot.start).format("HH:mm")}
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
                            <Text type="secondary">
                                ⏱ Slot: {timeline?.slotMinutes} phút
                            </Text>
                            <br />
                            <Text type="secondary">
                                🕒 Giờ mở cửa: {timeline?.openTime} – {timeline?.closeTime}
                            </Text>
                        </div>
                    </Col>

                </Row>
            </Card>
        </div>
    );
};

export default BookingPage;
