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
import { useSearchParams } from 'react-router';
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { FaDownload } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
    fetchDeviceReturns,
    selectDeviceReturnLoading,
    selectDeviceReturnMeta,
    selectDeviceReturns,
} from '../../../redux/features/deviceReturnSlice';
import type { ICheckout } from '../../../types/checkout';
import type { DeviceCondition, IDeviceReturn } from '../../../types/deviceReturn';
import { deleteDeviceReturn, getAllCheckouts, getDeviceReturnById } from '../../../config/Api';
import { toast } from 'react-toastify';
import ModalAddDeviceReturn from './modals/ModalAddDeviceReturn';
import ModalDeviceReturnDetails from './modals/ModalDeviceReturnDetails';
import ModalUpdateDeviceReturn from './modals/ModalUpdateDeviceReturn';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import { buildSpringListQuery, type SpringSortItem } from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';
import { tableSorterToSortItems } from '../../../utils/pagination/tableSorterToSpringSort';
import { formatInstant, formatLocalDate } from '../../../utils/format/localdatetime';
import { ASSET_USAGE_STATUS_META } from '../../../utils/constants/assetUsage.constants';
import { DEVICE_CONDITION_META } from '../../../utils/constants/deviceReturn.constants';
import type { AssetUsageStatus } from '../../../types/assetUsage';

const RETURN_TEXT_FIELDS = [
    'checkout.assetUsage.user.email',
    'checkout.assetUsage.user.name',
    'checkout.assetUsage.asset.assetName',
];

function combineReturnListFilter(keyword: string, checkoutId: number | undefined): string | undefined {
    const parts: string[] = [];
    const textFilter = orFieldsInsensitiveLike(RETURN_TEXT_FIELDS, keyword);
    if (textFilter) parts.push(textFilter);
    if (checkoutId != null && checkoutId > 0) {
        parts.push(`checkout.id==${checkoutId}`);
    }
    if (parts.length === 0) return undefined;
    return parts.join(' and ');
}

