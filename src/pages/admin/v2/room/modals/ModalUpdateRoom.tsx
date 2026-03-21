import {
    Image,
    Modal,
    Select,
    Upload,
    type GetProp,
    type UploadFile,
    type UploadProps,
} from "antd";
import { Form, Input, InputNumber } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { updateRoom, uploadImageRoom } from "../../../../../config/Api";
import { useAppDispatch } from "../../../../../redux/hooks";
import { fetchRooms } from "../../../../../redux/features/v2/roomSlice";
import type { IRoom, IUpdateRoomRequest } from "../../../../../types/v2/room";
import { ROOM_STATUS_OPTIONS } from "../../../../../utils/constants/room.constants";

interface IProps {
    openModalUpdateRoom: boolean;
    setOpenModalUpdateRoom: (v: boolean) => void;
    roomEdit: IRoom | null;
}

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const ModalUpdateRoom = ({
    openModalUpdateRoom,
    setOpenModalUpdateRoom,
    roomEdit,
}: IProps) => {
    const [form] = Form.useForm<IUpdateRoomRequest>();
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
                    uid: file.uid || Date.now().toString(),
                    name: file.name,
                    status: "done",
                    url: roomUrl,
                    originFileObj: file,
                },
            ]);

            onSuccess?.("ok");
            toast.success("Upload ảnh thành công");
        } catch (err) {
            onError?.(err);
            toast.error("Upload ảnh thất bại");
        }
    };

    const handleEditRoom = async (values: IUpdateRoomRequest) => {
        if (!roomEdit?.id) {
            toast.error("ID phòng không hợp lệ");
            return;
        }

        const payload: IUpdateRoomRequest = {
            ...values,
            roomName:
                typeof values.roomName === "string" ? values.roomName.trim() : values.roomName,
            building:
                typeof values.building === "string" ? values.building.trim() : values.building,
        };

        try {
            const res = await updateRoom(roomEdit.id, payload);

            if (res.data.statusCode === 200) {
                toast.success("Cập nhật phòng thành công");
                form.resetFields();
                setFileList([]);
                await dispatch(fetchRooms(""));
                setOpenModalUpdateRoom(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra!</div>
                    <div>{Array.isArray(m) ? m.join(", ") : m}</div>
                </div>
            );
        }
    };

    useEffect(() => {
        if (!roomEdit) return;

        form.resetFields();

        form.setFieldsValue({
            roomName: roomEdit.roomName,
            building: roomEdit.building,
            floor: roomEdit.floor,
            roomNumber: roomEdit.roomNumber,
            capacity: roomEdit.capacity,
            description: roomEdit.description ?? undefined,
            status: roomEdit.status,
            contactPerson: roomEdit.contactPerson ?? undefined,
            contactPhone: roomEdit.contactPhone ?? undefined,
            keyLocation: roomEdit.keyLocation ?? undefined,
            notes: roomEdit.notes ?? undefined,
            roomUrl: roomEdit.roomUrl ?? undefined,
        });

        if (roomEdit.roomUrl) {
            setFileList([
                {
                    uid: "-1",
                    name: "room",
                    status: "done",
                    url: roomEdit.roomUrl,
                },
            ]);
        } else {
            setFileList([]);
        }
    }, [roomEdit, form]);

    return (
        <Modal
            title="Cập nhật phòng"
            maskClosable={false}
            open={openModalUpdateRoom}
            okText="Lưu"
            cancelText="Hủy"
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdateRoom(false)}
        >
            <hr />
            <Form
                form={form}
                layout="vertical"
                onFinish={handleEditRoom}
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
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Tầng"
                    name="floor"
                    rules={[{ required: true, message: "Vui lòng nhập số tầng" }]}
                >
                    <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>

                <Form.Item
                    label="Số phòng"
                    name="roomNumber"
                    rules={[{ required: true, message: "Vui lòng nhập số phòng" }]}
                >
                    <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>

                <Form.Item
                    label="Sức chứa"
                    name="capacity"
                    rules={[
                        { required: true, message: "Vui lòng nhập sức chứa" },
                        { type: "number", min: 1, message: "Sức chứa phải ít nhất là 1" },
                    ]}
                >
                    <InputNumber style={{ width: "100%" }} min={1} />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea rows={2} />
                </Form.Item>

                <Form.Item
                    label="Trạng thái"
                    name="status"
                    rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                    <Select options={ROOM_STATUS_OPTIONS} />
                </Form.Item>

                <Form.Item label="Người phụ trách" name="contactPerson">
                    <Input />
                </Form.Item>

                <Form.Item label="Số điện thoại liên hệ" name="contactPhone">
                    <Input />
                </Form.Item>

                <Form.Item label="Nơi lấy chìa khóa" name="keyLocation">
                    <Input />
                </Form.Item>

                <Form.Item label="Ghi chú" name="notes">
                    <Input.TextArea rows={2} />
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
                            styles={{ root: { display: "none" } }}
                            preview={{
                                visible: previewOpen,
                                onVisibleChange: setPreviewOpen,
                                afterOpenChange: (v) => !v && setPreviewImage(""),
                            }}
                            src={previewImage}
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

export default ModalUpdateRoom;
