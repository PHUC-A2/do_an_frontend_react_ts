import { Modal, Select, Form, Input } from "antd";
import { useState } from "react";
import { toast } from "react-toastify";

import { createPermission } from "../../../../config/Api";
import { useAppDispatch } from "../../../../redux/hooks";

import type { PermissionKey } from "../../../../types/permission";
import type { ICreatePermissionReq } from "../../../../types/permission";
import { LIST_PERMISSION } from "../../../../utils/constants/permission-meta.constants";
import { fetchPermissions } from "../../../../redux/features/permissionSlice";

interface IProps {
    openModalAddPermission: boolean;
    setOpenModalAddPermission: (v: boolean) => void;
}

const ModalAddPermission = ({
    openModalAddPermission,
    setOpenModalAddPermission,
}: IProps) => {
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState<boolean>(false);

    // ====================== AUTO FILL DESCRIPTION ======================
    const findPermissionByName = (name: PermissionKey) => {
        for (const group of LIST_PERMISSION) {
            const found = group.items.find(item => item.name === name);
            if (found) return found;
        }
        return null;
    };

    const onPermissionChange = (value: PermissionKey) => {
        const p = findPermissionByName(value);
        if (p) {
            form.setFieldsValue({
                description: p.description ?? "",
            });
        }
    };

    // ====================== SUBMIT ======================
    const handleAddPermission = async (values: ICreatePermissionReq) => {
        try {
            setLoading(true);
            const res = await createPermission(values);
            console.log(res);
            if (res.data.statusCode === 201) {
                toast.success("Tạo permission thành công");
                await dispatch(fetchPermissions(''));
                form.resetFields();
                setOpenModalAddPermission(false);
            }

        } catch (error: any) {
            const m =
                error?.response?.data?.message ?? "Không xác định";
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
            title="Thêm mới quyền hạn"
            open={openModalAddPermission}
            maskClosable={false}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={loading}
            onOk={() => form.submit()}
            onCancel={() => setOpenModalAddPermission(false)}
        >
            <hr />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleAddPermission}
                autoComplete="off"
            >
                {/* PERMISSION NAME */}
                <Form.Item
                    label="Tên permission"
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn permission",
                        },
                    ]}
                >
                    <Select
                        placeholder="Chọn permission"
                        onChange={onPermissionChange}
                    >
                        {LIST_PERMISSION.map(group => (
                            <Select.OptGroup
                                key={group.group}
                                label={group.group}
                            >
                                {group.items.map(item => (
                                    <Select.Option
                                        key={item.name}
                                        value={item.name}
                                    >
                                        {item.name}
                                    </Select.Option>
                                ))}
                            </Select.OptGroup>
                        ))}
                    </Select>
                </Form.Item>

                {/* DESCRIPTION */}
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

export default ModalAddPermission;
