import {
    Card,
    DatePicker,
    Form,
    Input,
    Popconfirm,
    Select,
    Spin,
    Switch,
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
import { useEffect, useMemo, useState } from "react";
import type { IPitch } from "../../../../types/pitch";
import dayjs, { Dayjs } from "dayjs";
import { Button, Spinner } from "react-bootstrap";
import { formatVND } from "../../../../utils/format/price";
import { useSelector } from "react-redux";
import {
    fetchPitches,
    selectPitches,
    selectPitchLoading,
} from "../../../../redux/features/pitchSlice";
import { useAppDispatch } from "../../../../redux/hooks";
import { fetchBookingsClient } from "../../../../redux/features/bookingClientSlice";

const { Text } = Typography;

interface IProps {
    bookingId: number;
    pitchIdNumber: number; // sân hiện tại (route)
    pitch: IPitch | null;
    pitchLoading: boolean;
    onSuccess?: () => void;
}

type BookingFormValues = {
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
    dateTimeRange: [Dayjs, Dayjs];
    pitchId?: number;
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
    const selectedPitchId = Form.useWatch("pitchId", form);

    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [changePitch, setChangePitch] = useState(false);

    /* ===== Redux ===== */
    const pitches = useSelector(selectPitches);
    const pitchLoadingRedux = useSelector(selectPitchLoading);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (pitches.length === 0) {
            dispatch(fetchPitches("page=1&pageSize=100"));
        }
    }, [dispatch, pitches.length]);
    /* ===== Load booking ===== */
    useEffect(() => {
        setInitLoading(true);
        getBookingById(bookingId)
            .then(res => {
                const b = res.data.data;
                if (!b) return;

                form.setFieldsValue({
                    dateTimeRange: [
                        dayjs(b.startDateTime),
                        dayjs(b.endDateTime),
                    ],
                    shirtOption: b.shirtOption,
                    contactPhone: b.contactPhone,
                });
            })
            .finally(() => setInitLoading(false));
    }, [bookingId, form]);

    /* ===== Pitch options ===== */
    const pitchOptions = useMemo(
        () =>
            pitches
                .filter(p => p.status === "ACTIVE")
                .map(p => ({
                    label: `${p.name} - ${formatVND(p.pricePerHour)}/giờ`,
                    value: p.id,
                })),
        [pitches]
    );

    /* ===== Pitch đang dùng để tính tiền ===== */
    const currentPitch: IPitch | null = useMemo(() => {
        if (!changePitch) return pitch ?? null;
        return pitches.find(p => p.id === selectedPitchId) ?? null;
    }, [changePitch, pitch, pitches, selectedPitchId]);

    /* ===== Preview price ===== */
    const previewPrice = useMemo(() => {
        if (!dateTimeRange || !currentPitch) return 0;

        const minutes = dateTimeRange[1].diff(
            dateTimeRange[0],
            "minute"
        );
        if (minutes <= 0) return 0;

        return Math.round(
            (currentPitch.pricePerHour / 60) * minutes
        );
    }, [dateTimeRange, currentPitch]);

    /* ===== Submit ===== */
    const handleUpdate = async (values: BookingFormValues) => {
        setLoading(true);
        const [start, end] = values.dateTimeRange;

        try {
            const finalPitchId =
                changePitch
                    ? values.pitchId!
                    : pitchIdNumber;

            await updateBookingClient(bookingId, {
                pitchId: finalPitchId,
                shirtOption: values.shirtOption,
                contactPhone: values.contactPhone,
                startDateTime: start.format("YYYY-MM-DDTHH:mm:ss"),
                endDateTime: end.format("YYYY-MM-DDTHH:mm:ss"),
            });

            toast.success("Cập nhật lịch đặt thành công");
            dispatch(fetchBookingsClient(''));
            onSuccess?.();
        } catch (e: any) {
            toast.error(
                e?.response?.data?.message ??
                "Cập nhật thất bại"
            );
        } finally {
            setLoading(false);
        }
    };

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
            {/* ===== SWITCH ĐỔI SÂN ===== */}
            <Form.Item label="Đổi sân thi đấu">
                <Switch
                    checked={changePitch}
                    onChange={(checked) => {
                        setChangePitch(checked);
                        if (!checked) {
                            form.setFieldValue("pitchId", undefined);
                        }
                    }}
                />
            </Form.Item>

            {changePitch && (
                <Form.Item
                    label="Chọn sân mới"
                    name="pitchId"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn sân",
                        },
                    ]}
                >
                    <Select
                        placeholder="Chọn sân"
                        options={pitchOptions}
                        loading={pitchLoadingRedux}
                        showSearch={{
                            optionFilterProp: "label",
                        }}
                    />
                </Form.Item>
            )}

            {/* ===== TIME RANGE ===== */}
            <Form.Item
                label="Thời gian thi đấu"
                name="dateTimeRange"
                rules={[{ required: true, message: "Vui lòng nhập thời gian thi đấu" }]}
            >
                <DatePicker.RangePicker
                    showTime={{ format: "HH:mm" }}
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: "100%" }}
                    minuteStep={5}
                    placeholder={[
                        "Thời gian bắt đầu",
                        "Thời gian kết thúc",
                    ]}
                    disabledDate={d =>
                        d.isBefore(dayjs().startOf("day"))
                    }
                />
            </Form.Item>

            {/* ===== PREVIEW ===== */}
            {(pitchLoading || pitchLoadingRedux) ? (
                <Spin />
            ) : (
                currentPitch &&
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

                        <Text
                            strong
                            style={{
                                fontSize: 18,
                                color: "#22c55e",
                            }}
                        >
                            💰Tạm tính: {formatVND(previewPrice)}
                        </Text>
                    </Card>
                )
            )}

            {/* ===== SHIRT ===== */}
            <Form.Item
                label="Áo pitch"
                name="shirtOption"
                rules={[{ required: true }]}
            >
                <Select options={SHIRT_OPTION_OPTIONS} />
            </Form.Item>

            {/* ===== PHONE ===== */}
            <Form.Item label="Số điện thoại" name="contactPhone">
                <Input />
            </Form.Item>

            {/* ===== SUBMIT ===== */}
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
                    disabled={
                        loading ||
                        !dateTimeRange ||
                        !shirtOption ||
                        (changePitch && !selectedPitchId)
                    }
                >
                    {loading ? (
                        <>
                            <Spinner
                                animation="border"
                                size="sm"
                            />
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
