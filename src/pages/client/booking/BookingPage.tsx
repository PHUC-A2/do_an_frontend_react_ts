import {
    Card,
    Col,
    DatePicker,
    Row,
    Typography,
    Space,
    Spin,
    Tag,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import "./BookingPage.scss";
import { useLocation, useParams } from "react-router";
import type { IPitch } from "../../../types/pitch";
import { getPitchById } from "../../../config/Api";
import BookingTime from "./components/BookingTimeline";
import CreateBookingForm from "./components/CreateBookingForm";
import { useBookingTimeline } from "./hook/useBookingTimeline";
import { Button } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";
import { formatVND } from "../../../utils/format/price";
import {
    EnvironmentOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import { getPitchTypeLabel, PITCH_STATUS_META } from "../../../utils/constants/pitch.constants";
import { GrStatusGood } from "react-icons/gr";
import { MdDateRange, MdMergeType, MdPriceChange } from "react-icons/md";
import { GiSloth } from "react-icons/gi";
import { TbSoccerField } from "react-icons/tb";
import { IoMdClock } from "react-icons/io";
import UpdateBookingForm from "./components/UpdateBookingForm";
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

    const location = useLocation();

    const mode: "CREATE" | "UPDATE" = location.state?.mode ?? "CREATE";
    const bookingId: number | undefined = location.state?.bookingId;
    const [activePitchId, setActivePitchId] = useState(pitchIdNumber);

    const {
        timeline,
        timelineLoading,
        reloadTimeline,
    } = useBookingTimeline(activePitchId, bookingDate);
    
    useEffect(() => {
        if (!pitchIdNumber) return;
        setActivePitchId(pitchIdNumber);
    }, [pitchIdNumber]);

    // } = useBookingTimeline(pitchIdNumber, bookingDate);

    // useEffect(() => {
    //     if (!pitchIdNumber) return;

    //     setPitchLoading(true);
    // getPitchById(pitchIdNumber)
    // getPitchById(activePitchId)
    //         .then(res => {
    //             if (res.data.statusCode === 200) {
    //                 setPitch(res.data.data ?? null);
    //             }
    //         })
    //         .finally(() => setPitchLoading(false));
    // }, [pitchIdNumber]);
    useEffect(() => {
        if (!activePitchId) return;

        setPitchLoading(true);
        getPitchById(activePitchId)
            .then(res => {
                if (res.data.statusCode === 200) {
                    setPitch(res.data.data ?? null);
                }
            })
            .finally(() => setPitchLoading(false));
    }, [activePitchId]);

    return (
        <div className={`luxury-card-wrapper ${isDark ? "dark" : "light"}`}>
            <Card
                className="booking-card"
                title={
                    <Space>
                        <TbSoccerField style={{ marginBottom: 2 }} size={20} />
                        <span>{mode === "CREATE" ? "Tạo lịch đặt sân" : "Cập nhật lịch đặt sân"}</span> |
                        <Space>
                            <IoMdClock size={20} style={{ marginBottom: 2 }} />
                            <span>Timeline</span>
                            <Tag color="green">Trống</Tag>
                            <Tag color="red">Đã đặt</Tag>
                        </Space>
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

                    <Col xs={24} lg={8}
                        style={{ paddingTop: 12 }}
                    >
                        <Title level={5}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 8,
                            }}
                        >
                            <MdDateRange size={20} /> Chọn ngày để xem các khung giờ còn trống!
                        </Title>

                        <DatePicker
                            style={{ width: "100%" }}
                            value={bookingDate}
                            onChange={setBookingDate}
                            format="DD/MM/YYYY"
                            placeholder="Chọn ngày"
                        />



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

                                    <Title
                                        level={5}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            marginBottom: 8,
                                        }}
                                    >
                                        <TbSoccerField size={20} />
                                        {pitch.name}
                                    </Title>

                                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                        <Tag color="blue">
                                            <MdMergeType /> {getPitchTypeLabel(pitch.pitchType)}
                                        </Tag>

                                        <Tag color={PITCH_STATUS_META[pitch.status].color}>
                                            <GrStatusGood /> {PITCH_STATUS_META[pitch.status].label}
                                        </Tag>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        <Text type="warning">
                                            <EnvironmentOutlined /> Địa chỉ:
                                            <Tag color="success" style={{ marginLeft: 6 }}>
                                                {pitch.address}
                                            </Tag>
                                        </Text>

                                        <Text type="warning">
                                            <GiSloth /> Slot:
                                            <Tag color="success" style={{ marginLeft: 6 }}>
                                                {timeline?.slotMinutes} phút
                                            </Tag>
                                        </Text>

                                        <Text type="warning">
                                            <ClockCircleOutlined /> Giờ mở cửa:
                                            <Tag color="success" style={{ marginLeft: 6 }}>
                                                {pitch.open24h
                                                    ? "Mở cửa 24/7"
                                                    : `${pitch.openTime} - ${pitch.closeTime}`}
                                            </Tag>
                                        </Text>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            width: "100%",
                                        }}
                                    >
                                        <Text type="warning" strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <MdPriceChange />{" Giá: "}
                                            <Tag color="success">{formatVND(pitch.pricePerHour)} / giờ</Tag>
                                        </Text>

                                        <Button
                                            variant="outline-info"
                                            onClick={() => {
                                                if (pitch?.latitude == null || pitch?.longitude == null) return;

                                                const url = `https://www.google.com/maps/dir/?api=1&destination=${pitch.latitude},${pitch.longitude}`;
                                                window.open(url, "_blank");
                                            }}
                                            disabled={pitch?.latitude == null || pitch?.longitude == null}
                                            style={{ display: "flex", alignItems: "center", gap: 6 }}
                                        >
                                            <FaMapMarkerAlt />
                                            Chỉ đường
                                        </Button>
                                    </div>

                                </Card>
                            )
                        )}

                        {mode === "CREATE" && (
                            <CreateBookingForm
                                pitchIdNumber={pitchIdNumber}
                                pitch={pitch}
                                pitchLoading={pitchLoading}
                                onSuccess={reloadTimeline}
                            />
                        )}

                        {mode === "UPDATE" && bookingId && (
                            <UpdateBookingForm
                                bookingId={bookingId}
                                pitchIdNumber={pitchIdNumber}
                                pitch={pitch}
                                pitchLoading={pitchLoading}
                                onSuccess={reloadTimeline}
                                onPitchChange={setActivePitchId}
                            />
                        )}

                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default BookingPage;