import { Collapse, Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import type { ICheckout } from '../../../../types/checkout';
import { formatInstant, formatLocalDate } from '../../../../utils/format/localdatetime';
import { ASSET_USAGE_STATUS_META, ASSET_USAGE_TYPE_META } from '../../../../utils/constants/assetUsage.constants';

const { Text } = Typography;

interface IProps {
    setOpenModalCheckoutDetails: (v: boolean) => void;
    openModalCheckoutDetails: boolean;
    checkout: ICheckout | null;
    isLoading: boolean;
}

const ModalCheckoutDetails = (props: IProps) => {
    const { openModalCheckoutDetails, setOpenModalCheckoutDetails, checkout, isLoading } = props;

    return (
        <Drawer
            title="Chi tiết phiếu nhận tài sản"
            placement="right"
            onClose={() => setOpenModalCheckoutDetails(false)}
            open={openModalCheckoutDetails}
        >
            <Spin spinning={isLoading}>
                <Collapse
                    defaultActiveKey={['usage', 'checkout', 'meta']}
                    items={[
                        {
                            key: 'usage',
                            label: 'Đăng ký liên quan',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="ID đăng ký">{checkout?.assetUsageId ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Người dùng">
                                        {checkout?.userId != null ? (
                                            <Text>
                                                #{checkout.userId} — {checkout.userEmail ?? checkout.userName ?? ''}
                                            </Text>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tài sản">
                                        {checkout?.assetId != null ? (
                                            <Text>
                                                #{checkout.assetId} — {checkout.assetName ?? ''}
                                            </Text>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Loại usage">
                                        {checkout?.usageType ? (
                                            <Tag color={ASSET_USAGE_TYPE_META[checkout.usageType]?.color}>
                                                {ASSET_USAGE_TYPE_META[checkout.usageType]?.label}
                                            </Tag>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày / giờ đăng ký">
                                        {checkout?.usageDate
                                            ? `${formatLocalDate(checkout.usageDate)} ${checkout.startTime ?? ''} → ${checkout.endTime ?? ''}`
                                            : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mục đích">{checkout?.subject ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái đăng ký">
                                        {checkout?.assetUsageStatus ? (
                                            <Tag color={ASSET_USAGE_STATUS_META[checkout.assetUsageStatus]?.color}>
                                                {ASSET_USAGE_STATUS_META[checkout.assetUsageStatus]?.label}
                                            </Tag>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: 'checkout',
                            label: 'Phiếu nhận',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="ID phiếu">{checkout?.id ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Thời điểm nhận">
                                        {formatInstant(checkout?.receiveTime)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tình trạng ban đầu">
                                        {checkout?.conditionNote ?? 'N/A'}
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: 'meta',
                            label: 'Lịch sử',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Người tạo">
                                        {checkout?.createdBy ? checkout.createdBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">{formatInstant(checkout?.createdAt)}</Descriptions.Item>
                                    <Descriptions.Item label="Người cập nhật">
                                        {checkout?.updatedBy ? checkout.updatedBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(checkout?.updatedAt)}</Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Drawer>
    );
};

export default ModalCheckoutDetails;
