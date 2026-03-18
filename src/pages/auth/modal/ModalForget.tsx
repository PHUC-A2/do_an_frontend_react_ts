import { Button, Form, Input, Modal, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
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
    const [otpExpiry, setOtpExpiry] = useState(0);
    const [resendCooldown, setResendCooldown] = useState(0);
    const expiryTimerRef = useRef<number | null>(null);
    const cooldownTimerRef = useRef<number | null>(null);

    const startCountdowns = () => {
        if (expiryTimerRef.current) window.clearInterval(expiryTimerRef.current);
        if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
        setOtpExpiry(300);
        setResendCooldown(60);
        expiryTimerRef.current = window.setInterval(() => {
            setOtpExpiry(prev => {
                if (prev <= 1) { window.clearInterval(expiryTimerRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
        cooldownTimerRef.current = window.setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { window.clearInterval(cooldownTimerRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        return () => {
            if (expiryTimerRef.current) window.clearInterval(expiryTimerRef.current);
            if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
        };
    }, []);

    const closeModal = () => {
        setOpen(false);
        setStep(1);
        setEmail("");
        form.resetFields();
        setOtpExpiry(0);
        setResendCooldown(0);
        if (expiryTimerRef.current) window.clearInterval(expiryTimerRef.current);
        if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);

            if (step === 1) {
                await forgetPassword(values.email);
                setEmail(values.email);
                setStep(2);
                form.resetFields();
                startCountdowns();
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

                        <div style={{ margin: '8px 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {otpExpiry > 0 ? (
                                <Text style={{ color: otpExpiry <= 60 ? '#ff4d4f' : '#52c41a', fontSize: 13 }}>
                                    OTP hết hạn sau: <strong>{String(Math.floor(otpExpiry / 60)).padStart(2, '0')}:{String(otpExpiry % 60).padStart(2, '0')}</strong>
                                </Text>
                            ) : (
                                <Text type="danger" style={{ fontSize: 13 }}>OTP đã hết hạn</Text>
                            )}
                            <Button
                                type="link"
                                size="small"
                                disabled={resendCooldown > 0 || loading}
                                onClick={async () => {
                                    try {
                                        setLoading(true);
                                        await forgetPassword(email);
                                        startCountdowns();
                                        toast.success("Đã gửi lại OTP");
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || "Không thể gửi lại OTP");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                style={{ padding: 0, fontSize: 13 }}
                            >
                                {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại OTP'}
                            </Button>
                        </div>

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
