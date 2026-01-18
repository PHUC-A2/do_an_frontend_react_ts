import { Image, Modal, Select, Upload, type GetProp, type UploadFile, type UploadProps } from 'antd';
import { Form, Input } from 'antd';
import { updateUser, uploadImageAvatar } from '../../../../config/Api';
import { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useAppDispatch } from '../../../../redux/hooks';
import { fetchUsers } from '../../../../redux/features/userSlice';
import { type IUpdateUserReq, type IUser } from '../../../../types/user';
import { USER_STATUS } from '../../../../utils/constants/user.constants';

interface IProps {
    openModalUpdateUser: boolean;
    setOpenModalUpdateUser: (v: boolean) => void;
    userEdit: IUser | null;
}

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const ModalUpdateUser = (props: IProps) => {
    const { openModalUpdateUser, setOpenModalUpdateUser, userEdit } = props;
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

    const handleEditUser = async (values: IUpdateUserReq) => {
        try {
            if (!userEdit?.id) {
                toast.error("ID người dùng không hợp lệ");
                return;
            }

            const res = await updateUser(userEdit.id, values);

            if (res.data.statusCode === 200) {
                toast.success("Cập nhật người dùng thành công");
                form.resetFields();
                setFileList([]);
                await dispatch(fetchUsers(""));
                setOpenModalUpdateUser(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra!</div>
                    <div>{m}</div>
                </div>
            );
        }
    };


    useEffect(() => {
        if (!userEdit) return;

        form.resetFields(); // reset data

        form.setFieldsValue({
            name: userEdit.name,
            fullName: userEdit.fullName,
            phoneNumber: userEdit.phoneNumber,
            avatarUrl: userEdit.avatarUrl,
            status: userEdit.status,
        });

        if (userEdit.avatarUrl) {
            setFileList([
                {
                    uid: "-1",
                    name: "avatar",
                    status: "done",
                    url: userEdit.avatarUrl,
                },
            ]);
        } else {
            setFileList([]);
        }
    }, [userEdit]);

    return (
        <>
            <Modal
                title="Cập nhật người dùng"
                maskClosable={false}
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={openModalUpdateUser}
                okText="Lưu"
                onOk={() => form.submit()}
                onCancel={() => setOpenModalUpdateUser(false)}
                cancelText="Hủy"
            >
                <div>
                    <hr />
                    <Form
                        form={form}
                        onFinish={handleEditUser}
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

                        <Form.Item
                            label="Trạng thái"
                            name="status"
                        // rules={[{ required: true, message: 'Vui lòng nhập trạng thái!' }]}
                        >
                            <Select placeholder="Chọn trạng thái">
                                {USER_STATUS.map(status => (
                                    <Select.Option key={status} value={status}>
                                        {status}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                    </Form>
                </div>
            </Modal>
        </>
    )
}
export default ModalUpdateUser;