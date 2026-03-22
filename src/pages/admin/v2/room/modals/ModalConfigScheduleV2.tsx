import {
    Button,
    Collapse,
    Divider,
    Form,
    InputNumber,
    Modal,
    Space,
    Switch,
    Table,
    TimePicker,
    Typography,
} from "antd";
import type { FormInstance } from "antd/es/form";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { toast } from "react-toastify";

import {
    createRoomScheduleV2,
    getRoomScheduleV2,
    updateRoomScheduleV2,
} from "../../../../../config/Api";
import { useAppDispatch } from "../../../../../redux/hooks";
import {
    clearSchedule,
    setRoomScheduleLoading,
    setSchedule,
} from "../../../../../redux/features/v2/roomScheduleSlice";
import type { ICreateScheduleRequestV2, IRoomScheduleV2, ISlotPreviewV2 } from "../../../../../types/v2/roomSchedule";
import type { IRoom } from "../../../../../types/v2/room";
import {
    calculateSlotsPreview,
    countGapInputsUniform,
    splitMorningAfternoonSlotCounts,
} from "../../../../../utils/v2/roomScheduleSlots";
import {
    buildUtbDhOfficialFormValues,
    UTB_DH_REFERENCE_PERIODS,
} from "../../../../../utils/v2/utbDhSchedulePreset";
import axios from "axios";

dayjs.extend(customParseFormat);

/** InputNumber + hậu tố "phút" (Ant Design 6: thay cho addonAfter). */
function InputNumberPhut(props: ComponentProps<typeof InputNumber>) {
    const { style, ...rest } = props;
    return (
        <Space.Compact style={{ width: "100%", ...(typeof style === "object" && style ? style : {}) }}>
            <InputNumber {...rest} style={{ width: "100%" }} />
            <Typography.Text
                style={{
                    margin: 0,
                    padding: "0 11px",
                    display: "inline-flex",
                    alignItems: "center",
                    background: "var(--ant-color-fill-secondary, #fafafa)",
                    border: "1px solid var(--ant-color-border, #d9d9d9)",
                    borderLeft: 0,
                    borderRadius: "0 6px 6px 0",
                    minHeight: 32,
                }}
            >
                phút
            </Typography.Text>
        </Space.Compact>
    );
}

type FormValues = {
    useFlexibleBreaks: boolean;
    totalSlots: number;
    slotDuration: number;
    breakDuration: number;
    morningStart: Dayjs;
    morningEnd: Dayjs;
    afternoonStart: Dayjs;
    afternoonEnd: Dayjs;
    morningGapBreaks: number[];
    afternoonGapBreaks: number[];
};

