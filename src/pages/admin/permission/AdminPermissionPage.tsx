import { Table, Tag, Space, Card, type PopconfirmProps, message, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
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
import ModalAddPermission from "./modals/ModatlAddPermission";
import ModalUpdatePermission from "./modals/ModalUpdatePermission";
import { FaArrowsToEye } from "react-icons/fa6";
import { CiEdit } from "react-icons/ci";
import ModalPermissionDetails from "./modals/ModalPermissionDetails";
import { deletePermission, getPermissionById } from "../../../config/Api";
import { toast } from "react-toastify";
import { MdDelete } from "react-icons/md";

const AdminPermissionPage = () => {
    const dispatch = useAppDispatch();

    const permissions = useAppSelector(selectPermissions);
    const loading = useAppSelector(selectPermissionLoading);
    const meta = useAppSelector(selectPermissionMeta);
    const [openModalAddPermission, setOpenModalAddPermission] = useState<boolean>(false);
    const [openModalUpdatePermission, setOpenModalUpdatePermission] = useState<boolean>(false);
    const [permissionEdit, setPermissionEdit] = useState<IPermission | null>(null);
    const [openModalPermissionDetails, setOpenModalPermissionDetails] = useState(false);
    const [permission, setPermission] = useState<IPermission | null>(null);
    const [isLoadingPermissionDetails, setIsLoadingPermissionDetails] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);


    const [messageApi, holder] = message.useMessage();

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deletePermission(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchPermissions(""));
                messageApi.success('Xóa thành công');
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xóa user</div>
                    <div>{m}</div>
                </div>
            )
        } finally {
            setDeletingId(null);
        }
    };

    const cancel: PopconfirmProps['onCancel'] = () => {
        messageApi.error('Đã bỏ chọn');
    };

    const handleView = async (id: number) => {
        setPermission(null);
        setIsLoadingPermissionDetails(true);
        setOpenModalPermissionDetails(true);

        try {
            const res = await getPermissionById(id);
            if (res.data.statusCode === 200) {
                setPermission(res.data.data ?? null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <>
                    <div>Có lỗi khi tải chi tiết quyền</div>
                    <div>{m}</div>
                </>
            );
        } finally {
            setIsLoadingPermissionDetails(false);
        }
    };

    const handleEdit = (data: IPermission) => {
        setPermissionEdit(data);
        setOpenModalUpdatePermission(true);
    }

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
            render: (_: any, record: IPermission) => (
                <Space>
                    <RBButton variant="outline-info" size="sm"
                    onClick={() => handleView(record.id)}
                    >
                        <FaArrowsToEye />
                    </RBButton>

                    <RBButton variant="outline-warning" size="sm"
                        onClick={() => handleEdit(record)}
                    >
                        <CiEdit />
                    </RBButton>

                    {holder}

                    <Popconfirm
                        title="Xóa quyền"
                        description="Bạn có chắc chắn muốn xóa quyền này không?"
                        onConfirm={() => handleDelete(record.id)}
                        onCancel={cancel}
                        okText="Có"
                        cancelText="Không"
                        okButtonProps={{
                            loading: deletingId === record.id
                        }}
                    >
                        <RBButton size="sm" variant="outline-danger"
                            disabled={deletingId === record.id}
                        >
                            <MdDelete />
                        </RBButton>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card
                size="small"
                title="Quản lý quyền (Permissions)"
                extra={
                    <RBButton
                        variant="outline-primary"
                        size="sm"
                        style={{ display: "flex", alignItems: "center", gap: 3 }}
                        onClick={() => setOpenModalAddPermission(true)}
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

            <ModalAddPermission
                openModalAddPermission={openModalAddPermission}
                setOpenModalAddPermission={setOpenModalAddPermission}
            />

            <ModalUpdatePermission
                openModalUpdatePermission={openModalUpdatePermission}
                setOpenModalUpdatePermission={setOpenModalUpdatePermission}
                permissionEdit={permissionEdit}
            />

            <ModalPermissionDetails
                openModalPermissionDetails={openModalPermissionDetails}
                setOpenModalPermissionDetails={setOpenModalPermissionDetails}
                permission={permission}
                isLoading={isLoadingPermissionDetails}
            />
        </>
    );
};

export default AdminPermissionPage;
