import {
    Card,
    Col,
    DatePicker,
    Row,
    Select,
    TimePicker,
    Divider,
    Tag,
    Input,
    Button,
    Typography,
    Space
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import './BookingPage.scss'

const { Title } = Typography;

/* ================== TYPES ================== */

interface Pitch {
    id: number;
    name: string;
    pitchType: "THREE" | "SEVEN";
    pricePerHour: number;
    open24h: boolean;
    status: "ACTIVE" | "INACTIVE";
    address: string;
}

interface BookedSlot {
    start: string; // HH:mm
    end: string;   // HH:mm
}

/* ================== MOCK DATA ================== */

// Mock danh sách sân (giống API bạn gửi)
const MOCK_PITCHES: Pitch[] = [
    {
        id: 1,
        name: "Sân bóng mini 3 người",
        pitchType: "THREE",
        pricePerHour: 250000,
        open24h: true,
        status: "ACTIVE",
        address: "ĐH Tây Bắc"
    },
    {
        id: 2,
        name: "Sân bóng 7 người",
        pitchType: "SEVEN",
        pricePerHour: 350000,
        open24h: true,
        status: "ACTIVE",
        address: "ĐH Tây Bắc"
    }
];

// Mock slot đã đặt (sau này gọi API theo pitchId + date)
const MOCK_BOOKED_SLOTS: BookedSlot[] = [
    { start: "09:00", end: "10:30" },
    { start: "18:00", end: "19:00" }
];

// Khung giờ sân
const TIME_SLOTS = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "22:30"
];

/* ================== COMPONENT ================== */

