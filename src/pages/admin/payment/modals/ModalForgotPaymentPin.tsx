import { Button, Form, Input, Modal, Typography, theme } from 'antd';
import { CheckOutlined, KeyOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { requestForgotPaymentPinOtp, resetPaymentPinWithOtp } from '../../../../config/Api';

const { Text } = Typography;

interface ModalForgotPaymentPinProps {
    open: boolean;
    onClose: () => void;
    /** Email tài khoản đang đăng nhập (chỉ hiển thị). */
    userEmail: string;
    onSuccess: () => void;
}

const ModalForgotPaymentPin = ({ open, onClose, userEmail, onSuccess }: ModalForgotPaymentPinProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [otpExpiry, setOtpExpiry] = useState(0);
    const [resendCooldown, setResendCooldown] = useState(0);
    const expiryTimerRef = useRef<number | null>(null);
    const cooldownTimerRef = useRef<number | null>(null);
    const { token } = theme.useToken();

    const startCountdowns = () => {
        if (expiryTimerRef.current) window.clearInterval(expiryTimerRef.current);
        if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
        setOtpExpiry(300);
        setResendCooldown(60);
        expiryTimerRef.current = window.setInterval(() => {
            setOtpExpiry((prev) => {
                if (prev <= 1) {
                    window.clearInterval(expiryTimerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        cooldownTimerRef.current = window.setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    window.clearInterval(cooldownTimerRef.current!);
                    return 0;
                }
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
        form.resetFields();
        setStep(1);
        setOtpExpiry(0);
        setResendCooldown(0);
        if (expiryTimerRef.current) window.clearInterval(expiryTimerRef.current);
        if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
        onClose();
    };

    const handleSubmit = async (values: { otp?: string; newPin?: string; confirmPin?: string }) => {
        setLoading(true);
        try {
            if (step === 1) {
                await requestForgotPaymentPinOtp();
                setStep(2);
                form.resetFields();
                startCountdowns();
                toast.success('OTP đã gửi về email đăng nhập');
                return;
            }
            await resetPaymentPinWithOtp({
                otp: values.otp!.trim(),
                newPin: values.newPin!,
                confirmPin: values.confirmPin!,
            });
            toast.success('Đã đặt lại PIN xác nhận thanh toán');
            onSuccess();
            closeModal();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e?.response?.data?.message ?? 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <SafetyCertificateOutlined style={{ color: token.colorWarning }} />
                    Quên PIN xác nhận thanh toán
                </span>
            }
            onCancel={closeModal}
            footer={null}
            destroyOnHidden
            forceRender
            width={440}
        >
            <Form form={form} layout="vertical" onFinish={(v) => void handleSubmit(v)}>
                {step === 1 && (
                    <>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                            Mã OTP được gửi tới email của tài khoản bạn đang sử dụng. Mã có hiệu lực trong 5 phút.
                        </Text>
                        <Text style={{ display: 'block', marginBottom: 16 }}>
                            Email: <b>{userEmail || '—'}</b>
                        </Text>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            icon={<MailOutlined />}
                        >
                            Gửi OTP
                        </Button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <Text type="secondary">
                            OTP đã gửi đến: <b>{userEmail}</b>
                        </Text>
                        <div
                            style={{
                                margin: '8px 0 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 8,
                            }}
                        >
                            {otpExpiry > 0 ? (
                                <Text
                                    style={{
                                        color: otpExpiry <= 60 ? token.colorError : token.colorSuccess,
                                        fontSize: 13,
                                    }}
                                >
                                    OTP hết hạn sau:{' '}
                                    <strong>
                                        {String(Math.floor(otpExpiry / 60)).padStart(2, '0')}:
                                        {String(otpExpiry % 60).padStart(2, '0')}
                                    </strong>
                                </Text>
                            ) : (
                                <Text type="danger" style={{ fontSize: 13 }}>
                                    OTP đã hết hạn — gửi lại mã mới
                                </Text>
                            )}
                            <Button
                                type="link"
                                size="small"
                                icon={<MailOutlined />}
                                disabled={resendCooldown > 0 || loading}
                                onClick={async () => {
                                    try {
                                        setLoading(true);
                                        await requestForgotPaymentPinOtp();
                                        startCountdowns();
                                        toast.success('Đã gửi lại OTP');
                                    } catch (err: unknown) {
                                        const e = err as { response?: { data?: { message?: string } } };
                                        toast.error(e?.response?.data?.message ?? 'Không thể gửi lại OTP');
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
                            label="Mã OTP"
                            rules={[{ required: true, message: 'Vui lòng nhập OTP' }]}
                        >
                            <Input placeholder="Nhập mã OTP từ email" prefix={<KeyOutlined />} />
                        </Form.Item>

                        <Form.Item
                            name="newPin"
                            label="PIN mới (6 số)"
                            rules={[
                                { required: true, message: 'Nhập PIN mới' },
                                { pattern: /^\d{6}$/, message: 'Đúng 6 chữ số' },
                            ]}
                        >
                            <Input.Password
                                maxLength={6}
                                inputMode="numeric"
                                placeholder="6 chữ số"
                                autoComplete="new-password"
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirmPin"
                            label="Nhập lại PIN mới"
                            dependencies={['newPin']}
                            rules={[
                                { required: true, message: 'Nhập lại PIN' },
                                { pattern: /^\d{6}$/, message: 'Đúng 6 chữ số' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPin') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('PIN không khớp'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                maxLength={6}
                                inputMode="numeric"
                                placeholder="6 chữ số"
                                autoComplete="new-password"
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            icon={<CheckOutlined />}
                        >
                            Đặt lại PIN
                        </Button>
                    </>
                )}
            </Form>
        </Modal>
    );
};

export default ModalForgotPaymentPin;
