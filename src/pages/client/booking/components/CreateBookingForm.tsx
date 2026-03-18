import { DatePicker, Form, Input, Popconfirm, Radio, Select, Spin, type PopconfirmProps } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { toast } from "react-toastify";

import { SHIRT_OPTION_OPTIONS } from "../../../../utils/constants/booking.constants";
import type { ICreateBookingClientReq, ShirtOptionEnum } from "../../../../types/booking";
import { createBookingClient, clientBorrowEquipment, getPublicEquipments } from "../../../../config/Api";
import type { IPitch } from "../../../../types/pitch";
import type { IEquipment } from "../../../../types/equipment";
import { formatVND } from "../../../../utils/format/price";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { fetchBookingsClient } from "../../../../redux/features/bookingClientSlice";
import { TbSoccerField } from "react-icons/tb";
import EquipmentBorrowSection from "./EquipmentBorrowSection";

interface IProps {
    pitchIdNumber: number;
    pitch: IPitch | null;
    pitchLoading: boolean;
    bookingDate: Dayjs;
    isDark: boolean;
    onSuccess?: () => void;
}

type FormValues = {
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = String(Math.floor(i / 2)).padStart(2, "0");
    const m = i % 2 === 0 ? "00" : "30";
    return `${h}:${m}`;
});

