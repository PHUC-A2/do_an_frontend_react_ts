import {
    Button,
    Card,
    Empty,
    Popconfirm,
    type PopconfirmProps,
    Space,
    Table,
    Input,
    Select,
    Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableProps } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { FaDownload } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
    fetchDevices,
    selectDeviceLoading,
    selectDeviceMeta,
    selectDevices,
} from '../../../redux/features/deviceSlice';
import type { DeviceStatus, DeviceType, IDevice } from '../../../types/device';
import type { IAsset } from '../../../types/asset';
import { deleteDevice, getAllAssets, getDeviceById } from '../../../config/Api';
import { toast } from 'react-toastify';
import ModalAddDevice from './modals/ModalAddDevice';
import ModalDeviceDetails from './modals/ModalDeviceDetails';
import ModalUpdateDevice from './modals/ModalUpdateDevice';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import { buildSpringListQuery, type SpringSortItem } from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';
import { tableSorterToSortItems } from '../../../utils/pagination/tableSorterToSpringSort';
import { DEVICE_STATUS_META, DEVICE_TYPE_OPTIONS, DEVICE_STATUS_OPTIONS } from '../../../utils/constants/device.constants';

const DEVICE_TEXT_FIELDS = ['deviceName', 'asset.assetName'];

/** Gộp filter text + tài sản + enum (spring-filter trên entity Device). */
function combineDeviceListFilter(
    keyword: string,
    assetId: number | undefined,
    status: DeviceStatus | undefined,
    deviceType: DeviceType | undefined
): string | undefined {
    const parts: string[] = [];
    const textFilter = orFieldsInsensitiveLike(DEVICE_TEXT_FIELDS, keyword);
    if (textFilter) parts.push(textFilter);
    if (assetId != null && assetId > 0) {
        parts.push(`asset.id==${assetId}`);
    }
    if (status) {
        parts.push(`status : '${status}'`);
    }
    if (deviceType) {
        parts.push(`deviceType : '${deviceType}'`);
    }
    if (parts.length === 0) return undefined;
    return parts.join(' and ');
}

