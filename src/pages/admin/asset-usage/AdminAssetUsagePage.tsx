import {
    Badge,
    Button,
    Card,
    DatePicker,
    Empty,
    Popconfirm,
    type PopconfirmProps,
    Space,
    Table,
    Input,
    Select,
    Tabs,
    Tag,
    Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { FaDownload } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdCheckCircle, MdClose, MdDelete } from 'react-icons/md';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
    fetchAssetUsages,
    selectAssetUsageLoading,
    selectAssetUsageMeta,
    selectAssetUsages,
} from '../../../redux/features/assetUsageSlice';
import type { AssetUsageStatus, AssetUsageType, IAssetUsage } from '../../../types/assetUsage';
import type { IAsset } from '../../../types/asset';
import type { IUser } from '../../../types/user';
import { deleteAssetUsage, getAllAssets, getAllAssetUsages, getAllUsers, getAssetUsageById, updateAssetUsage } from '../../../config/Api';
import { toast } from 'react-toastify';
import ModalAddAssetUsage from './modals/ModalAddAssetUsage';
import ModalAssetUsageDetails from './modals/ModalAssetUsageDetails';
import ModalUpdateAssetUsage from './modals/ModalUpdateAssetUsage';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import { buildSpringListQuery, type SpringSortItem } from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';
import { tableSorterToSortItems } from '../../../utils/pagination/tableSorterToSpringSort';
import { resolveAssetRoomFeeMode } from '../../../utils/constants/asset.constants';
import {
    ASSET_USAGE_STATUS_META,
    ASSET_USAGE_STATUS_OPTIONS,
    ASSET_USAGE_TYPE_META,
    ASSET_USAGE_TYPE_OPTIONS,
} from '../../../utils/constants/assetUsage.constants';

const USAGE_TEXT_FIELDS = ['user.name', 'user.email', 'asset.assetName', 'subject'];

function combineAssetUsageListFilter(
    tab: 'all' | 'pending',
    keyword: string,
    assetId: number | undefined,
    userId: number | undefined,
    status: AssetUsageStatus | undefined,
    usageType: AssetUsageType | undefined,
    filterDate: Dayjs | null
): string | undefined {
    const parts: string[] = [];
    const textFilter = orFieldsInsensitiveLike(USAGE_TEXT_FIELDS, keyword);
    if (textFilter) parts.push(textFilter);
    if (assetId != null && assetId > 0) parts.push(`asset.id==${assetId}`);
    if (userId != null && userId > 0) parts.push(`user.id==${userId}`);
    if (status) parts.push(`status : '${status}'`);
    if (tab === 'pending') parts.push(`status : 'PENDING'`);
    if (usageType) parts.push(`usageType : '${usageType}'`);
    if (filterDate) parts.push(`usageDate : '${filterDate.format('YYYY-MM-DD')}'`);
    if (parts.length === 0) return undefined;
    return parts.join(' and ');
}

