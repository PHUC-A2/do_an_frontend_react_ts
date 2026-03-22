import { Collapse, Descriptions, Drawer, Image, Spin, Tag, Typography } from "antd";
import type { IDeviceCatalog } from "../../../../../types/v2/deviceCatalog";
import {
    DEVICE_CATALOG_MOBILITY_LABEL,
    DEVICE_CATALOG_STATUS_META,
    DEVICE_CATALOG_TYPE_LABEL,
} from "../../../../../utils/constants/deviceCatalog.constants";
import { formatInstant } from "../../../../../utils/format/localdatetime";

const { Text } = Typography;

interface IProps {
    openModalDeviceCatalogDetails: boolean;
    setOpenModalDeviceCatalogDetails: (v: boolean) => void;
    catalog: IDeviceCatalog | null;
    isLoading: boolean;
}

const ModalViewDeviceCatalog = ({
    openModalDeviceCatalogDetails,
    setOpenModalDeviceCatalogDetails,
    catalog,
    isLoading,
}: IProps) => {
    return (
        <Drawer
            title="Chi tiết danh mục thiết bị"
            placement="right"
            width={420}
            onClose={() => setOpenModalDeviceCatalogDetails(false)}
            open={openModalDeviceCatalogDetails}
        >
            <Spin spinning={isLoading}>
                <Collapse
                    defaultActiveKey={["general", "meta"]}
                    items={[
                        {
                            key: "general",
                            label: "Thông tin danh mục",
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Ảnh thiết bị">
                                        {catalog?.imageUrl ? (
                                            <Image
                                                src={catalog.imageUrl}
                                                width="100%"
                                                style={{ borderRadius: 6, maxHeight: 280, objectFit: "contain" }}
                                            />
                                        ) : (
                                            "N/A"
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="ID">{catalog?.id ?? "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Tên">{catalog?.deviceName ?? "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Loại thiết bị">
                                        {catalog?.deviceType ? DEVICE_CATALOG_TYPE_LABEL[catalog.deviceType] : "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Cố định / Lưu động">
                                        {catalog?.mobilityType
                                            ? DEVICE_CATALOG_MOBILITY_LABEL[catalog.mobilityType]
                                            : "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Hãng">{catalog?.manufacturer ?? "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Model">{catalog?.model ?? "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        {catalog?.status ? (
                                            <Tag color={DEVICE_CATALOG_STATUS_META[catalog.status].color}>
                                                {DEVICE_CATALOG_STATUS_META[catalog.status].label}
                                            </Tag>
                                        ) : (
                                            "N/A"
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mô tả">{catalog?.description ?? "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Đường dẫn ảnh (lưu trữ)">
                                        {catalog?.imageUrl ? (
                                            <Text copyable ellipsis style={{ maxWidth: 360 }}>
                                                {catalog.imageUrl}
                                            </Text>
                                        ) : (
                                            "N/A"
                                        )}
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
                                        {catalog?.createdBy ? catalog.createdBy : "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">{formatInstant(catalog?.createdAt)}</Descriptions.Item>
                                    <Descriptions.Item label="Người cập nhật">
                                        {catalog?.updatedBy ? catalog.updatedBy : "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(catalog?.updatedAt)}</Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Drawer>
    );
};

export default ModalViewDeviceCatalog;
