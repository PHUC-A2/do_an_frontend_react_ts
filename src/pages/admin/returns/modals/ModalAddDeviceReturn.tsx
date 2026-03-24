import { Checkbox, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createDeviceReturn, getAllCheckouts, getAllDeviceReturns } from '../../../../config/Api';
import type { ICheckout } from '../../../../types/checkout';
import type { DeviceCondition, ICreateDeviceReturnReq } from '../../../../types/deviceReturn';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchDeviceReturns, selectDeviceReturnLastListQuery } from '../../../../redux/features/deviceReturnSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import { buildSpringListQuery } from '../../../../utils/pagination/buildSpringPageQuery';
import { DEVICE_CONDITION_OPTIONS } from '../../../../utils/constants/deviceReturn.constants';

interface IProps {
    openModalAddDeviceReturn: boolean;
    setOpenModalAddDeviceReturn: (v: boolean) => void;
}

type FormVals = {
    checkoutId: number;
    returnAt?: Dayjs;
    deviceStatus: DeviceCondition;
    returnerName?: string;
    returnerPhone?: string;
    receiverName: string;
    receiverPhone: string;
    returnConditionNote?: string;
    returnReportPrintOptIn?: boolean;
    borrowerSignName?: string;
    staffSignName?: string;
    quantityReturnedGood?: number;
    quantityLost?: number;
    quantityDamaged?: number;
};

