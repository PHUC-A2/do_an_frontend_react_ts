import { Button, Form, Input, Modal, Typography } from "antd";
import { useState } from "react";
import { toast } from "react-toastify";
import { forgetPassword, resetPassword } from "../../../config/Api";
import "./ModalForget.scss"

const { Text } = Typography;

interface Props {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ModalForget = ({ open, setOpen }: Props) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState("");

    const closeModal = () => {
        setOpen(false);
        setStep(1);
        setEmail("");
        form.resetFields();
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);

            if (step === 1) {
                await forgetPassword(values.email);
                setEmail(values.email);
                setStep(2);
                form.resetFields();
                toast.success("OTP đã gửi về email");
                return;
            }

            await resetPassword(email, values.otp, values.newPassword);
            toast.success("Đổi mật khẩu thành công");
            closeModal();

        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            title="Quên mật khẩu"
            onCancel={closeModal}
            footer={null}
            destroyOnHidden
            className="forget-modal"
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>

                {step === 1 && (
                    <>
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: "Nhập email" },
                                { type: "email", message: "Email không hợp lệ" }
                            ]}
                        >
                            <Input placeholder="Nhập email..." />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Gửi OTP
                        </Button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <Text type="secondary">
                            OTP đã gửi đến: <b>{email}</b>
                        </Text>

                        <Form.Item
                            name="otp"
                            label="OTP"
                            rules={[{ required: true, message: "Nhập OTP" }]}
                        >
                            <Input placeholder="Nhập OTP..." />
                        </Form.Item>

                        <Form.Item
                            name="newPassword"
                            label="Mật khẩu mới"
                            rules={[
                                { required: true, message: "Nhập mật khẩu mới" },
                                { min: 6, message: "Tối thiểu 6 ký tự" }
                            ]}
                        >
                            <Input.Password placeholder="Nhập mật khẩu mới..." />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label="Xác nhận mật khẩu"
                            dependencies={["newPassword"]}
                            rules={[
                                { required: true, message: "Xác nhận mật khẩu" },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue("newPassword") === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject("Mật khẩu không khớp");
                                    }
                                })
                            ]}
                        >
                            <Input.Password placeholder="Nhập lại mật khẩu..." />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Đặt lại mật khẩu
                        </Button>
                    </>
                )}

            </Form>
        </Modal>
    );
};

export default ModalForget;
