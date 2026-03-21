import { Descriptions, Drawer, Spin, Tag, Image, Collapse } from "antd";

import type { IRoom } from "../../../../../types/v2/room";
import { ROOM_STATUS_META } from "../../../../../utils/constants/room.constants";
import { formatInstant } from "../../../../../utils/format/localdatetime";

interface IProps {
    openModalRoomDetails: boolean;
    setOpenModalRoomDetails: (v: boolean) => void;
    room: IRoom | null;
    isLoading: boolean;
}

const ModalViewRoom = ({
    openModalRoomDetails,
    setOpenModalRoomDetails,
    room,
    isLoading,
}: IProps) => {
    return (
        <Drawer
            title="Chi tiết phòng"
            placement="right"
            onClose={() => setOpenModalRoomDetails(false)}
            open={openModalRoomDetails}
        >
            <Spin spinning={isLoading}>
                <Collapse
                    defaultActiveKey={["general", "meta"]}
                    items={[
                        {
                            key: "general",
                            label: "Thông tin phòng",
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Ảnh phòng">
                                        {room?.roomUrl ? (
                                            <Image
                                                src={room.roomUrl}
                                                width="100%"
                                                style={{ borderRadius: 6 }}
                                            />
                                        ) : (
                                            "N/A"
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="ID">{room?.id ?? "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Tên phòng">
                                        {room?.roomName ?? "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Nhà">{room?.building ?? "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Tầng">{room?.floor ?? "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Số phòng">
                                        {room?.roomNumber ?? "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Sức chứa">
                                        {room?.capacity ?? "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        {room?.status ? (
                                            <Tag color={ROOM_STATUS_META[room.status].color}>
                                                {ROOM_STATUS_META[room.status].label}
                                            </Tag>
                                        ) : (
                                            "N/A"
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mô tả">
                                        {room?.description?.trim() ? room.description : "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Người phụ trách">
                                        {room?.contactPerson ?? "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="SĐT liên hệ">
                                        {room?.contactPhone ?? "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Nơi lấy chìa khóa">
                                        {room?.keyLocation ?? "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ghi chú">
                                        {room?.notes?.trim() ? room.notes : "N/A"}
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: "meta",
                            label: "Lịch sử cập nhật",
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Người tạo">
                                        {room?.createdBy ? room.createdBy : "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">
                                        {formatInstant(room?.createdAt)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Người cập nhật">
                                        {room?.updatedBy ? room.updatedBy : "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày cập nhật">
                                        {formatInstant(room?.updatedAt)}
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Drawer>
    );
};

export default ModalViewRoom;
