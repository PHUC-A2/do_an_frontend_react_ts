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
    Space,
    // Grid
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import './BookingPage.scss';

const { Title } = Typography;
// const { useBreakpoint } = Grid;

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

// Mock data
const MOCK_PITCHES: Pitch[] = [
    { id: 1, name: "Sân bóng mini 3 người", pitchType: "THREE", pricePerHour: 250000, open24h: true, status: "ACTIVE", address: "ĐH Tây Bắc" },
    { id: 2, name: "Sân bóng 7 người", pitchType: "SEVEN", pricePerHour: 350000, open24h: true, status: "ACTIVE", address: "ĐH Tây Bắc" }
];

const MOCK_BOOKED_SLOTS: BookedSlot[] = [
    { start: "09:00", end: "10:30" },
    { start: "18:00", end: "19:00" }
];

const TIME_SLOTS = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "22:30"
];

interface BookingPageProps {
    theme: "light" | "dark";
}

const BookingPage: React.FC<BookingPageProps> = ({ theme }) => {
    const [pitches, setPitches] = useState<Pitch[]>([]);
    const [pitchId, setPitchId] = useState<number | null>(null);
    const [bookingDate, setBookingDate] = useState<Dayjs | null>(null);
    const [timeRange, setTimeRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [contactPhone, setContactPhone] = useState("");
    const [shirtOption, setShirtOption] = useState<"WITHOUT_PITCH_SHIRT" | "PITCH_SHIRT" | null>(null);

    const isDark = theme === "dark";
    // const screens = useBreakpoint();

    useEffect(() => {
        setPitches(MOCK_PITCHES);
    }, []);

    const isBooked = (time: string) => {
        const t = dayjs(time, "HH:mm");
        return MOCK_BOOKED_SLOTS.some(slot => {
            const start = dayjs(slot.start, "HH:mm");
            const end = dayjs(slot.end, "HH:mm");
            return (t.isSame(start) || (t.isAfter(start) && t.isBefore(end)));
        });
    };

    const isSelected = (time: string) => {
        const [start, end] = timeRange;
        if (!start || !end) return false;
        const t = dayjs(time, "HH:mm");
        return t.isSame(start) || t.isSame(end) || (t.isAfter(start) && t.isBefore(end));
    };

    const selectTime = (time: string) => {
        const t = dayjs(time, "HH:mm");
        const [start, end] = timeRange;

        if (!start || (start && end)) {
            setTimeRange([t, null]);
        } else if (start && !end) {
            if (t.isBefore(start)) {
                setTimeRange([t, start]);
            } else {
                setTimeRange([start, t]);
            }
        }
    };

    const buildBookingPayload = () => {
        if (!pitchId || !bookingDate || !timeRange[0] || !timeRange[1]) return null;
        return {
            pitchId,
            startDateTime: bookingDate.hour(timeRange[0].hour()).minute(timeRange[0].minute()).second(0).format("YYYY-MM-DDTHH:mm:ss"),
            endDateTime: bookingDate.hour(timeRange[1].hour()).minute(timeRange[1].minute()).second(0).format("YYYY-MM-DDTHH:mm:ss"),
            shirtOption,
            contactPhone
        };
    };

    const calculateTotalPrice = () => {
        if (!pitchId || !timeRange[0] || !timeRange[1]) return 0;
        const pitch = pitches.find(p => p.id === pitchId);
        if (!pitch) return 0;
        const durationMinutes = timeRange[1].diff(timeRange[0], "minute");
        return durationMinutes > 0 ? (durationMinutes / 60) * pitch.pricePerHour : 0;
    };

    const textColor = isDark ? "#fff" : "#000";
    const bgColor = isDark ? "#0d1a26" : "#fff";

    return (
        <Card
            className="booking-card"
            title="⚽ Đặt sân bóng"
            style={{ background: bgColor, color: textColor }}
            extra={<Button type="primary" onClick={() => console.log("BOOKING:", buildBookingPayload())}>Đặt sân</Button>}
        >
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Divider>📌 Chú thích</Divider>
                    <Space>
                        <Tag color="blue">Đang chọn</Tag>
                        <Tag color="red">Đã đặt</Tag>
                        <Tag color="gray">Trống</Tag>
                    </Space>
                </Col>

                <Col span={24}>
                    <Title level={5} style={{ color: textColor }}>🕒 Khung giờ</Title>
                    <div className="time-grid-wrapper">
                        <div className="time-grid">
                            {TIME_SLOTS.map(time => {
                                const booked = isBooked(time);
                                const selected = isSelected(time);
                                let status = booked ? "booked" : selected ? "selected" : "free";
                                return (
                                    <div
                                        key={time}
                                        className={`time-slot ${status}`}
                                        onClick={() => !booked && selectTime(time)}
                                        style={{
                                            cursor: booked ? "not-allowed" : "pointer",
                                            background: selected ? (isDark ? "#faad1440" : "#1890ff40") : "transparent",
                                            color: booked ? "red" : textColor,
                                            border: selected ? `2px solid ${isDark ? "#faad14" : "#1890ff"}` : "1px solid #ccc",
                                            borderRadius: 6,
                                            padding: 6,
                                            textAlign: "center",
                                            minWidth: 70
                                        }}
                                    >
                                        <div>{time}</div>
                                        <Tag color={booked ? "red" : selected ? "blue" : "gray"} style={{ marginTop: 4 }}>
                                            {booked ? "Đã đặt" : selected ? "Đang chọn" : "Trống"}
                                        </Tag>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Title level={5} style={{ color: textColor }}>Sân</Title>
                    <Select<number> placeholder="Chọn sân" value={pitchId ?? undefined} style={{ width: "100%" }} onChange={setPitchId}>
                        {pitches.map(p => <Select.Option key={p.id} value={p.id}>{p.name} – {p.pricePerHour.toLocaleString()}đ/giờ</Select.Option>)}
                    </Select>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Title level={5} style={{ color: textColor }}>Ngày</Title>
                    <DatePicker placeholder="Chọn ngày" style={{ width: "100%" }} format="DD/MM/YYYY" onChange={setBookingDate} />
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Title level={5} style={{ color: textColor }}>Giờ</Title>
                    <TimePicker.RangePicker placeholder={["Giờ bắt đầu", "Giờ kết thúc"]} style={{ width: "100%" }} format="HH:mm" minuteStep={5} onChange={v => setTimeRange(v ?? [null, null])} />
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Title level={5} style={{ color: textColor }}>Áo pitch</Title>
                    <Select placeholder="Lấy áo" value={shirtOption ?? undefined} style={{ width: "100%" }} onChange={setShirtOption}>
                        <Select.Option value="WITHOUT_PITCH_SHIRT">Không lấy áo</Select.Option>
                        <Select.Option value="PITCH_SHIRT">Có lấy áo</Select.Option>
                    </Select>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Title level={5} style={{ color: textColor }}>Điện thoại</Title>
                    <Input placeholder="SĐT liên hệ" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                </Col>

                <Col span={24}>
                    <Card style={{ marginTop: 16, background: bgColor, color: textColor }}>
                        <Row justify="space-between" align="middle">
                            <Title level={5} style={{ color: textColor }}>💰 Tổng tiền</Title>
                            <Title level={4} style={{ color: textColor }}>
                                {calculateTotalPrice().toLocaleString()} đ
                            </Title>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </Card>
    );
};

export default BookingPage;