const AdminAssetUsagePage = () => {
    const dispatch = useAppDispatch();
    const list = useAppSelector(selectAssetUsages);
    const meta = useAppSelector(selectAssetUsageMeta);
    const loading = useAppSelector(selectAssetUsageLoading);

    const [openAdd, setOpenAdd] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
    const [allCount, setAllCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);

    const [detail, setDetail] = useState<IAssetUsage | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [usageEdit, setUsageEdit] = useState<IAssetUsage | null>(null);

    const canView = usePermission('ASSET_USAGE_VIEW_LIST');

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterAssetId, setFilterAssetId] = useState<number | undefined>(undefined);
    const [filterUserId, setFilterUserId] = useState<number | undefined>(undefined);
    const [filterStatus, setFilterStatus] = useState<AssetUsageStatus | undefined>(undefined);
    const [filterUsageType, setFilterUsageType] = useState<AssetUsageType | undefined>(undefined);
    const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
    const [assetsOpts, setAssetsOpts] = useState<IAsset[]>([]);
    const [usersOpts, setUsersOpts] = useState<IUser[]>([]);
    const [loadingOpts, setLoadingOpts] = useState(false);

    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const [searchParams, setSearchParams] = useSearchParams();
    const openIdParam = searchParams.get('openAssetUsageId');

    const handleEdit = (row: IAssetUsage) => {
        setUsageEdit(row);
        setOpenUpdate(true);
    };

    const handleView = useCallback(async (id: number) => {
        setDetail(null);
        setDetailLoading(true);
        setOpenDetail(true);
        try {
            const res = await getAssetUsageById(id);
            if (res.data.statusCode === 200) {
                setDetail((res.data.data as IAssetUsage) ?? null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <>
                    <div>Có lỗi khi tải chi tiết</div>
                    <div>{m}</div>
                </>
            );
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!openIdParam) return;
        const id = Number(openIdParam);
        if (Number.isNaN(id) || id <= 0) {
            setSearchParams(
                (prev: URLSearchParams) => {
                    const next = new URLSearchParams(prev);
                    next.delete('openAssetUsageId');
                    return next;
                },
                { replace: true }
            );
            return;
        }
        setSearchParams(
            (prev: URLSearchParams) => {
                const next = new URLSearchParams(prev);
                next.delete('openAssetUsageId');
                return next;
            },
            { replace: true }
        );
        void handleView(id);
    }, [openIdParam, setSearchParams, handleView]);

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteAssetUsage(id);
            if (res.data.statusCode === 200) {
                await dispatch(
                    fetchAssetUsages(
                        buildSpringListQuery({
                            page: meta.page,
                            pageSize: meta.pageSize,
                            filter: combineAssetUsageListFilter(
                                activeTab,
                                debouncedSearch,
                                filterAssetId,
                                filterUserId,
                                filterStatus,
                                filterUsageType,
                                filterDate
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
                    <div>Có lỗi xảy ra khi xóa</div>
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
        if (!canView) return;
        const load = async () => {
            try {
                setLoadingOpts(true);
                const uq = buildSpringListQuery({ page: 1, pageSize: 300 });
                const aq = buildSpringListQuery({ page: 1, pageSize: 500 });
                const [ur, ar] = await Promise.all([getAllUsers(uq), getAllAssets(aq)]);
                if (ur.data.statusCode === 200 && ur.data.data?.result) setUsersOpts(ur.data.data.result);
                if (ar.data.statusCode === 200 && ar.data.data?.result) setAssetsOpts(ar.data.data.result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingOpts(false);
            }
        };
        void load();
    }, [canView]);

    const filterStr = useMemo(
        () =>
            combineAssetUsageListFilter(
                activeTab,
                debouncedSearch,
                filterAssetId,
                filterUserId,
                filterStatus,
                filterUsageType,
                filterDate
            ),
        [activeTab, debouncedSearch, filterAssetId, filterUserId, filterStatus, filterUsageType, filterDate]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(fetchAssetUsages(buildSpringListQuery({ page, pageSize, filter: filterStr, sort })));
        },
        [dispatch, filterStr]
    );

    const loadTabCounts = useCallback(async () => {
        try {
            const [allRes, pendingRes] = await Promise.all([
                getAllAssetUsages(
                    buildSpringListQuery({
                        page: 1,
                        pageSize: 1,
                        filter: combineAssetUsageListFilter(
                            'all',
                            debouncedSearch,
                            filterAssetId,
                            filterUserId,
                            filterStatus,
                            filterUsageType,
                            filterDate
                        ),
                    })
                ),
                getAllAssetUsages(
                    buildSpringListQuery({
                        page: 1,
                        pageSize: 1,
                        filter: combineAssetUsageListFilter(
                            'pending',
                            debouncedSearch,
                            filterAssetId,
                            filterUserId,
                            filterStatus,
                            filterUsageType,
                            filterDate
                        ),
                    })
                ),
            ]);

            setAllCount(allRes.data.data?.meta?.total ?? 0);
            setPendingCount(pendingRes.data.data?.meta?.total ?? 0);
        } catch {
            setAllCount(0);
            setPendingCount(0);
        }
    }, [debouncedSearch, filterAssetId, filterDate, filterStatus, filterUsageType, filterUserId]);

    useEffect(() => {
        if (!canView) return;
        fetchPage(1, meta.pageSize, sortRef.current);
        void loadTabCounts();
    }, [
        canView,
        activeTab,
        debouncedSearch,
        filterAssetId,
        filterUserId,
        filterStatus,
        filterUsageType,
        filterDate,
        fetchPage,
        loadTabCounts,
        meta.pageSize,
    ]);

    const handleTableChange: TableProps<IAssetUsage>['onChange'] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const handleQuickUpdateStatus = async (record: IAssetUsage, nextStatus: IAssetUsage['status']) => {
        try {
            setProcessingId(record.id);
            await updateAssetUsage(record.id, {
                userId: record.userId,
                assetId: record.assetId,
                usageType: record.usageType,
                usageFeeMode: resolveAssetRoomFeeMode(record.usageFeeMode),
                date: record.date,
                startTime: record.startTime.length === 5 ? `${record.startTime}:00` : record.startTime,
                endTime: record.endTime.length === 5 ? `${record.endTime}:00` : record.endTime,
                subject: record.subject,
                status: nextStatus,
            });
            toast.success(nextStatus === 'APPROVED' ? 'Đã duyệt lịch đặt phòng' : 'Đã từ chối lịch đặt phòng');
            fetchPage(meta.page, meta.pageSize, sortRef.current);
            void loadTabCounts();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Cập nhật trạng thái thất bại');
        } finally {
            setProcessingId(null);
        }
    };

    const columns: ColumnsType<IAssetUsage> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: unknown, __: IAssetUsage, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: true },
        { title: 'Người dùng', dataIndex: 'userId', key: 'user.id', sorter: true },
        {
            title: 'Email / tên',
            key: 'user.email',
            sorter: true,
            render: (_: unknown, r: IAssetUsage) => r.userEmail || r.userName || '-',
        },
        { title: 'ID phòng', dataIndex: 'assetId', key: 'asset.id', sorter: true },
        {
            title: 'Phòng',
            dataIndex: 'assetName',
            key: 'asset.assetName',
            sorter: true,
            render: (t?: string | null) => t || '-',
        },
        {
            title: 'Loại',
            dataIndex: 'usageType',
            key: 'usageType',
            sorter: true,
            render: (t: AssetUsageType) => (
                <Tag color={ASSET_USAGE_TYPE_META[t]?.color}>{ASSET_USAGE_TYPE_META[t]?.label ?? t}</Tag>
            ),
        },
        {
            title: 'Phí đăng ký',
            key: 'usageFeeMode',
            render: (_: unknown, r: IAssetUsage) =>
                resolveAssetRoomFeeMode(r.usageFeeMode) === 'PAID' ? (
                    <Tag color="gold">Có phí</Tag>
                ) : (
                    <Tag color="green">Miễn phí</Tag>
                ),
        },
        { title: 'Ngày', dataIndex: 'date', key: 'usageDate', sorter: true },
        { title: 'Bắt đầu', dataIndex: 'startTime', key: 'startTime', sorter: true },
        { title: 'Kết thúc', dataIndex: 'endTime', key: 'endTime', sorter: true },
        {
            title: 'Mục đích',
            dataIndex: 'subject',
            key: 'subject',
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (s: AssetUsageStatus) => (
                <Tag color={ASSET_USAGE_STATUS_META[s]?.color}>{ASSET_USAGE_STATUS_META[s]?.label ?? s}</Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: unknown, record: IAssetUsage) => (
                <Space align="center" style={{ justifyContent: 'center', width: '100%' }}>
                    <PermissionWrapper required="ASSET_USAGE_VIEW_DETAIL">
                        <Tooltip title="Xem chi tiết lịch đặt phòng">
                            <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                                <FaArrowsToEye />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>
                    <PermissionWrapper required="ASSET_USAGE_UPDATE">
                        <Tooltip
                            title={
                                record.status === 'CANCELLED' || record.status === 'COMPLETED' || record.status === 'REJECTED'
                                    ? 'Không thể sửa lịch đặt đã kết thúc / đã hủy / đã từ chối'
                                    : 'Chỉnh sửa lịch đặt phòng'
                            }
                        >
                            <RBButton
                                variant="outline-warning"
                                size="sm"
                                disabled={record.status === 'CANCELLED' || record.status === 'COMPLETED' || record.status === 'REJECTED'}
                                onClick={() => handleEdit(record)}
                            >
                                <CiEdit />
                            </RBButton>
                        </Tooltip>
                    </PermissionWrapper>
                    {record.status === 'PENDING' && (
                        <PermissionWrapper required="ASSET_USAGE_UPDATE">
                            <>
                                <Tooltip title="Duyệt lịch đặt phòng chờ xác nhận">
                                    <RBButton
                                        variant="outline-success"
                                        size="sm"
                                        disabled={processingId === record.id}
                                        onClick={() => void handleQuickUpdateStatus(record, 'APPROVED')}
                                    >
                                        <MdCheckCircle />
                                    </RBButton>
                                </Tooltip>
                                <Tooltip title="Từ chối lịch đặt phòng chờ xác nhận">
                                    <RBButton
                                        variant="outline-secondary"
                                        size="sm"
                                        disabled={processingId === record.id}
                                        onClick={() => void handleQuickUpdateStatus(record, 'REJECTED')}
                                    >
                                        <MdClose />
                                    </RBButton>
                                </Tooltip>
                            </>
                        </PermissionWrapper>
                    )}
                    <PermissionWrapper required="ASSET_USAGE_DELETE">
                        <Popconfirm
                            title="Xóa lịch đặt phòng"
                            description="Bạn có chắc chắn muốn xóa lịch đặt phòng này không?"
                            onConfirm={() => handleDelete(record.id)}
                            onCancel={cancel}
                            okText="Có"
                            cancelText="Không"
                            placement="topLeft"
                            okButtonProps={{ loading: deletingId === record.id }}
                        >
                            <Tooltip title="Xóa lịch đặt phòng">
                                <RBButton size="sm" variant="outline-danger" disabled={deletingId === record.id}>
                                    <MdDelete />
                                </RBButton>
                            </Tooltip>
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
                    title="Quản lý lịch đặt phòng"
                    extra={
                        <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Tìm user, phòng, mục đích"
                                style={{ width: 220 }}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <Select<number>
                                allowClear
                                placeholder="Người dùng"
                                style={{ width: 200 }}
                                loading={loadingOpts}
                                value={filterUserId}
                                onChange={(v) => setFilterUserId(v ?? undefined)}
                                options={usersOpts.map((u) => ({
                                    value: u.id,
                                    label: `${u.id} — ${u.email ?? u.name}`,
                                }))}
                            />
                            <Select<number>
                                allowClear
                                placeholder="Phòng"
                                style={{ width: 200 }}
                                loading={loadingOpts}
                                value={filterAssetId}
                                onChange={(v) => setFilterAssetId(v ?? undefined)}
                                options={assetsOpts.map((a) => ({
                                    value: a.id,
                                    label: `${a.id} — ${a.assetName}`,
                                }))}
                            />
                            <DatePicker
                                allowClear
                                placeholder="Ngày"
                                value={filterDate}
                                onChange={(d) => setFilterDate(d)}
                                style={{ width: 140 }}
                            />
                            <Select<AssetUsageStatus>
                                allowClear
                                placeholder="Trạng thái"
                                style={{ width: 150 }}
                                value={filterStatus}
                                onChange={(v) => setFilterStatus(v ?? undefined)}
                                options={ASSET_USAGE_STATUS_OPTIONS}
                            />
                            <Select<AssetUsageType>
                                allowClear
                                placeholder="Loại"
                                style={{ width: 140 }}
                                value={filterUsageType}
                                onChange={(v) => setFilterUsageType(v ?? undefined)}
                                options={ASSET_USAGE_TYPE_OPTIONS}
                            />
                            <PermissionWrapper required="ASSET_USAGE_CREATE">
                                <RBButton
                                    variant="outline-primary"
                                    size="sm"
                                    style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                                    onClick={() => setOpenAdd(true)}
                                >
                                    <IoIosAddCircle />
                                    Thêm mới
                                </RBButton>
                            </PermissionWrapper>
                            <Button
                                icon={<FaDownload />}
                                onClick={() => exportTableToExcel(columns, list, 'asset-usages')}
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
                        required="ASSET_USAGE_VIEW_LIST"
                        fallback={<Empty description="Bạn không có quyền xem danh sách lịch đặt phòng" />}
                    >
                        <Tabs
                            activeKey={activeTab}
                            onChange={(key) => setActiveTab(key as 'all' | 'pending')}
                            items={[
                                {
                                    key: 'all',
                                    label: (
                                        <Space size={8}>
                                            <span>Tất cả lịch đặt phòng</span>
                                            <Badge count={allCount} color="#1677ff" />
                                        </Space>
                                    ),
                                },
                                {
                                    key: 'pending',
                                    label: (
                                        <Space size={8}>
                                            <span>Chờ duyệt</span>
                                            <Badge count={pendingCount} color="#faad14" />
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                        <Table<IAssetUsage>
                            columns={columns}
                            dataSource={list}
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

                <ModalAddAssetUsage openModalAddAssetUsage={openAdd} setOpenModalAddAssetUsage={setOpenAdd} />
                <ModalAssetUsageDetails
                    openModalAssetUsageDetails={openDetail}
                    setOpenModalAssetUsageDetails={setOpenDetail}
                    usage={detail}
                    isLoading={detailLoading}
                />
                <ModalUpdateAssetUsage
                    openModalUpdateAssetUsage={openUpdate}
                    setOpenModalUpdateAssetUsage={setOpenUpdate}
                    usageEdit={usageEdit}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminAssetUsagePage;