const AdminDevicePage = () => {
    const dispatch = useAppDispatch();
    const listDevices = useAppSelector(selectDevices);
    const meta = useAppSelector(selectDeviceMeta);
    const loading = useAppSelector(selectDeviceLoading);

    const [openModalAddDevice, setOpenModalAddDevice] = useState(false);
    const [openModalDeviceDetails, setOpenModalDeviceDetails] = useState(false);
    const [openModalUpdateDevice, setOpenModalUpdateDevice] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [device, setDevice] = useState<IDevice | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deviceEdit, setDeviceEdit] = useState<IDevice | null>(null);

    const canViewDevices = usePermission('DEVICE_VIEW_LIST');

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterAssetId, setFilterAssetId] = useState<number | undefined>(undefined);
    const [filterStatus, setFilterStatus] = useState<DeviceStatus | undefined>(undefined);
    const [filterDeviceType, setFilterDeviceType] = useState<DeviceType | undefined>(undefined);
    const [assetsForFilter, setAssetsForFilter] = useState<IAsset[]>([]);
    const [loadingAssetsFilter, setLoadingAssetsFilter] = useState(false);

    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const [searchParams, setSearchParams] = useSearchParams();
    const openDeviceIdParam = searchParams.get('openDeviceId');

    const handleEdit = (data: IDevice) => {
        setDeviceEdit(data);
        setOpenModalUpdateDevice(true);
    };

    const handleView = useCallback(async (id: number) => {
        setDevice(null);
        setIsLoading(true);
        setOpenModalDeviceDetails(true);
        try {
            const res = await getDeviceById(id);
            if (res.data.statusCode === 200) {
                setDevice((res.data.data as IDevice) ?? null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <>
                    <div>Có lỗi khi tải chi tiết thiết bị</div>
                    <div>{m}</div>
                </>
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!openDeviceIdParam) return;
        const id = Number(openDeviceIdParam);
        if (Number.isNaN(id) || id <= 0) {
            setSearchParams(
                (prev: URLSearchParams) => {
                    const next = new URLSearchParams(prev);
                    next.delete('openDeviceId');
                    return next;
                },
                { replace: true }
            );
            return;
        }
        setSearchParams(
            (prev: URLSearchParams) => {
                const next = new URLSearchParams(prev);
                next.delete('openDeviceId');
                return next;
            },
            { replace: true }
        );
        void handleView(id);
    }, [openDeviceIdParam, setSearchParams, handleView]);

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteDevice(id);
            if (res.data.statusCode === 200) {
                await dispatch(
                    fetchDevices(
                        buildSpringListQuery({
                            page: meta.page,
                            pageSize: meta.pageSize,
                            filter: combineDeviceListFilter(
                                debouncedSearch,
                                filterAssetId,
                                filterStatus,
                                filterDeviceType
                            ),
                            sort: sortItems,
                        })
                    )
                );
                toast.success('Xóa thành công');
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xóa thiết bị</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setDeletingId(null);
        }
    };

    const cancel: PopconfirmProps['onCancel'] = () => {
        toast.error('Đã bỏ chọn');
    };

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        if (!canViewDevices) return;
        const load = async () => {
            try {
                setLoadingAssetsFilter(true);
                const q = buildSpringListQuery({ page: 1, pageSize: 500 });
                const res = await getAllAssets(q);
                if (res.data.statusCode === 200 && res.data.data?.result) {
                    setAssetsForFilter(res.data.data.result);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingAssetsFilter(false);
            }
        };
        void load();
    }, [canViewDevices]);

    const filterStr = useMemo(
        () => combineDeviceListFilter(debouncedSearch, filterAssetId, filterStatus, filterDeviceType),
        [debouncedSearch, filterAssetId, filterStatus, filterDeviceType]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(fetchDevices(buildSpringListQuery({ page, pageSize, filter: filterStr, sort })));
        },
        [dispatch, filterStr]
    );

    useEffect(() => {
        if (!canViewDevices) return;
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canViewDevices, debouncedSearch, filterAssetId, filterStatus, filterDeviceType, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<IDevice>['onChange'] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const columns: ColumnsType<IDevice> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: unknown, __: IDevice, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: true,
        },
        {
            title: 'ID tài sản',
            dataIndex: 'assetId',
            key: 'asset.id',
            sorter: true,
            // Điều hướng mở chi tiết tài sản (AdminAssetPage đọc query openAssetId).
            render: (_: number | undefined, record: IDevice) =>
                record.assetId ? (
                    <Link to={`/admin/asset?openAssetId=${record.assetId}`}>{record.assetId}</Link>
                ) : (
                    '-'
                ),
        },
        {
            title: 'Tên tài sản',
            dataIndex: 'assetName',
            key: 'asset.assetName',
            sorter: true,
            render: (_: string | null | undefined, record: IDevice) =>
                record.assetId ? (
                    <Link to={`/admin/asset?openAssetId=${record.assetId}`}>
                        {record.assetName?.trim() ? record.assetName : `Tài sản #${record.assetId}`}
                    </Link>
                ) : (
                    '-'
                ),
        },
        {
            title: 'Tên thiết bị',
            dataIndex: 'deviceName',
            key: 'deviceName',
            sorter: true,
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            sorter: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (s: DeviceStatus) => (
                <Tag color={DEVICE_STATUS_META[s]?.color}>{DEVICE_STATUS_META[s]?.label ?? s}</Tag>
            ),
        },
        {
            title: 'Loại',
            dataIndex: 'deviceType',
            key: 'deviceType',
            sorter: true,
            render: (t: DeviceType) => <Tag>{DEVICE_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t}</Tag>,
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: unknown, record: IDevice) => (
                <Space align="center" style={{ justifyContent: 'center', width: '100%' }}>
                    <PermissionWrapper required="DEVICE_VIEW_DETAIL">
                        <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required="DEVICE_UPDATE">
                        <RBButton variant="outline-warning" size="sm" onClick={() => handleEdit(record)}>
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required="DEVICE_DELETE">
                        <Popconfirm
                            title="Xóa thiết bị"
                            description="Bạn có chắc chắn muốn xóa thiết bị này không?"
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
                    title="Quản lý thiết bị theo tài sản"
                    extra={
                        <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Tìm tên thiết bị / tên tài sản"
                                style={{ width: 240 }}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <Select<number>
                                allowClear
                                placeholder="Lọc tài sản"
                                style={{ width: 200 }}
                                loading={loadingAssetsFilter}
                                value={filterAssetId}
                                onChange={(v) => setFilterAssetId(v ?? undefined)}
                                options={assetsForFilter.map((a) => ({
                                    value: a.id,
                                    label: `${a.id} — ${a.assetName}`,
                                }))}
                            />
                            <Select<DeviceStatus>
                                allowClear
                                placeholder="Trạng thái"
                                style={{ width: 160 }}
                                value={filterStatus}
                                onChange={(v) => setFilterStatus(v ?? undefined)}
                                options={DEVICE_STATUS_OPTIONS}
                            />
                            <Select<DeviceType>
                                allowClear
                                placeholder="Loại TB"
                                style={{ width: 160 }}
                                value={filterDeviceType}
                                onChange={(v) => setFilterDeviceType(v ?? undefined)}
                                options={DEVICE_TYPE_OPTIONS}
                            />
                            <PermissionWrapper required="DEVICE_CREATE">
                                <RBButton
                                    variant="outline-primary"
                                    size="sm"
                                    style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                                    onClick={() => setOpenModalAddDevice(true)}
                                >
                                    <IoIosAddCircle />
                                    Thêm mới
                                </RBButton>
                            </PermissionWrapper>

                            <Button
                                icon={<FaDownload />}
                                onClick={() => exportTableToExcel(columns, listDevices, 'devices')}
                            >
                                Xuất Excel
                            </Button>
                        </Space>
                    }
                    hoverable={false}
                    style={{
                        width: '100%',
                        overflowX: 'auto',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                >
                    <PermissionWrapper
                        required="DEVICE_VIEW_LIST"
                        fallback={<Empty description="Bạn không có quyền xem danh sách thiết bị theo tài sản" />}
                    >
                        <Table<IDevice>
                            columns={columns}
                            dataSource={listDevices}
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

                <ModalAddDevice openModalAddDevice={openModalAddDevice} setOpenModalAddDevice={setOpenModalAddDevice} />

                <ModalDeviceDetails
                    openModalDeviceDetails={openModalDeviceDetails}
                    setOpenModalDeviceDetails={setOpenModalDeviceDetails}
                    device={device}
                    isLoading={isLoading}
                />

                <ModalUpdateDevice
                    openModalUpdateDevice={openModalUpdateDevice}
                    setOpenModalUpdateDevice={setOpenModalUpdateDevice}
                    deviceEdit={deviceEdit}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminDevicePage;