const ModalAddDeviceReturn = (props: IProps) => {
    const { openModalAddDeviceReturn, setOpenModalAddDeviceReturn } = props;
    const [form] = Form.useForm<FormVals>();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectDeviceReturnLastListQuery);
    const [submitting, setSubmitting] = useState(false);
    const [checkoutOptions, setCheckoutOptions] = useState<ICheckout[]>([]);
    const [loadingOpts, setLoadingOpts] = useState(false);

    useEffect(() => {
        if (!openModalAddDeviceReturn) return;
        const load = async () => {
            try {
                setLoadingOpts(true);
                const cq = buildSpringListQuery({ page: 1, pageSize: 500 });
                const rq = buildSpringListQuery({ page: 1, pageSize: 500 });
                const [cr, rr] = await Promise.all([getAllCheckouts(cq), getAllDeviceReturns(rq)]);
                const checkouts = cr.data.statusCode === 200 && cr.data.data?.result ? cr.data.data.result : [];
                const returns = rr.data.statusCode === 200 && rr.data.data?.result ? rr.data.data.result : [];
                const returnedCheckoutIds = new Set(returns.map((r) => r.checkoutId));
                const eligible = checkouts.filter(
                    (c) => c.assetUsageStatus === 'IN_PROGRESS' && !returnedCheckoutIds.has(c.id)
                );
                setCheckoutOptions(eligible);
            } catch (e) {
                console.error(e);
                toast.error('Không tải được biên bản nhận đủ điều kiện trả');
            } finally {
                setLoadingOpts(false);
            }
        };
        void load();
    }, [openModalAddDeviceReturn]);

    const resetModal = () => {
        form.resetFields();
        form.setFieldsValue({
            returnAt: dayjs(),
            deviceStatus: 'GOOD',
            returnReportPrintOptIn: false,
            returnerName: '',
            returnerPhone: '',
            receiverName: '',
            receiverPhone: '',
            returnConditionNote: '',
            borrowerSignName: '',
            staffSignName: '',
        });
    };

    const handleAdd = async (values: FormVals) => {
        const payload: ICreateDeviceReturnReq = {
            checkoutId: values.checkoutId,
            returnTime: values.returnAt ? values.returnAt.toISOString() : undefined,
            deviceStatus: values.deviceStatus,
            returnerName: values.returnerName ? values.returnerName.trim() || null : null,
            returnerPhone: values.returnerPhone ? values.returnerPhone.trim() || null : null,
            receiverName: values.receiverName.trim(),
            receiverPhone: values.receiverPhone.trim(),
            returnConditionNote: values.returnConditionNote ? values.returnConditionNote.trim() || null : null,
            returnReportPrintOptIn: values.returnReportPrintOptIn ?? false,
            borrowerSignName: values.deviceStatus === 'GOOD' ? null : values.borrowerSignName?.trim() || null,
            staffSignName: values.deviceStatus === 'GOOD' ? null : values.staffSignName?.trim() || null,
            quantityReturnedGood: values.quantityReturnedGood ?? null,
            quantityLost: values.quantityLost ?? null,
            quantityDamaged: values.quantityDamaged ?? null,
        };
        try {
            setSubmitting(true);
            const res = await createDeviceReturn(payload);
            if (res.data.statusCode === 201) {
                await dispatch(fetchDeviceReturns(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalAddDeviceReturn(false);
                toast.success('Tạo biên bản trả phòng thành công');
                resetModal();
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>
                        <strong>Có lỗi xảy ra!</strong>
                    </div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Tạo biên bản trả phòng"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalAddDeviceReturn}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => {
                setOpenModalAddDeviceReturn(false);
                resetModal();
            }}
            afterOpenChange={(open) => {
                if (open)
                    form.setFieldsValue({
                        returnAt: dayjs(),
                        deviceStatus: 'GOOD',
                        returnReportPrintOptIn: false,
                        returnerName: '',
                        returnerPhone: '',
                        receiverName: '',
                        receiverPhone: '',
                        returnConditionNote: '',
                        borrowerSignName: '',
                        staffSignName: '',
                        quantityReturnedGood: undefined,
                        quantityLost: undefined,
                        quantityDamaged: undefined,
                    });
            }}
        >
            <div>
                <hr />
                <p style={{ marginBottom: 12, color: '#666' }}>
                    Chỉ hiển thị biên bản nhận có lịch đặt phòng <strong>Đang dùng</strong> và chưa có biên bản trả.
                </p>
                <Form<FormVals> form={form} onFinish={handleAdd} layout="vertical" autoComplete="off">
                    <Form.Item
                        label="Biên bản nhận phòng"
                        name="checkoutId"
                        rules={[{ required: true, message: 'Vui lòng chọn biên bản nhận phòng!' }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            loading={loadingOpts}
                            placeholder="Chọn biên bản nhận phòng"
                            options={checkoutOptions.map((c) => ({
                                value: c.id,
                                label: `#${c.id} — lịch #${c.assetUsageId} — ${c.assetName ?? ''} — ${c.userEmail ?? ''}`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item label="Thời điểm trả phòng" name="returnAt">
                        <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                    </Form.Item>

                    <Form.Item
                        label="Tình trạng sau khi dùng"
                        name="deviceStatus"
                        rules={[{ required: true, message: 'Chọn tình trạng!' }]}
                    >
                        <Select options={DEVICE_CONDITION_OPTIONS} />
                    </Form.Item>

                    <Form.Item label="Người trả (tên/SĐT) — snapshot" name="returnerName">
                        <Input placeholder="Tên người trả (tùy chọn, backend sẽ fallback nếu rỗng)" />
                    </Form.Item>
                    <Form.Item label="SĐT người trả" name="returnerPhone">
                        <Input placeholder="SĐT người trả (tùy chọn, backend sẽ fallback nếu rỗng)" />
                    </Form.Item>

                    <Form.Item
                        label="Người nhận tại sân (bắt buộc)"
                        name="receiverName"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên người nhận' }]}
                    >
                        <Input placeholder="Họ tên người nhận" />
                    </Form.Item>
                    <Form.Item
                        label="SĐT người nhận tại sân (bắt buộc)"
                        name="receiverPhone"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại người nhận' }]}
                    >
                        <Input placeholder="Số điện thoại người nhận" />
                    </Form.Item>

                    <Form.Item label="Ghi chú biên bản trả phòng" name="returnConditionNote">
                        <Input.TextArea rows={3} placeholder="Ví dụ: đủ phụ kiện, có trầy nhẹ…" />
                    </Form.Item>

                    <Form.Item label="Trả tốt (tùy chọn)" name="quantityReturnedGood">
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Mất (tùy chọn)" name="quantityLost">
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Hỏng (tùy chọn)" name="quantityDamaged">
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="returnReportPrintOptIn" valuePropName="checked">
                        <Checkbox>Ghi nhận in / lưu biên bản trả phòng</Checkbox>
                    </Form.Item>

                    <Form.Item shouldUpdate noStyle dependencies={['deviceStatus']}>
                        {() => {
                            const current = form.getFieldValue('deviceStatus') as DeviceCondition | undefined;
                            const show = current === 'LOST' || current === 'DAMAGED' || current === 'BROKEN';
                            if (!show) return null;

                            return (
                                <>
                                    <Form.Item
                                        label="Họ tên người mượn ký xác nhận (bắt buộc khi có mất/hỏng)"
                                        name="borrowerSignName"
                                        rules={[{ required: true, message: 'Vui lòng nhập họ tên người mượn ký' }]}
                                    >
                                        <Input placeholder="Họ tên người mượn ký xác nhận" />
                                    </Form.Item>
                                    <Form.Item
                                        label="Họ tên nhân viên / bên giao nhận ký xác nhận (bắt buộc khi có mất/hỏng)"
                                        name="staffSignName"
                                        rules={[{ required: true, message: 'Vui lòng nhập họ tên nhân viên ký' }]}
                                    >
                                        <Input placeholder="Họ tên nhân viên ký xác nhận" />
                                    </Form.Item>
                                </>
                            );
                        }}
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalAddDeviceReturn;
