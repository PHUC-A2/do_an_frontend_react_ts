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
    fetchCheckouts,
    selectCheckoutLoading,
    selectCheckoutMeta,
    selectCheckouts,
} from '../../../redux/features/checkoutSlice';
import type { IAssetUsage } from '../../../types/assetUsage';
import type { ICheckout } from '../../../types/checkout';
import { deleteCheckout, getAllAssetUsages, getCheckoutById } from '../../../config/Api';
import { toast } from 'react-toastify';
import ModalAddCheckout from './modals/ModalAddCheckout';
import ModalCheckoutDetails from './modals/ModalCheckoutDetails';
import ModalUpdateCheckout from './modals/ModalUpdateCheckout';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import { buildSpringListQuery, type SpringSortItem } from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';
import { tableSorterToSortItems } from '../../../utils/pagination/tableSorterToSpringSort';
import { formatInstant, formatLocalDate } from '../../../utils/format/localdatetime';
import { ASSET_USAGE_STATUS_META } from '../../../utils/constants/assetUsage.constants';
import type { AssetUsageStatus } from '../../../types/assetUsage';

const CHECKOUT_TEXT_FIELDS = [
    'assetUsage.user.email',
    'assetUsage.user.name',
    'assetUsage.asset.assetName',
    'assetUsage.subject',
    'conditionNote',
];

function combineCheckoutListFilter(keyword: string, assetUsageId: number | undefined): string | undefined {
    const parts: string[] = [];
    const textFilter = orFieldsInsensitiveLike(CHECKOUT_TEXT_FIELDS, keyword);
    if (textFilter) parts.push(textFilter);
    if (assetUsageId != null && assetUsageId > 0) {
        parts.push(`assetUsage.id==${assetUsageId}`);
    }
    if (parts.length === 0) return undefined;
    return parts.join(' and ');
}

