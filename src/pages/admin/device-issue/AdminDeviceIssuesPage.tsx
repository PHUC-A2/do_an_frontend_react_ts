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
import RBButton from 'react-bootstrap/Button';
import { IoIosAddCircle } from 'react-icons/io';
import { FaDownload } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { FaArrowsToEye } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
    fetchDeviceIssues,
    selectDeviceIssueLoading,
    selectDeviceIssueMeta,
    selectDeviceIssues,
} from '../../../redux/features/deviceIssueSlice';
import type { IDeviceIssue, IssueStatus } from '../../../types/deviceIssue';
import type { IAsset } from '../../../types/asset';
import { deleteDeviceIssue, getAllAssets, getDeviceIssueById } from '../../../config/Api';
import { toast } from 'react-toastify';
import ModalAddDeviceIssue from './modals/ModalAddDeviceIssue';
import ModalDeviceIssueDetails from './modals/ModalDeviceIssueDetails';
import ModalUpdateDeviceIssue from './modals/ModalUpdateDeviceIssue';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import { buildSpringListQuery, type SpringSortItem } from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';
import { tableSorterToSortItems } from '../../../utils/pagination/tableSorterToSpringSort';
import { ISSUE_STATUS_META, ISSUE_STATUS_OPTIONS } from '../../../utils/constants/deviceIssue.constants';

const DEVICE_ISSUE_TEXT_FIELDS = ['description', 'reportedBy', 'device.deviceName', 'asset.assetName'];

/** Gộp filter text + tài sản + trạng thái (spring-filter trên entity DeviceIssue). */
function combineDeviceIssueListFilter(
    keyword: string,
    assetId: number | undefined,
    status: IssueStatus | undefined
): string | undefined {
    const parts: string[] = [];
    const textFilter = orFieldsInsensitiveLike(DEVICE_ISSUE_TEXT_FIELDS, keyword);
    if (textFilter) parts.push(textFilter);
    if (assetId != null && assetId > 0) {
        parts.push(`asset.id==${assetId}`);
    }
    if (status) {
        parts.push(`status : '${status}'`);
    }
    if (parts.length === 0) return undefined;
    return parts.join(' and ');
}

