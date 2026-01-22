import { Table, Tag, Space, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect } from "react";
import RBButton from "react-bootstrap/Button";
import { IoIosAddCircle } from "react-icons/io";

import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
    fetchPermissions,
    selectPermissions,
    selectPermissionLoading,
    selectPermissionMeta,
} from "../../../redux/features/permissionSlice";

import type { IPermission } from "../../../types/permission";
import { splitPermission } from "../../../utils/constants/permission.utils";
import { PERMISSION_ACTION_COLOR } from "../../../utils/constants/permission-ui.constants";

const AdminPermissionPage = () => {
    const dispatch = useAppDispatch();

    const permissions = useAppSelector(selectPermissions);
    const loading = useAppSelector(selectPermissionLoading);
    const meta = useAppSelector(selectPermissionMeta);

    useEffect(() => {
        dispatch(fetchPermissions("page=1&pageSize=7"));
    }, [dispatch]);

    const columns: ColumnsType<IPermission> = [
        {
            title: "STT",
            render: (_: any, __: IPermission, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: "ID",
            dataIndex: "id",
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: "Permission",
            dataIndex: "name",
            render: (name: string) => <Tag>{name}</Tag>,
        },
        {
            title: "Resource",
            render: (_, record) => {
                const { resource } = splitPermission(record.name);
                return <Tag color="geekblue">{resource}</Tag>;
            },
        },
        {
            title: "Action",
            render: (_, record) => {
                const { action } = splitPermission(record.name);

                if (action === "ALL") {
                    return <Tag color="volcano">ALL</Tag>;
                }

                return (
                    <Tag color={PERMISSION_ACTION_COLOR[action]}>
                        {action}
                    </Tag>
                );
            },
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            render: (text) => text || "-",
        },
        {
            title: "Hành động",
            render: () => (
                <Space>
                    <span style={{ fontStyle: "italic", color: "#999" }}>
                        (Chưa xử lý)
                    </span>
                </Space>
            ),
        },
    ];

    return (
        <Card
            size="small"
            title="Quản lý quyền (Permissions)"
            extra={
                <RBButton
                    variant="outline-primary"
                    size="sm"
                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                // disabled
                >
                    <IoIosAddCircle />
                    Thêm mới
                </RBButton>
            }
            hoverable={false}
            style={{
                width: "100%",
                overflowX: "auto",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
        >
            <Table<IPermission>
                columns={columns}
                dataSource={permissions}
                rowKey="id"
                loading={loading}
                size="small"
                bordered
                scroll={{ x: "max-content" }}
                pagination={{
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                        dispatch(
                            fetchPermissions(
                                `page=${page}&pageSize=${pageSize}`
                            )
                        );
                    },
                }}
            />
        </Card>
    );
};

export default AdminPermissionPage;