function normalizeHm(v: unknown): string {
    if (typeof v === "string") {
        if (v.includes("T")) {
            return v.slice(11, 16);
        }
        return v.length >= 5 ? v.substring(0, 5) : v;
    }
    if (Array.isArray(v) && v.length >= 2) {
        const h = Number(v[0]);
        const m = Number(v[1]);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return "07:00";
}

function buildBaseRequest(v: FormValues): ICreateScheduleRequestV2 {
    return {
        totalSlots: v.totalSlots,
        slotDuration: v.slotDuration,
        breakDuration: v.breakDuration,
        morningStart: v.morningStart.format("HH:mm"),
        morningEnd: v.morningEnd.format("HH:mm"),
        afternoonStart: v.afternoonStart.format("HH:mm"),
        afternoonEnd: v.afternoonEnd.format("HH:mm"),
    };
}

function takeOrPad(arr: number[] | undefined, len: number, pad: number): number[] {
    const a = arr ?? [];
    return Array.from({ length: len }, (_, i) =>
        typeof a[i] === "number" && !Number.isNaN(a[i]) ? a[i] : pad
    );
}

function formValuesToRequest(v: FormValues): ICreateScheduleRequestV2 {
    const base = buildBaseRequest(v);
    if (!v.useFlexibleBreaks) {
        return base;
    }
    const lens = countGapInputsUniform(base);
    const br = v.breakDuration;
    return {
        ...base,
        morningGapBreaks: takeOrPad(v.morningGapBreaks, lens.morning, br),
        afternoonGapBreaks: takeOrPad(v.afternoonGapBreaks, lens.afternoon, br),
    };
}

function scheduleToFormDefaults(s: IRoomScheduleV2): FormValues {
    const hasFlex =
        (s.morningGapBreaks != null && s.morningGapBreaks.length > 0) ||
        (s.afternoonGapBreaks != null && s.afternoonGapBreaks.length > 0);
    return {
        useFlexibleBreaks: hasFlex,
        totalSlots: s.totalSlots,
        slotDuration: s.slotDuration,
        breakDuration: s.breakDuration,
        morningStart: dayjs(normalizeHm(s.morningStart), "HH:mm"),
        morningEnd: dayjs(normalizeHm(s.morningEnd), "HH:mm"),
        afternoonStart: dayjs(normalizeHm(s.afternoonStart), "HH:mm"),
        afternoonEnd: dayjs(normalizeHm(s.afternoonEnd), "HH:mm"),
        morningGapBreaks: s.morningGapBreaks ?? [],
        afternoonGapBreaks: s.afternoonGapBreaks ?? [],
    };
}

/** Mặc định khi phòng chưa có cấu hình: khớp lịch ĐH 10 tiết (ảnh tham chiếu). */
const DEFAULT_FORM: FormValues = buildUtbDhOfficialFormValues();

function applyUtbDhOfficialPreset(form: FormInstance<FormValues>) {
    form.setFieldsValue(buildUtbDhOfficialFormValues());
}

interface ModalConfigScheduleV2Props {
    open: boolean;
    onClose: () => void;
    room: IRoom | null;
}

const ModalConfigScheduleV2 = ({ open, onClose, room }: ModalConfigScheduleV2Props) => {
    const [form] = Form.useForm<FormValues>();
    const dispatch = useAppDispatch();
    const [scheduleId, setScheduleId] = useState<number | null>(null);
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const watched = Form.useWatch([], form);

    const previewRows: ISlotPreviewV2[] = useMemo(() => {
        if (!open || !watched?.morningStart) {
            return [];
        }
        try {
            const req = formValuesToRequest(watched as FormValues);
            return calculateSlotsPreview(req);
        } catch {
            return [];
        }
    }, [watched, open]);

    const gapLens = useMemo(() => {
        if (!open || !watched?.morningStart) {
            return { morning: 0, afternoon: 0 };
        }
        try {
            const w = watched as Partial<FormValues>;
            if (!w.morningStart || !w.morningEnd || !w.afternoonStart || !w.afternoonEnd) {
                return { morning: 0, afternoon: 0 };
            }
            return countGapInputsUniform(buildBaseRequest(w as FormValues));
        } catch {
            return { morning: 0, afternoon: 0 };
        }
    }, [open, watched]);

    const slotSplit = useMemo(() => {
        if (!open || !watched?.morningStart) {
            return { morning: 0, afternoon: 0 };
        }
        try {
            const w = watched as Partial<FormValues>;
            if (!w.morningStart || !w.morningEnd || !w.afternoonStart || !w.afternoonEnd) {
                return { morning: 0, afternoon: 0 };
            }
            return splitMorningAfternoonSlotCounts(formValuesToRequest(w as FormValues));
        } catch {
            return { morning: 0, afternoon: 0 };
        }
    }, [open, watched]);

    const referenceColumns = useMemo(
        () => [
            { title: "Tiết", dataIndex: "slotNumber", key: "slotNumber", width: 72 },
            { title: "Buổi", dataIndex: "session", key: "session", width: 88 },
            {
                title: "Giờ",
                key: "range",
                render: (_: unknown, row: (typeof UTB_DH_REFERENCE_PERIODS)[number]) =>
                    `${row.start} → ${row.end}`,
            },
        ],
        []
    );

    useEffect(() => {
        const fv = watched as FormValues | undefined;
        if (!open || !fv?.useFlexibleBreaks || !fv?.morningStart) {
            return;
        }
        const lens = countGapInputsUniform(buildBaseRequest(fv));
        const br = fv.breakDuration ?? 10;
        const m = fv.morningGapBreaks ?? [];
        const a = fv.afternoonGapBreaks ?? [];
        if (m.length === lens.morning && a.length === lens.afternoon) {
            return;
        }
        form.setFieldsValue({
            morningGapBreaks: takeOrPad(m, lens.morning, br),
            afternoonGapBreaks: takeOrPad(a, lens.afternoon, br),
        });
    }, [
        open,
        watched,
        form,
    ]);

    useEffect(() => {
        if (!open || !room) {
            return;
        }

        let cancelled = false;
        (async () => {
            setScheduleId(null);
            setLoadingSchedule(true);
            dispatch(setRoomScheduleLoading(true));
            try {
                const res = await getRoomScheduleV2(room.id);
                if (cancelled) {
                    return;
                }
                if (res.status === 200 && Number(res.data.statusCode) === 200 && res.data.data) {
                    const data = res.data.data;
                    setScheduleId(data.id);
                    form.setFieldsValue(scheduleToFormDefaults(data));
                    dispatch(setSchedule(data));
                } else if (res.status === 400) {
                    const msg = String(res.data?.message ?? "");
                    if (msg.includes("Chưa có cấu hình")) {
                        setScheduleId(null);
                        form.setFieldsValue(DEFAULT_FORM);
                        dispatch(setSchedule(null));
                    } else {
                        toast.error(msg || "Không tải được cấu hình lịch");
                    }
                } else {
                    toast.error("Không tải được cấu hình lịch");
                }
            } catch (e: unknown) {
                const m =
                    axios.isAxiosError(e) && e.response?.data?.message
                        ? String(e.response.data.message)
                        : "Không tải được cấu hình lịch";
                toast.error(m);
            } finally {
                if (!cancelled) {
                    setLoadingSchedule(false);
                    dispatch(setRoomScheduleLoading(false));
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, room, form, dispatch]);

    const handleOk = async () => {
        if (!room) {
            return;
        }
        try {
            const values = await form.validateFields();
            const body = formValuesToRequest(values);
            const slots = calculateSlotsPreview(body);
            if (slots.length === 0 || slots.length !== body.totalSlots) {
                toast.error(
                    "Không xếp đủ tiết trong khung giờ sáng/chiều. Hãy điều chỉnh thời gian hoặc số tiết."
                );
                return;
            }

            setSubmitting(true);
            if (scheduleId != null) {
                const res = await updateRoomScheduleV2(room.id, scheduleId, body);
                const sc = Number(res.data.statusCode);
                if (sc >= 200 && sc < 300 && !res.data.error) {
                    toast.success(res.data.message ?? "Cập nhật cấu hình lịch tiết thành công");
                    if (res.data.data) {
                        dispatch(setSchedule(res.data.data));
                    }
                    onClose();
                }
            } else {
                const res = await createRoomScheduleV2(room.id, body);
                const sc = Number(res.data.statusCode);
                if (sc >= 200 && sc < 300 && !res.data.error) {
                    toast.success(res.data.message ?? "Tạo cấu hình lịch tiết thành công");
                    if (res.data.data) {
                        dispatch(setSchedule(res.data.data));
                    }
                    onClose();
                }
            }
        } catch (e: unknown) {
            if (axios.isAxiosError(e)) {
                const m = e.response?.data?.message ?? e.message;
                toast.error(typeof m === "string" ? m : "Có lỗi khi lưu cấu hình");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        dispatch(clearSchedule());
        onClose();
    };

    const columns: ColumnsType<ISlotPreviewV2> = [
        {
            title: "Tiết",
            dataIndex: "slotNumber",
            key: "slotNumber",
            width: 64,
        },
        {
            title: "Buổi",
            key: "session",
            width: 88,
            render: (_: unknown, row: ISlotPreviewV2) => {
                const m = slotSplit.morning;
                if (!previewRows.length) {
                    return "";
                }
                if (!m) {
                    return "—";
                }
                return row.slotNumber <= m ? "Sáng" : "Chiều";
            },
        },
        {
            title: "Bắt đầu",
            dataIndex: "startTime",
            key: "startTime",
        },
        {
            title: "Kết thúc",
            dataIndex: "endTime",
            key: "endTime",
        },
        {
            title: "Tóm tắt",
            key: "label",
            render: (_: unknown, row: ISlotPreviewV2) =>
                `Tiết ${row.slotNumber}: ${row.startTime} → ${row.endTime}`,
        },
    ];

    return (
        <Modal
            title={`Cấu hình lịch tiết${room ? ` — ${room.roomName}` : ""}`}
            open={open}
            onCancel={handleCancel}
            onOk={handleOk}
            okText="Lưu Cấu Hình"
            cancelText="Hủy"
            confirmLoading={submitting}
            width={820}
            destroyOnHidden
            forceRender
        >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                Buổi sáng xếp trước, buổi chiều sau. Mỗi tiết 50 phút; nghỉ giữa tiết có thể 5 hoặc 10 phút (bật{" "}
                <strong>nghỉ linh hoạt</strong>). Mặc định khớp lịch ĐH 10 tiết; bạn có thể đổi khung giờ, số tiết hoặc
                từng khoảng nghỉ.
            </Typography.Paragraph>

            <Collapse
                style={{ marginBottom: 16 }}
                items={[
                    {
                        key: "utb-ref",
                        label: "Bảng tham chiếu lịch ĐH (10 tiết — Sáng / Chiều)",
                        children: (
                            <Table
                                size="small"
                                pagination={false}
                                rowKey="slotNumber"
                                dataSource={[...UTB_DH_REFERENCE_PERIODS]}
                                columns={referenceColumns}
                            />
                        ),
                    },
                ]}
            />

            <Form<FormValues>
                form={form}
                layout="vertical"
                initialValues={DEFAULT_FORM}
                disabled={loadingSchedule}
            >
                <Form.Item
                    label="Tổng số tiết"
                    name="totalSlots"
                    rules={[
                        { required: true, message: "Nhập tổng số tiết" },
                        { type: "number", min: 1, max: 20, message: "Từ 1 đến 20 tiết" },
                    ]}
                >
                    <InputNumber min={1} max={20} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Thời lượng mỗi tiết"
                    name="slotDuration"
                    rules={[{ required: true, message: "Nhập thời lượng" }]}
                >
                    <InputNumberPhut min={1} />
                </Form.Item>

                <Form.Item
                    label="Nghỉ giữa tiết (mặc định / lấp ô còn thiếu)"
                    name="breakDuration"
                    rules={[{ required: true, message: "Nhập thời gian nghỉ" }]}
                    extra="Khi tắt “nghỉ linh hoạt”, mọi khoảng nghỉ giữa tiết dùng giá trị này."
                >
                    <InputNumberPhut min={0} />
                </Form.Item>

                <Form.Item
                    label="Giờ bắt đầu buổi sáng"
                    name="morningStart"
                    rules={[{ required: true, message: "Chọn giờ" }]}
                >
                    <TimePicker format="HH:mm" needConfirm={false} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Giờ kết thúc buổi sáng (biên trên — ≥ giờ kết thúc tiết cuối sáng)"
                    name="morningEnd"
                    dependencies={["morningStart"]}
                    rules={[
                        { required: true, message: "Chọn giờ" },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                const start = getFieldValue("morningStart") as Dayjs | undefined;
                                if (!value || !start) {
                                    return Promise.resolve();
                                }
                                if (!value.isAfter(start)) {
                                    return Promise.reject(new Error("Giờ kết thúc phải sau giờ bắt đầu buổi sáng"));
                                }
                                return Promise.resolve();
                            },
                        }),
                    ]}
                    extra="Ví dụ lịch chuẩn: tiết 5 sáng kết thúc 11:35 — chọn ít nhất 11:35 (thường để 11:35–12:00)."
                >
                    <TimePicker format="HH:mm" needConfirm={false} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Giờ bắt đầu buổi chiều"
                    name="afternoonStart"
                    rules={[{ required: true, message: "Chọn giờ" }]}
                >
                    <TimePicker format="HH:mm" needConfirm={false} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Giờ kết thúc buổi chiều (biên trên — ≥ giờ kết thúc tiết cuối chiều)"
                    name="afternoonEnd"
                    dependencies={["afternoonStart"]}
                    rules={[
                        { required: true, message: "Chọn giờ" },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                const start = getFieldValue("afternoonStart") as Dayjs | undefined;
                                if (!value || !start) {
                                    return Promise.resolve();
                                }
                                if (!value.isAfter(start)) {
                                    return Promise.reject(new Error("Giờ kết thúc phải sau giờ bắt đầu buổi chiều"));
                                }
                                return Promise.resolve();
                            },
                        }),
                    ]}
                    extra="Ví dụ lịch chuẩn: tiết 10 kết thúc 17:35 — chọn ít nhất 17:35."
                >
                    <TimePicker format="HH:mm" needConfirm={false} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Nghỉ linh hoạt (từng khoảng khác nhau — ví dụ 5 và 10 phút)"
                    name="useFlexibleBreaks"
                    valuePropName="checked"
                    extra="Bật để nhập phút nghỉ sau từng tiết riêng cho buổi sáng và buổi chiều (giống lịch tiết ĐH)."
                >
                    <Switch
                        onChange={(checked) => {
                            if (!checked) {
                                form.setFieldsValue({ morningGapBreaks: [], afternoonGapBreaks: [] });
                            }
                        }}
                    />
                </Form.Item>

                <Space style={{ marginBottom: 8 }} wrap>
                    <Button type="link" onClick={() => applyUtbDhOfficialPreset(form)} disabled={loadingSchedule}>
                        Áp lịch ĐH chuẩn (như bảng tham chiếu)
                    </Button>
                </Space>

                {watched?.useFlexibleBreaks && gapLens.morning > 0 && (
                    <>
                        <Divider>Buổi sáng — phút nghỉ sau từng tiết</Divider>
                        {Array.from({ length: gapLens.morning }).map((_, i) => (
                            <Form.Item
                                key={`mg-${i}`}
                                label={`Nghỉ sau tiết ${i + 1} (sáng)`}
                                name={["morningGapBreaks", i]}
                                rules={[{ required: true, message: "Nhập phút nghỉ" }]}
                            >
                                <InputNumberPhut min={0} max={180} />
                            </Form.Item>
                        ))}
                    </>
                )}

                {watched?.useFlexibleBreaks && gapLens.afternoon > 0 && (
                    <>
                        <Divider>Buổi chiều — phút nghỉ sau từng tiết</Divider>
                        {Array.from({ length: gapLens.afternoon }).map((_, i) => (
                            <Form.Item
                                key={`ag-${i}`}
                                label={`Nghỉ sau tiết ${
                                    slotSplit.morning > 0 ? slotSplit.morning + i + 1 : i + 1
                                } (chiều)`}
                                name={["afternoonGapBreaks", i]}
                                rules={[{ required: true, message: "Nhập phút nghỉ" }]}
                            >
                                <InputNumberPhut min={0} max={180} />
                            </Form.Item>
                        ))}
                    </>
                )}
            </Form>

            <Typography.Title level={5} style={{ marginTop: 16 }}>
                Xem trước lịch tiết
            </Typography.Title>
            <Table<ISlotPreviewV2>
                size="small"
                rowKey="slotNumber"
                loading={loadingSchedule}
                columns={columns}
                dataSource={previewRows}
                pagination={false}
                locale={{ emptyText: loadingSchedule ? "Đang tải…" : "Chưa có tiết hợp lệ — kiểm tra khung giờ" }}
            />
        </Modal>
    );
};

export default ModalConfigScheduleV2;
