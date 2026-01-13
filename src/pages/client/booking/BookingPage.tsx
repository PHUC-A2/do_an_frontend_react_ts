import {
    Card,
    Col,
    DatePicker,
    Row,
    Select,
    Input,
    Button,
    Typography,
    Divider,
    Tag,
    Space,
    TimePicker,
    message
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import "./BookingPage.scss";
import { PiSoccerBallFill } from "react-icons/pi";
import { IoMdClock } from "react-icons/io";

const { Title } = Typography;

/* ================= TYPES ================= */

interface Pitch {
    id: number;
    name: string;
    pricePerHour: number;
}

interface BookedSlot {
    start: string; // HH:mm
    end: string;
}

/* ================= MOCK ================= */

const MOCK_PITCHES: Pitch[] = [
    { id: 1, name: "Sân 3 người", pricePerHour: 250000 },
    { id: 2, name: "Sân 7 người", pricePerHour: 350000 }
];

const MOCK_BOOKED_SLOTS: BookedSlot[] = [
    { start: "09:00", end: "10:30" },
    { start: "18:00", end: "19:00" }
];

const TIME_SLOTS = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00"
];

/* ================= COMPONENT ================= */

const BookingPage = () => {
    const [pitches, setPitches] = useState<Pitch[]>([]);
    const [pitchId, setPitchId] = useState<number>();
    const [bookingDate, setBookingDate] = useState<Dayjs | null>(null);
    const [timeRange, setTimeRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [contactPhone, setContactPhone] = useState("");
    const [shirtOption, setShirtOption] = useState<string>();

    useEffect(() => {
        setPitches(MOCK_PITCHES);
    }, []);

    /* ===== BOOKED CHECK ===== */

    const isOverlappingBooked = (start: Dayjs, end: Dayjs) => {
        return MOCK_BOOKED_SLOTS.some(slot => {
            const s = dayjs(slot.start, "HH:mm");
            const e = dayjs(slot.end, "HH:mm");
            return start.isBefore(e) && end.isAfter(s);
        });
    };

    /* ===== GRID STATUS ===== */

    const isSlotBooked = (time: string) => {
        const t = dayjs(time, "HH:mm");
        return MOCK_BOOKED_SLOTS.some(s => {
            const start = dayjs(s.start, "HH:mm");
            const end = dayjs(s.end, "HH:mm");
            return t.isSame(start) || (t.isAfter(start) && t.isBefore(end));
        });
    };

    const isSelected = (time: string) => {
        if (!timeRange[0] || !timeRange[1]) return false;
        const t = dayjs(time, "HH:mm");
        return t.isAfter(timeRange[0]) && t.isBefore(timeRange[1])
            || t.isSame(timeRange[0])
            || t.isSame(timeRange[1]);
    };

    /* ===== GRID CLICK ===== */

    const selectTimeFromGrid = (time: string) => {
        if (isSlotBooked(time)) return;

        const t = dayjs(time, "HH:mm");
        const [start, end] = timeRange;

        if (!start || end) {
            setTimeRange([t, null]);
            return;
        }

        const s = t.isBefore(start) ? t : start;
        const e = t.isBefore(start) ? start : t;

        if (isOverlappingBooked(s, e)) {
            message.error("Khung giờ bị trùng lịch đã đặt");
            return;
        }

        setTimeRange([s, e]);
    };

    /* ===== RANGE PICKER ===== */

    const onRangeChange = (v: [Dayjs | null, Dayjs | null] | null) => {
        if (!v || !v[0] || !v[1]) {
            setTimeRange([null, null]);
            return;
        }

        if (isOverlappingBooked(v[0], v[1])) {
            message.error("Khung giờ bị trùng lịch đã đặt");
            return;
        }

        setTimeRange(v);
    };

    /* ===== PRICE ===== */

    const calculateTotalPrice = () => {
        if (!pitchId || !timeRange[0] || !timeRange[1]) return 0;
        const pitch = pitches.find(p => p.id === pitchId);
        if (!pitch) return 0;

        const minutes = timeRange[1].diff(timeRange[0], "minute");
        return (minutes / 60) * pitch.pricePerHour;
    };

    const buildBookingPayload = () => {
        if (!pitchId || !bookingDate || !timeRange[0] || !timeRange[1]) return null;

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


    return (
        <div className="luxury-card-wrapper">
            <Card className="booking-card" title={
                <Space style={{
                    display: "flex", alignContent: "center",
                    justifyContent: "start"
                }}>
                    <PiSoccerBallFill size={25} />
                    <span>Đặt sân bóng</span>
                </Space>
            } >
                <Row gutter={[24, 24]}>

                    {/* ===== LEFT ===== */}
                    <Col xs={24} lg={16}>
                        {/* <Title level={4}>🕒 Lịch trống</Title> */}
                        <Title level={5}>
                            <Space style={{
                                display: "flex", alignContent: "center",
                                justifyContent: "start"
                            }}>
                                <IoMdClock size={24} />
                                <span>Lịch trống</span>
                            </Space>
                        </Title>
                        <Space style={{ marginBottom: 12 }}>
                            <Tag color="green">Trống</Tag>
                            <Tag color="blue">Đang chọn</Tag>
                            <Tag color="red">Đã đặt</Tag>
                        </Space>

                        <div className="time-grid-wrapper">
                            <div className="time-grid">
                                {TIME_SLOTS.map(time => {
                                    const booked = isSlotBooked(time);
                                    const selected = isSelected(time);

                                    return (
                                        <div
                                            key={time}
                                            className={`time-slot luxury ${booked ? "booked" : selected ? "selected" : "free"}`}
                                            onClick={() => selectTimeFromGrid(time)}
                                        >
                                            <div className="slot-inner">
                                                <div className="time">{time}</div>
                                                <div className="label">
                                                    {booked ? "ĐÃ ĐẶT" : selected ? "ĐANG CHỌN" : "TRỐNG"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Col>

                    {/* ===== RIGHT ===== */}
                    <Col xs={24} lg={8}>
                        <Title level={4}>📋 Thông tin</Title>

                        <Select
                            style={{ width: "100%" }}
                            placeholder="Chọn sân"
                            value={pitchId}
                            onChange={setPitchId}
                        >
                            {pitches.map(p => (
                                <Select.Option key={p.id} value={p.id}>
                                    {p.name} – {p.pricePerHour.toLocaleString()}đ/giờ
                                </Select.Option>
                            ))}
                        </Select>

                        <DatePicker
                            style={{ width: "100%", marginTop: 12 }}
                            format="DD/MM/YYYY"
                            onChange={setBookingDate}
                            placeholder="Chọn ngày"
                        />

                        <TimePicker.RangePicker
                            style={{ width: "100%", marginTop: 12 }}
                            format="HH:mm"
                            minuteStep={5}
                            value={timeRange}
                            onChange={onRangeChange}
                            placeholder={["Giờ bắt đầu", "Giờ kết thúc"]}
                        />

                        <Select
                            style={{ width: "100%", marginTop: 12 }}
                            placeholder="Áo pitch"
                            onChange={setShirtOption}
                        >
                            <Select.Option value="NO">Không lấy áo</Select.Option>
                            <Select.Option value="YES">Có lấy áo</Select.Option>
                        </Select>

                        <Input
                            style={{ marginTop: 12 }}
                            placeholder="Số điện thoại"
                            value={contactPhone}
                            onChange={e => setContactPhone(e.target.value)}
                        />

                        <Divider />

                        <div className="summary">
                            <span>Tổng tiền: </span>
                            <strong>{calculateTotalPrice().toLocaleString()} đ</strong>
                        </div>
                        <Button
                            style={{ marginTop: 16 }}
                            type="primary"
                            block
                            size="large"
                            disabled={!bookingDate || !timeRange[0] || !timeRange[1]}
                            onClick={() => {
                                const payload = buildBookingPayload();
                                console.log("BOOKING PAYLOAD:", payload);
                            }}
                        >
                            Xác nhận đặt sân
                        </Button>

                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default BookingPage;
