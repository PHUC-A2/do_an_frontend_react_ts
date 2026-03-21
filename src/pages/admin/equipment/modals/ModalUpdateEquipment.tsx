import { Image, Modal, Upload, Select, type UploadFile, type UploadProps, type GetProp } from 'antd';
import { Form, Input, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { updateEquipment, uploadImageEquipment } from '../../../../config/Api';
import { useAppDispatch } from '../../../../redux/hooks';
import { fetchEquipments } from '../../../../redux/features/equipmentSlice';
import type { IEquipment, IUpdateEquipmentReq } from '../../../../types/equipment';
import { EQUIPMENT_STATUS_OPTIONS } from '../../../../utils/constants/equipment.constants';

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    equipmentEdit: IEquipment | null;
}

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const ModalUpdateEquipment = ({ open, setOpen, equipmentEdit }: IProps) => {
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    useEffect(() => {
        if (equipmentEdit && open) {
            form.setFieldsValue({
                name: equipmentEdit.name,
                description: equipmentEdit.description,
                totalQuantity: equipmentEdit.totalQuantity,
                price: equipmentEdit.price,
                imageUrl: equipmentEdit.imageUrl,
                status: equipmentEdit.status,
                conditionNote: equipmentEdit.conditionNote ?? '',
            });
            if (equipmentEdit.imageUrl) {
                setFileList([{
                    uid: '-1',
                    name: equipmentEdit.imageUrl,
                    status: 'done',
                    url: `/storage/equipment/${equipmentEdit.imageUrl}`,
                }]);
            } else {
                setFileList([]);
            }
        }
    }, [equipmentEdit, open]);

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleChange: UploadProps['onChange'] = ({ fileList }) => setFileList(fileList);

    const handleUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImageEquipment(file);
            const imageUrl = res.data?.fileName;
            form.setFieldValue('imageUrl', imageUrl);
            setFileList([{ uid: file.uid, name: file.name, status: 'done', url: res.data?.url }]);
            onSuccess?.('ok');
            toast.success('Upload ảnh thành công');
        } catch {
            onError?.();
            toast.error('Upload ảnh thất bại');
        }
    };

    const handleSubmit = async (values: any) => {
        if (!equipmentEdit) return;

        const payload: IUpdateEquipmentReq = {
            name: values.name,
            description: values.description,
            totalQuantity: values.totalQuantity,
            price: values.price,
            imageUrl: values.imageUrl,
            status: values.status,
        };

        try {
            const res = await updateEquipment(equipmentEdit.id, payload);
            if (res.data.statusCode === 200) {
                toast.success('Cập nhật thiết bị thành công');
                await dispatch(fetchEquipments(''));
                setOpen(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(<div><strong>Có lỗi xảy ra!</strong><div>{m}</div></div>);
        }
    };

    return (
        <Modal
            title="Cập nhật thiết bị"
            open={open}
            maskClosable={false}
            okText="Lưu"
            cancelText="Hủy"
            onOk={() => form.submit()}
            onCancel={() => setOpen(false)}
        >
            <hr />
            <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
                <Form.Item label="Tên thiết bị" name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea rows={2} />
                </Form.Item>

                <Form.Item label="Tổng số lượng" name="totalQuantity"
                    rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                >
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>

                <Form.Item label="Giá trị (đ)" name="price"
                    rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                </Form.Item>

                <Form.Item label="Trạng thái" name="status"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                    <Select options={EQUIPMENT_STATUS_OPTIONS} />
                </Form.Item>

                <Form.Item label="Ghi chú tình trạng thiết bị" name="conditionNote">
                    <Input.TextArea rows={2} placeholder="Mô tả tình trạng hiện tại của thiết bị trong kho" />
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
                        {fileList.length >= 1 ? null : (
                            <button style={{ border: 0, background: 'none' }} type="button">
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </button>
                        )}
                    </Upload>
                    {previewImage && (
                        <Image
                            preview={{ visible: previewOpen, onVisibleChange: setPreviewOpen }}
                            src={previewImage}
                            style={{ display: 'none' }}
                        />
                    )}
                </Form.Item>

                <Form.Item name="imageUrl" hidden><Input /></Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalUpdateEquipment;
