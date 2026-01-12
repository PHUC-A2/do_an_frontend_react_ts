import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input } from 'antd';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import './Register.scss';
import { register } from '../../config/Api';
import type { IRegister } from '../../types/auth';
import { useState } from 'react';
import { toast } from 'react-toastify';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    // const dispatch = useAppDispatch();

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
                // dispatch(fetchUsers());
                toast.success(res.data?.data?.message);
                form.resetFields();
                setTimeout(() => {
                    navigate('/login');
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
                            <Link to="#">Quên mật khẩu?</Link>
                        </Flex>
                    </Form.Item>
                </Form>
            </motion.div>
        </div>
    );
};

export default RegisterPage;