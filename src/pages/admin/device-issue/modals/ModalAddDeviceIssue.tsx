import { Form, Input, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createDeviceIssue, getAllAssets, getAllDevices } from '../../../../config/Api';
import type { IAsset } from '../../../../types/asset';
import type { IDevice } from '../../../../types/device';
import type { ICreateDeviceIssueReq, IssueStatus } from '../../../../types/deviceIssue';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchDeviceIssues, selectDeviceIssueLastListQuery } from '../../../../redux/features/deviceIssueSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import { buildSpringListQuery } from '../../../../utils/pagination/buildSpringPageQuery';
import { ISSUE_STATUS_OPTIONS } from '../../../../utils/constants/deviceIssue.constants';

interface IProps {
    openModalAddDeviceIssue: boolean;
    setOpenModalAddDeviceIssue: (v: boolean) => void;
}

/** Modal báo cáo sự cố — chọn tài sản rồi thiết bị thuộc tài sản đó (khớp nghiệp vụ backend). */
const ModalAddDeviceIssue = (props: IProps) => {
    const { openModalAddDeviceIssue, setOpenModalAddDeviceIssue } = props;
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectDeviceIssueLastListQuery);
    const [submitting, setSubmitting] = useState(false);
    const [assets, setAssets] = useState<IAsset[]>([]);
    const [devices, setDevices] = useState<IDevice[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const watchedAssetId = Form.useWatch('assetId', form);

    useEffect(() => {
        if (!openModalAddDeviceIssue) return;
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
    }, [openModalAddDeviceIssue]);

    useEffect(() => {
        if (!openModalAddDeviceIssue || watchedAssetId == null) {
            setDevices([]);
            return;
        }
        const load = async () => {
            try {
                setLoadingDevices(true);
                const filter = `asset.id==${watchedAssetId}`;
                const q = buildSpringListQuery({ page: 1, pageSize: 500, filter });
                const res = await getAllDevices(q);
                const body = res.data;
                if (body.statusCode === 200 && body.data?.result) {
                    setDevices(body.data.result);
                } else {
                    setDevices([]);
                }
            } catch (e) {
                console.error(e);
                toast.error('Không tải được thiết bị theo tài sản');
                setDevices([]);
            } finally {
                setLoadingDevices(false);
            }
        };
        void load();
    }, [openModalAddDeviceIssue, watchedAssetId]);

    const resetModal = () => {
        form.resetFields();
        setDevices([]);
    };

    const handleAdd = async (data: ICreateDeviceIssueReq) => {
        try {
            setSubmitting(true);
            const payload: ICreateDeviceIssueReq = { ...data };
            if (!payload.status) {
                delete payload.status;
            }
            const res = await createDeviceIssue(payload);
            const body = res.data;
            if (body.statusCode === 201) {
                await dispatch(fetchDeviceIssues(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalAddDeviceIssue(false);
                toast.success('Tạo báo cáo sự cố thiết bị thành công');
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
            title="Thêm sự cố thiết bị"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalAddDeviceIssue}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => {
                setOpenModalAddDeviceIssue(false);
                resetModal();
            }}
            afterOpenChange={(open) => {
                if (open) {
                    form.resetFields();
                    setDevices([]);
                }
            }}
        >
            <div>
                <hr />
                <Form<ICreateDeviceIssueReq> form={form} onFinish={handleAdd} layout="vertical" autoComplete="off">
                    <Form.Item
                        label="Tài sản"
                        name="assetId"
                        rules={[{ required: true, message: 'Vui lòng chọn tài sản!' }]}
                    >
                        <Select<number>
                            showSearch
                            optionFilterProp="label"
                            loading={loadingAssets}
                            placeholder="Chọn tài sản"
                            onChange={() => form.setFieldValue('deviceId', undefined)}
                            options={assets.map((a) => ({
                                value: a.id,
                                label: `${a.id} — ${a.assetName}`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Thiết bị"
                        name="deviceId"
                        rules={[{ required: true, message: 'Vui lòng chọn thiết bị!' }]}
                    >
                        <Select<number>
                            showSearch
                            optionFilterProp="label"
                            loading={loadingDevices}
                            disabled={watchedAssetId == null}
                            placeholder="Chọn thiết bị thuộc tài sản"
                            options={devices.map((d) => ({
                                value: d.id,
                                label: `${d.id} — ${d.deviceName}`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Mô tả sự cố"
                        name="description"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item
                        label="Người báo"
                        name="reportedBy"
                        rules={[{ required: true, message: 'Vui lòng nhập người báo!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item label="Trạng thái (tùy chọn)" name="status">
                        <Select<IssueStatus> allowClear options={ISSUE_STATUS_OPTIONS} placeholder="Mặc định: Mở" />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalAddDeviceIssue;
