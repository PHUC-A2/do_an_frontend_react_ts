import { Form, Input, InputNumber, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createDevice, getAllAssets } from '../../../../config/Api';
import type { IAsset } from '../../../../types/asset';
import type { DeviceStatus, DeviceType, ICreateDeviceReq } from '../../../../types/device';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchDevices, selectDeviceLastListQuery } from '../../../../redux/features/deviceSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import { buildSpringListQuery } from '../../../../utils/pagination/buildSpringPageQuery';
import { DEVICE_STATUS_OPTIONS, DEVICE_TYPE_OPTIONS } from '../../../../utils/constants/device.constants';

interface IProps {
    openModalAddDevice: boolean;
    setOpenModalAddDevice: (v: boolean) => void;
}

/** Modal thêm thiết bị gắn tài sản — cùng luồng ModalAddAsset (Lưu / Hủy, refetch list). */
const ModalAddDevice = (props: IProps) => {
    const { openModalAddDevice, setOpenModalAddDevice } = props;
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectDeviceLastListQuery);
    const [submitting, setSubmitting] = useState(false);
    const [assets, setAssets] = useState<IAsset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);

    /** Nạp danh sách tài sản cho Select assetId khi mở modal. */
    useEffect(() => {
        if (!openModalAddDevice) return;
        const load = async () => {
            try {
                setLoadingAssets(true);
                const q = buildSpringListQuery({ page: 1, pageSize: 500 });
                const res = await getAllAssets(q);
                const body = res.data;
                if (body.statusCode === 200 && body.data?.result) {
                    setAssets(body.data.result);
                }
            } catch (e) {
                console.error(e);
                toast.error('Không tải được danh sách tài sản');
            } finally {
                setLoadingAssets(false);
            }
        };
        void load();
    }, [openModalAddDevice]);

    const resetModal = () => {
        form.resetFields();
        form.setFieldsValue({
            quantity: 1,
            status: 'AVAILABLE' satisfies DeviceStatus,
            deviceType: 'FIXED' satisfies DeviceType,
        });
    };

    const handleAdd = async (data: ICreateDeviceReq) => {
        try {
            setSubmitting(true);
            const res = await createDevice(data);
            const body = res.data;
            if (body.statusCode === 201) {
                await dispatch(fetchDevices(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalAddDevice(false);
                toast.success('Tạo mới thiết bị theo tài sản thành công');
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
            title="Thêm thiết bị theo tài sản"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalAddDevice}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => {
                setOpenModalAddDevice(false);
                resetModal();
            }}
            afterOpenChange={(open) => {
                if (open) {
                    form.setFieldsValue({
                        quantity: 1,
                        status: 'AVAILABLE',
                        deviceType: 'FIXED',
                    });
                }
            }}
        >
            <div>
                <hr />
                <Form<ICreateDeviceReq> form={form} onFinish={handleAdd} layout="vertical" autoComplete="off">
                    <Form.Item
                        label="Tài sản"
                        name="assetId"
                        rules={[{ required: true, message: 'Vui lòng chọn tài sản!' }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            loading={loadingAssets}
                            placeholder="Chọn tài sản"
                            options={assets.map((a) => ({
                                value: a.id,
                                label: `${a.id} — ${a.assetName}`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Tên thiết bị"
                        name="deviceName"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Số lượng"
                        name="quantity"
                        rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
                        <Select options={DEVICE_STATUS_OPTIONS} />
                    </Form.Item>

                    <Form.Item label="Loại thiết bị" name="deviceType" rules={[{ required: true }]}>
                        <Select options={DEVICE_TYPE_OPTIONS} />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalAddDevice;
