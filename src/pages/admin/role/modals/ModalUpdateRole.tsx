import { Modal, Form, Input } from "antd";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { updateRole } from "../../../../config/Api";
import { useAppDispatch } from "../../../../redux/hooks";
import type { IRole, IUpdateRoleReq } from "../../../../types/role";
import { fetchRoles } from "../../../../redux/features/roleSlice";
interface IProps {
    openModalUpdateRole: boolean;
    setOpenModalUpdateRole: (v: boolean) => void;
    roleEdit: IRole | null;
}

const ModalUpdateRole = ({
    openModalUpdateRole,
    setOpenModalUpdateRole,
    roleEdit,
}: IProps) => {
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (roleEdit && openModalUpdateRole) {
            form.setFieldsValue({
                name: roleEdit.name,
                description: roleEdit.description,
            });
        }
    }, [roleEdit, openModalUpdateRole]);

    const handleUpdateRole = async (
        values: IUpdateRoleReq
    ) => {
        if (!roleEdit) return;

        try {
            setLoading(true);
            const res = await updateRole(
                roleEdit.id,
                values
            );

            if (res.data.statusCode === 200) {
                toast.success("Cập nhật role thành công");
                await dispatch(fetchRoles(""));
                form.resetFields();
                setOpenModalUpdateRole(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <strong>Có lỗi xảy ra!</strong>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Cập nhật vai trò"
            open={openModalUpdateRole}
            maskClosable={false}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={loading}
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdateRole(false)}
        >
            <hr />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateRole}
                autoComplete="off"
            >
                <Form.Item
                    label="Tên vai trò"
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên vai trò",
                        },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập mô tả",
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalUpdateRole;