const AdminReturnsPage = () => {
    const dispatch = useAppDispatch();
    const list = useAppSelector(selectDeviceReturns);
    const meta = useAppSelector(selectDeviceReturnMeta);
    const loading = useAppSelector(selectDeviceReturnLoading);

    const [openAdd, setOpenAdd] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [detail, setDetail] = useState<IDeviceReturn | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [returnEdit, setReturnEdit] = useState<IDeviceReturn | null>(null);

    const canView = usePermission('RETURN_VIEW_LIST');

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterCheckoutId, setFilterCheckoutId] = useState<number | undefined>(undefined);
    const [checkoutOpts, setCheckoutOpts] = useState<ICheckout[]>([]);
    const [loadingCheckoutOpts, setLoadingCheckoutOpts] = useState(false);

    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const [searchParams, setSearchParams] = useSearchParams();
    const openIdParam = searchParams.get('openReturnId');

    const handleEdit = (row: IDeviceReturn) => {
        setReturnEdit(row);
        setOpenUpdate(true);
    };

    const handleView = useCallback(async (id: number) => {
        setDetail(null);
        setDetailLoading(true);
        setOpenDetail(true);
        try {
            const res = await getDeviceReturnById(id);
            if (res.data.statusCode === 200) {
                setDetail((res.data.data as IDeviceReturn) ?? null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <>
                    <div>Có lỗi khi tải chi tiết biên bản trả phòng</div>
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
                    next.delete('openReturnId');
                    return next;
                },
                { replace: true }
            );
            return;
        }
        setSearchParams(
            (prev: URLSearchParams) => {
                const next = new URLSearchParams(prev);
                next.delete('openReturnId');
                return next;
            },
            { replace: true }
        );
        void handleView(id);
    }, [openIdParam, setSearchParams, handleView]);

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteDeviceReturn(id);
            if (res.data.statusCode === 200) {
                await dispatch(
                    fetchDeviceReturns(
                        buildSpringListQuery({
                            page: meta.page,
                            pageSize: meta.pageSize,
                            filter: combineReturnListFilter(debouncedSearch, filterCheckoutId),
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
                setLoadingCheckoutOpts(true);
                const q = buildSpringListQuery({ page: 1, pageSize: 500 });
                const res = await getAllCheckouts(q);
                if (res.data.statusCode === 200 && res.data.data?.result) {
                    setCheckoutOpts(res.data.data.result);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingCheckoutOpts(false);
            }
        };
        void load();
    }, [canView]);

    const filterStr = useMemo(
        () => combineReturnListFilter(debouncedSearch, filterCheckoutId),
        [debouncedSearch, filterCheckoutId]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(fetchDeviceReturns(buildSpringListQuery({ page, pageSize, filter: filterStr, sort })));
        },
        [dispatch, filterStr]
    );

    useEffect(() => {
        if (!canView) return;
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canView, debouncedSearch, filterCheckoutId, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<IDeviceReturn>['onChange'] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const columns: ColumnsType<IDeviceReturn> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: unknown, __: IDeviceReturn, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: true },
        { title: 'ID biên bản nhận', dataIndex: 'checkoutId', key: 'checkout.id', sorter: true },
        {
            title: 'Người dùng',
            key: 'user',
            render: (_: unknown, r: IDeviceReturn) => r.userEmail || r.userName || '-',
        },
        {
            title: 'Phòng',
            dataIndex: 'assetName',
            key: 'checkout.assetUsage.asset.assetName',
            sorter: true,
            render: (t?: string | null) => t || '-',
        },
        {
            title: 'Ngày đặt phòng',
            dataIndex: 'usageDate',
            key: 'checkout.assetUsage.usageDate',
            sorter: true,
            render: (d?: string) => (d ? formatLocalDate(d) : '-'),
        },
        {
            title: 'Trạng thái lịch đặt',
            dataIndex: 'assetUsageStatus',
            key: 'checkout.assetUsage.status',
            sorter: true,
            render: (s: AssetUsageStatus | undefined) =>
                s ? (
                    <Tag color={ASSET_USAGE_STATUS_META[s]?.color}>{ASSET_USAGE_STATUS_META[s]?.label ?? s}</Tag>
                ) : (
                    '-'
                ),
        },
        {
            title: 'Trả phòng lúc',
            dataIndex: 'returnTime',
            key: 'returnTime',
            sorter: true,
            render: (t: string) => formatInstant(t),
        },
        {
            title: 'Tình trạng',
            dataIndex: 'deviceStatus',
            key: 'deviceStatus',
            sorter: true,
            render: (s: DeviceCondition) => (
                <Tag color={DEVICE_CONDITION_META[s]?.color}>{DEVICE_CONDITION_META[s]?.label ?? s}</Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: unknown, record: IDeviceReturn) => (
                <Space align="center" style={{ justifyContent: 'center', width: '100%' }}>
                    <PermissionWrapper required="RETURN_VIEW_DETAIL">
                        <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>
                    <PermissionWrapper required="RETURN_UPDATE">
                        <RBButton variant="outline-warning" size="sm" onClick={() => handleEdit(record)}>
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>
                    <PermissionWrapper required="RETURN_DELETE">
                        <Popconfirm
                            title="Xóa biên bản trả phòng"
                            description="Bạn có chắc chắn? Trạng thái lịch đặt phòng có thể về Đang sử dụng nếu đang Hoàn thành."
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
        <>
            <AdminWrapper>
                <Card
                    size="small"
                    title="Quản lý biên bản trả phòng"
                    extra={
                        <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Tìm email, phòng"
                                style={{ width: 220 }}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <Select<number>
                                allowClear
                                placeholder="Lọc theo biên bản nhận"
                                style={{ width: 220 }}
                                loading={loadingCheckoutOpts}
                                value={filterCheckoutId}
                                onChange={(v) => setFilterCheckoutId(v ?? undefined)}
                                options={checkoutOpts.map((c) => ({
                                    value: c.id,
                                    label: `#${c.id} — lịch #${c.assetUsageId}`,
                                }))}
                            />
                            <PermissionWrapper required="RETURN_CREATE">
                                <RBButton
                                    variant="outline-primary"
                                    size="sm"
                                    style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                                    onClick={() => setOpenAdd(true)}
                                >
                                    <IoIosAddCircle />
                                    Thêm biên bản trả
                                </RBButton>
                            </PermissionWrapper>
                            <Button
                                icon={<FaDownload />}
                                onClick={() => exportTableToExcel(columns, list, 'returns')}
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
                        required="RETURN_VIEW_LIST"
                        fallback={<Empty description="Bạn không có quyền xem danh sách biên bản trả phòng" />}
                    >
                        <Table<IDeviceReturn>
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

                <ModalAddDeviceReturn openModalAddDeviceReturn={openAdd} setOpenModalAddDeviceReturn={setOpenAdd} />
                <ModalDeviceReturnDetails
                    openModalDeviceReturnDetails={openDetail}
                    setOpenModalDeviceReturnDetails={setOpenDetail}
                    deviceReturn={detail}
                    isLoading={detailLoading}
                />
                <ModalUpdateDeviceReturn
                    openModalUpdateDeviceReturn={openUpdate}
                    setOpenModalUpdateDeviceReturn={setOpenUpdate}
                    returnEdit={returnEdit}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminReturnsPage;
