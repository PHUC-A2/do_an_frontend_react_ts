import { Button, Flex, Form, Input, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { resendOtp, resendOtpByEmail, verifyEmail } from '../../config/Api';
import './VerifyEmail.scss';

const { Text } = Typography;

const PENDING_VERIFICATION_KEY = 'pending_verification';

const VerifyEmailPage = () => {
    const [form] = Form.useForm();
    const [emailForm] = Form.useForm();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [loadingVerify, setLoadingVerify] = useState(false);
    const [loadingResend, setLoadingResend] = useState(false);
    const [loadingResendByEmail, setLoadingResendByEmail] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [otpExpiry, setOtpExpiry] = useState(300);
    const otpExpiryStarted = useRef(false);

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
        if (otpExpiryStarted.current) return;
        otpExpiryStarted.current = true;
        const timer = window.setInterval(() => {
            setOtpExpiry((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);

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
            setOtpExpiry(300);
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

    const handleResendOtpByEmailOnly = async (values: { email: string }) => {
        const emailTrim = values.email?.trim() ?? '';
        try {
            setLoadingResendByEmail(true);
            const res = await resendOtpByEmail(emailTrim);
            if (res?.data?.statusCode === 200) {
                const payload = res?.data?.data?.message as
                    | { userId?: number; email?: string }
                    | string
                    | undefined;
                const obj = typeof payload === 'object' && payload !== null ? payload : null;
                const userId = obj?.userId != null ? Number(obj.userId) : NaN;
                const emailOut = typeof obj?.email === 'string' ? obj.email : emailTrim;

                if (Number.isFinite(userId) && userId > 0 && emailOut) {
                    localStorage.setItem(
                        PENDING_VERIFICATION_KEY,
                        JSON.stringify({ userId, email: emailOut }),
                    );
                    toast.success('Đã gửi OTP xác thực. Vui lòng kiểm tra email.');
                    emailForm.resetFields();
                    navigate(
                        `/verify-email?userId=${userId}&email=${encodeURIComponent(emailOut)}`,
                        { replace: true },
                    );
                }
            }
        } catch (error: unknown) {
            const e = error as { response?: { data?: { message?: string } } };
            toast.error(e?.response?.data?.message ?? 'Không thể gửi OTP xác thực');
        } finally {
            setLoadingResendByEmail(false);
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

                        {otpExpiry > 0 ? (
                            <Text className="verify-email-text" style={{ color: otpExpiry <= 60 ? '#ff4d4f' : '#52c41a', display: 'block', marginBottom: 8 }}>
                                OTP hết hạn sau: <strong>{String(Math.floor(otpExpiry / 60)).padStart(2, '0')}:{String(otpExpiry % 60).padStart(2, '0')}</strong>
                            </Text>
                        ) : (
                            <Text type="danger" style={{ display: 'block', marginBottom: 8 }}>
                                OTP đã hết hạn. Vui lòng gửi lại.
                            </Text>
                        )}

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
                        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                            Nhập email đã đăng ký (tài khoản chưa xác thực) để gửi lại OTP. Sau khi gửi thành công,
                            trang sẽ chuyển về cùng bước nhập mã trên URL dạng /verify-email?userId=…&email=… giống
                            sau khi đăng ký.
                        </Text>
                        <Form
                            form={emailForm}
                            layout="vertical"
                            onFinish={handleResendOtpByEmailOnly}
                            className="verify-form"
                        >
                            <Form.Item
                                name="email"
                                label="Email đã đăng ký"
                                normalize={(value) => value?.trim()}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email' },
                                    { type: 'email', message: 'Email không hợp lệ' },
                                ]}
                            >
                                <Input size="large" placeholder="Nhập email đã đăng ký..." />
                            </Form.Item>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    className="btn-verify"
                                    loading={loadingResendByEmail}
                                >
                                    Gửi OTP xác thực
                                </Button>
                            </Form.Item>
                        </Form>
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
