import { DatePicker, Form, Modal, Select } from 'antd';
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
                toast.error('Không tải được checkout đủ điều kiện trả');
            } finally {
                setLoadingOpts(false);
            }
        };
        void load();
    }, [openModalAddDeviceReturn]);

    const resetModal = () => {
        form.resetFields();
        form.setFieldsValue({ returnAt: dayjs(), deviceStatus: 'GOOD' });
    };

    const handleAdd = async (values: FormVals) => {
        const payload: ICreateDeviceReturnReq = {
            checkoutId: values.checkoutId,
            returnTime: values.returnAt ? values.returnAt.toISOString() : undefined,
            deviceStatus: values.deviceStatus,
        };
        try {
            setSubmitting(true);
            const res = await createDeviceReturn(payload);
            if (res.data.statusCode === 201) {
                await dispatch(fetchDeviceReturns(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalAddDeviceReturn(false);
                toast.success('Tạo phiếu trả thành công');
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
            title="Tạo phiếu trả tài sản"
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
                if (open) form.setFieldsValue({ returnAt: dayjs(), deviceStatus: 'GOOD' });
            }}
        >
            <div>
                <hr />
                <p style={{ marginBottom: 12, color: '#666' }}>
                    Chỉ hiển thị phiếu nhận có đăng ký <strong>Đang dùng</strong> và chưa có phiếu trả.
                </p>
                <Form<FormVals> form={form} onFinish={handleAdd} layout="vertical" autoComplete="off">
                    <Form.Item
                        label="Phiếu nhận (checkout)"
                        name="checkoutId"
                        rules={[{ required: true, message: 'Vui lòng chọn checkout!' }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            loading={loadingOpts}
                            placeholder="Chọn checkout"
                            options={checkoutOptions.map((c) => ({
                                value: c.id,
                                label: `#${c.id} — usage #${c.assetUsageId} — ${c.assetName ?? ''} — ${c.userEmail ?? ''}`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item label="Thời điểm trả" name="returnAt">
                        <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                    </Form.Item>

                    <Form.Item
                        label="Tình trạng sau khi dùng"
                        name="deviceStatus"
                        rules={[{ required: true, message: 'Chọn tình trạng!' }]}
                    >
                        <Select options={DEVICE_CONDITION_OPTIONS} />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalAddDeviceReturn;
