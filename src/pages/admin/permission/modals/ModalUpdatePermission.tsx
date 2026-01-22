import { Modal, Select, Form, Input } from "antd";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { updatePermission } from "../../../../config/Api";
import { useAppDispatch } from "../../../../redux/hooks";

import type {
    PermissionKey,
    IPermission,
    IUpdatePermissionReq,
} from "../../../../types/permission";

import { LIST_PERMISSION } from "../../../../utils/constants/permission-meta.constants";
import { fetchPermissions } from "../../../../redux/features/permissionSlice";

interface IProps {
    openModalUpdatePermission: boolean;
    setOpenModalUpdatePermission: (v: boolean) => void;
    permissionEdit: IPermission | null;
}

const ModalUpdatePermission = ({
    openModalUpdatePermission,
    setOpenModalUpdatePermission,
    permissionEdit,
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

    // ====================== SET FORM DATA ======================
    useEffect(() => {
        if (permissionEdit && openModalUpdatePermission) {
            form.setFieldsValue({
                name: permissionEdit.name,
                description: permissionEdit.description,
            });
        }
    }, [permissionEdit, openModalUpdatePermission]);

    // ====================== SUBMIT ======================
    const handleUpdatePermission = async (
        values: IUpdatePermissionReq
    ) => {
        if (!permissionEdit) return;

        try {
            setLoading(true);
            const res = await updatePermission(
                permissionEdit.id,
                values
            );

            if (res.data.statusCode === 200) {
                toast.success("Cập nhật permission thành công");
                await dispatch(fetchPermissions(""));
                form.resetFields();
                setOpenModalUpdatePermission(false);
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
            title="Cập nhật quyền hạn"
            open={openModalUpdatePermission}
            maskClosable={false}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={loading}
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdatePermission(false)}
        >
            <hr />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdatePermission}
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
                        // disabled
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

export default ModalUpdatePermission;
