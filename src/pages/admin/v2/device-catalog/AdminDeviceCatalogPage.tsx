import { Table, Tag, Space, Card, Popconfirm, type PopconfirmProps, Empty, Button, Input, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RBButton from "react-bootstrap/Button";
import { IoIosAddCircle } from "react-icons/io";
import { CiEdit } from "react-icons/ci";
import { FaArrowsToEye } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";
import { FaDownload } from "react-icons/fa";

import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import {
    fetchDeviceCatalogs,
    selectDeviceCatalogLoading,
    selectDeviceCatalogMeta,
    selectDeviceCatalogs,
} from "../../../../redux/features/v2/deviceCatalogSlice";
import type { IDeviceCatalog } from "../../../../types/v2/deviceCatalog";
import { deleteDeviceCatalog, getDeviceCatalogById } from "../../../../config/Api";
import { toast } from "react-toastify";
import { usePermission } from "../../../../hooks/common/usePermission";
import PermissionWrapper from "../../../../components/wrapper/PermissionWrapper";
import AdminWrapper from "../../../../components/wrapper/AdminWrapper";
import { exportTableToExcel } from "../../../../utils/export/exportExcelFromTable";
import {
    buildSpringListQuery,
    type SpringSortItem,
} from "../../../../utils/pagination/buildSpringPageQuery";
import { orFieldsInsensitiveLike } from "../../../../utils/pagination/springFilterText";
import { tableSorterToSortItems } from "../../../../utils/pagination/tableSorterToSpringSort";
import {
    DEVICE_CATALOG_MOBILITY_LABEL,
    DEVICE_CATALOG_STATUS_META,
    DEVICE_CATALOG_TYPE_LABEL,
    DEVICE_TYPE_SELECT_OPTIONS,
    FILTER_ALL_VALUE,
    MOBILITY_TYPE_SELECT_OPTIONS,
    STATUS_SELECT_OPTIONS,
} from "../../../../utils/constants/deviceCatalog.constants";
import ModalAddDeviceCatalog from "./modals/ModalAddDeviceCatalog";
import ModalUpdateDeviceCatalog from "./modals/ModalUpdateDeviceCatalog";
import ModalViewDeviceCatalog from "./modals/ModalViewDeviceCatalog";

const buildDeviceCatalogListFilter = (
    keyword: string,
    deviceType: string,
    mobilityType: string,
    status: string
): string | undefined => {
    const parts: string[] = [];
    const text = orFieldsInsensitiveLike(["deviceName", "manufacturer", "model", "description"], keyword);
    if (text) {
        parts.push(text);
    }
    if (deviceType && deviceType !== FILTER_ALL_VALUE) {
        parts.push(`deviceType : '${deviceType}'`);
    }
    if (mobilityType && mobilityType !== FILTER_ALL_VALUE) {
        parts.push(`mobilityType : '${mobilityType}'`);
    }
    if (status && status !== FILTER_ALL_VALUE) {
        parts.push(`status : '${status}'`);
    }
    if (parts.length === 0) {
        return undefined;
    }
    if (parts.length === 1) {
        return parts[0];
    }
    return `(${parts.join(" and ")})`;
};

const filterSelectOptions = (opts: { value: string; label: string }[]) => [
    { value: FILTER_ALL_VALUE, label: "Tất cả" },
    ...opts,
];

const AdminDeviceCatalogPage = () => {
    const dispatch = useAppDispatch();
    const list = useAppSelector(selectDeviceCatalogs);
    const meta = useAppSelector(selectDeviceCatalogMeta);
    const loading = useAppSelector(selectDeviceCatalogLoading);

    const [openModalAdd, setOpenModalAdd] = useState(false);
    const [openModalUpdate, setOpenModalUpdate] = useState(false);
    const [openModalView, setOpenModalView] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [catalogView, setCatalogView] = useState<IDeviceCatalog | null>(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [catalogEdit, setCatalogEdit] = useState<IDeviceCatalog | null>(null);

    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterDeviceType, setFilterDeviceType] = useState(FILTER_ALL_VALUE);
    const [filterMobility, setFilterMobility] = useState(FILTER_ALL_VALUE);
    const [filterStatus, setFilterStatus] = useState(FILTER_ALL_VALUE);
    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const canViewList = usePermission("DEVICE_CATALOG_VIEW_LIST");

    const filterStr = useMemo(
        () => buildDeviceCatalogListFilter(debouncedSearch, filterDeviceType, filterMobility, filterStatus),
        [debouncedSearch, filterDeviceType, filterMobility, filterStatus]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(
                fetchDeviceCatalogs(
                    buildSpringListQuery({
                        page,
                        pageSize,
                        filter: filterStr,
                        sort,
                    })
                )
            );
        },
        [dispatch, filterStr]
    );

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        if (!canViewList) {
            return;
        }
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canViewList, debouncedSearch, filterDeviceType, filterMobility, filterStatus, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<IDeviceCatalog>["onChange"] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const handleEdit = (row: IDeviceCatalog) => {
        setCatalogEdit(row);
        setOpenModalUpdate(true);
    };

    const handleView = async (id: number) => {
        setCatalogView(null);
        setViewLoading(true);
        setOpenModalView(true);
        try {
            const res = await getDeviceCatalogById(id);
            if (Number(res.data.statusCode) === 200) {
                setCatalogView(res.data.data ?? null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi khi tải chi tiết danh mục</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setViewLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteDeviceCatalog(id);
            if (Number(res.data.statusCode) === 200) {
                await dispatch(
                    fetchDeviceCatalogs(
                        buildSpringListQuery({
                            page: meta.page,
                            pageSize: meta.pageSize,
                            filter: filterStr,
                            sort: sortItems,
                        })
                    )
                );
                toast.success("Xóa thành công");
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xóa danh mục</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setDeletingId(null);
        }
    };

    const cancel: PopconfirmProps["onCancel"] = () => {
        toast.error("Đã bỏ chọn");
    };

    const columns: ColumnsType<IDeviceCatalog> = [
        {
            title: "STT",
            key: "stt",
            width: 64,
            render: (_: unknown, __: IDeviceCatalog, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 72,
            sorter: true,
        },
        {
            title: "Tên",
            dataIndex: "deviceName",
            key: "deviceName",
            sorter: true,
            ellipsis: true,
        },
        {
            title: "Loại",
            dataIndex: "deviceType",
            key: "deviceType",
            width: 120,
            sorter: true,
            render: (t: IDeviceCatalog["deviceType"]) => DEVICE_CATALOG_TYPE_LABEL[t],
        },
        {
            title: "Cố định / Lưu động",
            dataIndex: "mobilityType",
            key: "mobilityType",
            width: 140,
            sorter: true,
            render: (t: IDeviceCatalog["mobilityType"]) => DEVICE_CATALOG_MOBILITY_LABEL[t],
        },
        {
            title: "Hãng",
            dataIndex: "manufacturer",
            key: "manufacturer",
            ellipsis: true,
            render: (t?: string | null) => t || "—",
        },
        {
            title: "Model",
            dataIndex: "model",
            key: "model",
            ellipsis: true,
            render: (t?: string | null) => t || "—",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 120,
            sorter: true,
            render: (s: IDeviceCatalog["status"]) => (
                <Tag color={DEVICE_CATALOG_STATUS_META[s].color}>{DEVICE_CATALOG_STATUS_META[s].label}</Tag>
            ),
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 168,
            fixed: "right",
            render: (_: unknown, record: IDeviceCatalog) => (
                <Space align="center" style={{ justifyContent: "center", width: "100%" }}>
                    <PermissionWrapper required={"DEVICE_CATALOG_VIEW_DETAIL"}>
                        <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>
                    <PermissionWrapper required={"DEVICE_CATALOG_UPDATE"}>
                        <RBButton variant="outline-warning" size="sm" onClick={() => handleEdit(record)}>
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>
                    <PermissionWrapper required={"DEVICE_CATALOG_DELETE"}>
                        <Popconfirm
                            title="Xóa danh mục thiết bị"
                            description="Bạn có chắc chắn muốn xóa danh mục này không?"
                            onConfirm={() => handleDelete(record.id)}
                            onCancel={cancel}
                            okText="Có"
                            cancelText="Không"
                            okButtonProps={{ loading: deletingId === record.id }}
                        >
                            <RBButton size="sm" variant="outline-danger" disabled={deletingId === record.id}>
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
                    title="Quản lý danh mục thiết bị"
                    extra={
                        <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Tìm tên, hãng, model…"
                                style={{ width: 240 }}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <Select
                                style={{ width: 160 }}
                                placeholder="Loại thiết bị"
                                value={filterDeviceType}
                                onChange={(v) => setFilterDeviceType(v)}
                                options={filterSelectOptions(DEVICE_TYPE_SELECT_OPTIONS as { value: string; label: string }[])}
                            />
                            <Select
                                style={{ width: 160 }}
                                placeholder="Cố định / Lưu động"
                                value={filterMobility}
                                onChange={(v) => setFilterMobility(v)}
                                options={filterSelectOptions(MOBILITY_TYPE_SELECT_OPTIONS as { value: string; label: string }[])}
                            />
                            <Select
                                style={{ width: 150 }}
                                placeholder="Trạng thái"
                                value={filterStatus}
                                onChange={(v) => setFilterStatus(v)}
                                options={filterSelectOptions(STATUS_SELECT_OPTIONS as { value: string; label: string }[])}
                            />
                            <PermissionWrapper required={"DEVICE_CATALOG_CREATE"}>
                                <RBButton
                                    variant="outline-primary"
                                    size="sm"
                                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                                    onClick={() => setOpenModalAdd(true)}
                                >
                                    <IoIosAddCircle />
                                    Thêm mới
                                </RBButton>
                            </PermissionWrapper>
                            <Button icon={<FaDownload />} onClick={() => exportTableToExcel(columns, list, "danh-muc-thiet-bi")}>
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
                    <PermissionWrapper
                        required={"DEVICE_CATALOG_VIEW_LIST"}
                        fallback={<Empty description="Bạn không có quyền xem danh mục thiết bị" />}
                    >
                        <Table<IDeviceCatalog>
                            columns={columns}
                            dataSource={list}
                            rowKey="id"
                            loading={loading}
                            size="small"
                            locale={{ emptyText: "Không có dữ liệu danh mục thiết bị" }}
                            onChange={handleTableChange}
                            pagination={{
                                current: meta.page,
                                pageSize: meta.pageSize,
                                total: meta.total,
                                showSizeChanger: true,
                                showTotal: (t) => `Tổng ${t} bản ghi`,
                            }}
                            bordered
                            scroll={{ x: "max-content" }}
                        />
                    </PermissionWrapper>
                </Card>

                <ModalAddDeviceCatalog openModalAdd={openModalAdd} setOpenModalAdd={setOpenModalAdd} />

                <ModalViewDeviceCatalog
                    openModalDeviceCatalogDetails={openModalView}
                    setOpenModalDeviceCatalogDetails={setOpenModalView}
                    catalog={catalogView}
                    isLoading={viewLoading}
                />

                <ModalUpdateDeviceCatalog
                    openModalUpdate={openModalUpdate}
                    setOpenModalUpdate={setOpenModalUpdate}
                    catalogEdit={catalogEdit}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminDeviceCatalogPage;
