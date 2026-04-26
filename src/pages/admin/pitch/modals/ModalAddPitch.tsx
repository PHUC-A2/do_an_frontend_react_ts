import {
    Image,
    Modal,
    Upload,
    Select,
    Switch,
    TimePicker,
    Divider,
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
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchPitchesAdmin, selectPitchLastListQuery } from '../../../../redux/features/pitchSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';

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
    const pitchListQuery = useAppSelector(selectPitchLastListQuery);
    const open24h = Form.useWatch('open24h', form);
    const useHourlyPricing = Form.useWatch('useHourlyPricing', form);
    const openTime = Form.useWatch('openTime', form);
    const closeTime = Form.useWatch('closeTime', form);
    const pitchLength = Form.useWatch('length', form);
    const pitchWidth = Form.useWatch('width', form);
    const pitchArea =
        typeof pitchLength === 'number' && typeof pitchWidth === 'number'
            ? Number((pitchLength * pitchWidth).toFixed(2))
            : null;


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
        // Tách riêng 2 khung giá: Sáng và Chiều (không dùng list chung)
        const normalizedHourlyPrices = [
            {
                startTime: values?.morningStartTime ? dayjs(values.morningStartTime).format("HH:mm") : undefined,
                endTime: values?.morningEndTime ? dayjs(values.morningEndTime).format("HH:mm") : undefined,
                pricePerHour: Number(values?.morningPricePerHour),
            },
            {
                startTime: values?.afternoonStartTime ? dayjs(values.afternoonStartTime).format("HH:mm") : undefined,
                endTime: values?.afternoonEndTime ? dayjs(values.afternoonEndTime).format("HH:mm") : undefined,
                pricePerHour: Number(values?.afternoonPricePerHour),
            },
        ].filter((hp: any) => hp.startTime && hp.endTime && Number.isFinite(hp.pricePerHour) && hp.pricePerHour > 0);

        const payload: ICreatePitchReq = {
            ...values,
            openTime: values.openTime
                ? dayjs(values.openTime).format('HH:mm')
                : null,
            closeTime: values.closeTime
                ? dayjs(values.closeTime).format('HH:mm')
                : null,
            // Khi bật giá theo khung giờ: gửi danh sách khung giá, đồng thời set giá base theo khung đầu tiên
            // để backend luôn có giá fallback hợp lệ.
            pricePerHour: values.useHourlyPricing
                ? Number(normalizedHourlyPrices[0]?.pricePerHour ?? values.pricePerHour)
                : values.pricePerHour,
            hourlyPrices: values.useHourlyPricing ? normalizedHourlyPrices : [],
        };

        if (values.useHourlyPricing && normalizedHourlyPrices.length === 0) {
            toast.error("Vui lòng thêm ít nhất 1 khung giờ giá khi bật giá theo khung giờ.");
            return;
        }

        try {
            const res = await createPitch(payload);
            if (res.data.statusCode === 201) {
                toast.success('Tạo sân mới thành công');
                await dispatch(fetchPitchesAdmin(pitchListQuery || DEFAULT_ADMIN_LIST_QUERY));
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
                initialValues={{ useHourlyPricing: false, open24h: false }}
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

                <Form.Item label="Bật giá theo khung giờ" name="useHourlyPricing" valuePropName="checked">
                    <Switch />
                </Form.Item>

                {!useHourlyPricing && (
                    <Form.Item
                        label="Giá / giờ"
                        name="pricePerHour"
                        rules={[
                            { required: true, message: 'Vui lòng nhập giá thuê sân' },
                            { type: 'number', min: 1, message: 'Giá phải lớn hơn 0' },
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        />
                    </Form.Item>
                )}

                {useHourlyPricing && (
                    <>
                        <Divider titlePlacement="left">Giá theo khung giờ</Divider>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>Khung sáng</div>
                                <Form.Item label="Giờ bắt đầu sáng" name="morningStartTime" rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu sáng" }]}>
                                    <TimePicker format="HH:mm" style={{ width: "100%" }} />
                                </Form.Item>
                                <Form.Item label="Giờ kết thúc sáng" name="morningEndTime" rules={[{ required: true, message: "Vui lòng chọn giờ kết thúc sáng" }]}>
                                    <TimePicker format="HH:mm" style={{ width: "100%" }} />
                                </Form.Item>
                                <Form.Item
                                    label="Giá sáng / giờ"
                                    name="morningPricePerHour"
                                    rules={[{ required: true, message: "Vui lòng nhập giá sáng" }, { type: "number", min: 1, message: "Giá phải lớn hơn 0" }]}
                                >
                                    <InputNumber style={{ width: "100%" }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
                                </Form.Item>
                            </div>
                            <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>Khung chiều</div>
                                <Form.Item label="Giờ bắt đầu chiều" name="afternoonStartTime" rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu chiều" }]}>
                                    <TimePicker format="HH:mm" style={{ width: "100%" }} />
                                </Form.Item>
                                <Form.Item label="Giờ kết thúc chiều" name="afternoonEndTime" rules={[{ required: true, message: "Vui lòng chọn giờ kết thúc chiều" }]}>
                                    <TimePicker format="HH:mm" style={{ width: "100%" }} />
                                </Form.Item>
                                <Form.Item
                                    label="Giá chiều / giờ"
                                    name="afternoonPricePerHour"
                                    rules={[{ required: true, message: "Vui lòng nhập giá chiều" }, { type: "number", min: 1, message: "Giá phải lớn hơn 0" }]}
                                >
                                    <InputNumber style={{ width: "100%" }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
                                </Form.Item>
                            </div>
                        </div>
                    </>
                )}

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

                <Form.Item label="Chiều dài sân (m)" name="length" rules={[{ type: 'number', min: 0, message: 'Chiều dài phải >= 0' }]}>
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="Ví dụ: 105" />
                </Form.Item>

                <Form.Item label="Chiều rộng sân (m)" name="width" rules={[{ type: 'number', min: 0, message: 'Chiều rộng phải >= 0' }]}>
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="Ví dụ: 68" />
                </Form.Item>

                <Form.Item label="Chiều cao (m)" name="height" rules={[{ type: 'number', min: 0, message: 'Chiều cao phải >= 0' }]}>
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="Ví dụ: 10" />
                </Form.Item>

                <Form.Item label="Diện tích sân (m2)">
                    <Input
                        readOnly
                        value={pitchArea != null ? pitchArea.toLocaleString('vi-VN') : 'Tự tính khi nhập chiều dài và chiều rộng'}
                    />
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
