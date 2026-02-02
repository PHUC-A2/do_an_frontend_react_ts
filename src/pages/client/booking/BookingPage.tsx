import {
    Card,
    Col,
    DatePicker,
    Row,
    Typography,
    Space,
    Spin,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import "./BookingPage.scss";
import { PiSoccerBallFill } from "react-icons/pi";
import { useParams } from "react-router";
import type { IPitch } from "../../../types/pitch";
import { getPitchById } from "../../../config/Api";
import BookingTime from "./components/BookingTimeline";
import CreateBookingForm from "./components/CreateBookingForm";
import { useBookingTimeline } from "./hook/useBookingTimeline";

const { Title, Text } = Typography;

interface BookingPageProps {
    theme: "light" | "dark";
}

const BookingPage: React.FC<BookingPageProps> = ({ theme }) => {
    const isDark = theme === "dark";
    const { pitchId } = useParams<{ pitchId: string }>();
    const pitchIdNumber = Number(pitchId);

    const [bookingDate, setBookingDate] = useState<Dayjs | null>(dayjs());
    const [pitch, setPitch] = useState<IPitch | null>(null);
    const [pitchLoading, setPitchLoading] = useState(false);

    const {
        timeline,
        timelineLoading,
        reloadTimeline,
    } = useBookingTimeline(pitchIdNumber, bookingDate);

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
                    <Col xs={24} lg={16}>
                        <BookingTime
                            timelineLoading={timelineLoading}
                            timeline={timeline}
                        />
                    </Col>

                    <Col xs={24} lg={8}>
                        <Title level={5}>
                            📅 Chọn ngày để xem các khung giờ còn trống!
                        </Title>

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
                                🕒 Giờ mở cửa:{" "}
                                {formatTime(timeline?.openTime)} –{" "}
                                {formatTime(timeline?.closeTime)}
                            </Text>
                        </div>

                        {pitchLoading ? (
                            <Spin />
                        ) : (
                            pitch && (
                                <Card size="small" style={{ marginTop: 16 }}>
                                    <img
                                        src={
                                            pitch.pitchUrl ||
                                            "https://images.unsplash.com/photo-1574629810360-7efbbe195018"
                                        }
                                        alt={pitch.name ?? undefined}
                                        style={{
                                            width: "100%",
                                            height: 160,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            marginBottom: 12,
                                        }}
                                    />
                                    <Title level={5}>
                                        🏟 {pitch.name}
                                    </Title>
                                    <Text type="secondary">
                                        💸{" "}
                                        {pitch.pricePerHour.toLocaleString(
                                            "vi-VN"
                                        )}{" "}
                                        đ / giờ
                                    </Text>
                                </Card>
                            )
                        )}

                        <CreateBookingForm
                            pitchIdNumber={pitchIdNumber}
                            pitch={pitch}
                            pitchLoading={pitchLoading}
                            onSuccess={reloadTimeline}
                        />
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default BookingPage;
