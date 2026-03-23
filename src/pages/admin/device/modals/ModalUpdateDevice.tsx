import {
    Form,
    Input,
    InputNumber,
    Image,
    Modal,
    Select,
    Upload,
    type GetProp,
    type UploadFile,
    type UploadProps,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAllAssets, updateDevice, uploadImageDevice } from '../../../../config/Api';
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

    type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

    /** Convert file -> base64 để preview khi cần. */
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
                setFileList([]);
                setPreviewOpen(false);
                setPreviewImage('');
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

    /** Upload ảnh thiết bị (admin) và gán tên file vào field hidden `imageUrl`. */
    const handleUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImageDevice(file);
            const imageUrl = res.data?.fileName;
            const url = res.data?.url;

            // Lưu tên file ảnh vào request DTO.
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

    useEffect(() => {
        if (!deviceEdit) return;
        form.resetFields();
        form.setFieldsValue({
            assetId: deviceEdit.assetId,
            deviceName: deviceEdit.deviceName,
            quantity: deviceEdit.quantity,
            status: deviceEdit.status,
            deviceType: deviceEdit.deviceType,
            imageUrl: deviceEdit.imageUrl ?? null,
        });

        // Nạp fileList để hiển thị preview ảnh hiện tại (nếu đã cấu hình).
        if (deviceEdit.imageUrl) {
            setFileList([
                {
                    uid: `existing-${deviceEdit.id}`,
                    name: deviceEdit.imageUrl,
                    status: 'done',
                    url: `/storage/device/${deviceEdit.imageUrl}`,
                },
            ]);
        } else {
            setFileList([]);
        }
        setPreviewOpen(false);
        setPreviewImage('');
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
            onCancel={() => {
                setOpenModalUpdateDevice(false);
                setPreviewOpen(false);
                setPreviewImage('');
            }}
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

                    <Form.Item name="imageUrl" hidden>
                        <Input />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalUpdateDevice;
