import {
    Image,
    Modal,
    Select,
    Upload,
    InputNumber,
    TimePicker,
    Switch,
    type GetProp,
    type UploadFile,
    type UploadProps,
} from 'antd';
import { Form, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

import { updatePitch, uploadImagePitch } from '../../../../config/Api';
import { useAppDispatch } from '../../../../redux/hooks';
import { fetchPitches } from '../../../../redux/features/pitchSlice';

import type { IPitch, IUpdatePitchReq } from '../../../../types/pitch';
import {
    PITCH_STATUS_OPTIONS,
    PITCH_TYPE_OPTIONS,
} from '../../../../utils/constants/pitch.constants';

interface IProps {
    openModalUpdatePitch: boolean;
    setOpenModalUpdatePitch: (v: boolean) => void;
    pitchEdit: IPitch | null;
}

type IUpdatePitchForm = Omit<IUpdatePitchReq, 'openTime' | 'closeTime'> & {
    openTime?: dayjs.Dayjs | null;
    closeTime?: dayjs.Dayjs | null;
};

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const ModalUpdatePitch = (props: IProps) => {
    const { openModalUpdatePitch, setOpenModalUpdatePitch, pitchEdit } = props;

    const [form] = Form.useForm<IUpdatePitchForm>();
    const dispatch = useAppDispatch();

    const [previewOpen, setPreviewOpen] = useState<boolean>(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const open24h = Form.useWatch('open24h', form);
    const openTime = Form.useWatch('openTime', form);
    const closeTime = Form.useWatch('closeTime', form);

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
    
                // Cập nhật form field "pitchUrl"
                form.setFieldValue('pitchUrl', pitchUrl);
    
                // Cập nhật lại danh sách file
                setFileList([
                    {
                        uid: file.uid || Date.now(),
                        name: file.name,
                        status: 'done',
                        url: pitchUrl,
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

    const handleEditPitch = async (values: IUpdatePitchForm) => {
        if (!pitchEdit?.id) {
            toast.error('ID sân không hợp lệ');
            return;
        }

        const payload: IUpdatePitchReq = {
            ...values,
            openTime: values.openTime
                ? dayjs(values.openTime).format('HH:mm')
                : null,
            closeTime: values.closeTime
                ? dayjs(values.closeTime).format('HH:mm')
                : null,
        };

        try {
            const res = await updatePitch(pitchEdit.id, payload);

            if (res.data.statusCode === 200) {
                toast.success('Cập nhật sân thành công');
                form.resetFields();
                setFileList([]);
                await dispatch(fetchPitches(''));
                setOpenModalUpdatePitch(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>Có lỗi xảy ra!</div>
                    <div>{m}</div>
                </div>
            );
        }
    };

    useEffect(() => {
        if (!pitchEdit) return;

        form.resetFields();

        form.setFieldsValue({
            name: pitchEdit.name,
            pitchType: pitchEdit.pitchType,
            pricePerHour: pitchEdit.pricePerHour,
            open24h: pitchEdit.open24h,
            openTime: pitchEdit.openTime
                ? dayjs(pitchEdit.openTime, 'HH:mm')
                : null,
            closeTime: pitchEdit.closeTime
                ? dayjs(pitchEdit.closeTime, 'HH:mm')
                : null,
            address: pitchEdit.address,
            latitude: pitchEdit.latitude,
            longitude: pitchEdit.longitude,
            status: pitchEdit.status,
            pitchUrl: pitchEdit.pitchUrl,
        });

        if (pitchEdit.pitchUrl) {
            setFileList([
                {
                    uid: '-1',
                    name: 'pitch',
                    status: 'done',
                    url: pitchEdit.pitchUrl,
                },
            ]);
        } else {
            setFileList([]);
        }
    }, [pitchEdit]);

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
            title="Cập nhật sân"
            maskClosable={false}
            open={openModalUpdatePitch}
            okText="Lưu"
            cancelText="Hủy"
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdatePitch(false)}
        >
            <hr />
            <Form
                form={form}
                layout="vertical"
                onFinish={handleEditPitch}
                autoComplete="off"
            >
                <Form.Item label="Tên sân" name="name">
                    <Input />
                </Form.Item>

                <Form.Item label="Loại sân" name="pitchType">
                    <Select options={PITCH_TYPE_OPTIONS} />
                </Form.Item>

                <Form.Item label="Giá / giờ" name="pricePerHour">
                    <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>

                <Form.Item
                    label="Mở 24h"
                    name="open24h"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>


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

                <Form.Item label="Địa chỉ" name="address">
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Vĩ độ (Latitude)"
                    name="latitude"
                    rules={[
                        { required: true, message: 'Vui lòng nhập vĩ độ' },
                        { type: 'number', min: -90, max: 90, message: 'Vĩ độ phải từ -90 đến 90' },
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Ví dụ: 21.309507"
                        step={0.000001}
                    />
                </Form.Item>

                <Form.Item
                    label="Kinh độ (Longitude)"
                    name="longitude"
                    rules={[
                        { required: true, message: 'Vui lòng nhập kinh độ' },
                        { type: 'number', min: -180, max: 180, message: 'Kinh độ phải từ -180 đến 180' },
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Ví dụ: 103.940030"
                        step={0.000001}
                    />
                </Form.Item>

                <Form.Item label="Trạng thái" name="status">
                    <Select options={PITCH_STATUS_OPTIONS} />
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
                            styles={{ root: { display: 'none' } }}
                            preview={{
                                visible: previewOpen,
                                onVisibleChange: setPreviewOpen,
                                afterOpenChange: (v) =>
                                    !v && setPreviewImage(''),
                            }}
                            src={previewImage}
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

export default ModalUpdatePitch;
