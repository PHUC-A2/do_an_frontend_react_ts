import { Image, Modal, Upload, type GetProp, type UploadFile, type UploadProps } from 'antd';
import { Form, Input, InputNumber } from 'antd';
import { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { updateAsset, uploadImageAsset } from '../../../../config/Api';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchAssets, selectAssetLastListQuery } from '../../../../redux/features/assetSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import type { IUpdateAssetReq, IAsset } from '../../../../types/asset';

interface IProps {
    openModalUpdateAsset: boolean;
    setOpenModalUpdateAsset: (v: boolean) => void;
    assetEdit: IAsset | null;
}

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const ModalUpdateAsset = (props: IProps) => {
    const { openModalUpdateAsset, setOpenModalUpdateAsset, assetEdit } = props;
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

    /** Upload ảnh mới, cập nhật assetsUrl trong form (giống ModalUpdateUser + avatarUrl) */
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

    const handleEdit = async (values: IUpdateAssetReq) => {
        try {
            if (!assetEdit?.id) {
                toast.error('ID tài sản không hợp lệ');
                return;
            }
            setSubmitting(true);
            const res = await updateAsset(assetEdit.id, values);

            if (res.data.statusCode === 200) {
                toast.success('Cập nhật tài sản thành công');
                form.resetFields();
                setFileList([]);
                await dispatch(fetchAssets(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalUpdateAsset(false);
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
        if (!assetEdit) return;

        form.resetFields();
        form.setFieldsValue({
            assetName: assetEdit.assetName,
            location: assetEdit.location ?? undefined,
            capacity: assetEdit.capacity ?? undefined,
            assetsUrl: assetEdit.assetsUrl ?? undefined,
        });

        if (assetEdit.assetsUrl) {
            setFileList([
                {
                    uid: '-1',
                    name: 'asset',
                    status: 'done',
                    url: assetEdit.assetsUrl,
                },
            ]);
        } else {
            setFileList([]);
        }
    }, [assetEdit]);

    return (
        <Modal
            title="Cập nhật tài sản"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalUpdateAsset}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdateAsset(false)}
        >
            <div>
                <hr />
                <Form form={form} onFinish={handleEdit} layout="vertical" autoComplete="off">
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

export default ModalUpdateAsset;
