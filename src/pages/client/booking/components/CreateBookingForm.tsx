import {
    // Button,
    Card,
    DatePicker,
    Form,
    Input,
    Popconfirm,
    Select,
    Spin,
    Typography,
    type PopconfirmProps,
} from "antd";
import { SHIRT_OPTION_OPTIONS } from "../../../../utils/constants/booking.constants";
import { toast } from "react-toastify";
import type {
    ICreateBookingClientReq,
    ShirtOptionEnum,
} from "../../../../types/booking";
import { createBookingClient } from "../../../../config/Api";
import { useState } from "react";
import type { IPitch } from "../../../../types/pitch";
import dayjs, { Dayjs } from "dayjs";
import { Button, Spinner } from "react-bootstrap";
import { formatVND } from "../../../../utils/format/price";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { fetchBookingsClient } from "../../../../redux/features/bookingClientSlice";

const { Text } = Typography;

interface IProps {
    pitchIdNumber: number;
    pitch: IPitch | null;
    pitchLoading: boolean;
    onSuccess?: () => void;
}

type BookingFormValues = {
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
    dateTimeRange: [Dayjs, Dayjs];
};

const CreateBookingForm = ({
    pitchIdNumber,
    pitch,
    pitchLoading,
    onSuccess,
}: IProps) => {
    const [form] = Form.useForm<BookingFormValues>();
    const dateTimeRange = Form.useWatch("dateTimeRange", form);
    const shirtOption = Form.useWatch("shirtOption", form);
    const [bookingLoading, setBookingLoading] = useState(false);
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
    const dispatch = useAppDispatch();

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
                dispatch(fetchBookingsClient(''));
                form.resetFields();
                onSuccess?.(); //  trigger reload timeline
            }
        } catch (e: any) {
            const m = e?.response?.data?.message ?? "Lỗi không xác định";
            toast.error(
                <div>
                    <strong>Có lỗi xảy ra!</strong>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setBookingLoading(false);
        }
    };

    const previewPrice = (() => {
        if (!dateTimeRange || !pitch) return 0;

        const [start, end] = dateTimeRange;
        const minutes = end.diff(start, "minute");
        if (minutes <= 0) return 0;

        let total = (pitch.pricePerHour / 60) * minutes;
        // if (shirtOption === "WITH_PITCH_SHIRT") total += 25000;

        return Math.round(total);
    })();

    const cancel: PopconfirmProps['onCancel'] = () => {
        toast.info('Đã bỏ chọn');
    };

    // const handleConfirmBooking = () => {
    //     form.submit();
    // };

    const handleConfirmBooking = async () => {
        if (!isAuthenticated) {
            const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
            toast.warning("Vui lòng đăng nhập để đặt sân");
            await minDelay; // chạy spin 2s
            window.location.href = `/login?redirect=${location.pathname}`;
            return;
        }
        form.submit();
    };

    return (
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
                    format=" HH:mm DD/MM/YYYY"
                    style={{ width: "100%" }}
                    minuteStep={5}
                    placeholder={["Thời gian bắt đầu", "Thời gian kết thúc"]}
                    disabledDate={d => d.isBefore(dayjs().startOf("day"))}
                />
            </Form.Item>

            {pitchLoading ? (
                <Spin />
            ) : (
                pitch &&
                dateTimeRange && (
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Text>
                            ⏱ Thời lượng:{" "}
                            {dateTimeRange[1].diff(
                                dateTimeRange[0],
                                "minute"
                            )}{" "}
                            phút
                        </Text>
                        <br />
                        {shirtOption === "WITH_PITCH_SHIRT" && (
                            <>
                                <Text>👕 Áo pitch: free</Text>
                                <br />
                            </>
                        )}
                        <Text strong style={{ fontSize: 18, color: "#22c55e" }}>
                            💰Tạm tính:{" "}
                            {formatVND(previewPrice)}
                        </Text>
                    </Card>
                )
            )}

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


            <Popconfirm
                title="Xác nhận"
                placement="topLeft"
                description="Bạn có chắc chắn muốn đặt sân không?"
                okText="Có"
                cancelText="Không"
                onCancel={cancel}
                onConfirm={handleConfirmBooking}
            >
                <Button
                    variant="outline-warning"
                    className="w-100 d-flex justify-content-center align-items-center gap-2"
                    disabled={bookingLoading || !dateTimeRange || !shirtOption}
                >
                    {bookingLoading ? (
                        <>
                            <Spinner animation="border" size="sm" />
                            Đang đặt sân...
                        </>
                    ) : (
                        "Đặt sân"
                    )}
                </Button>
            </Popconfirm>
        </Form>
    );
};

export default CreateBookingForm;
