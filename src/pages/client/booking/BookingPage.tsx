import {
    Card,
    Col,
    DatePicker,
    Row,
    Typography,
    Space,
    message,
    Spin,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import "./BookingPage.scss";
import { PiSoccerBallFill } from "react-icons/pi";
import { useParams } from "react-router";
import type { IPitchTimeline } from "../../../types/timeline";
import { getPitchById, getTimeline } from "../../../config/Api";
import type { IPitch } from "../../../types/pitch";
import BookingTime from "./components/BookingTimeline";
import CreateBookingForm from "./components/CreateBookingForm";

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
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [pitch, setPitch] = useState<IPitch | null>(null);
    const [pitchLoading, setPitchLoading] = useState(false);

    useEffect(() => {
        if (!pitchIdNumber) return;

        setPitchLoading(true);
        getPitchById(pitchIdNumber)
            .then(res => {
                if (res.data.statusCode === 200) {
                    setPitch(res.data.data ?? null);
                }
            })
            .finally(() => setPitchLoading(false));
    }, [pitchIdNumber]);

    /* ===== FETCH TIMELINE ===== */
    useEffect(() => {
        if (!bookingDate || !pitchIdNumber) return;

        setTimelineLoading(true);
        getTimeline(pitchIdNumber, bookingDate.format("YYYY-MM-DD"))
            .then(res => setTimeline(res.data.data ?? null))
            .catch(() => message.error("Không lấy được timeline"))
            .finally(() => setTimelineLoading(false));
    }, [bookingDate, pitchIdNumber]);



    const formatTime = (time?: string) =>
        time ? dayjs(`1970-01-01T${time}`).format("HH:mm") : "--:--";


    return (
        <div className={`luxury-card-wrapper ${isDark ? "dark" : "light"}`}>
            <Card
                className="booking-card"
                title={
                    <Space>
                        <PiSoccerBallFill size={24} />
                        <span>Đặt sân</span>
                    </Space>
                }
            >
                <Row gutter={[24, 24]}>

                    {/* ===== LEFT: TIMELINE ===== */}
                    <Col xs={24} lg={16}>
                        <BookingTime
                            timelineLoading={timelineLoading}
                            timeline={timeline}
                        />
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
                                🕒 Giờ mở cửa: {formatTime(timeline?.openTime)} – {formatTime(timeline?.closeTime)}
                            </Text>
                        </div>

                        {/* ===== PITCH INFO ===== */}
                        {pitchLoading ? (
                            <Spin />
                        ) : (
                            pitch && (
                                <Card size="small" style={{ marginTop: 16 }}>
                                    <img
                                        src={pitch.pitchUrl || `https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000`}
                                        alt={pitch.name || `Field`}
                                        style={{
                                            width: "100%",
                                            height: 160,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            marginBottom: 12
                                        }}
                                    />

                                    <Title level={5} style={{ marginBottom: 4 }}>
                                        🏟 {pitch.name}
                                    </Title>

                                    <Text type="secondary">
                                        💸 {pitch.pricePerHour.toLocaleString("vi-VN")} đ / giờ
                                    </Text>
                                </Card>
                            )
                        )}

                        {/* Create */}
                        <CreateBookingForm
                            pitchIdNumber={pitchIdNumber}
                            setTimeline={setTimeline}
                            bookingDate={bookingDate}
                            pitch={pitch}
                            pitchLoading={pitchLoading}
                        />
                    </Col>

                </Row>


            </Card>
        </div>
    );
};

export default BookingPage;
