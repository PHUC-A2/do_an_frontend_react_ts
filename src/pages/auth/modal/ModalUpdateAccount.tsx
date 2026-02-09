import {
    Button,
    Drawer,
    Form,
    Input,
    Upload,
    Image
} from "antd";
import type { UploadFile, UploadProps, GetProp } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { updateAccount, uploadImageAvatar } from "../../../config/Api";
import { fetchAccount } from "../../../redux/features/accountSlice";

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
    const account = useAppSelector(state => state.account.account);

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    const dispatch = useAppDispatch();

    // Load data khi mở modal
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
        }
    }, [openModalUpdateAccount, account]);

    // Upload avatar
    const handleUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImageAvatar(file);
            const avatarUrl = res.data?.url;

            form.setFieldValue("avatarUrl", avatarUrl);

            setFileList([
                {
                    uid: file.uid || Date.now(),
                    name: file.name,
                    status: "done",
                    url: avatarUrl,
                },
            ]);

            onSuccess?.("ok");
            toast.success("Upload ảnh thành công");
        } catch (err) {
            onError?.(err);
            toast.error("Upload ảnh thất bại");
        }
    };

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            const res = await updateAccount(values);
            if (res.data.statusCode === 200) {
                toast.success("Cập nhật tài khoản thành công");
                dispatch(fetchAccount());
                setOpenModalUpdateAccount(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Có lỗi xảy ra";
            toast.error(
                <div>
                    <div><strong>Có lỗi xảy ra!</strong></div>
                    <div>{m}</div>
                </div>
            );
        }
    };

    return (
        <Drawer
            title="Cập nhật tài khoản"
            size={420}
            open={openModalUpdateAccount}
            onClose={() => setOpenModalUpdateAccount(false)}
            destroyOnHidden
            extra={
                <Button type="primary" onClick={() => form.submit()}>
                    Lưu
                </Button>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item name="name" label="Tên">
                    <Input />
                </Form.Item>

                <Form.Item name="fullName" label="Họ và tên">
                    <Input />
                </Form.Item>

                <Form.Item
                    name="phoneNumber"
                    label="Số điện thoại"
                    rules={[
                        {
                            // pattern: /^\d{9,11}$/,
                            message: "Số điện thoại không hợp lệ",
                        },
                    ]}
                >
                    <Input />
                </Form.Item>

                {/* Upload avatar */}
                <Form.Item label="Ảnh đại diện">
                    <Upload
                        listType="picture-circle"
                        fileList={fileList}
                        customRequest={handleUpload}
                        onPreview={handlePreview}
                        onChange={({ fileList }) => setFileList(fileList)}
                        accept=".jpg,.jpeg,.png,.webp"
                    >
                        {fileList.length >= 1 ? null : (
                            <button
                                type="button"
                                style={{ border: 0, background: "none" }}
                            >
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </button>
                        )}
                    </Upload>
                </Form.Item>

                {/* Hidden field */}
                <Form.Item name="avatarUrl" hidden>
                    <Input />
                </Form.Item>

                {previewImage && (
                    <Image
                        style={{ display: "none" }}
                        preview={{
                            visible: previewOpen,
                            onVisibleChange: setPreviewOpen,
                        }}
                        src={previewImage}
                    />
                )}
            </Form>
        </Drawer>
    );
};

export default ModalUpdateAccount;
