import { Descriptions, Drawer, Spin, Tag, Image } from 'antd';
import dayjs from 'dayjs';

import type { IPitch } from '../../../../types/pitch';
import { PITCH_STATUS_META, getPitchTypeLabel } from '../../../../utils/constants/pitch.constants';

interface IProps {
    openModalPitchDetails: boolean;
    setOpenModalPitchDetails: (v: boolean) => void;
    pitch: IPitch | null;
    isLoading: boolean;
}

const ModalPitchDetails = (props: IProps) => {
    const {
        openModalPitchDetails,
        setOpenModalPitchDetails,
        pitch,
        isLoading,
    } = props;

    return (
        <Drawer
            title="Chi tiết sân"
            placement="right"
            closable={false}
            onClose={() => setOpenModalPitchDetails(false)}
            open={openModalPitchDetails}
            // size=
        >
            <Spin spinning={isLoading}>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Ảnh sân">
                        {pitch?.pitchUrl ? (
                            <Image
                                src={pitch.pitchUrl}
                                width="100%"
                                style={{ borderRadius: 6 }}
                            />
                        ) : (
                            'N/A'
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="ID">
                        {pitch?.id ?? 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên sân">
                        {pitch?.name ?? 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Loại sân">
                        {pitch?.pitchType
                            ? getPitchTypeLabel(pitch.pitchType)
                            : 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Giá / giờ">
                        {pitch?.pricePerHour
                            ? pitch.pricePerHour.toLocaleString('vi-VN') + ' đ'
                            : 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {pitch?.status ? (
                            <Tag color={PITCH_STATUS_META[pitch.status].color}>
                                {PITCH_STATUS_META[pitch.status].label}
                            </Tag>
                        ) : (
                            'N/A'
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Giờ hoạt động">
                        {pitch?.open24h
                            ? 'Mở cửa 24h'
                            : `${pitch?.openTime ?? '--'} - ${pitch?.closeTime ?? '--'}`}
                    </Descriptions.Item>

                    <Descriptions.Item label="Địa chỉ">
                        {pitch?.address ?? 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {pitch?.createdBy ?? 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {pitch?.updatedBy ?? 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {pitch?.createdAt
                            ? dayjs(pitch.createdAt).format('DD/MM/YYYY HH:mm:ss')
                            : 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {pitch?.updatedAt
                            ? dayjs(pitch.updatedAt).format('DD/MM/YYYY HH:mm:ss')
                            : 'N/A'}
                    </Descriptions.Item>
                </Descriptions>
            </Spin>
        </Drawer>
    );
};

export default ModalPitchDetails;