const CreateBookingForm = ({ pitchIdNumber, pitch, pitchLoading, bookingDate, isDark, onSuccess }: IProps) => {
    const [form] = Form.useForm<FormValues>();
    const shirtOption = Form.useWatch("shirtOption", form);
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

    const [startDate, setStartDate] = useState(bookingDate.format("YYYY-MM-DD"));
    const [startTime, setStartTime] = useState("07:00");
    const [endDate, setEndDate] = useState(bookingDate.format("YYYY-MM-DD"));
    const [endTime, setEndTime] = useState("08:00");
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);

    // Equipment state — lifted here, passed to EquipmentBorrowSection
    const [equipments, setEquipments] = useState<IEquipment[]>([]);
    const [ballQty, setBallQty] = useState<number>(1);
    const [borrowShirt, setBorrowShirt] = useState(false);
    const [shirtQty, setShirtQty] = useState<number>(1);

    useEffect(() => {
        if (!isAuthenticated) return;
        getPublicEquipments()
            .then(res => { if (res.data.statusCode === 200) setEquipments(res.data.data ?? []); })
            .catch(() => { });
    }, [isAuthenticated]);

    useEffect(() => {
        if (shirtOption !== "WITH_PITCH_SHIRT") setBorrowShirt(false);
    }, [shirtOption]);

    useEffect(() => {
        const lastBookingDate = dayjs(startDate);
        if (!lastBookingDate.isSame(bookingDate, "day") && !touched) {
            const nextDate = bookingDate.format("YYYY-MM-DD");
            setStartDate(nextDate);
            setEndDate(nextDate);
        }
    }, [bookingDate, startDate, touched]);

    const startDj = useMemo(() => dayjs(`${startDate}T${startTime}`), [startDate, startTime]);
    const endDj = useMemo(() => dayjs(`${endDate}T${endTime}`), [endDate, endTime]);
    const minutes = endDj.diff(startDj, "minute");
    const isValid = minutes > 0;
    const preview = pitch && isValid ? Math.round((pitch.pricePerHour / 60) * minutes) : 0;
    const dtError = touched && !isValid ? "Giờ kết thúc phải sau giờ bắt đầu" : null;

    const handleBooking = async (values: FormValues) => {
        setTouched(true);
        if (!isValid) return;

        if (!isAuthenticated) {
            toast.warning("Vui lòng đăng nhập để đặt sân");
            await new Promise(r => setTimeout(r, 2000));
            window.location.href = `/login?redirect=${location.pathname}`;
            return;
        }

        setLoading(true);
        const payload: ICreateBookingClientReq = {
            pitchId: pitchIdNumber,
            shirtOption: values.shirtOption,
            contactPhone: values.contactPhone,
            startDateTime: startDj.format("YYYY-MM-DDTHH:mm:ss"),
            endDateTime: endDj.format("YYYY-MM-DDTHH:mm:ss"),
        };

        try {
            const res = await createBookingClient(payload);
            if (res.data.statusCode === 201) {
                const newBookingId = res.data.data?.id;
                if (newBookingId) {
                    const ballEq = equipments.find(e => e.name.toLowerCase().includes("bóng") || e.name.toLowerCase().includes("ball"));
                    const shirtEq = equipments.find(e => e.name.toLowerCase().includes("áo") || e.name.toLowerCase().includes("shirt"));
                    const tasks: Promise<any>[] = [];
                    if (ballEq && ballQty > 0)
                        tasks.push(clientBorrowEquipment({ bookingId: newBookingId, equipmentId: ballEq.id, quantity: ballQty }).catch(() => { }));
                    if (borrowShirt && shirtEq && shirtQty > 0)
                        tasks.push(clientBorrowEquipment({ bookingId: newBookingId, equipmentId: shirtEq.id, quantity: shirtQty }).catch(() => { }));
                    if (tasks.length > 0) await Promise.all(tasks);
                }
                toast.success("Yêu cầu đặt sân đã được gửi, đang chờ admin xác nhận!");
                dispatch(fetchBookingsClient(""));
                form.resetFields();
                setTouched(false);
                setBallQty(1);
                setBorrowShirt(false);
                setShirtQty(1);
                onSuccess?.();
            }
        } catch (e: any) {
            const m = e?.response?.data?.message ?? "Lỗi không xác định";
            toast.error(<div><strong>Có lỗi xảy ra!</strong><div>{m}</div></div>);
        } finally {
            setLoading(false);
        }
    };

    const cancel: PopconfirmProps["onCancel"] = () => toast.info("Đã bỏ chọn");
    const canSubmit = isValid && !loading;
    const pickerPopupClass = isDark ? "bk__picker-popup bk__picker-popup--dark" : "bk__picker-popup bk__picker-popup--light";

    const handleConfirmSubmit = async () => {
        try {
            await form.validateFields();
            form.submit();
        } catch {
            toast.warning("Vui lòng kiểm tra lại thông tin trước khi đặt sân");
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleBooking}>

            <div className="bk__dt-group">
                <div className="bk__dt-block">
                    <span className="bk__dt-label">📅 Ngày bắt đầu</span>
                    <div className="bk__dt-row">
                        <DatePicker
                            className={`bk__picker-input${dtError ? " bk__picker-input--error" : ""}`}
                            value={dayjs(startDate, "YYYY-MM-DD")}
                            format="DD/MM/YYYY"
                            allowClear={false}
                            inputReadOnly
                            classNames={{ popup: pickerPopupClass }}
                            disabledDate={current => !!current && current.startOf("day").isBefore(dayjs().startOf("day"))}
                            onChange={value => { if (!value) return; setStartDate(value.format("YYYY-MM-DD")); setTouched(true); }}
                        />
                    </div>
                </div>
                <div className="bk__dt-block">
                    <span className="bk__dt-label">🕐 Giờ bắt đầu</span>
                    <div className="bk__dt-row">
                        <Select className="bk__time-select" value={startTime}
                            options={TIME_OPTIONS.map(t => ({ label: t, value: t }))}
                            classNames={{ popup: { root: pickerPopupClass } }}
                            onChange={value => { setStartTime(value); setTouched(true); }} />
                    </div>
                </div>
                <div className="bk__dt-block">
                    <span className="bk__dt-label">📅 Ngày kết thúc</span>
                    <div className="bk__dt-row">
                        <DatePicker
                            className={`bk__picker-input${dtError ? " bk__picker-input--error" : ""}`}
                            value={dayjs(endDate, "YYYY-MM-DD")}
                            format="DD/MM/YYYY"
                            allowClear={false}
                            inputReadOnly
                            classNames={{ popup: pickerPopupClass }}
                            disabledDate={current => !!current && current.startOf("day").isBefore(dayjs(startDate).startOf("day"))}
                            onChange={value => { if (!value) return; setEndDate(value.format("YYYY-MM-DD")); setTouched(true); }}
                        />
                    </div>
                </div>
                <div className="bk__dt-block">
                    <span className="bk__dt-label">🕐 Giờ kết thúc</span>
                    <div className="bk__dt-row">
                        <Select
                            className={`bk__time-select${dtError ? " bk__time-select--error" : ""}`}
                            value={endTime}
                            options={TIME_OPTIONS.map(t => ({ label: t, value: t }))}
                            classNames={{ popup: { root: pickerPopupClass } }}
                            onChange={value => { setEndTime(value); setTouched(true); }} />
                    </div>
                </div>
            </div>

            {dtError && <p className="bk__dt-error">{dtError}</p>}

            <AnimatePresence>
                {!pitchLoading && pitch && isValid && (
                    <motion.div className="bk__price-preview"
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <p className="bk__price-row">⏱ Thời lượng: {minutes} phút</p>
                        <p className="bk__price-row">
                            📐 Kích thước: {pitch.length ?? '--'}m x {pitch.width ?? '--'}m x {pitch.height ?? '--'}m
                        </p>
                        <p className="bk__price-row">
                            📏 Diện tích: {pitch.length != null && pitch.width != null
                                ? `${Number((pitch.length * pitch.width).toFixed(2)).toLocaleString('vi-VN')} m2`
                                : 'Chưa cập nhật'}
                        </p>
                        <div className="bk__price-total">💰 Tạm tính: {formatVND(preview)}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Form.Item label="Áo pitch" name="shirtOption" style={{ marginBottom: 12 }}>
                <Radio.Group className="bk__shirt-radio" buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
                    {SHIRT_OPTION_OPTIONS.map(opt => (
                        <Radio.Button key={opt.value} value={opt.value} style={{ flex: 1, textAlign: 'center' }}>
                            {opt.label}
                        </Radio.Button>
                    ))}
                </Radio.Group>
            </Form.Item>

            <Form.Item label="Số điện thoại liên hệ" name="contactPhone" style={{ marginBottom: 16 }}>
                <Input className="bk__input-wrap" placeholder="0912 345 678" />
            </Form.Item>

            <EquipmentBorrowSection
                isAuthenticated={isAuthenticated}
                shirtOption={shirtOption}
                ballQty={ballQty} setBallQty={setBallQty}
                borrowShirt={borrowShirt} setBorrowShirt={setBorrowShirt}
                shirtQty={shirtQty} setShirtQty={setShirtQty}
                equipments={equipments}
            />

            <Popconfirm
                title="Xác nhận đặt sân"
                description={
                    <span>
                        {startDj.format("HH:mm DD/MM")} → {endDj.format("HH:mm DD/MM")}
                        {preview > 0 && ` · ${formatVND(preview)}`}
                    </span>
                }
                okText="Đặt ngay" cancelText="Huỷ" placement="topLeft"
                onCancel={cancel} onConfirm={handleConfirmSubmit} disabled={!canSubmit}
            >
                <button className="bk__submit-btn" type="button" disabled={!canSubmit}>
                    {loading ? <><Spin size="small" /> Đang đặt sân...</> : <><TbSoccerField size={16} /> Đặt sân ngay</>}
                </button>
            </Popconfirm>

        </Form>
    );
};

export default CreateBookingForm;
