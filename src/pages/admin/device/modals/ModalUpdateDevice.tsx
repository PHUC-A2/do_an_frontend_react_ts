import { Form, Input, InputNumber, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAllAssets, updateDevice } from '../../../../config/Api';
import type { IAsset } from '../../../../types/asset';
import type { IDevice, IUpdateDeviceReq } from '../../../../types/device';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchDevices, selectDeviceLastListQuery } from '../../../../redux/features/deviceSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import { buildSpringListQuery } from '../../../../utils/pagination/buildSpringPageQuery';
import { DEVICE_STATUS_OPTIONS, DEVICE_TYPE_OPTIONS } from '../../../../utils/constants/device.constants';

interface IProps {
    openModalUpdateDevice: boolean;
    setOpenModalUpdateDevice: (v: boolean) => void;
    deviceEdit: IDevice | null;
}

/** Modal cập nhật thiết bị — bám ModalUpdateAsset (refetch theo lastListQuery). */
const ModalUpdateDevice = (props: IProps) => {
    const { openModalUpdateDevice, setOpenModalUpdateDevice, deviceEdit } = props;
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectDeviceLastListQuery);
    const [submitting, setSubmitting] = useState(false);
    const [assets, setAssets] = useState<IAsset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);

    useEffect(() => {
        if (!openModalUpdateDevice) return;
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
    }, [openModalUpdateDevice]);

    const handleEdit = async (values: IUpdateDeviceReq) => {
        try {
            if (!deviceEdit?.id) {
                toast.error('ID thiết bị không hợp lệ');
                return;
            }
            setSubmitting(true);
            const res = await updateDevice(deviceEdit.id, values);
            const body = res.data;
            if (body.statusCode === 200) {
                toast.success('Cập nhật thiết bị theo tài sản thành công');
                form.resetFields();
                await dispatch(fetchDevices(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalUpdateDevice(false);
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
        if (!deviceEdit) return;
        form.resetFields();
        form.setFieldsValue({
            assetId: deviceEdit.assetId,
            deviceName: deviceEdit.deviceName,
            quantity: deviceEdit.quantity,
            status: deviceEdit.status,
            deviceType: deviceEdit.deviceType,
        });
    }, [deviceEdit]);

    return (
        <Modal
            title="Cập nhật thiết bị theo tài sản"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalUpdateDevice}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdateDevice(false)}
        >
            <div>
                <hr />
                <Form<IUpdateDeviceReq> form={form} onFinish={handleEdit} layout="vertical" autoComplete="off">
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

export default ModalUpdateDevice;