const BookingPage = () => {
    /* ===== STATE ===== */
    const [pitches, setPitches] = useState<Pitch[]>([]);
    const [pitchId, setPitchId] = useState<number | null>(null);
    const [bookingDate, setBookingDate] = useState<Dayjs | null>(null);
    const [timeRange, setTimeRange] = useState<[Dayjs | null, Dayjs | null]>([
        null,
        null
    ]);
    const [contactPhone, setContactPhone] = useState("");
    const [shirtOption, setShirtOption] =
        useState<"WITHOUT_PITCH_SHIRT" | "PITCH_SHIRT" | null>(null);

    /* ===== MOCK LOAD ===== */
    useEffect(() => {
        // giả lập call API
        setPitches(MOCK_PITCHES);
    }, []);

    /* ================== HELPERS ================== */

    const isBooked = (time: string) => {
        const t = dayjs(time, "HH:mm");

        return MOCK_BOOKED_SLOTS.some(slot => {
            const start = dayjs(slot.start, "HH:mm");
            const end = dayjs(slot.end, "HH:mm");

            return (
                (t.isSame(start) || t.isAfter(start)) &&
                t.isBefore(end)
            );
        });
    };

    const isSelected = (time: string) => {
        const [start, end] = timeRange;
        if (!start || !end) return false;

        const t = dayjs(time, "HH:mm");

        return (
            t.isSame(start) ||
            t.isSame(end) ||
            (t.isAfter(start) && t.isBefore(end))
        );
    };

    /* ================== TIMELINE ================== */

    // const timelineItems: TimelineProps["items"] = TIME_SLOTS.map(time => {
    //     const booked = isBooked(time);
    //     const selected = isSelected(time);

    //     let color: "red" | "blue" | "gray" = "gray";
    //     let label = "Trống";

    //     if (booked) {
    //         color = "red";
    //         label = "Đã đặt";
    //     } else if (selected) {
    //         color = "blue";
    //         label = "Đang chọn";
    //     }

    //     return {
    //         color,
    //         content: (
    //             <div style={{ textAlign: "center", minWidth: 80 }}>
    //                 <div>{time}</div>
    //                 <Tag color={color} style={{ marginTop: 4 }}>
    //                     {label}
    //                 </Tag>
    //             </div>
    //         )
    //     };
    // });

    /* ================== BUILD REQUEST ================== */

    const buildBookingPayload = () => {
        if (!pitchId || !bookingDate || !timeRange[0] || !timeRange[1]) {
            return null;
        }

        return {
            pitchId,
            startDateTime: bookingDate
                .hour(timeRange[0].hour())
                .minute(timeRange[0].minute())
                .second(0)
                .format("YYYY-MM-DDTHH:mm:ss"),
            endDateTime: bookingDate
                .hour(timeRange[1].hour())
                .minute(timeRange[1].minute())
                .second(0)
                .format("YYYY-MM-DDTHH:mm:ss"),
            shirtOption,
            contactPhone
        };
    };

    const calculateTotalPrice = () => {
        if (!pitchId || !timeRange[0] || !timeRange[1]) return 0;

        const pitch = pitches.find(p => p.id === pitchId);
        if (!pitch) return 0;

        const start = timeRange[0];
        const end = timeRange[1];

        const durationMinutes = end.diff(start, "minute");
        if (durationMinutes <= 0) return 0;

        const hours = durationMinutes / 60;

        return hours * pitch.pricePerHour;
    };


    /* ================== RENDER ================== */

    return (
        <>
            <Card
                className="booking-card"
                title="⚽ Đặt sân bóng"
                extra={
                    <Button
                        type="primary"
                        className="booking-submit-btn"
                        onClick={() => {
                            console.log("BOOKING REQUEST:", buildBookingPayload());
                        }}
                    >
                        Đặt sân
                    </Button>
                }
            >

                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Divider titlePlacement="start">📌 Chú thích</Divider>
                        <Space>
                            <Tag color="blue">Đang chọn</Tag>
                            <Tag color="red">Đã đặt</Tag>
                            <Tag color="gray">Trống</Tag>
                        </Space></Col>
                    <Col span={24}>
                        <Title level={5}>🕒 Khung giờ</Title>
                        {/* <Timeline
                            orientation="horizontal"
                            className="booking-timeline"
                            items={timelineItems}
                        /> */}

                        <div className="time-grid-wrapper">
                            <div className="time-grid">
                                {TIME_SLOTS.map(time => {
                                    const booked = isBooked(time);
                                    const selected = isSelected(time);

                                    let status = "free";
                                    let label = "Trống";

                                    if (booked) {
                                        status = "booked";
                                        label = "Đã đặt";
                                    } else if (selected) {
                                        status = "selected";
                                        label = "Đang chọn";
                                    }

                                    return (
                                        <div key={time} className={`time-slot ${status}`}>
                                            <div className="time">{time}</div>
                                            {/* <div className="line" /> */}
                                            <div className="dot" />
                                            <Tag color={status === "booked" ? "red" : status === "selected" ? "blue" : "gray"}>
                                                {label}
                                            </Tag>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </Col>

                    {/* ===== CHỌN SÂN (ID THẬT) ===== */}
                    <Col xs={24} sm={12} md={6}>
                        <Title level={5}>Sân</Title>
                        <Select<number>
                            placeholder="Chọn sân"
                            value={pitchId ?? undefined}
                            style={{ width: "100%" }}
                            onChange={setPitchId}
                        >
                            {pitches.map(p => (
                                <Select.Option key={p.id} value={p.id}>
                                    {p.name} – {p.pricePerHour.toLocaleString()}đ/giờ
                                </Select.Option>
                            ))}
                        </Select>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Title level={5}>Ngày</Title>
                        <DatePicker
                            placeholder="Chọn ngày"
                            style={{ width: "100%" }}
                            format="DD/MM/YYYY"
                            onChange={setBookingDate}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Title level={5}>Giờ</Title>
                        <TimePicker.RangePicker
                            placeholder={["Giờ bắt đầu", "Giờ kết thúc"]}
                            style={{ width: "100%" }}
                            format="HH:mm"
                            minuteStep={5}
                            onChange={v => setTimeRange(v ?? [null, null])}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Title level={5}>Áo pitch</Title>
                        <Select
                            placeholder="Lấy áo"
                            style={{ width: "100%" }}
                            value={shirtOption ?? undefined}
                            onChange={setShirtOption}
                        >
                            <Select.Option value="WITHOUT_PITCH_SHIRT">
                                Không lấy áo
                            </Select.Option>
                            <Select.Option value="PITCH_SHIRT">
                                Có lấy áo
                            </Select.Option>
                        </Select>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Title level={5}>Điện thoại</Title>
                        <Input
                            value={contactPhone}
                            onChange={e => setContactPhone(e.target.value)}
                            placeholder="SĐT liên hệ"
                        />
                    </Col>
                    <Col span={24}>
                        <Card className="booking-total-card" variant="borderless">
                            <Row justify="space-between" align="middle">
                                <Title level={5}>💰 Tổng tiền</Title>
                                <Title level={4} className="booking-total-price">
                                    {calculateTotalPrice().toLocaleString()} đ
                                </Title>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </Card>
        </>
    );
};

export default BookingPage;
