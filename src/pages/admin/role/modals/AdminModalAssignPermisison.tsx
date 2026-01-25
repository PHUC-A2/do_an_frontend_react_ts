import { Modal, Select, Spin } from 'antd';
import { Form } from 'antd';
import type { IAssignPermissionReq, IRole } from '../../../../types/role';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { assignPermission, getRoleById } from '../../../../config/Api';
import { selectPermissions } from '../../../../redux/features/permissionSlice';
import { useEffect, useState } from 'react';
import { fetchRoles } from '../../../../redux/features/roleSlice';

interface IProps {
    openModalAssignPermisison: boolean;
    setOpenModalAssignPermisison: (v: boolean) => void;
    roleAssignPermission: IRole | null;
}

const AdminModalAssignPermission = (props: IProps) => {
    const { openModalAssignPermisison, setOpenModalAssignPermisison, roleAssignPermission } = props;
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);

    //Lấy list permission từ Redux
    const listPermission = useAppSelector(selectPermissions);

    const handleAssignPermission = async (data: IAssignPermissionReq) => {
        try {
            setSubmitting(true);
            if (roleAssignPermission?.id) {
                const res = await assignPermission(roleAssignPermission.id, data);

                if (res.data.statusCode === 200) {
                    await dispatch(fetchRoles("")).unwrap();
                    toast.success("Gắn quyền cho vai trò thành công");
                    setOpenModalAssignPermisison(false);
                    form.resetFields();
                }
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Lỗi không xác định";
            console.log(error)
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

    useEffect(() => {
        const loadRoleDetail = async () => {
            if (!openModalAssignPermisison || !roleAssignPermission?.id) return;

            try {
                setLoading(true);
                const res = await getRoleById(roleAssignPermission.id);

                const role = res.data.data; // IRole

                form.setFieldsValue({
                    permissionIds: role?.permissions?.map(p => p.id) || []
                });
            } catch (err: any) {
                toast.error("Không tải được quyền của vai trò");
            } finally {
                setLoading(false);
            }
        };

        loadRoleDetail();
    }, [openModalAssignPermisison, roleAssignPermission?.id]);

    return (
        <Modal
            confirmLoading={submitting}
            title="Gắn quyền hạn cho vai trò"
            maskClosable={false}
            closable={true}
            open={openModalAssignPermisison}
            okText="Save"
            onOk={() => form.submit()}
            onCancel={() => {
                setOpenModalAssignPermisison(false)
                form.resetFields();
            }}
        >
            <hr />

            <Spin spinning={loading}>
                <Form
                    form={form}
                    onFinish={handleAssignPermission}
                    layout='vertical'
                    autoComplete="off"
                >
                    <Form.Item
                        label="Chọn quyền"
                        name="permissionIds"
                        rules={[{ required: true, message: 'Vui lòng chọn quyền!' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn quyền"
                            style={{ width: "100%" }}
                            options={listPermission.map(p => ({
                                label: p.name,  // tên permission
                                value: p.id     // id gửi backend
                            }))}
                        />
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
};

export default AdminModalAssignPermission;
