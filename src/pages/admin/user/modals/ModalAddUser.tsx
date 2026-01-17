import { Image, Modal, Upload, type GetProp, type UploadFile, type UploadProps } from 'antd';
import { Form, Input } from 'antd';
import { createUser, uploadImageAvatar } from '../../../../config/Api';
import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import type { ICreateUserReq } from '../../../../types/user';
import { useAppDispatch } from '../../../../redux/hooks';
import { fetchUsers } from '../../../../redux/features/userSlice';

interface IProps {
    openModalAddUser: boolean;
    setOpenModalAddUser: (v: boolean) => void;
}

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const ModalAddUser = (props: IProps) => {
    const { openModalAddUser, setOpenModalAddUser } = props;
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }

        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
        setFileList(newFileList);

    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

    const handleUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImageAvatar(file);
            const avatarUrl = res.data?.url;

            // Cập nhật form field "avatarUrl"
            form.setFieldValue('avatarUrl', avatarUrl);

            // Cập nhật lại danh sách file
            setFileList([
                {
                    uid: file.uid || Date.now(),
                    name: file.name,
                    status: 'done',
                    url: avatarUrl,
                    originFileObj: file,
                },
            ]);

            onSuccess?.('ok');
            toast.success('Upload ảnh thành công');
        } catch (err) {
            console.error(err);
            onError?.(err);
            toast.error('Upload ảnh thất bại');
        }
    };

    const handleAddUser = async (data: ICreateUserReq) => {
        try {
            const res = await createUser(data);
            if (res.data.statusCode === 201) {
                await dispatch(fetchUsers(""));
                setOpenModalAddUser(false);
                toast.success('Tạo mới người dùng thành công')
                form.resetFields(); // dùng để xóa các giá trị sau khi đã submit
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div><strong>Có lỗi xảy ra!</strong></div>
                    <div>{m}</div>
                </div>
            );
        }
    }

    return (
        <>
            <Modal
                title="Thêm mới người dùng"
                maskClosable={false}
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={openModalAddUser}
                okText="Save"
                onOk={() => form.submit()}
                onCancel={() => setOpenModalAddUser(false)}
            >
                <div>
                    <hr />
                    <Form
                        form={form}
                        onFinish={handleAddUser}
                        layout='vertical'
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Tên"
                            name="name"
                        // rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Họ và tên"
                            name="fullName"
                        // rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: 'Vui lòng nhập email!' },
                                { type: "email", message: 'Email không hợp lệ!' }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item
                            label="Số điện thoại"
                            name="phoneNumber"
                        // rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                        >
                            <Input />
                        </Form.Item>
                        {/*Upload ảnh */}
                        <Form.Item label="Ảnh đại diện" required>
                            <Upload
                                listType="picture-circle"
                                fileList={fileList}
                                onPreview={handlePreview}
                                onChange={handleChange}
                                customRequest={handleUpload}
                                accept=".jpg,.jpeg,.png,.webp"
                            >
                                {fileList.length >= 1 ? null : uploadButton}
                                {/* {fileList.length >= 8 ? null : uploadButton} */}
                            </Upload>
                            {previewImage && (
                                <Image
                                    styles={{
                                        root: { display: 'none' }
                                    }}
                                    preview={{
                                        visible: previewOpen,
                                        onVisibleChange: (visible) => setPreviewOpen(visible),
                                        afterOpenChange: (visible) => !visible && setPreviewImage(''),
                                    }}
                                    src={previewImage}
                                />
                            )}
                        </Form.Item>

                        {/* Hidden field để form lưu string URL */}
                        <Form.Item name="avatarUrl" hidden
                            // rules={[{ required: true, message: 'Vui lòng tải ảnh lên!' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </>
    )
}
export default ModalAddUser;