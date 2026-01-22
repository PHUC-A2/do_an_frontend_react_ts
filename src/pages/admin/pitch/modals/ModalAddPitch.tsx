import {
    Image,
    Modal,
    Upload,
    Select,
    Switch,
    TimePicker,
    type UploadFile,
    type UploadProps,
    type GetProp,
} from 'antd';
import { Form, Input, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

import { createPitch, uploadImagePitch } from '../../../../config/Api';
import { useAppDispatch } from '../../../../redux/hooks';
import { fetchPitches } from '../../../../redux/features/pitchSlice';

import type { ICreatePitchReq } from '../../../../types/pitch';
import {
    PITCH_TYPE_OPTIONS,
} from '../../../../utils/constants/pitch.constants';

interface IProps {
    openModalAddPitch: boolean;
    setOpenModalAddPitch: (v: boolean) => void;
}

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const ModalAddPitch = ({ openModalAddPitch, setOpenModalAddPitch }: IProps) => {
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const open24h = Form.useWatch('open24h', form);
    const openTime = Form.useWatch('openTime', form);
    const closeTime = Form.useWatch('closeTime', form);


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

    const handleChange: UploadProps['onChange'] = ({ fileList }) =>
        setFileList(fileList);

    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

    const handleUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImagePitch(file);
            const pitchUrl = res.data?.url;

            form.setFieldValue('pitchUrl', pitchUrl);

            setFileList([
                {
                    uid: file.uid,
                    name: file.name,
                    status: 'done',
                    url: pitchUrl,
                },
            ]);

            onSuccess?.('ok');
            toast.success('Upload ảnh thành công');
        } catch (err) {
            onError?.(err);
            toast.error('Upload ảnh thất bại');
        }
    };

    const handleAddPitch = async (values: any) => {
        const payload: ICreatePitchReq = {
            ...values,
            openTime: values.openTime
                ? dayjs(values.openTime).format('HH:mm')
                : null,
            closeTime: values.closeTime
                ? dayjs(values.closeTime).format('HH:mm')
                : null,
        };

        try {
            const res = await createPitch(payload);
            if (res.data.statusCode === 201) {
                toast.success('Tạo sân mới thành công');
                await dispatch(fetchPitches(''));
                form.resetFields();
                setFileList([]);
                setOpenModalAddPitch(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <strong>Có lỗi xảy ra!</strong>
                    <div>{m}</div>
                </div>
            );
        }
    };

    useEffect(() => {
        if (open24h) {
            form.setFieldsValue({
                openTime: null,
                closeTime: null,
            });
        }
    }, [open24h]);

    useEffect(() => {
        if (openTime || closeTime) {
            form.setFieldValue('open24h', false);
        }
    }, [openTime, closeTime]);

    return (
        <Modal
            title="Thêm mới sân"
            open={openModalAddPitch}
            maskClosable={false}
            okText="Lưu"
            cancelText="Hủy"
            onOk={() => form.submit()}
            onCancel={() => setOpenModalAddPitch(false)}
        >
            <hr />
            <Form
                form={form}
                layout="vertical"
                onFinish={handleAddPitch}
                autoComplete="off"
            >
                <Form.Item label="Tên sân" name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên sân' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item label="Loại sân" name="pitchType"
                    rules={[{ required: true, message: 'Vui lòng chọn loại sân' }]}
                >
                    <Select options={PITCH_TYPE_OPTIONS} />
                </Form.Item>

                <Form.Item
                    label="Giá / giờ"
                    name="pricePerHour"
                    rules={[
                        { required: true, message: 'Vui lòng nhập giá thuê sân' },
                        {
                            type: 'number',
                            min: 1,
                            message: 'Giá phải lớn hơn 0',
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        formatter={(v) =>
                            `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        }
                    />
                </Form.Item>

                {!openTime && !closeTime && (
                    <Form.Item label="Mở 24h" name="open24h" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                )}

                {!open24h && (
                    <>
                        <Form.Item label="Giờ mở cửa" name="openTime">
                            <TimePicker format="HH:mm" style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item label="Giờ đóng cửa" name="closeTime">
                            <TimePicker format="HH:mm" style={{ width: '100%' }} />
                        </Form.Item>
                    </>
                )}

                <Form.Item
                    label="Địa chỉ"
                    name="address"
                    rules={[{ required: true, message: 'Vui lòng nhập địa chỉ sân' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item label="Ảnh sân">
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
                            preview={{
                                visible: previewOpen,
                                onVisibleChange: setPreviewOpen,
                            }}
                            src={previewImage}
                            style={{ display: 'none' }}
                        />
                    )}
                </Form.Item>

                <Form.Item name="pitchUrl" hidden>
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalAddPitch;
