import { Table, Tag, Space, Card, Popconfirm, type PopconfirmProps, Empty, Button, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RBButton from "react-bootstrap/Button";
import { IoIosAddCircle } from "react-icons/io";
import { CiEdit } from "react-icons/ci";
import { FaArrowsToEye } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";
import { FaDownload } from "react-icons/fa";
import { SettingOutlined } from "@ant-design/icons";

import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import {
    fetchRooms,
    selectRoomLastListQuery,
    selectRoomLoading,
    selectRoomMeta,
    selectRooms,
} from "../../../../redux/features/v2/roomSlice";

import type { IRoom } from "../../../../types/v2/room";
import { ROOM_STATUS_META } from "../../../../utils/constants/room.constants";
import ModalAddRoom from "./modals/ModalAddRoom";
import ModalViewRoom from "./modals/ModalViewRoom";
import { deleteRoom, getRoomById } from "../../../../config/Api";
import { toast } from "react-toastify";
import ModalUpdateRoom from "./modals/ModalUpdateRoom";
import ModalConfigScheduleV2 from "./modals/ModalConfigScheduleV2";
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
import { DEFAULT_ADMIN_LIST_QUERY } from "../../../../utils/pagination/defaultListQuery";

const ROOM_SEARCH_FIELDS = [
    "roomName",
    "building",
    "contactPerson",
    "contactPhone",
    "description",
    "notes",
];

const AdminRoomPage = () => {
    const dispatch = useAppDispatch();

    const listRooms = useAppSelector(selectRooms);
    const meta = useAppSelector(selectRoomMeta);
    const loading = useAppSelector(selectRoomLoading);
    const listQuery = useAppSelector(selectRoomLastListQuery);

    const [openModalAddRoom, setOpenModalAddRoom] = useState(false);
    const [openModalRoomDetails, setOpenModalRoomDetails] = useState(false);
    const [openModalUpdateRoom, setOpenModalUpdateRoom] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [room, setRoom] = useState<IRoom | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [roomEdit, setRoomEdit] = useState<IRoom | null>(null);
    const [openScheduleConfig, setOpenScheduleConfig] = useState(false);
    const [roomForSchedule, setRoomForSchedule] = useState<IRoom | null>(null);
    const canViewRooms = usePermission("ROOM_VIEW_LIST");

    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const handleEdit = (data: IRoom) => {
        setRoomEdit(data);
        setOpenModalUpdateRoom(true);
    };

    const handleOpenScheduleConfig = (data: IRoom) => {
        setRoomForSchedule(data);
        setOpenScheduleConfig(true);
    };

    const handleView = async (id: number) => {
        setRoom(null);
        setIsLoading(true);
        setOpenModalRoomDetails(true);

        try {
            const res = await getRoomById(id);
            if (res.data.statusCode === 200) {
                setRoom(res.data.data ?? null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <>
                    <div>Có lỗi khi tải chi tiết phòng</div>
                    <div>{m}</div>
                </>
            );
        } finally {
            setIsLoading(false);
        }
    };

    const filterStr = useMemo(
        () => orFieldsInsensitiveLike(ROOM_SEARCH_FIELDS, debouncedSearch),
        [debouncedSearch]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(
                fetchRooms(
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

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteRoom(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchRooms(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                toast.success("Xóa thành công");
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xóa phòng</div>
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

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        if (!canViewRooms) return;
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canViewRooms, debouncedSearch, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<IRoom>["onChange"] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const columns: ColumnsType<IRoom> = [
        {
            title: "STT",
            key: "stt",
            render: (_: unknown, __: IRoom, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: true,
        },
        {
            title: "Tên phòng",
            dataIndex: "roomName",
            key: "roomName",
            sorter: true,
        },
        {
            title: "Nhà",
            dataIndex: "building",
            key: "building",
            sorter: true,
        },
        {
            title: "Tầng",
            dataIndex: "floor",
            key: "floor",
            sorter: true,
        },
        {
            title: "Số Phòng",
            dataIndex: "roomNumber",
            key: "roomNumber",
            sorter: true,
        },
        {
            title: "Sức Chứa",
            dataIndex: "capacity",
            key: "capacity",
            sorter: true,
        },
        {
            title: "Trạng Thái",
            dataIndex: "status",
            key: "status",
            sorter: true,
            render: (status: IRoom["status"]) => (
                <Tag color={ROOM_STATUS_META[status].color}>{ROOM_STATUS_META[status].label}</Tag>
            ),
        },
        {
            title: "Hành động",
            key: "actions",
            render: (_: unknown, record: IRoom) => (
                <Space align="center" style={{ justifyContent: "center", width: "100%" }}>
                    <PermissionWrapper required={"ROOM_VIEW_DETAIL"}>
                        <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required={"ROOM_UPDATE"}>
                        <RBButton variant="outline-warning" size="sm" onClick={() => handleEdit(record)}>
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required={"ROOM_UPDATE"}>
                        <RBButton
                            variant="outline-secondary"
                            size="sm"
                            title="Cấu hình Lịch"
                            onClick={() => handleOpenScheduleConfig(record)}
                        >
                            <SettingOutlined />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required={"ROOM_DELETE"}>
                        <Popconfirm
                            title="Xóa phòng"
                            description="Bạn có chắc chắn muốn xóa phòng này không?"
                            onConfirm={() => handleDelete(record.id)}
                            onCancel={cancel}
                            okText="Có"
                            cancelText="Không"
                            placement="topLeft"
                            okButtonProps={{
                                loading: deletingId === record.id,
                            }}
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
                    title="Quản lý phòng tin học"
                    extra={
                        <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Tên phòng, tòa nhà, liên hệ…"
                                style={{ width: 260 }}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <PermissionWrapper required={"ROOM_CREATE"}>
                                <RBButton
                                    variant="outline-primary"
                                    size="sm"
                                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                                    onClick={() => setOpenModalAddRoom(true)}
                                >
                                    <IoIosAddCircle />
                                    Thêm mới
                                </RBButton>
                            </PermissionWrapper>

                            <Button
                                icon={<FaDownload />}
                                onClick={() => exportTableToExcel(columns, listRooms, "phong-tin-hoc")}
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
                    <PermissionWrapper
                        required={"ROOM_VIEW_LIST"}
                        fallback={<Empty description="Bạn không có quyền xem danh sách phòng" />}
                    >
                        <Table<IRoom>
                            columns={columns}
                            dataSource={listRooms}
                            rowKey="id"
                            loading={loading}
                            size="small"
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

                <ModalAddRoom openModalAddRoom={openModalAddRoom} setOpenModalAddRoom={setOpenModalAddRoom} />

                <ModalViewRoom
                    openModalRoomDetails={openModalRoomDetails}
                    setOpenModalRoomDetails={setOpenModalRoomDetails}
                    room={room}
                    isLoading={isLoading}
                />

                <ModalUpdateRoom
                    openModalUpdateRoom={openModalUpdateRoom}
                    setOpenModalUpdateRoom={setOpenModalUpdateRoom}
                    roomEdit={roomEdit}
                />

                <ModalConfigScheduleV2
                    open={openScheduleConfig}
                    onClose={() => {
                        setOpenScheduleConfig(false);
                        setRoomForSchedule(null);
                    }}
                    room={roomForSchedule}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminRoomPage;
