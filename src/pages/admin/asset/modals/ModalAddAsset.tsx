import { Image, Modal, Upload, type GetProp, type UploadFile, type UploadProps } from 'antd';
import { Form, Input, InputNumber } from 'antd';
import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { createAsset, uploadImageAsset } from '../../../../config/Api';
import type { ICreateAssetReq } from '../../../../types/asset';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchAssets, selectAssetLastListQuery } from '../../../../redux/features/assetSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';

interface IProps {
    openModalAddAsset: boolean;
    setOpenModalAddAsset: (v: boolean) => void;
}

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const ModalAddAsset = (props: IProps) => {
    const { openModalAddAsset, setOpenModalAddAsset } = props;
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectAssetLastListQuery);
    const [submitting, setSubmitting] = useState(false);
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

    /** Upload ảnh qua API file, gán URL vào field ẩn assetsUrl (cùng luồng ModalAddUser + avatarUrl) */
    const handleUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImageAsset(file);
            const assetsUrl = res.data?.url;
            form.setFieldValue('assetsUrl', assetsUrl);
            setFileList([
                {
                    uid: file.uid || Date.now(),
                    name: file.name,
                    status: 'done',
                    url: assetsUrl,
                    originFileObj: file,
                },
            ]);
            onSuccess?.('ok');
            toast.success('Upload ảnh thành công');
        } catch (err) {
            console.error(err);
            onError?.(err);
            toast.error('Upload ảnh thất bại');
        }
    };

    const resetModalUi = () => {
        form.resetFields();
        setFileList([]);
        setPreviewImage('');
        setPreviewOpen(false);
    };

    const handleAdd = async (data: ICreateAssetReq) => {
        try {
            setSubmitting(true);
            const res = await createAsset(data);
            if (res.data.statusCode === 201) {
                await dispatch(fetchAssets(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalAddAsset(false);
                toast.success('Tạo mới tài sản thành công');
                resetModalUi();
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div><strong>Có lỗi xảy ra!</strong></div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Thêm mới tài sản"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalAddAsset}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => {
                setOpenModalAddAsset(false);
                resetModalUi();
            }}
        >
            <div>
                <hr />
                <Form form={form} onFinish={handleAdd} layout="vertical" autoComplete="off">
                    <Form.Item
                        label="Tên tài sản"
                        name="assetName"
                        rules={[{ required: true, message: 'Vui lòng nhập tên tài sản!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item label="Vị trí" name="location">
                        <Input />
                    </Form.Item>

                    <Form.Item label="Sức chứa" name="capacity">
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="Số nguyên ≥ 0" />
                    </Form.Item>

                    <Form.Item label="Ảnh tài sản">
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
                        {previewImage && (
                            <Image
                                styles={{ root: { display: 'none' } }}
                                preview={{
                                    visible: previewOpen,
                                    onVisibleChange: (visible) => setPreviewOpen(visible),
                                    afterOpenChange: (visible) => !visible && setPreviewImage(''),
                                }}
                                src={previewImage}
                            />
                        )}
                    </Form.Item>

                    <Form.Item name="assetsUrl" hidden>
                        <Input />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalAddAsset;