const AdminCheckoutPage = () => {
    const dispatch = useAppDispatch();
    const list = useAppSelector(selectCheckouts);
    const meta = useAppSelector(selectCheckoutMeta);
    const loading = useAppSelector(selectCheckoutLoading);

    const [openAdd, setOpenAdd] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [detail, setDetail] = useState<ICheckout | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [checkoutEdit, setCheckoutEdit] = useState<ICheckout | null>(null);

    const canView = usePermission('CHECKOUT_VIEW_LIST');

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterAssetUsageId, setFilterAssetUsageId] = useState<number | undefined>(undefined);
    const [usageOpts, setUsageOpts] = useState<IAssetUsage[]>([]);
    const [loadingUsageOpts, setLoadingUsageOpts] = useState(false);

    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const [searchParams, setSearchParams] = useSearchParams();
    const openIdParam = searchParams.get('openCheckoutId');

    const handleEdit = (row: ICheckout) => {
        setCheckoutEdit(row);
        setOpenUpdate(true);
    };

    const handleView = useCallback(async (id: number) => {
        setDetail(null);
        setDetailLoading(true);
        setOpenDetail(true);
        try {
            const res = await getCheckoutById(id);
            if (res.data.statusCode === 200) {
                setDetail((res.data.data as ICheckout) ?? null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <>
                    <div>Có lỗi khi tải chi tiết phiếu nhận</div>
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
                    next.delete('openCheckoutId');
                    return next;
                },
                { replace: true }
            );
            return;
        }
        setSearchParams(
            (prev: URLSearchParams) => {
                const next = new URLSearchParams(prev);
                next.delete('openCheckoutId');
                return next;
            },
            { replace: true }
        );
        void handleView(id);
    }, [openIdParam, setSearchParams, handleView]);

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteCheckout(id);
            if (res.data.statusCode === 200) {
                await dispatch(
                    fetchCheckouts(
                        buildSpringListQuery({
                            page: meta.page,
                            pageSize: meta.pageSize,
                            filter: combineCheckoutListFilter(debouncedSearch, filterAssetUsageId),
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
                setLoadingUsageOpts(true);
                const q = buildSpringListQuery({ page: 1, pageSize: 500 });
                const res = await getAllAssetUsages(q);
                if (res.data.statusCode === 200 && res.data.data?.result) {
                    setUsageOpts(res.data.data.result);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingUsageOpts(false);
            }
        };
        void load();
    }, [canView]);

    const filterStr = useMemo(
        () => combineCheckoutListFilter(debouncedSearch, filterAssetUsageId),
        [debouncedSearch, filterAssetUsageId]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(fetchCheckouts(buildSpringListQuery({ page, pageSize, filter: filterStr, sort })));
        },
        [dispatch, filterStr]
    );

    useEffect(() => {
        if (!canView) return;
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canView, debouncedSearch, filterAssetUsageId, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<ICheckout>['onChange'] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const columns: ColumnsType<ICheckout> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: unknown, __: ICheckout, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: true },
        { title: 'ID đăng ký', dataIndex: 'assetUsageId', key: 'assetUsage.id', sorter: true },
        {
            title: 'User',
            key: 'user',
            render: (_: unknown, r: ICheckout) => r.userEmail || r.userName || '-',
        },
        {
            title: 'Tài sản',
            dataIndex: 'assetName',
            key: 'assetUsage.asset.assetName',
            sorter: true,
            render: (t?: string | null) => t || '-',
        },
        {
            title: 'Ngày usage',
            dataIndex: 'usageDate',
            key: 'assetUsage.usageDate',
            sorter: true,
            render: (d?: string) => (d ? formatLocalDate(d) : '-'),
        },
        {
            title: 'Trạng thái đ.ký',
            dataIndex: 'assetUsageStatus',
            key: 'assetUsage.status',
            sorter: true,
            render: (s: AssetUsageStatus | undefined) =>
                s ? (
                    <Tag color={ASSET_USAGE_STATUS_META[s]?.color}>{ASSET_USAGE_STATUS_META[s]?.label ?? s}</Tag>
                ) : (
                    '-'
                ),
        },
        {
            title: 'Nhận lúc',
            dataIndex: 'receiveTime',
            key: 'receiveTime',
            sorter: true,
            render: (t: string) => formatInstant(t),
        },
        {
            title: 'Ghi chú',
            dataIndex: 'conditionNote',
            key: 'conditionNote',
            ellipsis: true,
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: unknown, record: ICheckout) => (
                <Space align="center" style={{ justifyContent: 'center', width: '100%' }}>
                    <PermissionWrapper required="CHECKOUT_VIEW_DETAIL">
                        <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>
                    <PermissionWrapper required="CHECKOUT_UPDATE">
                        <RBButton variant="outline-warning" size="sm" onClick={() => handleEdit(record)}>
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>
                    <PermissionWrapper required="CHECKOUT_DELETE">
                        <Popconfirm
                            title="Xóa phiếu nhận"
                            description="Bạn có chắc chắn muốn xóa? Trạng thái đăng ký có thể được hoàn về Đã duyệt nếu đang Đang dùng."
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
                    title="Phiếu nhận tài sản (Checkout)"
                    extra={
                        <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Tìm email, tài sản, mục đích, ghi chú"
                                style={{ width: 240 }}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <Select<number>
                                allowClear
                                placeholder="Lọc theo đăng ký"
                                style={{ width: 220 }}
                                loading={loadingUsageOpts}
                                value={filterAssetUsageId}
                                onChange={(v) => setFilterAssetUsageId(v ?? undefined)}
                                options={usageOpts.map((u) => ({
                                    value: u.id,
                                    label: `#${u.id} — ${u.assetName ?? ''} — ${u.date}`,
                                }))}
                            />
                            <PermissionWrapper required="CHECKOUT_CREATE">
                                <RBButton
                                    variant="outline-primary"
                                    size="sm"
                                    style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                                    onClick={() => setOpenAdd(true)}
                                >
                                    <IoIosAddCircle />
                                    Thêm phiếu nhận
                                </RBButton>
                            </PermissionWrapper>
                            <Button
                                icon={<FaDownload />}
                                onClick={() => exportTableToExcel(columns, list, 'checkouts')}
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
                        required="CHECKOUT_VIEW_LIST"
                        fallback={<Empty description="Bạn không có quyền xem danh sách phiếu nhận tài sản" />}
                    >
                        <Table<ICheckout>
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

                <ModalAddCheckout openModalAddCheckout={openAdd} setOpenModalAddCheckout={setOpenAdd} />
                <ModalCheckoutDetails
                    openModalCheckoutDetails={openDetail}
                    setOpenModalCheckoutDetails={setOpenDetail}
                    checkout={detail}
                    isLoading={detailLoading}
                />
                <ModalUpdateCheckout
                    openModalUpdateCheckout={openUpdate}
                    setOpenModalUpdateCheckout={setOpenUpdate}
                    checkoutEdit={checkoutEdit}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminCheckoutPage;
