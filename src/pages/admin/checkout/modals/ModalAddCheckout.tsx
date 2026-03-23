import { DatePicker, Form, Input, Modal, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createCheckout, getAllAssetUsages, getAllCheckouts } from '../../../../config/Api';
import type { IAssetUsage } from '../../../../types/assetUsage';
import type { ICreateCheckoutReq } from '../../../../types/checkout';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchCheckouts, selectCheckoutLastListQuery } from '../../../../redux/features/checkoutSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import { buildSpringListQuery } from '../../../../utils/pagination/buildSpringPageQuery';
import { ASSET_USAGE_TYPE_META } from '../../../../utils/constants/assetUsage.constants';

interface IProps {
    openModalAddCheckout: boolean;
    setOpenModalAddCheckout: (v: boolean) => void;
}

type FormVals = {
    assetUsageId: number;
    receiveAt?: Dayjs;
    conditionNote?: string;
};

const ModalAddCheckout = (props: IProps) => {
    const { openModalAddCheckout, setOpenModalAddCheckout } = props;
    const [form] = Form.useForm<FormVals>();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectCheckoutLastListQuery);
    const [submitting, setSubmitting] = useState(false);
    const [usageOptions, setUsageOptions] = useState<IAssetUsage[]>([]);
    const [loadingOpts, setLoadingOpts] = useState(false);

    useEffect(() => {
        if (!openModalAddCheckout) return;
        const load = async () => {
            try {
                setLoadingOpts(true);
                const approvedFilter = buildSpringListQuery({
                    page: 1,
                    pageSize: 500,
                    filter: `status : 'APPROVED'`,
                });
                const allCheckoutsQ = buildSpringListQuery({ page: 1, pageSize: 500 });
                const [ur, cr] = await Promise.all([getAllAssetUsages(approvedFilter), getAllCheckouts(allCheckoutsQ)]);
                const usages = ur.data.statusCode === 200 && ur.data.data?.result ? ur.data.data.result : [];
                const checkouts = cr.data.statusCode === 200 && cr.data.data?.result ? cr.data.data.result : [];
                const usedIds = new Set(checkouts.map((c) => c.assetUsageId));
                setUsageOptions(usages.filter((u) => !usedIds.has(u.id)));
            } catch (e) {
                console.error(e);
                toast.error('Không tải được đăng ký đủ điều kiện nhận');
            } finally {
                setLoadingOpts(false);
            }
        };
        void load();
    }, [openModalAddCheckout]);

    const resetModal = () => {
        form.resetFields();
        form.setFieldsValue({ receiveAt: dayjs() });
    };

    const handleAdd = async (values: FormVals) => {
        const payload: ICreateCheckoutReq = {
            assetUsageId: values.assetUsageId,
            receiveTime: values.receiveAt ? values.receiveAt.toISOString() : undefined,
            conditionNote: values.conditionNote?.trim() || undefined,
        };
        try {
            setSubmitting(true);
            const res = await createCheckout(payload);
            if (res.data.statusCode === 201) {
                await dispatch(fetchCheckouts(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalAddCheckout(false);
                toast.success('Tạo phiếu nhận tài sản thành công');
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
            title="Tạo phiếu nhận tài sản"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalAddCheckout}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => {
                setOpenModalAddCheckout(false);
                resetModal();
            }}
            afterOpenChange={(open) => {
                if (open) form.setFieldsValue({ receiveAt: dayjs() });
            }}
        >
            <div>
                <hr />
                <p style={{ marginBottom: 12, color: '#666' }}>
                    Chỉ hiển thị đăng ký <strong>Đã duyệt</strong> và chưa có phiếu nhận.
                </p>
                <Form<FormVals> form={form} onFinish={handleAdd} layout="vertical" autoComplete="off">
                    <Form.Item
                        label="Đăng ký sử dụng tài sản"
                        name="assetUsageId"
                        rules={[{ required: true, message: 'Vui lòng chọn đăng ký!' }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            loading={loadingOpts}
                            placeholder="Chọn đăng ký (APPROVED, chưa checkout)"
                            options={usageOptions.map((u) => ({
                                value: u.id,
                                label: `#${u.id} — ${u.assetName ?? 'TS'} — ${u.date} ${u.startTime}-${u.endTime} (${ASSET_USAGE_TYPE_META[u.usageType]?.label ?? u.usageType})`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item label="Thời điểm nhận" name="receiveAt">
                        <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                    </Form.Item>

                    <Form.Item label="Ghi chú tình trạng ban đầu" name="conditionNote">
                        <Input.TextArea rows={3} placeholder="Tùy chọn" />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalAddCheckout;
