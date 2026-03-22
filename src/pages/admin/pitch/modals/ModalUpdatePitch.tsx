import {
    Image,
    Modal,
    Select,
    Upload,
    InputNumber,
    TimePicker,
    Switch,
    Divider,
    List,
    Button,
    Popconfirm,
    Popover,
    Space,
    Tooltip,
    Radio,
    Tag,
    type GetProp,
    type UploadFile,
    type UploadProps,
} from 'antd';
import { Form, Input } from 'antd';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

import {
    updatePitch,
    uploadImagePitch,
    adminGetPitchEquipments,
    adminUpsertPitchEquipment,
    adminDeletePitchEquipment,
    getAllEquipments,
} from '../../../../config/Api';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchPitches, selectPitchLastListQuery } from '../../../../redux/features/pitchSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';

import type { IPitch, IUpdatePitchReq } from '../../../../types/pitch';
import type { IEquipment } from '../../../../types/equipment';
import type { EquipmentMobilityEnum, IPitchEquipment } from '../../../../types/pitchEquipment';
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
    const pitchListQuery = useAppSelector(selectPitchLastListQuery);

    const [previewOpen, setPreviewOpen] = useState<boolean>(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [pitchEquipments, setPitchEquipments] = useState<IPitchEquipment[]>([]);
    const [allEquipments, setAllEquipments] = useState<IEquipment[]>([]);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | undefined>(undefined);
    const [peQuantity, setPeQuantity] = useState<number>(1);
    const [peSpecification, setPeSpecification] = useState<string>('');
    const [peNote, setPeNote] = useState<string>('');
    const [peMobility, setPeMobility] = useState<EquipmentMobilityEnum>('FIXED');
    const [loadingPitchEquipments, setLoadingPitchEquipments] = useState(false);
    const [savingPitchEquipment, setSavingPitchEquipment] = useState(false);
    const [deletingEquipmentId, setDeletingEquipmentId] = useState<number | null>(null);

    const open24h = Form.useWatch('open24h', form);
    const openTime = Form.useWatch('openTime', form);
    const closeTime = Form.useWatch('closeTime', form);
    const pitchLength = Form.useWatch('length', form);
    const pitchWidth = Form.useWatch('width', form);
    const pitchArea =
        typeof pitchLength === 'number' && typeof pitchWidth === 'number'
            ? Number((pitchLength * pitchWidth).toFixed(2))
            : null;

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
                await dispatch(fetchPitches(pitchListQuery || DEFAULT_ADMIN_LIST_QUERY));
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

    const loadPitchEquipments = async (pitchId: number) => {
        setLoadingPitchEquipments(true);
        try {
            const res = await adminGetPitchEquipments(pitchId);
            if (res.data.statusCode === 200) {
                setPitchEquipments(res.data.data ?? []);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không tải được thiết bị sân');
        } finally {
            setLoadingPitchEquipments(false);
        }
    };

    const loadAllEquipments = async () => {
        try {
            const res = await getAllEquipments('page=1&pageSize=200');
            if (res.data.statusCode === 200) {
                setAllEquipments(res.data.data?.result ?? []);
            }
        } catch {
            setAllEquipments([]);
        }
    };

    useEffect(() => {
        if (!selectedEquipmentId) {
            setPeQuantity(1);
            setPeSpecification('');
            setPeNote('');
            setPeMobility('FIXED');
            return;
        }
        const existing = pitchEquipments.find((pe) => pe.equipmentId === selectedEquipmentId);
        if (existing) {
            setPeQuantity(existing.quantity);
            setPeSpecification(existing.specification ?? '');
            setPeNote(existing.note ?? '');
            setPeMobility(existing.equipmentMobility ?? 'FIXED');
        } else {
            setPeQuantity(1);
            setPeSpecification('');
            setPeNote('');
            setPeMobility('FIXED');
        }
    }, [selectedEquipmentId, pitchEquipments]);

    const handleAddOrUpdatePitchEquipment = async () => {
        if (!pitchEdit?.id) return;
        if (!selectedEquipmentId) {
            toast.warning('Vui lòng chọn thiết bị');
            return;
        }

        setSavingPitchEquipment(true);
        try {
            const res = await adminUpsertPitchEquipment(pitchEdit.id, {
                equipmentId: selectedEquipmentId,
                quantity: peQuantity,
                specification: peSpecification || null,
                note: peNote || null,
                equipmentMobility: peMobility,
            });

            if (res.data.statusCode === 200) {
                toast.success('Đã cập nhật thiết bị của sân');
                await loadPitchEquipments(pitchEdit.id);
                await loadAllEquipments();
                setSelectedEquipmentId(undefined);
                setPeQuantity(1);
                setPeSpecification('');
                setPeNote('');
                setPeMobility('FIXED');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể cập nhật thiết bị sân');
        } finally {
            setSavingPitchEquipment(false);
        }
    };

    const handleDeletePitchEquipment = async (equipmentId: number) => {
        if (!pitchEdit?.id) return;
        setDeletingEquipmentId(equipmentId);
        try {
            const res = await adminDeletePitchEquipment(pitchEdit.id, equipmentId);
            if (res.data.statusCode === 200) {
                toast.success('Đã xóa thiết bị khỏi sân');
                await loadPitchEquipments(pitchEdit.id);
                await loadAllEquipments();
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể xóa thiết bị khỏi sân');
        } finally {
            setDeletingEquipmentId(null);
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
            length: pitchEdit.length,
            width: pitchEdit.width,
            height: pitchEdit.height,
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
        if (!openModalUpdatePitch || !pitchEdit?.id) return;
        loadPitchEquipments(pitchEdit.id);
        loadAllEquipments();
    }, [openModalUpdatePitch, pitchEdit?.id]);

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

                <Divider orientation="horizontal">
                    <Space size={6}>
                        <span>Thiết bị gắn theo sân</span>
                        <Tooltip title="Nhấn để xem gợi ý phân loại">
                            <Popover
                                trigger="click"
                                placement="bottomLeft"
                                title="Phân loại trước khi nhập thông số"
                                content={
                                    <ul
                                        style={{
                                            margin: 0,
                                            paddingLeft: 18,
                                            maxWidth: 420,
                                            marginBottom: 0,
                                        }}
                                    >
                                        <li>
                                            <strong>Cố định trên sân</strong>: đèn chiếu sáng, lưới quây, khung thành (gỗ/sắt, kích thước…) — chỉ
                                            mô tả cho khách, <strong>không</strong> mượn qua đặt sân.
                                        </li>
                                        <li>
                                            <strong>Cho mượn (lưu động)</strong>: bóng, áo… — khách chọn SL khi đặt; hệ thống xử lý mượn/trả. Giá,
                                            trạng thái &quot;hoạt động tốt&quot;, ghi chú tình trạng cần cấu hình ở <strong>Danh mục thiết bị</strong>.
                                        </li>
                                    </ul>
                                }
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<QuestionCircleOutlined />}
                                    aria-label="Gợi ý phân loại thiết bị"
                                    style={{ color: 'var(--ant-color-info)' }}
                                />
                            </Popover>
                        </Tooltip>
                    </Space>
                </Divider>

                <Space orientation="vertical" style={{ width: '100%' }} size={10}>
                    <Select
                        placeholder="Chọn thiết bị từ kho để gắn vào sân"
                        value={selectedEquipmentId}
                        onChange={setSelectedEquipmentId}
                        options={allEquipments.map((e) => {
                            const kho =
                                e.quantityUnassignedToPitches ??
                                Math.max(0, e.totalQuantity - (e.quantityAllocatedOnPitches ?? 0));
                            return {
                                value: e.id,
                                label: `${e.name} (chưa gắn sân: ${kho} / tổng ${e.totalQuantity})`,
                            };
                        })}
                        showSearch
                        optionFilterProp="label"
                    />

                    <InputNumber
                        style={{ width: '100%' }}
                        min={1}
                        value={peQuantity}
                        onChange={(v) => setPeQuantity(v ?? 1)}
                        placeholder={
                            peMobility === 'MOVABLE'
                                ? 'Số lượng tối đa cho mượn mỗi lượt (theo cấu hình sân)'
                                : 'Số lượng / bộ lắp đặt trên sân (mô tả)'
                        }
                    />

                    <div>
                        <div style={{ marginBottom: 6, fontWeight: 600 }}>Loại gắn với sân</div>
                        <Radio.Group
                            style={{ width: '100%' }}
                            value={peMobility}
                            onChange={(e) => setPeMobility(e.target.value as EquipmentMobilityEnum)}
                        >
                            <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                                <Radio value="FIXED" style={{ alignItems: 'flex-start' }}>
                                    <div>
                                        <div>Cố định / trang bị sân</div>
                                        <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 400 }}>
                                            Đèn, lưới, khung thành… — hiển thị thông số, không luồng mượn booking.
                                        </div>
                                    </div>
                                </Radio>
                                <Radio value="MOVABLE" style={{ alignItems: 'flex-start' }}>
                                    <div>
                                        <div>Cho mượn khi đặt sân (lưu động)</div>
                                        <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 400 }}>
                                            Bóng, áo… — có mượn/trả, trừ kho khi mượn.
                                        </div>
                                    </div>
                                </Radio>
                            </Space>
                        </Radio.Group>
                    </div>

                    <Input.TextArea
                        rows={2}
                        value={peSpecification}
                        onChange={(e) => setPeSpecification(e.target.value)}
                        placeholder={
                            peMobility === 'MOVABLE'
                                ? 'VD: Bóng số 5, hãng Adidas, mức giá tham khảo… (chi tiết giá & tình trạng kho xem ở danh mục thiết bị)'
                                : 'VD: 4 bộ đèn LED 400W; lưới 7m×2,5m khung thép; khung thành sắt cao 2,44m, sơn chống gỉ…'
                        }
                    />

                    <Input.TextArea
                        rows={2}
                        value={peNote}
                        onChange={(e) => setPeNote(e.target.value)}
                        placeholder={
                            peMobility === 'MOVABLE'
                                ? 'Ghi chú hiển thị khách (VD: mượn tối đa 2 quả / trận, giữ bóng nguyên vẹn…)'
                                : 'Ghi chú hiển thị khách (VD: đèn bật tự động 18h–22h, lưới mới thay 2025…)'
                        }
                    />

                    <Button
                        type="primary"
                        loading={savingPitchEquipment}
                        onClick={handleAddOrUpdatePitchEquipment}
                    >
                        Thêm/Cập nhật thiết bị sân
                    </Button>

                    <List
                        bordered
                        loading={loadingPitchEquipments}
                        dataSource={pitchEquipments}
                        locale={{ emptyText: 'Sân này chưa có thiết bị được gắn' }}
                        renderItem={(item) => (
                            <List.Item
                                actions={[
                                    <Popconfirm
                                        key={`delete-${item.equipmentId}`}
                                        title="Xóa thiết bị khỏi sân?"
                                        onConfirm={() => handleDeletePitchEquipment(item.equipmentId)}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                    >
                                        <Button
                                            danger
                                            type="link"
                                            loading={deletingEquipmentId === item.equipmentId}
                                        >
                                            Xóa
                                        </Button>
                                    </Popconfirm>,
                                ]}
                            >
                                <List.Item.Meta
                                    title={
                                        <Space wrap size={6}>
                                            <span>{`${item.equipmentName} × ${item.quantity}`}</span>
                                            <Tag color={item.equipmentMobility === 'MOVABLE' ? 'blue' : 'default'}>
                                                {item.equipmentMobility === 'MOVABLE' ? 'Cho mượn' : 'Cố định sân'}
                                            </Tag>
                                        </Space>
                                    }
                                    description={
                                        <>
                                            {item.specification ? `Thông số: ${item.specification}` : 'Không có thông số'}
                                            <br />
                                            {item.note ? `Ghi chú hiển thị: ${item.note}` : 'Không có ghi chú'}
                                        </>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Space>
            </Form>
        </Modal>
    );
};

export default ModalUpdatePitch;
