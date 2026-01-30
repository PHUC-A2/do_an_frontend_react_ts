import { Table, Tag, Space, Card, type PopconfirmProps, message, Popconfirm, Tooltip } from "antd";
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

    const [messageApi, holder] = message.useMessage();


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
                messageApi.success('Xóa thành công');
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
        messageApi.error('Đã bỏ chọn');
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
        dispatch(fetchRoles("page=1&pageSize=7"));
    }, [dispatch]);

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
                        description="Bạn có chắc chắn muốn xóa vai trò này không?"
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

                    <Tooltip placement="left" title="Gắn quyền">
                        <RBButton size="sm" variant="outline-secondary"
                            onClick={() => handleAssignPermisison(record)}
                        >
                            <MdSecurity />
                        </RBButton>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card
                size="small"
                title="Quản lý vai trò (Roles)"
                extra={
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
                }
                hoverable={false}
                style={{
                    width: "100%",
                    overflowX: "auto",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
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
        </>
    );
};

export default AdminRolePage;
