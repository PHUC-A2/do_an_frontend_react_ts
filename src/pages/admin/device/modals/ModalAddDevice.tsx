import { Form, Input, InputNumber, Image, Modal, Select, Upload, type GetProp, type UploadFile, type UploadProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createDevice, getAllAssets, uploadImageDevice } from '../../../../config/Api';
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

    type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

    /** Convert file -> base64 để preview khi cần (dùng cùng pattern với ModalAddAsset/Equipment). */
    const getBase64 = (file: FileType): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => setFileList(newFileList);

    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

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
            imageUrl: null,
        });
        setFileList([]);
        setPreviewOpen(false);
        setPreviewImage('');
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

    /** Upload ảnh thiết bị (admin) và gán tên file vào field hidden `imageUrl`. */
    const handleUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImageDevice(file);
            const imageUrl = res.data?.fileName;
            const url = res.data?.url;

            // Lưu tên file ảnh vào request DTO để client tự ghép đường dẫn.
            form.setFieldValue('imageUrl', imageUrl);
            setFileList([
                {
                    uid: file.uid || Date.now(),
                    name: file.name,
                    status: 'done',
                    url,
                    originFileObj: file,
                },
            ]);
            onSuccess?.('ok');
            toast.success('Upload ảnh thiết bị thành công');
        } catch (err) {
            console.error(err);
            onError?.(err);
            toast.error('Upload ảnh thất bại');
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
                    setFileList([]);
                    setPreviewOpen(false);
                    setPreviewImage('');
                    form.setFieldsValue({
                        quantity: 1,
                        status: 'AVAILABLE',
                        deviceType: 'FIXED',
                        imageUrl: null,
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

                    <Form.Item label="Ảnh thiết bị">
                        <Upload
                            listType="picture-circle"
                            fileList={fileList}
                            onPreview={handlePreview}
                            onChange={handleChange}
                            customRequest={handleUpload}
                            accept=".jpg,.jpeg,.png,.webp"
                        >
                            {fileList.length >= 1 ? null : uploadButton}
                        </Upload>

                        {/* Ẩn Image thật để tránh layout nhảy; dùng preview trên Upload. */}
                        {previewImage ? (
                            <Image
                                preview={{
                                    visible: previewOpen,
                                    onVisibleChange: (visible) => setPreviewOpen(visible),
                                }}
                                src={previewImage}
                                style={{ display: 'none' }}
                            />
                        ) : null}
                    </Form.Item>

                    {/* Field ẩn lưu tên file ảnh lên backend. */}
                    <Form.Item name="imageUrl" hidden>
                        <Input />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalAddDevice;
