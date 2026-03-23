import { DatePicker, Form, Input, Modal, Select, TimePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAllAssets, getAllUsers, updateAssetUsage } from '../../../../config/Api';
import type { IAsset } from '../../../../types/asset';
import type { AssetUsageType, IAssetUsage, IUpdateAssetUsageReq } from '../../../../types/assetUsage';
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
    openModalUpdateAssetUsage: boolean;
    setOpenModalUpdateAssetUsage: (v: boolean) => void;
    usageEdit: IAssetUsage | null;
}

type FormVals = {
    userId: number;
    assetId: number;
    usageType: AssetUsageType;
    date: Dayjs;
    startTime: Dayjs;
    endTime: Dayjs;
    subject: string;
    status: IAssetUsage['status'];
};

const parseTimeToDayjs = (t: string) => {
    const part = t.length === 5 ? `${t}:00` : t;
    return dayjs(`2000-01-01T${part}`);
};

const ModalUpdateAssetUsage = (props: IProps) => {
    const { openModalUpdateAssetUsage, setOpenModalUpdateAssetUsage, usageEdit } = props;
    const [form] = Form.useForm<FormVals>();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectAssetUsageLastListQuery);
    const [submitting, setSubmitting] = useState(false);
    const [users, setUsers] = useState<IUser[]>([]);
    const [assets, setAssets] = useState<IAsset[]>([]);
    const [loadingRefs, setLoadingRefs] = useState(false);

    useEffect(() => {
        if (!openModalUpdateAssetUsage) return;
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
                toast.error('Không tải được danh sách người dùng / phòng');
            } finally {
                setLoadingRefs(false);
            }
        };
        void load();
    }, [openModalUpdateAssetUsage]);

    const handleEdit = async (values: FormVals) => {
        if (!usageEdit?.id) {
            toast.error('ID bản ghi không hợp lệ');
            return;
        }
        const payload: IUpdateAssetUsageReq = {
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
            const res = await updateAssetUsage(usageEdit.id, payload);
            if (res.data.statusCode === 200) {
                toast.success('Cập nhật lịch đặt phòng thành công');
                form.resetFields();
                await dispatch(fetchAssetUsages(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalUpdateAssetUsage(false);
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
        if (!usageEdit) return;
        form.resetFields();
        form.setFieldsValue({
            userId: usageEdit.userId,
            assetId: usageEdit.assetId,
            usageType: usageEdit.usageType,
            date: dayjs(usageEdit.date),
            startTime: parseTimeToDayjs(usageEdit.startTime),
            endTime: parseTimeToDayjs(usageEdit.endTime),
            subject: usageEdit.subject,
            status: usageEdit.status,
        });
    }, [usageEdit]);

    return (
        <Modal
            title="Cập nhật lịch đặt phòng"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalUpdateAssetUsage}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdateAssetUsage(false)}
        >
            <div>
                <hr />
                <Form<FormVals> form={form} onFinish={handleEdit} layout="vertical" autoComplete="off">
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
                        label="Phòng"
                        name="assetId"
                        rules={[{ required: true, message: 'Vui lòng chọn phòng!' }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            loading={loadingRefs}
                            placeholder="Chọn phòng"
                            options={assets.map((a) => ({
                                value: a.id,
                                label: `${a.id} — ${a.assetName}`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item label="Loại sử dụng" name="usageType" rules={[{ required: true }]}>
                        <Select options={ASSET_USAGE_TYPE_OPTIONS} />
                    </Form.Item>

                    <Form.Item label="Ngày đặt phòng" name="date" rules={[{ required: true, message: 'Vui lòng chọn ngày đặt phòng!' }]}>
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>

                    <Form.Item label="Giờ bắt đầu" name="startTime" rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu!' }]}>
                        <TimePicker style={{ width: '100%' }} format="HH:mm:ss" needConfirm={false} />
                    </Form.Item>

                    <Form.Item label="Giờ kết thúc" name="endTime" rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc!' }]}>
                        <TimePicker style={{ width: '100%' }} format="HH:mm:ss" needConfirm={false} />
                    </Form.Item>

                    <Form.Item label="Mục đích sử dụng" name="subject" rules={[{ required: true, message: 'Vui lòng nhập mục đích sử dụng!' }]}>
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
                        <Select options={ASSET_USAGE_STATUS_OPTIONS} />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalUpdateAssetUsage;
