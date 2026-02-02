import {
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
import type { ShirtOptionEnum } from "../../../../types/booking";
import {
    getBookingById,
    updateBookingClient,
} from "../../../../config/Api";
import { useEffect, useState } from "react";
import type { IPitch } from "../../../../types/pitch";
import dayjs, { Dayjs } from "dayjs";
import { Button, Spinner } from "react-bootstrap";
import { formatVND } from "../../../../utils/format/price";

const { Text } = Typography;

interface IProps {
    bookingId: number;
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

const UpdateBookingForm = ({
    bookingId,
    pitchIdNumber,
    pitch,
    pitchLoading,
    onSuccess,
}: IProps) => {
    const [form] = Form.useForm<BookingFormValues>();
    const dateTimeRange = Form.useWatch("dateTimeRange", form);
    const shirtOption = Form.useWatch("shirtOption", form);
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);

    useEffect(() => {
        setInitLoading(true);
        getBookingById(bookingId)
            .then(res => {
                const b = res.data.data ?? null;
                form.setFieldsValue({
                    dateTimeRange: [
                        dayjs(b?.startDateTime),
                        dayjs(b?.endDateTime),
                    ],
                    shirtOption: b?.shirtOption,
                    contactPhone: b?.contactPhone,
                });
            })
            .finally(() => setInitLoading(false));
    }, [bookingId, form]);

    const handleUpdate = async (values: BookingFormValues) => {
        setLoading(true);
        const [start, end] = values.dateTimeRange;

        try {
            await updateBookingClient(bookingId, {
                pitchId: pitchIdNumber,
                shirtOption: values.shirtOption,
                contactPhone: values.contactPhone,
                startDateTime: start.format("YYYY-MM-DDTHH:mm:ss"),
                endDateTime: end.format("YYYY-MM-DDTHH:mm:ss"),
            });

            toast.success("Cập nhật lịch đặt thành công");
            onSuccess?.();
        } catch (e: any) {
            toast.error(
                e?.response?.data?.message ?? "Cập nhật thất bại"
            );
        } finally {
            setLoading(false);
        }
    };

    /* ================== PREVIEW PRICE ================== */
    const previewPrice = (() => {
        if (!dateTimeRange || !pitch) return 0;
        const minutes = dateTimeRange[1].diff(dateTimeRange[0], "minute");
        if (minutes <= 0) return 0;
        return Math.round((pitch.pricePerHour / 60) * minutes);
    })();

    const cancel: PopconfirmProps["onCancel"] = () => {
        toast.info("Đã hủy cập nhật");
    };

    if (initLoading) return <Spin />;

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            style={{ marginTop: 24 }}
        >
            <Form.Item
                label="Thời gian thi đấu"
                name="dateTimeRange"
                rules={[{ required: true }]}
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
                            💰Tạm tính: {formatVND(previewPrice)}
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
                description="Bạn có chắc chắn muốn cập nhật lịch đặt không?"
                okText="Có"
                cancelText="Không"
                onCancel={cancel}
                onConfirm={() => form.submit()}
            >
                <Button
                    variant="outline-warning"
                    className="w-100 d-flex justify-content-center align-items-center gap-2"
                    disabled={loading || !dateTimeRange || !shirtOption}
                >
                    {loading ? (
                        <>
                            <Spinner animation="border" size="sm" />
                            Đang cập nhật...
                        </>
                    ) : (
                        "Cập nhật lịch đặt"
                    )}
                </Button>
            </Popconfirm>
        </Form>
    );
};

export default UpdateBookingForm;
