import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { toast } from 'react-toastify';

import { createPitchType, deletePitchType, getPitchTypes, updatePitchType } from '../../../../config/Api';
import type { IPitchType } from '../../../../types/pitch';

interface IProps {
    open: boolean;
    onClose: () => void;
}

interface IFormValue {
    name: string;
    code?: string | null;
}

const ModalManagePitchTypes = ({ open, onClose }: IProps) => {
    const [form] = Form.useForm<IFormValue>();
    const [items, setItems] = useState<IPitchType[]>([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState<IPitchType | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getPitchTypes();
            setItems(res.data.data ?? []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        loadData();
    }, [open]);

    const resetForm = () => {
        setEditing(null);
        form.resetFields();
    };

    const onSubmit = async (values: IFormValue) => {
        setSubmitting(true);
        try {
            if (editing?.id) {
                await updatePitchType(editing.id, values);
                toast.success('Cập nhật loại sân thành công');
            } else {
                await createPitchType(values);
                toast.success('Tạo loại sân thành công');
            }
            resetForm();
            await loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Thao tác thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const onDelete = async (id: number) => {
        try {
            await deletePitchType(id);
            toast.success('Đã xóa loại sân');
            if (editing?.id === id) {
                resetForm();
            }
            await loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể xóa loại sân');
        }
    };

    const columns: ColumnsType<IPitchType> = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
        { title: 'Tên loại sân', dataIndex: 'name', key: 'name' },
        { title: 'Mã', dataIndex: 'code', key: 'code', render: (value?: string | null) => value || '-' },
        {
            title: 'Hành động',
            key: 'action',
            width: 180,
            render: (_: unknown, record: IPitchType) => (
                <Space>
                    <Button
                        size="small"
                        onClick={() => {
                            setEditing(record);
                            form.setFieldsValue({
                                name: record.name,
                                code: record.code ?? undefined,
                            });
                        }}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xóa loại sân"
                        description="Bạn có chắc chắn muốn xóa loại sân này không?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => onDelete(record.id)}
                    >
                        <Button danger size="small">Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Modal
            title="Quản lý loại sân"
            open={open}
            width={860}
            footer={null}
            onCancel={() => {
                resetForm();
                onClose();
            }}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                style={{ marginBottom: 12 }}
            >
                <Space align="start" style={{ width: '100%' }} size={12}>
                    <Form.Item
                        label="Tên loại sân"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên loại sân' }]}
                        style={{ flex: 1, marginBottom: 0 }}
                    >
                        <Input placeholder="Ví dụ: Sân 9 người" />
                    </Form.Item>
                    <Form.Item label="Mã" name="code" style={{ width: 180, marginBottom: 0 }}>
                        <Input placeholder="Ví dụ: NINE" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, marginTop: 30 }}>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                {editing ? 'Lưu' : 'Thêm'}
                            </Button>
                            <Button onClick={resetForm}>Làm mới</Button>
                        </Space>
                    </Form.Item>
                </Space>
            </Form>

            <Table<IPitchType>
                rowKey="id"
                loading={loading}
                dataSource={items}
                columns={columns}
                pagination={false}
                size="small"
            />
        </Modal>
    );
};

export default ModalManagePitchTypes;
