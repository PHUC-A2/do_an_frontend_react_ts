import { Collapse, Descriptions, Drawer, Image, Spin, Typography } from 'antd';
import type { IAsset } from '../../../../types/asset';
import { formatInstant } from '../../../../utils/format/localdatetime';

const { Text } = Typography;

interface IProps {
    setOpenModalAssetDetails: (v: boolean) => void;
    openModalAssetDetails: boolean;
    asset: IAsset | null;
    isLoading: boolean;
}

/** Drawer chi tiết — cùng pattern ModalPitchDetails (Collapse + Descriptions). */
const ModalAssetDetails = (props: IProps) => {
    const { openModalAssetDetails, setOpenModalAssetDetails, asset, isLoading } = props;

    return (
        <Drawer
            title="Chi tiết tài sản"
            placement="right"
            onClose={() => setOpenModalAssetDetails(false)}
            open={openModalAssetDetails}
        >
            <Spin spinning={isLoading}>
                <Collapse
                    defaultActiveKey={['general', 'meta']}
                    items={[
                        {
                            key: 'general',
                            label: 'Thông tin tài sản',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Ảnh tài sản">
                                        {asset?.assetsUrl ? (
                                            <Image
                                                src={asset.assetsUrl}
                                                alt={asset.assetName}
                                                width="100%"
                                                style={{ borderRadius: 6 }}
                                            />
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="ID">{asset?.id ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Tên tài sản">{asset?.assetName ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Người phụ trách phòng">
                                        {asset?.responsibleName ?? 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Vị trí">{asset?.location ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Sức chứa">
                                        {asset?.capacity != null ? <Text>{asset.capacity}</Text> : 'N/A'}
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: 'meta',
                            label: 'Lịch sử cập nhật',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Người tạo">
                                        {asset?.createdBy ? asset.createdBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">{formatInstant(asset?.createdAt)}</Descriptions.Item>
                                    <Descriptions.Item label="Người cập nhật">
                                        {asset?.updatedBy ? asset.updatedBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(asset?.updatedAt)}</Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Drawer>
    );
};

export default ModalAssetDetails;
