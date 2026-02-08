import { Table, Tag, Space, Card, Popconfirm, type PopconfirmProps, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
    fetchPitches,
    selectPitchLoading,
    selectPitchMeta,
    selectPitches,
} from '../../../redux/features/pitchSlice';

import type { IPitch, PitchTypeEnum } from '../../../types/pitch';
import {
    PITCH_STATUS_META,
    getPitchTypeLabel,
} from '../../../utils/constants/pitch.constants';
import ModalAddPitch from './modals/ModalAddPitch';
import ModalPitchDetails from './modals/ModalPitchDetails';
import { deletePitch, getPitchById } from '../../../config/Api';
import { toast } from 'react-toastify';
import ModalUpdatePitch from './modals/ModalUpdatePitch';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { usePermission } from '../../../hooks/common/usePermission';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';

const AdminPitchPage = () => {
    const dispatch = useAppDispatch();

    const listPitches = useAppSelector(selectPitches);
    const meta = useAppSelector(selectPitchMeta);
    const loading = useAppSelector(selectPitchLoading);
    const [openModalAddPitch, setOpenModalAddPitch] = useState<boolean>(false);
    const [openModalPitchDetails, setOpenModalPitchDetails] = useState<boolean>(false);
    const [openModalUpdatePitch, setOpenModalUpdatePitch] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [pitch, setPitch] = useState<IPitch | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [pitchEdit, setPitchEdit] = useState<IPitch | null>(null);
    const canViewPitches = usePermission("PITCH_VIEW_LIST");


    const handleEdit = (data: IPitch) => {
        setPitchEdit(data);
        setOpenModalUpdatePitch(true);
    };


    const handleView = async (id: number) => {
        setPitch(null);
        setIsLoading(true);
        setOpenModalPitchDetails(true);

        try {
            const res = await getPitchById(id);
            if (res.data.statusCode === 200) {
                setPitch(res.data.data ?? null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <>
                    <div>Có lỗi khi tải chi tiết sân</div>
                    <div>{m}</div>
                </>
            );
        } finally {
            setIsLoading(false);
        }
    };


    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deletePitch(id);
            if (res.data.statusCode === 200) {
                await dispatch(fetchPitches(""));
                toast.success('Xóa thành công');
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
        toast.error('Đã bỏ chọn');
    };

    const columns: ColumnsType<IPitch> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: any, __: IPitch, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Tên sân',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) =>
                (a.name ?? '').localeCompare(b.name ?? ''),
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Loại sân',
            dataIndex: 'pitchType',
            key: 'pitchType',
            sorter: (a, b) => a.pitchType.localeCompare(b.pitchType),
            render: (type: PitchTypeEnum) => getPitchTypeLabel(type),
        },
        {
            title: 'Giá / giờ',
            dataIndex: 'pricePerHour',
            key: 'pricePerHour',
            sorter: (a, b) => a.pricePerHour - b.pricePerHour,
            render: (price: number) =>
                price.toLocaleString('vi-VN') + ' đ',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) => a.status.localeCompare(b.status),
            render: (status: IPitch['status']) => (
                <Tag color={PITCH_STATUS_META[status].color}>
                    {PITCH_STATUS_META[status].label}
                </Tag>
            ),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: any, record: IPitch) => (
                <Space align="center" style={{ justifyContent: "center", width: "100%" }}>

                    <PermissionWrapper required={"PITCH_VIEW_DETAIL"}>
                        <RBButton variant="outline-info" size="sm"
                            onClick={() => handleView(record.id)}
                        >
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required={"PITCH_UPDATE"}>
                        <RBButton variant="outline-warning" size="sm"
                            onClick={() => handleEdit(record)}
                        >
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>


                    <PermissionWrapper required={"PITCH_DELETE"}>
                        <Popconfirm
                            title="Xóa sân"
                            description="Bạn có chắc chắn muốn xóa sân này không?"
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

                    <RBButton
                        size='sm'
                        variant="outline-info"
                        onClick={() => {
                            if (record?.latitude == null || record?.longitude == null) return;

                            const url = `https://www.google.com/maps/dir/?api=1&destination=${record.latitude},${record.longitude}`;
                            window.open(url, '_blank');
                        }}
                        disabled={record?.latitude == null || record?.longitude == null}
                    >
                        <FaMapMarkerAlt />
                    </RBButton>
                </Space>
            ),
        },
    ];

    // fetch list pitches
    useEffect(() => {
        if (!canViewPitches) return;

        dispatch(fetchPitches(""));
    }, [canViewPitches, dispatch]);

    return (
        <>
            <AdminWrapper>
                <Card
                    size="small"
                    title="Quản lý sân (Pitch)"
                    extra={
                        <PermissionWrapper required={"PITCH_CREATE"}>
                            <RBButton
                                variant="outline-primary"
                                size="sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                                onClick={() => setOpenModalAddPitch(true)}
                            >
                                <IoIosAddCircle />
                                Thêm mới
                            </RBButton>
                        </PermissionWrapper>
                    }
                    hoverable={false}
                    style={{
                        width: '100%',
                        overflowX: 'auto',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                >
                    <PermissionWrapper required={"PITCH_VIEW_LIST"}
                        fallback={<Empty description="Bạn không có quyền xem danh sách sân" />}
                    >
                        <Table<IPitch>
                            columns={columns}
                            dataSource={listPitches}
                            rowKey="id"
                            loading={loading}
                            size="small"
                            pagination={{
                                current: meta.page,
                                pageSize: meta.pageSize,
                                total: meta.total,
                                showSizeChanger: true,
                                onChange: (page, pageSize) => {
                                    dispatch(fetchPitches(`page=${page}&pageSize=${pageSize}`));
                                },
                            }}
                            bordered
                            scroll={{ x: 'max-content' }}
                        />
                    </PermissionWrapper>
                </Card>

                <ModalAddPitch
                    openModalAddPitch={openModalAddPitch}
                    setOpenModalAddPitch={setOpenModalAddPitch}
                />

                <ModalPitchDetails
                    openModalPitchDetails={openModalPitchDetails}
                    setOpenModalPitchDetails={setOpenModalPitchDetails}
                    pitch={pitch}
                    isLoading={isLoading}
                />

                <ModalUpdatePitch
                    openModalUpdatePitch={openModalUpdatePitch}
                    setOpenModalUpdatePitch={setOpenModalUpdatePitch}
                    pitchEdit={pitchEdit}
                />
            </AdminWrapper>

        </>
    );
};

export default AdminPitchPage;
