import { Form, Input, Modal, Spin } from 'antd';
import type { IUser, IUpdateUserStatusReq } from '../../../../types/user';
import { updateUserStatus } from '../../../../config/Api';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';

interface ModalBanUserProps {
    open: boolean;
    onCancel: () => void;
    user: IUser | null;
    onSuccess: () => void;
}

const ModalBanUser = ({ open, onCancel, user, onSuccess }: ModalBanUserProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [actionType, setActionType] = useState<'ban' | 'unban'>('ban');

    // Reset form khi modal mở
    useEffect(() => {
        if (open && user) {
            // Delay một chút để form rendered xong
            const timer = setTimeout(() => {
                form.resetFields();
                // Nếu user đã bị khóa, mặc định là unban
                if (user.status === 'BANNED') {
                    setActionType('unban');
                } else {
                    setActionType('ban');
                }
            }, 0);

            return () => clearTimeout(timer);
        }
    }, [open, user, form]);

    const handleSubmit = async (values: any) => {
        if (!user) return;

        try {
            setLoading(true);

            const payload: IUpdateUserStatusReq = {
                status: actionType === 'ban' ? 'BANNED' : 'ACTIVE',
                reason: values.reason || null,
            };

            const res = await updateUserStatus(user.id, payload);

            if (res.data.statusCode === 200) {
                toast.success(
                    actionType === 'ban'
                        ? `Đã khóa tài khoản ${user.email}`
                        : `Đã mở khóa tài khoản ${user.email}`
                );
                onSuccess();
                onCancel();
            }
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>
                        {actionType === 'ban'
                            ? 'Lỗi khi khóa tài khoản'
                            : 'Lỗi khi mở khóa tài khoản'}
                    </div>
                    <div>{message}</div>
                </div>
            );
        } finally {
            setLoading(false);
        }
    };

    const isBanned = user?.status === 'BANNED';

    return (
        <Modal
            title={isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={loading}
            okText={isBanned ? 'Mở khóa' : 'Khóa'}
            cancelText="Hủy"
            centered
        >
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                >
                    <div style={{ marginBottom: 16 }}>
                        <p>
                            <strong>Email:</strong> {user?.email}
                        </p>
                        <p>
                            <strong>Tên:</strong> {user?.fullName || user?.name || '-'}
                        </p>
                        <p>
                            <strong>Trạng thái hiện tại:</strong>{' '}
                            {user?.status === 'BANNED' ? (
                                <span style={{ color: 'red' }}>Bị khóa</span>
                            ) : (
                                <span style={{ color: 'green' }}>Đang hoạt động</span>
                            )}
                        </p>
                    </div>

                    {!isBanned && (
                        <Form.Item
                            name="reason"
                            label="Lý do khóa (bắt buộc)"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập lý do khóa tài khoản',
                                },
                            ]}
                        >
                            <Input.TextArea
                                placeholder="Nhập lý do khóa tài khoản (VD: Vi phạm quy định, spam...)"
                                rows={4}
                            />
                        </Form.Item>
                    )}

                    {isBanned && user?.bannedReason && (
                        <div
                            style={{
                                marginBottom: 16,
                                padding: 12,
                                backgroundColor: '#fff2f0',
                                border: '1px solid #ffccc7',
                                borderRadius: 4,
                            }}
                        >
                            <p style={{ marginBottom: 0 }}>
                                <strong>Lý do khóa:</strong> {user.bannedReason}
                            </p>
                            {user.bannedAt && (
                                <p style={{ marginBottom: 0, fontSize: 12, color: '#666' }}>
                                    <strong>Thời gian khóa:</strong>{' '}
                                    {new Date(user.bannedAt).toLocaleString('vi-VN')}
                                </p>
                            )}
                        </div>
                    )}
                </Form>
            </Spin>
        </Modal>
    );
};

export default ModalBanUser;
