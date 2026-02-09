import {
    Button,
    Drawer,
    Form,
    Input,
    Upload,
    Image,
    Space,
    Typography,
    theme,
    Divider
} from "antd";
import type { UploadFile, UploadProps, GetProp } from "antd";
import {
    UserOutlined,
    PhoneOutlined,
    IdcardOutlined,
    CameraOutlined,
    SaveOutlined
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { updateAccount, uploadImageAvatar } from "../../../config/Api";
import { fetchAccount } from "../../../redux/features/accountSlice";
import { motion } from "framer-motion";
import type { IUpdateAccountReq } from "../../../types/account";

const { Text } = Typography;

interface IProps {
    openModalUpdateAccount: boolean;
    setOpenModalUpdateAccount: (v: boolean) => void;
}

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });

const ModalUpdateAccount = ({
    openModalUpdateAccount,
    setOpenModalUpdateAccount,
}: IProps) => {
    const [form] = Form.useForm();
    const { token } = theme.useToken();
    const account = useAppSelector(state => state.account.account);
    const [loading, setLoading] = useState(false);
    const [avatarRemoved, setAvatarRemoved] = useState(false);

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (openModalUpdateAccount && account) {
            form.setFieldsValue({
                name: account.name,
                fullName: account.fullName,
                phoneNumber: account.phoneNumber,
                avatarUrl: account.avatarUrl,
            });

            if (account.avatarUrl) {
                setFileList([
                    {
                        uid: "-1",
                        name: "avatar",
                        status: "done",
                        url: account.avatarUrl,
                    },
                ]);
            } else {
                setFileList([]);
            }
            setAvatarRemoved(false); // reset
        }
    }, [openModalUpdateAccount, account, form]);

    const handleUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImageAvatar(file);
            const avatarUrl = res.data?.url;
            form.setFieldValue("avatarUrl", avatarUrl);
            setFileList([{
                uid: file.uid || Date.now(),
                name: file.name,
                status: "done",
                url: avatarUrl,
            }]);
            onSuccess?.("ok");
            toast.success("Tải ảnh lên thành công");
        } catch (err) {
            onError?.(err);
            toast.error("Tải ảnh thất bại");
        }
    };

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleSubmit = async (values: IUpdateAccountReq) => {
        setLoading(true);
        try {
            const payload: IUpdateAccountReq = {
                ...values,
                phoneNumber:
                    values.phoneNumber === null
                        ? null
                        : values.phoneNumber?.trim(),
                avatarUrl: avatarRemoved ? "" : values.avatarUrl,
            };

            const res = await updateAccount(payload);

            if (res.data.statusCode === 200) {
                toast.success("Cập nhật thông tin thành công");
                dispatch(fetchAccount());
                setOpenModalUpdateAccount(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Có lỗi xảy ra";
            toast.error(m);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            title={
                <Space>
                    <UserOutlined style={{ color: token.colorPrimary }} />
                    <span style={{ fontWeight: 700 }}>Thông tin cá nhân</span>
                </Space>
            }
            size={420}
            open={openModalUpdateAccount}
            onClose={() => setOpenModalUpdateAccount(false)}
            destroyOnHidden
            styles={{
                body: { padding: '24px 20px' },
                footer: { textAlign: 'right', padding: '12px 20px' }
            }}
            footer={
                <Space>
                    <Button onClick={() => setOpenModalUpdateAccount(false)}>Hủy</Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={loading}
                        onClick={() => form.submit()}
                    >
                        Lưu thay đổi
                    </Button>
                </Space>
            }
        >
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark="optional"
                >
                    {/* Avatar Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                        <Form.Item label={null}>
                            <Upload
                                listType="picture-circle"
                                fileList={fileList}
                                customRequest={handleUpload}
                                onPreview={handlePreview}
                                onChange={({ fileList }) => setFileList(fileList)}
                                onRemove={() => {
                                    setFileList([]);
                                    setAvatarRemoved(true);        // đánh dấu đã xóa
                                    form.setFieldValue("avatarUrl", "");
                                    toast.success("Đã xóa ảnh đại diện");
                                    return true;
                                }}
                                accept=".jpg,.jpeg,.png,.webp"
                            >
                                {fileList.length >= 1 ? null : (
                                    <div style={{ textAlign: 'center' }}>
                                        <CameraOutlined style={{ fontSize: 20, color: token.colorTextTertiary }} />
                                        <div style={{ marginTop: 4, fontSize: 12 }}>Ảnh đại diện</div>
                                    </div>
                                )}
                            </Upload>
                        </Form.Item>
                        <Text type="secondary" style={{ fontSize: 12 }}>Nhấp vào ảnh để thay đổi</Text>
                    </div>

                    <Divider titlePlacement="start" plain>
                        <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                            THÔNG TIN CƠ BẢN
                        </Typography.Text>
                    </Divider>


                    <Form.Item
                        name="name"
                        label={<Space><IdcardOutlined /> <Text strong>Tên đăng nhập</Text></Space>}
                    >
                        <Input placeholder="Nhập tên đăng nhập" />
                    </Form.Item>

                    <Form.Item
                        name="fullName"
                        label={<Space><UserOutlined /> <Text strong>Họ và tên</Text></Space>}
                    >
                        <Input placeholder="Nhập họ và tên đầy đủ" />
                    </Form.Item>

                    <Form.Item
                        name="phoneNumber"
                        label={<Space><PhoneOutlined /> <Text strong>Số điện thoại</Text></Space>}
                        rules={[
                            {
                                pattern: /^$|^\d{9,11}$/,
                                message: "Số điện thoại phải từ 9–11 chữ số",
                            },
                        ]}
                    >
                        <Input placeholder="Ví dụ: 0912345678" />
                    </Form.Item>


                    {/* Hidden field cho avatarUrl */}
                    <Form.Item name="avatarUrl" hidden>
                        <Input />
                    </Form.Item>
                </Form>
            </motion.div>

            {previewImage && (
                <Image
                    style={{ display: "none" }}
                    preview={{
                        open: previewOpen,
                        onOpenChange: setPreviewOpen,
                    }}
                    src={previewImage}
                />

            )}
        </Drawer>
    );
};

export default ModalUpdateAccount;