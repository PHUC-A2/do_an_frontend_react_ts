import { Button, Card, Form, Input, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { fetchAccount } from '../../../redux/features/accountSlice';
import { postOwnerTenantRequest } from '../../../config/Api';
import { toast } from 'react-toastify';
import { ShopOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/** Lỗi: hiển thị lâu hơn mặc định (+2s) để người dùng kịp đọc. */
const TOAST_ERROR_OPTS = { autoClose: 7000, pauseOnHover: true as const };

interface BecomeOwnerPageProps {
    theme: 'light' | 'dark';
}

const BecomeOwnerPage: React.FC<BecomeOwnerPageProps> = ({ theme }) => {
    const isDark = theme === 'dark';
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
    const accountEmail = useAppSelector((s) => s.account.account?.email);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            void dispatch(fetchAccount());
        }
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && accountEmail) {
            const cur = form.getFieldValue('contactEmail');
            if (cur == null || String(cur).trim() === '') {
                form.setFieldsValue({ contactEmail: accountEmail });
            }
        }
    }, [isAuthenticated, accountEmail, form]);

    const onFinish = async (values: {
        shopName: string;
        contactPhone?: string;
        contactEmail?: string;
        description?: string;
    }) => {
        setLoading(true);
        try {
            const res = await postOwnerTenantRequest({
                shopName: values.shopName?.trim() ?? '',
                contactPhone: values.contactPhone?.trim() || undefined,
                contactEmail: values.contactEmail?.trim() ?? '',
                description: values.description?.trim() || undefined,
            });
            if (res?.data?.statusCode === 200 || res?.data?.statusCode === 201) {
                toast.success('Hệ thống đã tiếp nhận hồ sơ. Vui lòng chờ kết quả xét duyệt từ ban quản trị.');
                form.resetFields();
                if (accountEmail) {
                    form.setFieldsValue({ contactEmail: accountEmail });
                }
            } else {
                toast.error(
                    res?.data?.message ?? 'Không thể gửi hồ sơ. Vui lòng thử lại sau.',
                    TOAST_ERROR_OPTS,
                );
            }
        } catch (e: unknown) {
            const m =
                (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Gửi hồ sơ không thành công. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.';
            toast.error(m, TOAST_ERROR_OPTS);
        } finally {
            setLoading(false);
        }
    };

    const panelBg = isDark ? 'rgba(15, 28, 43, 0.92)' : 'rgba(255, 255, 255, 0.96)';
    const textColor = isDark ? 'rgba(248, 250, 252, 0.95)' : '#0f172a';
    const muted = isDark ? 'rgba(148, 163, 184, 0.95)' : 'rgba(30, 41, 59, 0.75)';

    return (
        <div
            style={{
                minHeight: '72vh',
                padding: '32px 16px 48px',
                maxWidth: 640,
                margin: '0 auto',
            }}
        >
            <Card
                style={{
                    background: panelBg,
                    border: isDark ? '1px solid rgba(250, 173, 20, 0.12)' : '1px solid rgba(15, 23, 42, 0.08)',
                }}
            >
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                        <Title level={3} style={{ color: textColor, marginBottom: 12 }}>
                            <ShopOutlined style={{ marginRight: 8 }} />
                            Đăng ký làm chủ sân
                        </Title>
                        <Text strong style={{ color: textColor, display: 'block', marginBottom: 8 }}>
                            Thực hiện theo các bước:
                        </Text>
                        <div
                            style={{
                                color: muted,
                                fontSize: 15,
                                lineHeight: 1.75,
                                marginBottom: 0,
                            }}
                        >
                            <p style={{ margin: '0 0 0.75em' }}>
                                Bước 1: Đăng ký tài khoản người dùng, xác minh thư điện tử theo hướng dẫn, sau đó đăng
                                nhập vào hệ thống.
                            </p>
                            <p style={{ margin: '0 0 0.75em' }}>
                                Bước 2: Mở lại trang này —{' '}
                                <code style={{ fontSize: 13, color: textColor, padding: '0 4px' }}>/become-owner</code> — điền
                                tên sân, email đăng ký chủ sân (thuộc tài khoản đã đăng ký, đang hoạt động trên hệ thống) và
                                gửi hồ sơ. Cần đang đăng nhập mới gửi được.
                            </p>
                            <p style={{ margin: 0 }}>
                                Bước 3: Hồ sơ được xem xét. Khi được chấp thuận, tài khoản được cấp quyền sử dụng phần
                                quản lý tương ứng.
                            </p>
                        </div>
                    </div>

                    {!isAuthenticated ? (
                        <div>
                            <Text style={{ color: textColor, display: 'block', marginBottom: 8 }}>
                                Để nộp hồ sơ, vui lòng đăng nhập hệ thống.
                            </Text>
                            <Text style={{ color: muted, display: 'block', marginBottom: 16, lineHeight: 1.7 }}>
                                Nếu chưa có tài khoản, vui lòng đăng ký rồi đăng nhập.
                                <br />
                                Nếu đã có tài khoản, vui lòng đăng nhập và mở lại trang này.
                            </Text>
                            <Space wrap>
                                <Link to="/register?redirect=%2Fbecome-owner">
                                    <Button size="large">Tạo tài khoản</Button>
                                </Link>
                                <Link to="/login?redirect=%2Fbecome-owner">
                                    <Button type="primary" size="large">
                                        Đăng nhập
                                    </Button>
                                </Link>
                            </Space>
                        </div>
                    ) : (
                        <Form form={form} layout="vertical" onFinish={onFinish}>
                            <Form.Item
                                name="shopName"
                                label="Tên sân / thương hiệu"
                                rules={[{ required: true, message: 'Vui lòng nhập tên sân' }]}
                            >
                                <Input placeholder="Ví dụ: Sân bóng Phúc FC" maxLength={200} showCount />
                            </Form.Item>
                            <Form.Item name="contactPhone" label="Số điện thoại liên hệ (không bắt buộc)">
                                <Input placeholder="Để trống nếu không cung cấp" maxLength={30} />
                            </Form.Item>
                            <Form.Item
                                name="contactEmail"
                                label="Email đăng ký chủ sân"
                                extra={
                                    <span style={{ lineHeight: 1.6 }}>
                                        Nhập thư điện tử thuộc tài khoản đã đăng ký, đang hoạt động; hệ thống tự xác
                                        minh.
                                        <br />
                                        Có thể trùng hoặc khác với thư dùng đăng nhập, tùy từng trường hợp tài khoản.
                                    </span>
                                }
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email đăng ký chủ sân' },
                                    { type: 'email', message: 'Định dạng thư điện tử không hợp lệ' },
                                ]}
                            >
                                <Input
                                    maxLength={120}
                                    placeholder="Thư điện tử đã đăng ký trên hệ thống"
                                />
                            </Form.Item>
                            <Form.Item name="description" label="Mô tả bổ sung (không bắt buộc)">
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Thông tin giới thiệu, giờ mở cửa, địa điểm (nếu cần)"
                                    maxLength={2000}
                                    showCount
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                                    Gửi hồ sơ
                                </Button>
                            </Form.Item>
                        </Form>
                    )}

                    <Text type="secondary" style={{ fontSize: 13 }}>
                        <Link to="/">Trang chủ</Link>
                    </Text>
                </Space>
            </Card>
        </div>
    );
};

export default BecomeOwnerPage;
