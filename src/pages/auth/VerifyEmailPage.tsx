import { Button, Flex, Form, Input, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { resendOtp, verifyEmail } from '../../config/Api';
import './VerifyEmail.scss';

const { Text } = Typography;

const PENDING_VERIFICATION_KEY = 'pending_verification';

const VerifyEmailPage = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [loadingVerify, setLoadingVerify] = useState(false);
    const [loadingResend, setLoadingResend] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    const fallback = useMemo(() => {
        try {
            const raw = localStorage.getItem(PENDING_VERIFICATION_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            const userId = Number(parsed?.userId);
            const email = typeof parsed?.email === 'string' ? parsed.email.trim() : '';

            if (!Number.isFinite(userId) || userId <= 0 || !email) {
                return null;
            }

            return { userId, email };
        } catch {
            return null;
        }
    }, []);

    const context = useMemo(() => {
        const userId = Number(searchParams.get('userId'));
        const email = (searchParams.get('email') || '').trim();

        if (Number.isFinite(userId) && userId > 0 && email) {
            return { userId, email };
        }

        return fallback;
    }, [fallback, searchParams]);

    useEffect(() => {
        if (!cooldownSeconds) {
            return;
        }

        const timer = window.setInterval(() => {
            setCooldownSeconds((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [cooldownSeconds]);

    useEffect(() => {
        if (context) {
            localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(context));
        }
    }, [context]);

    const handleVerify = async (values: { otp: string }) => {
        if (!context) {
            toast.error('Thiếu thông tin xác thực. Vui lòng đăng ký lại.');
            return;
        }

        try {
            setLoadingVerify(true);

            const res = await verifyEmail({
                userId: context.userId,
                email: context.email,
                otp: values.otp.trim(),
            });

            if (res?.data?.statusCode === 200) {
                localStorage.removeItem(PENDING_VERIFICATION_KEY);
                toast.success('Xác thực email thành công. Vui lòng đăng nhập.');
                form.resetFields();
                navigate('/login');
            }
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Xác thực email thất bại';
            toast.error(message);
        } finally {
            setLoadingVerify(false);
        }
    };

    const handleResendOtp = async () => {
        if (!context) {
            toast.error('Thiếu thông tin xác thực. Vui lòng đăng ký lại.');
            return;
        }

        if (cooldownSeconds > 0) {
            toast.info(`Vui lòng thử lại sau ${cooldownSeconds} giây`);
            return;
        }

        try {
            setLoadingResend(true);
            await resendOtp({ userId: context.userId, email: context.email });
            toast.success('Đã gửi lại OTP xác thực email');
            setCooldownSeconds(60);
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Không thể gửi lại OTP';

            const match = String(message).match(/(\d+)\s*giây/);
            if (match?.[1]) {
                setCooldownSeconds(Number(match[1]));
            }

            toast.error(message);
        } finally {
            setLoadingResend(false);
        }
    };

    return (
        <div className="verify-email-container">
            <div className="overlay" />

            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="verify-email-wrapper"
            >
                <h1 className="verify-title">Xác Thực Email</h1>

                {context ? (
                    <>
                        <Text className="verify-email-text">
                            Mã OTP đã gửi tới: <strong>{context.email}</strong>
                        </Text>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleVerify}
                            className="verify-form"
                        >
                            <Form.Item
                                name="otp"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập OTP' },
                                    { len: 6, message: 'OTP phải gồm đúng 6 ký tự' },
                                ]}
                            >
                                <Input
                                    size="large"
                                    maxLength={6}
                                    placeholder="Nhập OTP 6 số"
                                    onChange={(e) => {
                                        const onlyDigits = e.target.value.replace(/\D/g, '');
                                        form.setFieldValue('otp', onlyDigits);
                                    }}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    className="btn-verify"
                                    loading={loadingVerify}
                                >
                                    Xác thực
                                </Button>
                            </Form.Item>
                        </Form>

                        <Flex justify="space-between" align="center" className="verify-actions">
                            <Button
                                type="link"
                                className="resend-btn"
                                disabled={loadingResend || cooldownSeconds > 0}
                                onClick={handleResendOtp}
                            >
                                {cooldownSeconds > 0
                                    ? `Gửi lại OTP sau ${cooldownSeconds}s`
                                    : 'Gửi lại OTP'}
                            </Button>

                            <Link to="/login">Đăng nhập</Link>
                        </Flex>
                    </>
                ) : (
                    <div className="missing-context">
                        <Text>Không tìm thấy thông tin xác thực. Vui lòng đăng ký lại tài khoản.</Text>
                        <div className="missing-context-actions">
                            <Link to="/register">Đi tới đăng ký</Link>
                            <Link to="/login">Đi tới đăng nhập</Link>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmailPage;
