import { Table, Tag, Space, Card, type PopconfirmProps, Popconfirm, Tooltip, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import RBButton from "react-bootstrap/Button";
import { IoIosAddCircle } from "react-icons/io";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { FaArrowsToEye } from "react-icons/fa6";
import { CiEdit } from "react-icons/ci";
import { MdDelete, MdSecurity } from "react-icons/md";
import { fetchRoles, selectRoleLoading, selectRoleMeta, selectRoles } from "../../../redux/features/roleSlice";
import type { IRole } from "../../../types/role";
import ModalAddRole from "./modals/ModalAddRole";
import ModalRoleDetails from "./modals/ModalRoleDetails";
import { toast } from "react-toastify";
import { deleteRole, getRoleById } from "../../../config/Api";
import ModalUpdateRole from "./modals/ModalUpdateRole";
import { fetchPermissions } from "../../../redux/features/permissionSlice";
import AdminModalAssignPermission from "./modals/AdminModalAssignPermisison";
import PermissionWrapper from "../../../components/wrapper/PermissionWrapper";
import { usePermission } from "../../../hooks/common/usePermission";
import AdminWrapper from "../../../components/wrapper/AdminWrapper";

const AdminRolePage = () => {
    const dispatch = useAppDispatch();

    const roles = useAppSelector(selectRoles);
    const loading = useAppSelector(selectRoleLoading);
    const meta = useAppSelector(selectRoleMeta);
    const [openModalAddRole, setOpenModalAddRole] = useState<boolean>(false);
    const [openModalUpdateRole, setOpenModalUpdateRole] = useState<boolean>(false);
    const [roleEdit, setRoleEdit] = useState<IRole | null>(null);
    const [openModalRoleDetails, setOpenModalRoleDetails] = useState(false);
    const [role, setRole] = useState<IRole | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [openModalAssignPermisison, setOpenModalAssignPermisison] = useState<boolean>(false);
    const [roleAssignPermission, setRoleAssignPermission] = useState<IRole | null>(null);

    const canViewRoles = usePermission("ROLE_VIEW_LIST");

    // assign permission
    const handleAssignPermisison = async (data: IRole) => {
        setRoleAssignPermission(data);
        setOpenModalAssignPermisison(true);
        await dispatch(fetchPermissions("")).unwrap();
    }

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteRole(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchRoles(""));
                toast.success('Xóa thành công');
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra!</div>
                    <div>{m}</div>
                </div>
            )
        } finally {
            setDeletingId(null);
        }
    };

    const cancel: PopconfirmProps['onCancel'] = () => {
        toast.error('Đã bỏ chọn');
    };

    const handleView = async (id: number) => {
        setRole(null);
        setIsLoading(true);
        setOpenModalRoleDetails(true);

        try {
            const res = await getRoleById(id);
            if (res.data.statusCode === 200) {
                setRole(res.data.data ?? null);
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
            setIsLoading(false);
        }
    };

    const handleEdit = (data: IRole) => {
        setRoleEdit(data);
        setOpenModalUpdateRole(true);
    }

    useEffect(() => {
        if (!canViewRoles) return;

        dispatch(fetchRoles(""));
    }, [canViewRoles, dispatch]);

    const columns: ColumnsType<IRole> = [
        {
            title: "STT",
            render: (_: any, __: IRole, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: "ID",
            dataIndex: "id",
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: "Tên vai trò",
            dataIndex: "name",
            render: (name: string) => {
                return <Tag
                    color={name === "ADMIN" ? "warning" : "blue"}
                >
                    {name}
                </Tag>
            },
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            render: (text) => text || "-",
        },
        {
            title: "Hành động",
            render: (_: any, record: IRole) => (
                <Space align="center" style={{ justifyContent: "center", width: "100%" }}>
                    <PermissionWrapper required={"ROLE_VIEW_DETAIL"}>
                        <RBButton variant="outline-info" size="sm"
                            onClick={() => handleView(record.id)}
                        >
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required={"ROLE_UPDATE"}>
                        <RBButton variant="outline-warning" size="sm"
                            onClick={() => handleEdit(record)}
                        >
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required={"ROLE_DELETE"}>
                        <Popconfirm
                            title="Xóa quyền"
                            description="Bạn có chắc chắn muốn xóa vai trò này không?"
                            onConfirm={() => handleDelete(record.id)}
                            onCancel={cancel}
                            okText="Có"
                            cancelText="Không"
                            placement="topLeft"
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
                    </PermissionWrapper>

                    <PermissionWrapper required={"ROLE_ASSIGN_PERMISSION"}>
                        <Tooltip placement="left" title="Gắn quyền">
                            <RBButton size="sm" variant="outline-secondary"
                                onClick={() => handleAssignPermisison(record)}
                            >
                                <MdSecurity />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>
                </Space>
            ),
        },
    ];

    return (
        <>
            <AdminWrapper>
                <Card
                    size="small"
                    title="Quản lý vai trò (Roles)"
                    extra={
                        <PermissionWrapper required={"ROLE_CREATE"}>
                            <RBButton
                                variant="outline-primary"
                                size="sm"
                                style={{ display: "flex", alignItems: "center", gap: 3 }}
                                onClick={() => setOpenModalAddRole(true)}
                            // disabled
                            >
                                <IoIosAddCircle />
                                Thêm mới
                            </RBButton>
                        </PermissionWrapper>
                    }
                    hoverable={false}
                    style={{
                        width: "100%",
                        overflowX: "auto",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                >
                    <PermissionWrapper required={"ROLE_VIEW_LIST"}
                        fallback={<Empty description="Bạn không có quyền xem danh sách vai trò" />}
                    >
                        <Table<IRole>
                            columns={columns}
                            dataSource={roles}
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
                                        fetchRoles(
                                            `page=${page}&pageSize=${pageSize}`
                                        )
                                    );
                                },
                            }}
                        />
                    </PermissionWrapper>
                </Card>

                <ModalAddRole
                    openModalAddRole={openModalAddRole}
                    setOpenModalAddRole={setOpenModalAddRole}
                />

                <ModalRoleDetails
                    openModalRoleDetails={openModalRoleDetails}
                    setOpenModalRoleDetails={setOpenModalRoleDetails}
                    role={role}
                    isLoading={isLoading}
                />

                <ModalUpdateRole
                    openModalUpdateRole={openModalUpdateRole}
                    setOpenModalUpdateRole={setOpenModalUpdateRole}
                    roleEdit={roleEdit}
                />

                {/* assign permission */}

                <AdminModalAssignPermission
                    openModalAssignPermisison={openModalAssignPermisison}
                    setOpenModalAssignPermisison={setOpenModalAssignPermisison}
                    roleAssignPermission={roleAssignPermission}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminRolePage;
