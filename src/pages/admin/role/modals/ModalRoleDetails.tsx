import { Collapse, Descriptions, Drawer, Spin, Tag } from "antd";
import dayjs from "dayjs";
import type { IRole } from "../../../../types/role";

interface IProps {
    openModalRoleDetails: boolean;
    setOpenModalRoleDetails: (v: boolean) => void;
    role: IRole | null;
    isLoading: boolean;
}

const ModalRoleDetails = (props: IProps) => {
    const {
        openModalRoleDetails,
        setOpenModalRoleDetails,
        role,
        isLoading,
    } = props;

    return (
        <Drawer
            title="Chi tiết vai trò (Role)"
            placement="right"
            closable={false}
            onClose={() => setOpenModalRoleDetails(false)}
            open={openModalRoleDetails}
        >
            <Spin spinning={isLoading}>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="ID">
                        {role?.id ?? "N/A"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên vai trò">
                        {role?.name ? (
                            <Tag
                                color={role.name === "ADMIN" ? "warning" : "blue"}
                            >
                                {role.name}
                            </Tag>
                        ) : (
                            "N/A"
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Mô tả">
                        {role?.description || "-"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Quyền">
                        {role?.permissions && role.permissions.length > 0 ? (
                            <Collapse
                                size="small"
                                ghost
                                items={role.permissions.map((p) => ({
                                    key: String(p.id),
                                    label: (
                                        <span style={{ fontSize: 12, fontWeight: 500 }}>
                                            {p.name}
                                        </span>
                                    ),
                                    children: (
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "#666",
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {p.description}
                                        </div>
                                    ),
                                }))}
                            />
                        ) : (
                            "-"
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {role?.createdBy ?? "N/A"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {role?.updatedBy ?? "N/A"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {role?.createdAt
                            ? dayjs(role.createdAt).format(
                                "DD/MM/YYYY HH:mm:ss"
                            )
                            : "N/A"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {role?.updatedAt
                            ? dayjs(role.updatedAt).format(
                                "DD/MM/YYYY HH:mm:ss"
                            )
                            : "N/A"}
                    </Descriptions.Item>
                </Descriptions>
            </Spin>
        </Drawer>
    );
};

export default ModalRoleDetails;