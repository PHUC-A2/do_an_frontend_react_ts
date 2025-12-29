import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input } from 'antd';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import './Register.scss';

const RegisterPage = () => {
    const [form] = Form.useForm();
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
                    // onFinish={handleRegister}
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
                        // loading={loading}
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