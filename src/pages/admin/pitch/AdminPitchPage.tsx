import { Table, Tag, Space, Card, Popconfirm, message, type PopconfirmProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect } from 'react';
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

const AdminPitchPage = () => {
    const dispatch = useAppDispatch();

    const listPitches = useAppSelector(selectPitches);
    const meta = useAppSelector(selectPitchMeta);
    const loading = useAppSelector(selectPitchLoading);

    const [messageApi, holder] = message.useMessage();

    const cancel: PopconfirmProps['onCancel'] = () => {
        messageApi.error('Đã bỏ chọn');
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
                <Space>
                    <RBButton variant="outline-info" size="sm">
                        <FaArrowsToEye />
                    </RBButton>

                    <RBButton variant="outline-warning" size="sm">
                        <CiEdit />
                    </RBButton>

                    {holder}

                    <Popconfirm
                        title="Xóa sân"
                        description="Bạn có chắc chắn muốn xóa sân này không?"
                        onCancel={cancel}
                        okText="Có"
                        cancelText="Không"
                    >
                        <RBButton size="sm" variant="outline-danger">
                            <MdDelete />
                        </RBButton>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // fetch list pitches
    useEffect(() => {
        dispatch(fetchPitches("page=1&pageSize=7"));
    }, [dispatch]);

    return (
        <Card
            size="small"
            title="Quản lý sân"
            extra={
                <RBButton
                    variant="outline-primary"
                    size="sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                >
                    <IoIosAddCircle />
                    Thêm mới
                </RBButton>
            }
            hoverable={false}
            style={{
                width: '100%',
                overflowX: 'auto',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
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
        </Card>
    );
};

export default AdminPitchPage;
