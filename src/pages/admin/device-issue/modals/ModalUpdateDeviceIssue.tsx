import { Form, Input, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAllAssets, getAllDevices, updateDeviceIssue } from '../../../../config/Api';
import type { IAsset } from '../../../../types/asset';
import type { IDevice } from '../../../../types/device';
import type { IDeviceIssue, IUpdateDeviceIssueReq, IssueStatus } from '../../../../types/deviceIssue';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchDeviceIssues, selectDeviceIssueLastListQuery } from '../../../../redux/features/deviceIssueSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import { buildSpringListQuery } from '../../../../utils/pagination/buildSpringPageQuery';
import { ISSUE_STATUS_OPTIONS } from '../../../../utils/constants/deviceIssue.constants';

interface IProps {
    openModalUpdateDeviceIssue: boolean;
    setOpenModalUpdateDeviceIssue: (v: boolean) => void;
    issueEdit: IDeviceIssue | null;
}

/** Modal cập nhật sự cố — giữ luồng chọn tài sản → thiết bị như form tạo. */
const ModalUpdateDeviceIssue = (props: IProps) => {
    const { openModalUpdateDeviceIssue, setOpenModalUpdateDeviceIssue, issueEdit } = props;
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
        if (!openModalUpdateDeviceIssue) return;
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
    }, [openModalUpdateDeviceIssue]);

    useEffect(() => {
        if (!openModalUpdateDeviceIssue || watchedAssetId == null) {
            if (!openModalUpdateDeviceIssue) setDevices([]);
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
    }, [openModalUpdateDeviceIssue, watchedAssetId]);

    const handleEdit = async (values: IUpdateDeviceIssueReq) => {
        try {
            if (!issueEdit?.id) {
                toast.error('ID sự cố không hợp lệ');
                return;
            }
            setSubmitting(true);
            const res = await updateDeviceIssue(issueEdit.id, values);
            const body = res.data;
            if (body.statusCode === 200) {
                toast.success('Cập nhật sự cố thiết bị thành công');
                form.resetFields();
                await dispatch(fetchDeviceIssues(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                setOpenModalUpdateDeviceIssue(false);
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
        if (!issueEdit) return;
        form.resetFields();
        form.setFieldsValue({
            assetId: issueEdit.assetId,
            deviceId: issueEdit.deviceId,
            description: issueEdit.description,
            reportedBy: issueEdit.reportedBy,
            status: issueEdit.status,
        });
    }, [issueEdit, form]);

    return (
        <Modal
            title="Cập nhật sự cố thiết bị"
            maskClosable={false}
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={openModalUpdateDeviceIssue}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={submitting}
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdateDeviceIssue(false)}
        >
            <div>
                <hr />
                <Form<IUpdateDeviceIssueReq> form={form} onFinish={handleEdit} layout="vertical" autoComplete="off">
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

                    <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
                        <Select<IssueStatus> options={ISSUE_STATUS_OPTIONS} />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default ModalUpdateDeviceIssue;
