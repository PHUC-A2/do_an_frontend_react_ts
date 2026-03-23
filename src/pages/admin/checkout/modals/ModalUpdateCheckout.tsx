import { DatePicker, Form, Input, Modal } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { updateCheckout } from '../../../../config/Api';
import type { ICheckout, IUpdateCheckoutReq } from '../../../../types/checkout';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchCheckouts, selectCheckoutLastListQuery } from '../../../../redux/features/checkoutSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';

interface IProps {
    openModalUpdateCheckout: boolean;
    setOpenModalUpdateCheckout: (v: boolean) => void;
    checkoutEdit: ICheckout | null;
}

type FormVals = {
    receiveAt: Dayjs;
    conditionNote?: string;
};

const ModalUpdateCheckout = (props: IProps) => {
    const { openModalUpdateCheckout, setOpenModalUpdateCheckout, checkoutEdit } = props;
    const [form] = Form.useForm<FormVals>();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectCheckoutLastListQuery);
    const [submitting, setSubmitting] = useState(false);

    const handleEdit = async (values: FormVals) => {
        if (!checkoutEdit?.id) {
            toast.error('ID phiếu không hợp lệ');
            return;
        }
        const payload: IUpdateCheckoutReq = {
            receiveTime: values.receiveAt.toISOString(),
            conditionNote: values.conditionNote?.trim() || undefined,
        };
        try {
            setSubmitting(true);
            const res = await updateCheckout(checkoutEdit.id, payload);
            if (res.data.statusCode === 200) {
                toast.success('Cập nhật phiếu nhận thành công');
                form.resetFields();
                await dispatch(fetchCheckouts(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalUpdateCheckout(false);
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
        if (!checkoutEdit) return;
        form.resetFields();
        form.setFieldsValue({
            receiveAt: dayjs(checkoutEdit.receiveTime),
            conditionNote: checkoutEdit.conditionNote ?? undefined,
        });
    }, [checkoutEdit]);

    return (
        <Modal
            title="Cập nhật phiếu nhận tài sản"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalUpdateCheckout}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdateCheckout(false)}
        >
            <div>
                <hr />
                <Form<FormVals> form={form} onFinish={handleEdit} layout="vertical" autoComplete="off">
                    <Form.Item
                        label="Thời điểm nhận"
                        name="receiveAt"
                        rules={[{ required: true, message: 'Chọn thời điểm!' }]}
                    >
                        <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                    </Form.Item>

                    <Form.Item label="Ghi chú tình trạng" name="conditionNote">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalUpdateCheckout;
