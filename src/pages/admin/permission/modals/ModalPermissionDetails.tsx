import { Descriptions, Drawer, Spin, Tag } from "antd";

import type { IPermission } from "../../../../types/permission";
import { splitPermission } from "../../../../utils/constants/permission.utils";
import { PERMISSION_ACTION_COLOR } from "../../../../utils/constants/permission-ui.constants";
import { formatInstant } from "../../../../utils/format/localdatetime";

interface IProps {
    openModalPermissionDetails: boolean;
    setOpenModalPermissionDetails: (v: boolean) => void;
    permission: IPermission | null;
    isLoading: boolean;
}

const ModalPermissionDetails = (props: IProps) => {
    const {
        openModalPermissionDetails,
        setOpenModalPermissionDetails,
        permission,
        isLoading,
    } = props;

    const permissionMeta = permission
        ? splitPermission(permission.name)
        : null;

    return (
        <Drawer
            title="Chi tiết quyền (Permission)"
            placement="right"
            closable={false}
            onClose={() => setOpenModalPermissionDetails(false)}
            open={openModalPermissionDetails}
        >
            <Spin spinning={isLoading}>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="ID">
                        {permission?.id ?? "N/A"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Permission key">
                        {permission?.name ? (
                            <Tag>{permission.name}</Tag>
                        ) : (
                            "N/A"
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Resource">
                        {permissionMeta ? (
                            <Tag color="geekblue">
                                {permissionMeta.resource}
                            </Tag>
                        ) : (
                            "N/A"
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Action">
                        {permissionMeta ? (
                            permissionMeta.action === "ALL" ? (
                                <Tag color="volcano">ALL</Tag>
                            ) : (
                                <Tag
                                    color={
                                        PERMISSION_ACTION_COLOR[
                                        permissionMeta.action
                                        ]
                                    }
                                >
                                    {permissionMeta.action}
                                </Tag>
                            )
                        ) : (
                            "N/A"
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Mô tả">
                        {permission?.description || "-"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {permission?.createdBy ? permission.createdBy : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                        {formatInstant(permission?.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {permission?.updatedBy ? permission.updatedBy : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">
                        {formatInstant(permission?.updatedAt)}
                    </Descriptions.Item>

                </Descriptions>
            </Spin>
        </Drawer>
    );
};

export default ModalPermissionDetails;
