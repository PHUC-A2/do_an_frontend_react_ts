import {
    Avatar,
    Button,
    Card,
    Empty,
    Popconfirm,
    type PopconfirmProps,
    Space,
    Table,
    Input,
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
import { AppstoreOutlined } from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
    fetchAssets,
    selectAssetLoading,
    selectAssetMeta,
    selectAssets,
} from '../../../redux/features/assetSlice';
import type { IAsset } from '../../../types/asset';
import { deleteAsset, getAssetById } from '../../../config/Api';
import { toast } from 'react-toastify';
import ModalAddAsset from './modals/ModalAddAsset';
import ModalAssetDetails from './modals/ModalAssetDetails';
import ModalUpdateAsset from './modals/ModalUpdateAsset';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { usePermission } from '../../../hooks/common/usePermission';
import { exportTableToExcel } from '../../../utils/export/exportExcelFromTable';
import {
    buildSpringListQuery,
    type SpringSortItem,
} from '../../../utils/pagination/buildSpringPageQuery';
import { orFieldsInsensitiveLike } from '../../../utils/pagination/springFilterText';
import { tableSorterToSortItems } from '../../../utils/pagination/tableSorterToSpringSort';

const AdminAssetPage = () => {
    const dispatch = useAppDispatch();
    const listAssets = useAppSelector(selectAssets);
    const meta = useAppSelector(selectAssetMeta);
    const loading = useAppSelector(selectAssetLoading);

    const [openModalAddAsset, setOpenModalAddAsset] = useState(false);
    const [openModalAssetDetails, setOpenModalAssetDetails] = useState(false);
    const [openModalUpdateAsset, setOpenModalUpdateAsset] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [asset, setAsset] = useState<IAsset | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [assetEdit, setAssetEdit] = useState<IAsset | null>(null);

    const canViewAssets = usePermission('ASSET_VIEW_LIST');

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortItems, setSortItems] = useState<SpringSortItem[]>([]);
    const sortRef = useRef<SpringSortItem[]>([]);
    sortRef.current = sortItems;

    const [searchParams, setSearchParams] = useSearchParams();
    const openAssetIdParam = searchParams.get('openAssetId');

    const handleEdit = (data: IAsset) => {
        setAssetEdit(data);
        setOpenModalUpdateAsset(true);
    };

    const handleView = useCallback(async (id: number) => {
        setAsset(null);
        setIsLoading(true);
        setOpenModalAssetDetails(true);
        try {
            const res = await getAssetById(id);
            if (res.data.statusCode === 200) {
                setAsset(res.data.data ?? null);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(
                <>
                    <div>Có lỗi khi tải chi tiết tài sản</div>
                    <div>{m}</div>
                </>
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    /** Mở drawer chi tiết từ query (cùng pattern AdminPitchPage + openPitchId). */
    useEffect(() => {
        if (!openAssetIdParam) return;
        const id = Number(openAssetIdParam);
        if (Number.isNaN(id) || id <= 0) {
            setSearchParams(
                (prev: URLSearchParams) => {
                    const next = new URLSearchParams(prev);
                    next.delete('openAssetId');
                    return next;
                },
                { replace: true }
            );
            return;
        }
        setSearchParams(
            (prev: URLSearchParams) => {
                const next = new URLSearchParams(prev);
                next.delete('openAssetId');
                return next;
            },
            { replace: true }
        );
        void handleView(id);
    }, [openAssetIdParam, setSearchParams, handleView]);

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const res = await deleteAsset(id);
            if (res.data.statusCode === 200) {
                await dispatch(
                    fetchAssets(
                        buildSpringListQuery({
                            page: meta.page,
                            pageSize: meta.pageSize,
                            filter: orFieldsInsensitiveLike(['assetName', 'location'], debouncedSearch),
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
                    <div>Có lỗi xảy ra khi xóa tài sản</div>
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

    const filterStr = useMemo(
        () => orFieldsInsensitiveLike(['assetName', 'location'], debouncedSearch),
        [debouncedSearch]
    );

    const fetchPage = useCallback(
        (page: number, pageSize: number, sort: SpringSortItem[]) => {
            dispatch(fetchAssets(buildSpringListQuery({ page, pageSize, filter: filterStr, sort })));
        },
        [dispatch, filterStr]
    );

    useEffect(() => {
        if (!canViewAssets) return;
        fetchPage(1, meta.pageSize, sortRef.current);
    }, [canViewAssets, debouncedSearch, fetchPage, meta.pageSize]);

    const handleTableChange: TableProps<IAsset>['onChange'] = (pag, _f, sorter) => {
        const nextSort = tableSorterToSortItems(sorter);
        setSortItems(nextSort);
        fetchPage(pag?.current ?? 1, pag?.pageSize ?? meta.pageSize, nextSort);
    };

    const columns: ColumnsType<IAsset> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: unknown, __: IAsset, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: true,
        },
        {
            title: 'Ảnh',
            key: 'assetsUrl',
            render: (_: unknown, r: IAsset) => (
                <Avatar
                    size={40}
                    shape="square"
                    src={r.assetsUrl || undefined}
                    icon={!r.assetsUrl && <AppstoreOutlined />}
                    style={{ background: '#2C3E50', flexShrink: 0 }}
                />
            ),
        },
        {
            title: 'Tên tài sản',
            dataIndex: 'assetName',
            key: 'assetName',
            sorter: true,
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Vị trí',
            dataIndex: 'location',
            key: 'location',
            sorter: true,
            render: (text?: string | null) => text || '-',
        },
        {
            title: 'Sức chứa',
            dataIndex: 'capacity',
            key: 'capacity',
            sorter: true,
            render: (c: number | null | undefined) => (c != null ? String(c) : '-'),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: unknown, record: IAsset) => (
                <Space align="center" style={{ justifyContent: 'center', width: '100%' }}>
                    <PermissionWrapper required="ASSET_VIEW_DETAIL">
                        <RBButton variant="outline-info" size="sm" onClick={() => handleView(record.id)}>
                            <FaArrowsToEye />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required="ASSET_UPDATE">
                        <RBButton variant="outline-warning" size="sm" onClick={() => handleEdit(record)}>
                            <CiEdit />
                        </RBButton>
                    </PermissionWrapper>

                    <PermissionWrapper required="ASSET_DELETE">
                        <Popconfirm
                            title="Xóa tài sản"
                            description="Bạn có chắc chắn muốn xóa tài sản này không?"
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
                    title="Quản lý tài sản (Asset)"
                    extra={
                        <Space align="center" wrap>
                            <Input.Search
                                allowClear
                                placeholder="Tìm tên / vị trí"
                                style={{ width: 240 }}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <PermissionWrapper required="ASSET_CREATE">
                                <RBButton
                                    variant="outline-primary"
                                    size="sm"
                                    style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                                    onClick={() => setOpenModalAddAsset(true)}
                                >
                                    <IoIosAddCircle />
                                    Thêm mới
                                </RBButton>
                            </PermissionWrapper>

                            <Button
                                icon={<FaDownload />}
                                onClick={() => exportTableToExcel(columns, listAssets, 'assets')}
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
                        required="ASSET_VIEW_LIST"
                        fallback={<Empty description="Bạn không có quyền xem danh sách tài sản" />}
                    >
                        <Table<IAsset>
                            columns={columns}
                            dataSource={listAssets}
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

                <ModalAddAsset openModalAddAsset={openModalAddAsset} setOpenModalAddAsset={setOpenModalAddAsset} />

                <ModalAssetDetails
                    openModalAssetDetails={openModalAssetDetails}
                    setOpenModalAssetDetails={setOpenModalAssetDetails}
                    asset={asset}
                    isLoading={isLoading}
                />

                <ModalUpdateAsset
                    openModalUpdateAsset={openModalUpdateAsset}
                    setOpenModalUpdateAsset={setOpenModalUpdateAsset}
                    assetEdit={assetEdit}
                />
            </AdminWrapper>
        </>
    );
};

export default AdminAssetPage;
