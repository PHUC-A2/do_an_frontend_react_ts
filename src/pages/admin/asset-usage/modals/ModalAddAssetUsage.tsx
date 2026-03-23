import { DatePicker, Form, Input, Modal, Select, TimePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createAssetUsage, getAllAssets, getAllUsers } from '../../../../config/Api';
import type { IAsset } from '../../../../types/asset';
import type { AssetUsageStatus, AssetUsageType, ICreateAssetUsageReq } from '../../../../types/assetUsage';
import type { IUser } from '../../../../types/user';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchAssetUsages, selectAssetUsageLastListQuery } from '../../../../redux/features/assetUsageSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import { buildSpringListQuery } from '../../../../utils/pagination/buildSpringPageQuery';
import {
    ASSET_USAGE_STATUS_OPTIONS,
    ASSET_USAGE_TYPE_OPTIONS,
} from '../../../../utils/constants/assetUsage.constants';

interface IProps {
    openModalAddAssetUsage: boolean;
    setOpenModalAddAssetUsage: (v: boolean) => void;
}

type FormVals = {
    userId: number;
    assetId: number;
    usageType: AssetUsageType;
    date: Dayjs;
    startTime: Dayjs;
    endTime: Dayjs;
    subject: string;
    status?: AssetUsageStatus;
};

/** Chuyển chuỗi giờ API → Dayjs cho TimePicker. */
const parseTimeToDayjs = (t: string) => {
    const part = t.length === 5 ? `${t}:00` : t;
    return dayjs(`2000-01-01T${part}`);
};

const ModalAddAssetUsage = (props: IProps) => {
    const { openModalAddAssetUsage, setOpenModalAddAssetUsage } = props;
    const [form] = Form.useForm<FormVals>();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectAssetUsageLastListQuery);
    const [submitting, setSubmitting] = useState(false);
    const [users, setUsers] = useState<IUser[]>([]);
    const [assets, setAssets] = useState<IAsset[]>([]);
    const [loadingRefs, setLoadingRefs] = useState(false);

    useEffect(() => {
        if (!openModalAddAssetUsage) return;
        const load = async () => {
            try {
                setLoadingRefs(true);
                const uq = buildSpringListQuery({ page: 1, pageSize: 300 });
                const aq = buildSpringListQuery({ page: 1, pageSize: 500 });
                const [ur, ar] = await Promise.all([getAllUsers(uq), getAllAssets(aq)]);
                if (ur.data.statusCode === 200 && ur.data.data?.result) setUsers(ur.data.data.result);
                if (ar.data.statusCode === 200 && ar.data.data?.result) setAssets(ar.data.data.result);
            } catch (e) {
                console.error(e);
                toast.error('Không tải được danh sách người dùng / tài sản');
            } finally {
                setLoadingRefs(false);
            }
        };
        void load();
    }, [openModalAddAssetUsage]);

    const resetModal = () => {
        form.resetFields();
        form.setFieldsValue({
            date: dayjs(),
            startTime: parseTimeToDayjs('08:00:00'),
            endTime: parseTimeToDayjs('09:00:00'),
            usageType: 'RENT',
            status: 'PENDING',
        });
    };

    const handleAdd = async (values: FormVals) => {
        const payload: ICreateAssetUsageReq = {
            userId: values.userId,
            assetId: values.assetId,
            usageType: values.usageType,
            date: values.date.format('YYYY-MM-DD'),
            startTime: values.startTime.format('HH:mm:ss'),
            endTime: values.endTime.format('HH:mm:ss'),
            subject: values.subject.trim(),
            status: values.status,
        };
        try {
            setSubmitting(true);
            const res = await createAssetUsage(payload);
            if (res.data.statusCode === 201) {
                await dispatch(fetchAssetUsages(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalAddAssetUsage(false);
                toast.success('Tạo đăng ký sử dụng tài sản thành công');
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

    return (
        <Modal
            title="Thêm đăng ký sử dụng tài sản"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalAddAssetUsage}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => {
                setOpenModalAddAssetUsage(false);
                resetModal();
            }}
            afterOpenChange={(open) => {
                if (open) {
                    form.setFieldsValue({
                        date: dayjs(),
                        startTime: parseTimeToDayjs('08:00:00'),
                        endTime: parseTimeToDayjs('09:00:00'),
                        usageType: 'RENT',
                        status: 'PENDING',
                    });
                }
            }}
        >
            <div>
                <hr />
                <Form<FormVals> form={form} onFinish={handleAdd} layout="vertical" autoComplete="off">
                    <Form.Item
                        label="Người dùng"
                        name="userId"
                        rules={[{ required: true, message: 'Vui lòng chọn người dùng!' }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            loading={loadingRefs}
                            placeholder="Chọn user"
                            options={users.map((u) => ({
                                value: u.id,
                                label: `${u.id} — ${u.email ?? u.name}`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Tài sản"
                        name="assetId"
                        rules={[{ required: true, message: 'Vui lòng chọn tài sản!' }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            loading={loadingRefs}
                            placeholder="Chọn tài sản"
                            options={assets.map((a) => ({
                                value: a.id,
                                label: `${a.id} — ${a.assetName}`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item label="Loại" name="usageType" rules={[{ required: true }]}>
                        <Select options={ASSET_USAGE_TYPE_OPTIONS} />
                    </Form.Item>

                    <Form.Item label="Ngày" name="date" rules={[{ required: true, message: 'Chọn ngày!' }]}>
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>

                    <Form.Item
                        label="Giờ bắt đầu"
                        name="startTime"
                        rules={[{ required: true, message: 'Chọn giờ bắt đầu!' }]}
                    >
                        <TimePicker style={{ width: '100%' }} format="HH:mm:ss" needConfirm={false} />
                    </Form.Item>

                    <Form.Item
                        label="Giờ kết thúc"
                        name="endTime"
                        rules={[{ required: true, message: 'Chọn giờ kết thúc!' }]}
                    >
                        <TimePicker style={{ width: '100%' }} format="HH:mm:ss" needConfirm={false} />
                    </Form.Item>

                    <Form.Item
                        label="Mục đích"
                        name="subject"
                        rules={[{ required: true, message: 'Nhập mục đích!' }]}
                    >
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <Form.Item label="Trạng thái" name="status">
                        <Select allowClear options={ASSET_USAGE_STATUS_OPTIONS} placeholder="Mặc định: Chờ duyệt" />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalAddAssetUsage;
