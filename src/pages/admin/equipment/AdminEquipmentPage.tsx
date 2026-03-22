import { Table, Tag, Space, Card, Popconfirm, type PopconfirmProps, Empty, Button, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableProps } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';
import { FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
    fetchEquipments,
    selectEquipmentLoading,
    selectEquipmentMeta,
    selectEquipments,
} from '../../../redux/features/equipmentSlice';
import type { IEquipment } from '../../../types/equipment';
import { EQUIPMENT_STATUS_META } from '../../../utils/constants/equipment.constants';
import { deleteEquipment, getEquipmentById } from '../../../config/Api';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import {
    buildSpringListQuery,
    type SpringSortItem,
} from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';
import { tableSorterToSortItems } from '../../../utils/pagination/tableSorterToSpringSort';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { usePermission } from '../../../hooks/common/usePermission';

import ModalAddEquipment from './modals/ModalAddEquipment';
import ModalUpdateEquipment from './modals/ModalUpdateEquipment';
import ModalEquipmentDetails from './modals/ModalEquipmentDetails';

const AdminEquipmentPage = () => {
    const dispatch = useAppDispatch();
    const listEquipments = useAppSelector(selectEquipments);
    const meta = useAppSelector(selectEquipmentMeta);
    const loading = useAppSelector(selectEquipmentLoading);

    const [openModalAdd, setOpenModalAdd] = useState(false);
    const [openModalUpdate, setOpenModalUpdate] = useState(false);
    const [openModalDetails, setOpenModalDetails] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [equipment, setEquipment] = useState<IEquipment | null>(null);
    const [equipmentEdit, setEquipmentEdit] = useState<IEquipment | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const canView = usePermission("EQUIPMENT_VIEW_LIST");

    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const handleEdit = (data: IEquipment) => {
        setEquipmentEdit(data);
        setOpenModalUpdate(true);
    };

    const handleView = async (id: number) => {
        setEquipment(null);
        setIsLoading(true);
        setOpenModalDetails(true);
        try {
            const res = await getEquipmentById(id);
            if (res.data.statusCode === 200) setEquipment(res.data.data ?? null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không xác định');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            await deleteEquipment(id);
            await dispatch(
                fetchEquipments(
                    buildSpringListQuery({
                        page: meta.page,
                        pageSize: meta.pageSize,
                        filter: orFieldsInsensitiveLike(["name", "description"], debouncedSearch),
                        sort: sortItems,
                    })
                )
            );
            toast.success('Xóa thành công');
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không xác định');
        } finally {
            setDeletingId(null);
        }
    };

    const cancel: PopconfirmProps['onCancel'] = () => toast.error('Đã bỏ chọn');

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
                fetchEquipments(
                    buildSpringListQuery({ page, pageSize, filter: filterStr, sort })
                )
            );
        },
        [dispatch, filterStr]
    );

    useEffect(() => {
        if (!canView) return;
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canView, debouncedSearch, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<IEquipment>["onChange"] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const columns: ColumnsType<IEquipment> = [
        {
            title: 'STT', key: 'stt',
            render: (_: any, __: IEquipment, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: true },
        {
            title: 'Tên thiết bị', dataIndex: 'name', key: 'name',
            sorter: true,
        },
        {
            title: 'Tổng SL', dataIndex: 'totalQuantity', key: 'totalQuantity',
            sorter: true,
        },
        {
            title: 'Khả dụng', dataIndex: 'availableQuantity', key: 'availableQuantity',
            sorter: true,
        },
        {
            title: 'Giá trị', dataIndex: 'price', key: 'price',
            sorter: true,
            render: (price: number) => price.toLocaleString('vi-VN') + ' đ',
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            sorter: true,
            render: (status: IEquipment['status']) => (
                <Tag color={EQUIPMENT_STATUS_META[status].color}>
                    {EQUIPMENT_STATUS_META[status].label}
                </Tag>
            ),
        },
        {
            title: 'Hành động', key: 'actions',
            render: (_: any, record: IEquipment) => (
                <Space align="center" style={{ justifyContent: 'center', width: '100%' }}>
                    <PermissionWrapper required="EQUIPMENT_VIEW_DETAIL">
                        <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required="EQUIPMENT_UPDATE">
                        <RBButton variant="outline-warning" size="sm" onClick={() => handleEdit(record)}>
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required="EQUIPMENT_DELETE">
                        <Popconfirm
                            title="Xóa thiết bị"
                            description="Bạn có chắc muốn xóa thiết bị này không?"
                            onConfirm={() => handleDelete(record.id)}
                            onCancel={cancel}
                            okText="Có"
                            cancelText="Không"
                            placement="topLeft"
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
        <AdminWrapper>
            <Card
                size="small"
                title="Quản lý thiết bị (Equipment)"
                extra={
                    <Space align="center" wrap>
                        <Input.Search
                            allowClear
                            placeholder="Tìm tên / mô tả"
                            style={{ width: 220 }}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <PermissionWrapper required="EQUIPMENT_CREATE">
                            <RBButton
                                variant="outline-primary"
                                size="sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                                onClick={() => setOpenModalAdd(true)}
                            >
                                <IoIosAddCircle /> Thêm mới
                            </RBButton>
                        </PermissionWrapper>
                        <Button
                            icon={<FaDownload />}
                            onClick={() => exportTableToExcel(columns, listEquipments, 'equipments')}
                        >
                            Xuất Excel
                        </Button>
                    </Space>
                }
                hoverable={false}
                style={{ width: '100%', overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
                <PermissionWrapper
                    required="EQUIPMENT_VIEW_LIST"
                    fallback={<Empty description="Bạn không có quyền xem danh sách thiết bị" />}
                >
                    <Table<IEquipment>
                        columns={columns}
                        dataSource={listEquipments}
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
                        scroll={{ x: 'max-content' }}
                    />
                </PermissionWrapper>
            </Card>

            <ModalAddEquipment open={openModalAdd} setOpen={setOpenModalAdd} />
            <ModalUpdateEquipment open={openModalUpdate} setOpen={setOpenModalUpdate} equipmentEdit={equipmentEdit} />
            <ModalEquipmentDetails open={openModalDetails} setOpen={setOpenModalDetails} equipment={equipment} isLoading={isLoading} />
        </AdminWrapper>
    );
};

export default AdminEquipmentPage;
