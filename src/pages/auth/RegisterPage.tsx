import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input } from 'antd';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import './Register.scss';
import { register } from '../../config/Api';
import type { IRegister } from '../../types/auth';
import { useState } from 'react';
import { toast } from 'react-toastify';
import ModalForget from './modal/ModalForget';

const RegisterPage = () => {
    const PENDING_VERIFICATION_KEY = 'pending_verification';
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    // const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);

    const handleRegister = async (data: IRegister) => {
        // Trim toàn bộ dữ liệu trước khi gửi API
        const cleanedData: IRegister = {
            ...data,
            email: data.email?.trim(),
            password: data.password, // password giữ nguyên
        };

        setLoading(true);
        const minDelay = new Promise(resolve => setTimeout(resolve, 2000)); // tối thiểu 2 giây
        try {
            const res = await register(cleanedData);
            await minDelay;
            setLoading(false);
            if (res?.data?.statusCode === 201) {
                const payload = res?.data?.data?.message;
                const responseMessage = typeof payload === 'object' && payload?.message
                    ? payload.message
                    : (typeof payload === 'string' ? payload : 'Đăng ký tài khoản thành công. Vui lòng xác thực email.');

                const userId = typeof payload === 'object' && Number.isFinite(Number(payload?.userId))
                    ? Number(payload.userId)
                    : null;

                const email = typeof payload === 'object' && typeof payload?.email === 'string'
                    ? payload.email
                    : cleanedData.email;

                if (userId && email) {
                    localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify({ userId, email }));
                }

                toast.success(responseMessage);
                form.resetFields();
                setTimeout(() => {
                    if (userId && email) {
                        navigate(`/verify-email?userId=${userId}&email=${encodeURIComponent(email)}`);
                    } else {
                        navigate('/login');
                    }
                }, 2000);
            } else {
                toast.error(
                    <div>
                        <div><strong>Có lỗi xảy ra!</strong></div>
                        <div>{res.data?.message ?? "Đăng ký tài khoản thất bại!"}</div>
                    </div>
                );
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div><strong>Có lỗi xảy ra!</strong></div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="register-container">
            <div className="overlay"></div>

            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="register-form-wrapper"
            >
                <Form
                    form={form}
                    className="register-form"
                    onFinish={handleRegister}
                    layout="vertical"
                >
                    <h1 className="register-title">Đăng ký</h1>

                    <Form.Item
                        name="email"
                        normalize={(value) => value?.trim()} // auto trim
                        rules={[
                            { type: "email", message: 'Email không hợp lệ!' },
                            { required: true, message: 'Vui lòng nhập Email!' }
                        ]}
                    >
                        <Input
                            size="large"
                            prefix={<UserOutlined />}
                            placeholder="Email"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        normalize={(value) => value?.trim()} // auto trim
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined />}
                            placeholder="Mật khẩu"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            block
                            size="large"
                            htmlType="submit"
                            className="btn-register"
                            loading={loading}
                        >
                            <span>Đăng ký</span>
                        </Button>
                        <Flex className="mt-2" justify="space-between" align="center">
                            <Link to="/login">Đăng nhập!</Link>
                            <Link to="#" onClick={() => setOpen(true)}>Quên mật khẩu?</Link>
                        </Flex>
                        <Flex justify="start" className="mt-2">
                            <Link to="/verify-email">Chưa xác thực tài khoản?</Link>
                        </Flex>
                    </Form.Item>
                </Form>
            </motion.div>

            <ModalForget
                open={open}
                setOpen={setOpen}
            />
        </div>
    );
};

export default RegisterPage;