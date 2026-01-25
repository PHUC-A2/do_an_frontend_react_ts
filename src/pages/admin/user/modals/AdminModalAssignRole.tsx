import { Modal, Select, Spin } from 'antd';
import { Form } from 'antd';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import type { IAssignRoleReq, IUser } from '../../../../types/user';
import { assignRole, getUserById } from '../../../../config/Api';
import { fetchUsers } from '../../../../redux/features/userSlice';
import { selectRoles } from '../../../../redux/features/roleSlice';
import { useEffect, useState } from 'react';

interface IProps {
    openModalAssignRole: boolean;
    setOpenModalAssignRole: (v: boolean) => void;
    userAssignRole: IUser | null;
}

const AdminModalAssignRole = (props: IProps) => {
    const { openModalAssignRole, setOpenModalAssignRole, userAssignRole } = props;
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);


    //Lấy list role từ Redux
    const listRole = useAppSelector(selectRoles);

    const handleAssignRole = async (data: IAssignRoleReq) => {
        try {
            setSubmitting(true);
            if (userAssignRole?.id) {
                const res = await assignRole(userAssignRole.id, data);

                if (res.data.statusCode === 200) {
                    await dispatch(fetchUsers("")).unwrap();
                    toast.success("Gắn vai trò cho người dùng thành công");
                    setOpenModalAssignRole(false);
                    form.resetFields();
                }
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Lỗi không xác định";
            toast.error(
                <div>
                    <div><strong>Có lỗi xảy ra!</strong></div>
                    <div>{m}</div>
                </div>
            );
            console.log(error);
            console.log(m);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const loadUserDetail = async () => {
            if (!openModalAssignRole || !userAssignRole?.id) return;

            try {
                setLoading(true);
                const res = await getUserById(userAssignRole.id);

                const user = res.data.data; // Iuser

                form.setFieldsValue({
                    roleIds: user?.roles?.map(r => r.id) || []
                });
            } catch (err: any) {
                toast.error("Không tải được quyền của vai trò");
            } finally {
                setLoading(false);
            }
        };

        loadUserDetail();
    }, [openModalAssignRole, userAssignRole?.id]);

    return (
        <Modal
            confirmLoading={submitting}
            title="Gắn quyền hạn cho vai trò"
            maskClosable={false}
            closable={true}
            open={openModalAssignRole}
            okText="Save"
            onOk={() => form.submit()}
            onCancel={() => setOpenModalAssignRole(false)}
        >
            <hr />

            <Spin spinning={loading}>
                <Form
                    form={form}
                    onFinish={handleAssignRole}
                    layout='vertical'
                    autoComplete="off"
                >
                    <Form.Item
                        label="Chọn vai trò"
                        name="roleIds"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn vai trò"
                            style={{ width: "100%" }}
                            options={listRole.map(p => ({
                                label: p.name,  // tên role
                                value: p.id     // id gửi backend
                            }))}
                        />
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
};

export default AdminModalAssignRole;
