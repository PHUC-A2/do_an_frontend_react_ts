import { Modal, Form, Input } from "antd";
import { useState } from "react";
import { toast } from "react-toastify";
import { useAppDispatch } from "../../../../redux/hooks";
import type { ICreateRoleReq } from "../../../../types/role";
import { fetchRoles } from "../../../../redux/features/roleSlice";
import { createRole } from "../../../../config/Api";

interface IProps {
    openModalAddRole: boolean;
    setOpenModalAddRole: (v: boolean) => void;
}

const ModalAddRole = ({
    openModalAddRole,
    setOpenModalAddRole,
}: IProps) => {
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState<boolean>(false);

    const handleAddRole = async (values: ICreateRoleReq) => {
        try {
            setLoading(true);
            const res = await createRole(values);
            console.log(res);
            if (res.data.statusCode === 201) {
                toast.success("Tạo role thành công");
                await dispatch(fetchRoles(''));
                form.resetFields();
                setOpenModalAddRole(false);
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
            title="Thêm mới vai trò"
            open={openModalAddRole}
            maskClosable={false}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={loading}
            onOk={() => form.submit()}
            onCancel={() => setOpenModalAddRole(false)}
        >
            <hr />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleAddRole}
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

export default ModalAddRole;
