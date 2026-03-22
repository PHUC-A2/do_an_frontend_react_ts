import { Table, Tag, Space, Card, type PopconfirmProps, Popconfirm, Empty, Button, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import ModalAddPermission from "./modals/ModalAddPermission";
import ModalUpdatePermission from "./modals/ModalUpdatePermission";
import { FaArrowsToEye } from "react-icons/fa6";
import { CiEdit } from "react-icons/ci";
import ModalPermissionDetails from "./modals/ModalPermissionDetails";
import { deletePermission, getPermissionById } from "../../../config/Api";
import { toast } from "react-toastify";
import { MdDelete } from "react-icons/md";
import PermissionWrapper from "../../../components/wrapper/PermissionWrapper";
import { usePermission } from "../../../hooks/common/usePermission";
import AdminWrapper from "../../../components/wrapper/AdminWrapper";
import { FaDownload } from "react-icons/fa";
import { exportTableToExcel } from "../../../utils/export/exportExcelFromTable";
import {
    buildSpringListQuery,
    type SpringSortItem,
} from "../../../utils/pagination/buildSpringPageQuery";
import { orFieldsInsensitiveLike } from "../../../utils/pagination/springFilterText";
import { tableSorterToSortItems } from "../../../utils/pagination/tableSorterToSpringSort";

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
    const canViewPermissions = usePermission("PERMISSION_VIEW_LIST");

    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const filterStr = useMemo(
        () => orFieldsInsensitiveLike(["name", "description"], debouncedSearch),
        [debouncedSearch]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(
                fetchPermissions(
                    buildSpringListQuery({ page, pageSize, filter: filterStr, sort })
                )
            );
        },
        [dispatch, filterStr]
    );

    useEffect(() => {
        if (!canViewPermissions) return;
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canViewPermissions, debouncedSearch, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<IPermission>["onChange"] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deletePermission(id);
            if (res.data.statusCode === 200) {
                await dispatch(
                    fetchPermissions(
                        buildSpringListQuery({
                            page: meta.page,
                            pageSize: meta.pageSize,
                            filter: filterStr,
                            sort: sortItems,
                        })
                    )
                );
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

    const columns: ColumnsType<IPermission> = [
        {
            title: "STT",
            render: (_: any, __: IPermission, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: true,
        },
        {
            title: "Quyền",
            dataIndex: "name",
            key: "name",
            sorter: true,
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
            key: "description",
            sorter: true,
            render: (text) => text || "-",
        },
        {
            title: "Hành động",
            render: (_: any, record: IPermission) => (
                <Space align="center" style={{ justifyContent: "center", width: "100%" }}>

                    <PermissionWrapper required={"PERMISSION_VIEW_DETAIL"}>
                        <RBButton variant="outline-info" size="sm"
                            onClick={() => handleView(record.id)}
                        >
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required={"PERMISSION_UPDATE"}>
                        <RBButton variant="outline-warning" size="sm"
                            onClick={() => handleEdit(record)}
                        >
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required={"PERMISSION_DELETE"}>
                        <Popconfirm
                            title="Xóa quyền"
                            description="Bạn có chắc chắn muốn xóa quyền này không?"
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
                </Space>
            ),
        },
    ];

    return (
        <>
            <AdminWrapper>
                <Card
                    size="small"
                    title="Quản lý quyền (Permissions)"
                    extra={
                      <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Tìm tên / mô tả"
                                style={{ width: 220 }}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <PermissionWrapper required={"PERMISSION_CREATE"}>
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
                            </PermissionWrapper>

                            <Button
                                icon={<FaDownload />}
                                onClick={() =>
                                    exportTableToExcel(columns, permissions, 'permissions')
                                }
                            >
                                Xuất Excel
                            </Button>
                      </Space>
                    }
                    hoverable={false}
                    style={{
                        width: "100%",
                        overflowX: "auto",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                >
                    <PermissionWrapper required={"PERMISSION_VIEW_LIST"}
                        fallback={<Empty description="Bạn không có quyền xem danh sách quyền" />}
                    >
                        <Table<IPermission>
                            columns={columns}
                            dataSource={permissions}
                            rowKey="id"
                            loading={loading}
                            size="small"
                            bordered
                            scroll={{ x: "max-content" }}
                            onChange={handleTableChange}
                            pagination={{
                                current: meta.page,
                                pageSize: meta.pageSize,
                                total: meta.total,
                                showSizeChanger: true,
                                showTotal: (t) => `Tổng ${t} bản ghi`,
                            }}
                        />
                    </PermissionWrapper>
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
            </AdminWrapper>
        </>
    );
};

export default AdminPermissionPage;
