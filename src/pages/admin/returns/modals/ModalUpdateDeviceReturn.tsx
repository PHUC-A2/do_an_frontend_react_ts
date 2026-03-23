import { DatePicker, Form, Modal, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { updateDeviceReturn } from '../../../../config/Api';
import type { DeviceCondition, IDeviceReturn, IUpdateDeviceReturnReq } from '../../../../types/deviceReturn';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchDeviceReturns, selectDeviceReturnLastListQuery } from '../../../../redux/features/deviceReturnSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import { DEVICE_CONDITION_OPTIONS } from '../../../../utils/constants/deviceReturn.constants';

interface IProps {
    openModalUpdateDeviceReturn: boolean;
    setOpenModalUpdateDeviceReturn: (v: boolean) => void;
    returnEdit: IDeviceReturn | null;
}

type FormVals = {
    returnAt: Dayjs;
    deviceStatus: DeviceCondition;
};

const ModalUpdateDeviceReturn = (props: IProps) => {
    const { openModalUpdateDeviceReturn, setOpenModalUpdateDeviceReturn, returnEdit } = props;
    const [form] = Form.useForm<FormVals>();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectDeviceReturnLastListQuery);
    const [submitting, setSubmitting] = useState(false);

    const handleEdit = async (values: FormVals) => {
        if (!returnEdit?.id) {
            toast.error('ID phiếu không hợp lệ');
            return;
        }
        const payload: IUpdateDeviceReturnReq = {
            returnTime: values.returnAt.toISOString(),
            deviceStatus: values.deviceStatus,
        };
        try {
            setSubmitting(true);
            const res = await updateDeviceReturn(returnEdit.id, payload);
            if (res.data.statusCode === 200) {
                toast.success('Cập nhật phiếu trả thành công');
                form.resetFields();
                await dispatch(fetchDeviceReturns(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalUpdateDeviceReturn(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>Có lỗi xảy ra!</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (!returnEdit) return;
        form.resetFields();
        form.setFieldsValue({
            returnAt: dayjs(returnEdit.returnTime),
            deviceStatus: returnEdit.deviceStatus,
        });
    }, [returnEdit]);

    return (
        <Modal
            title="Cập nhật phiếu trả tài sản"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalUpdateDeviceReturn}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdateDeviceReturn(false)}
        >
            <div>
                <hr />
                <Form<FormVals> form={form} onFinish={handleEdit} layout="vertical" autoComplete="off">
                    <Form.Item
                        label="Thời điểm trả"
                        name="returnAt"
                        rules={[{ required: true, message: 'Chọn thời điểm!' }]}
                    >
                        <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                    </Form.Item>

                    <Form.Item
                        label="Tình trạng sau khi dùng"
                        name="deviceStatus"
                        rules={[{ required: true }]}
                    >
                        <Select options={DEVICE_CONDITION_OPTIONS} />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalUpdateDeviceReturn;