const AdminDeviceIssuesPage = () => {
    const dispatch = useAppDispatch();
    const listIssues = useAppSelector(selectDeviceIssues);
    const meta = useAppSelector(selectDeviceIssueMeta);
    const loading = useAppSelector(selectDeviceIssueLoading);

    const [openModalAdd, setOpenModalAdd] = useState(false);
    const [openDrawerDetails, setOpenDrawerDetails] = useState(false);
    const [openModalUpdate, setOpenModalUpdate] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [issueDetail, setIssueDetail] = useState<IDeviceIssue | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [issueEdit, setIssueEdit] = useState<IDeviceIssue | null>(null);

    const canViewList = usePermission('DEVICE_ISSUE_VIEW_LIST');

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterAssetId, setFilterAssetId] = useState<number | undefined>(undefined);
    const [filterStatus, setFilterStatus] = useState<IssueStatus | undefined>(undefined);
    const [assetsForFilter, setAssetsForFilter] = useState<IAsset[]>([]);
    const [loadingAssetsFilter, setLoadingAssetsFilter] = useState(false);

    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const handleEdit = (data: IDeviceIssue) => {
        setIssueEdit(data);
        setOpenModalUpdate(true);
    };

    const handleView = useCallback(async (id: number) => {
        setIssueDetail(null);
        setIsLoadingDetail(true);
        setOpenDrawerDetails(true);
        try {
            const res = await getDeviceIssueById(id);
            if (res.data.statusCode === 200) {
                setIssueDetail((res.data.data as IDeviceIssue) ?? null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <>
                    <div>Có lỗi khi tải chi tiết sự cố</div>
                    <div>{m}</div>
                </>
            );
        } finally {
            setIsLoadingDetail(false);
        }
    }, []);

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteDeviceIssue(id);
            if (res.data.statusCode === 200) {
                await dispatch(
                    fetchDeviceIssues(
                        buildSpringListQuery({
                            page: meta.page,
                            pageSize: meta.pageSize,
                            filter: combineDeviceIssueListFilter(
                                debouncedSearch,
                                filterAssetId,
                                filterStatus
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
                    <div>Có lỗi xảy ra khi xóa sự cố</div>
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
        if (!canViewList) return;
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
    }, [canViewList]);

    const filterStr = useMemo(
        () => combineDeviceIssueListFilter(debouncedSearch, filterAssetId, filterStatus),
        [debouncedSearch, filterAssetId, filterStatus]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(
                fetchDeviceIssues(buildSpringListQuery({ page, pageSize, filter: filterStr, sort }))
            );
        },
        [dispatch, filterStr]
    );

    useEffect(() => {
        if (!canViewList) return;
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canViewList, debouncedSearch, filterAssetId, filterStatus, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<IDeviceIssue>['onChange'] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const columns: ColumnsType<IDeviceIssue> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: unknown, __: IDeviceIssue, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: true,
        },
        {
            title: 'Thiết bị',
            key: 'device',
            sorter: true,
            render: (_: unknown, r: IDeviceIssue) => `${r.deviceId} — ${r.deviceName ?? ''}`,
        },
        {
            title: 'Tài sản',
            key: 'asset',
            sorter: true,
            render: (_: unknown, r: IDeviceIssue) => `${r.assetId} — ${r.assetName ?? ''}`,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            width: 220,
        },
        {
            title: 'Người báo',
            dataIndex: 'reportedBy',
            key: 'reportedBy',
            sorter: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (s: IssueStatus) => (
                <Tag color={ISSUE_STATUS_META[s]?.color}>{ISSUE_STATUS_META[s]?.label ?? s}</Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: unknown, record: IDeviceIssue) => (
                <Space align="center" style={{ justifyContent: 'center', width: '100%' }}>
                    <PermissionWrapper required="DEVICE_ISSUE_VIEW_DETAIL">
                        <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required="DEVICE_ISSUE_UPDATE">
                        <RBButton variant="outline-warning" size="sm" onClick={() => handleEdit(record)}>
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required="DEVICE_ISSUE_DELETE">
                        <Popconfirm
                            title="Xóa sự cố"
                            description="Bạn có chắc chắn muốn xóa bản ghi này không?"
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
                    title="Quản lý sự cố thiết bị"
                    extra={
                        <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Tìm mô tả, người báo, tên TB / tài sản"
                                style={{ width: 280 }}
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
                            <Select<IssueStatus>
                                allowClear
                                placeholder="Trạng thái"
                                style={{ width: 160 }}
                                value={filterStatus}
                                onChange={(v) => setFilterStatus(v ?? undefined)}
                                options={ISSUE_STATUS_OPTIONS}
                            />
                            <PermissionWrapper required="DEVICE_ISSUE_CREATE">
                                <RBButton
                                    variant="outline-primary"
                                    size="sm"
                                    style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                                    onClick={() => setOpenModalAdd(true)}
                                >
                                    <IoIosAddCircle />
                                    Thêm mới
                                </RBButton>
                            </PermissionWrapper>

                            <Button
                                icon={<FaDownload />}
                                onClick={() => exportTableToExcel(columns, listIssues, 'device-issues')}
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
                        required="DEVICE_ISSUE_VIEW_LIST"
                        fallback={<Empty description="Bạn không có quyền xem danh sách sự cố thiết bị" />}
                    >
                        <Table<IDeviceIssue>
                            columns={columns}
                            dataSource={listIssues}
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

                <ModalAddDeviceIssue openModalAddDeviceIssue={openModalAdd} setOpenModalAddDeviceIssue={setOpenModalAdd} />

                <ModalDeviceIssueDetails
                    openDrawerDeviceIssueDetails={openDrawerDetails}
                    setOpenDrawerDeviceIssueDetails={setOpenDrawerDetails}
                    issue={issueDetail}
                    isLoading={isLoadingDetail}
                />

                <ModalUpdateDeviceIssue
                    openModalUpdateDeviceIssue={openModalUpdate}
                    setOpenModalUpdateDeviceIssue={setOpenModalUpdate}
                    issueEdit={issueEdit}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminDeviceIssuesPage;
