import {
    Image,
    Modal,
    Upload,
    Select,
    type UploadFile,
    type UploadProps,
    type GetProp,
} from "antd";
import { Form, Input, InputNumber } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { createRoom, uploadImageRoom } from "../../../../../config/Api";
import { useAppDispatch } from "../../../../../redux/hooks";
import { fetchRooms } from "../../../../../redux/features/v2/roomSlice";
import type { ICreateRoomRequest } from "../../../../../types/v2/room";
import { ROOM_STATUS_OPTIONS } from "../../../../../utils/constants/room.constants";

interface IProps {
    openModalAddRoom: boolean;
    setOpenModalAddRoom: (v: boolean) => void;
}

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const ModalAddRoom = ({ openModalAddRoom, setOpenModalAddRoom }: IProps) => {
    const [form] = Form.useForm<ICreateRoomRequest>();
    const dispatch = useAppDispatch();

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleChange: UploadProps["onChange"] = ({ fileList: fl }) => setFileList(fl);

    const uploadButton = (
        <button style={{ border: 0, background: "none" }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

    const handleUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImageRoom(file);
            const roomUrl = res.data?.url;

            form.setFieldValue("roomUrl", roomUrl);

            setFileList([
                {
                    uid: file.uid,
                    name: file.name,
                    status: "done",
                    url: roomUrl,
                },
            ]);

            onSuccess?.("ok");
            toast.success("Upload ảnh thành công");
        } catch (err) {
            onError?.(err);
            toast.error("Upload ảnh thất bại");
        }
    };

    const handleAddRoom = async (values: ICreateRoomRequest) => {
        const payload: ICreateRoomRequest = {
            ...values,
            roomName:
                typeof values.roomName === "string" ? values.roomName.trim() : values.roomName,
            building:
                typeof values.building === "string" ? values.building.trim() : values.building,
        };

        try {
            const res = await createRoom(payload);
            if (res.data.statusCode === 201) {
                toast.success("Tạo phòng mới thành công");
                await dispatch(fetchRooms(""));
                form.resetFields();
                setFileList([]);
                setOpenModalAddRoom(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <strong>Có lỗi xảy ra!</strong>
                    <div>{Array.isArray(m) ? m.join(", ") : m}</div>
                </div>
            );
        }
    };

    useEffect(() => {
        if (openModalAddRoom) {
            form.resetFields();
            form.setFieldsValue({ status: "ACTIVE" });
            setFileList([]);
        }
    }, [openModalAddRoom, form]);

    return (
        <Modal
            title="Thêm mới phòng"
            open={openModalAddRoom}
            maskClosable={false}
            okText="Lưu"
            cancelText="Hủy"
            onOk={() => form.submit()}
            onCancel={() => setOpenModalAddRoom(false)}
        >
            <hr />
            <Form
                form={form}
                layout="vertical"
                onFinish={handleAddRoom}
                autoComplete="off"
            >
                <Form.Item
                    label="Tên phòng"
                    name="roomName"
                    rules={[{ required: true, message: "Vui lòng nhập tên phòng" }]}
                >
                    <Input placeholder="Ví dụ: Phòng A411" />
                </Form.Item>

                <Form.Item
                    label="Nhà"
                    name="building"
                    rules={[{ required: true, message: "Vui lòng nhập tên nhà" }]}
                >
                    <Input placeholder="Ví dụ: Nhà A" />
                </Form.Item>

                <Form.Item
                    label="Tầng"
                    name="floor"
                    rules={[{ required: true, message: "Vui lòng nhập số tầng" }]}
                >
                    <InputNumber style={{ width: "100%" }} min={0} placeholder="4" />
                </Form.Item>

                <Form.Item
                    label="Số phòng"
                    name="roomNumber"
                    rules={[{ required: true, message: "Vui lòng nhập số phòng" }]}
                >
                    <InputNumber style={{ width: "100%" }} min={0} placeholder="11" />
                </Form.Item>

                <Form.Item
                    label="Sức chứa"
                    name="capacity"
                    rules={[
                        { required: true, message: "Vui lòng nhập sức chứa" },
                        { type: "number", min: 1, message: "Sức chứa phải ít nhất là 1" },
                    ]}
                >
                    <InputNumber style={{ width: "100%" }} min={1} placeholder="45" />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea rows={2} placeholder="Mô tả phòng (tuỳ chọn)" />
                </Form.Item>

                <Form.Item label="Trạng thái" name="status">
                    <Select options={ROOM_STATUS_OPTIONS} />
                </Form.Item>

                <Form.Item label="Người phụ trách" name="contactPerson">
                    <Input placeholder="Tuỳ chọn" />
                </Form.Item>

                <Form.Item label="Số điện thoại liên hệ" name="contactPhone">
                    <Input placeholder="Tuỳ chọn" />
                </Form.Item>

                <Form.Item label="Nơi lấy chìa khóa" name="keyLocation">
                    <Input placeholder="Tuỳ chọn" />
                </Form.Item>

                <Form.Item label="Ghi chú" name="notes">
                    <Input.TextArea rows={2} placeholder="Thủ tục mượn, lưu ý..." />
                </Form.Item>

                <Form.Item label="Ảnh phòng">
                    <Upload
                        listType="picture-circle"
                        fileList={fileList}
                        onPreview={handlePreview}
                        onChange={handleChange}
                        customRequest={handleUpload}
                        accept=".jpg,.jpeg,.png,.webp"
                    >
                        {fileList.length >= 1 ? null : uploadButton}
                    </Upload>

                    {previewImage && (
                        <Image
                            preview={{
                                visible: previewOpen,
                                onVisibleChange: setPreviewOpen,
                            }}
                            src={previewImage}
                            style={{ display: "none" }}
                        />
                    )}
                </Form.Item>

                <Form.Item name="roomUrl" hidden>
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalAddRoom;
