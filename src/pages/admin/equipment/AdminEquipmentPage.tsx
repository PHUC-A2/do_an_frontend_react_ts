import { Table, Tag, Space, Card, Popconfirm, type PopconfirmProps, Empty, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
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
            await dispatch(fetchEquipments(''));
            toast.success('Xóa thành công');
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không xác định');
        } finally {
            setDeletingId(null);
        }
    };

    const cancel: PopconfirmProps['onCancel'] = () => toast.error('Đã bỏ chọn');

    const columns: ColumnsType<IEquipment> = [
        {
            title: 'STT', key: 'stt',
            render: (_: any, __: IEquipment, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
        {
            title: 'Tên thiết bị', dataIndex: 'name', key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Tổng SL', dataIndex: 'totalQuantity', key: 'totalQuantity',
            sorter: (a, b) => a.totalQuantity - b.totalQuantity,
        },
        {
            title: 'Khả dụng', dataIndex: 'availableQuantity', key: 'availableQuantity',
            sorter: (a, b) => a.availableQuantity - b.availableQuantity,
        },
        {
            title: 'Giá trị', dataIndex: 'price', key: 'price',
            sorter: (a, b) => a.price - b.price,
            render: (price: number) => price.toLocaleString('vi-VN') + ' đ',
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
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

    useEffect(() => {
        if (!canView) return;
        dispatch(fetchEquipments(''));
    }, [canView, dispatch]);

    return (
        <AdminWrapper>
            <Card
                size="small"
                title="Quản lý thiết bị (Equipment)"
                extra={
                    <Space align="center">
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
                        pagination={{
                            current: meta.page,
                            pageSize: meta.pageSize,
                            total: meta.total,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => {
                                dispatch(fetchEquipments(`page=${page}&pageSize=${pageSize}`));
                            },
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
