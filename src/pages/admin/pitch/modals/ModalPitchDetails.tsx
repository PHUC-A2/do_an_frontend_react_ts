import { Descriptions, Drawer, Spin, Tag, Image } from 'antd';

import type { IPitch } from '../../../../types/pitch';
import { PITCH_STATUS_META, getPitchTypeLabel } from '../../../../utils/constants/pitch.constants';
import { formatInstant } from '../../../../utils/format/localdatetime';
import { Button } from 'react-bootstrap';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { formatVND } from '../../../../utils/format/price';

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
                            ? formatVND(pitch.pricePerHour)
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
                        {pitch?.createdBy ? pitch.createdBy : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                        {formatInstant(pitch?.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {pitch?.updatedBy ? pitch.updatedBy : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">
                        {formatInstant(pitch?.updatedAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mở map chỉ đường">
                        <Button
                            variant="outline-info"
                            onClick={() => {
                                if (pitch?.latitude == null || pitch?.longitude == null) return;

                                const url = `https://www.google.com/maps/dir/?api=1&destination=${pitch.latitude},${pitch.longitude}`;
                                window.open(url, '_blank');
                            }}
                            disabled={pitch?.latitude == null || pitch?.longitude == null}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <FaMapMarkerAlt />
                            <span>Chỉ đường</span>
                        </Button>
                    </Descriptions.Item>

                    
                </Descriptions>
            </Spin>
        </Drawer>
    );
};

export default ModalPitchDetails;
