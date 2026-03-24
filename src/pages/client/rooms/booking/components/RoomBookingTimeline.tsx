import { Spin, Typography } from 'antd';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import dayjs from 'dayjs';

import type { IAssetRoomTimeline } from '../../../../../types/roomTimeline';
import type { SlotStatus } from '../../../../../types/timeline';

const { Text } = Typography;

/** Timeline chỉ để xem — không click chọn; tiết/giờ đặt chọn ở form bên phải. */
interface IProps {
    timelineLoading: boolean;
    timeline: IAssetRoomTimeline | null;
}

const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
};

const slotVariants: Variants = {
    hidden: { opacity: 0, scale: 0.82, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/** Màu nền/viền slot — tách BẬN / ĐÃ ĐẶT / ĐANG MƯỢN cho cả tiết và linh hoạt. */
const slotModifier = (slot: { status: SlotStatus; busyUsageStatus?: string | null }) => {
    if (slot.status === 'PAST') return 'past';
    if (slot.status === 'FREE') return 'free';
    if (slot.status === 'BUSY') {
        if (slot.busyUsageStatus === 'IN_PROGRESS') return 'booked-inprogress';
        if (slot.busyUsageStatus === 'APPROVED') return 'booked-approved';
        return 'booked-pending';
    }
    return 'free';
};

const slotLabel = (slot: { status: SlotStatus; busyUsageStatus?: string | null }) => {
    if (slot.status === 'BUSY') {
        if (slot.busyUsageStatus === 'IN_PROGRESS') return 'ĐANG MƯỢN';
        if (slot.busyUsageStatus === 'APPROVED') return 'ĐÃ ĐẶT';
        return 'BẬN';
    }
    if (slot.status === 'PAST') return 'ĐÃ QUA';
    return 'TRỐNG';
};

const flexLegend = (timeline: IAssetRoomTimeline) => {
    const hasInProgress = (timeline.slots ?? []).some((it) => it.busyUsageStatus === 'IN_PROGRESS');
    const hasApproved = (timeline.slots ?? []).some((it) => it.busyUsageStatus === 'APPROVED');
    const hasPending = (timeline.slots ?? []).some((it) => it.busyUsageStatus === 'PENDING');
    const parts: string[] = [];
    if (hasPending) parts.push('BẬN (chờ duyệt)');
    if (hasApproved) parts.push('ĐÃ ĐẶT');
    if (hasInProgress) parts.push('ĐANG MƯỢN');
    return parts.length ? `Trạng thái có trong ngày: ${parts.join(' • ')}` : '';
};

const RoomBookingTimeline = ({ timelineLoading, timeline }: IProps) => {
    const viewStart = (timeline?.flexibleViewStart ?? '07:00').slice(0, 5);
    const viewEnd = (timeline?.flexibleViewEnd ?? '22:00').slice(0, 5);

    return (
        <AnimatePresence mode="wait">
            {timelineLoading ? (
                <motion.div
                    key="loading"
                    className="bk__spin-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <Spin size="large" />
                </motion.div>
            ) : (
                <motion.div key={timeline?.mode ?? 'empty'} initial="hidden" animate="visible" variants={containerVariants}>
                    {!timeline ? (
                        <motion.p variants={slotVariants} className="bk__time-empty">
                            Chưa có dữ liệu timeline phòng
                        </motion.p>
                    ) : timeline.mode === 'PERIODS' ? (
                        <div>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>
                                Xem nhanh tiết trống / đã đặt. Chọn tiết đặt phòng ở form &quot;Thông tin đặt phòng&quot; bên phải.
                            </Text>
                            <div className="bk__time-grid">
                                {timeline.periods.map((slot) => {
                                    return (
                                        <motion.div
                                            key={slot.periodIndex}
                                            variants={slotVariants}
                                            className={`bk__slot bk__slot--${slotModifier(slot)}`}
                                        >
                                            <div className="bk__slot__inner">
                                                <div className="bk__slot__time">
                                                    {dayjs(slot.start).format('HH:mm')} - {dayjs(slot.end).format('HH:mm')}
                                                </div>
                                                <div className="bk__slot__label">{slotLabel(slot)}</div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>
                                Timeline theo giờ linh hoạt ({timeline.slotMinutes || 5} phút/slot). Chọn giờ ở form bên phải.
                            </Text>
                            <div className="bk__time-grid">
                                {(timeline.slots ?? []).map((slot) => {
                                    return (
                                        <motion.div
                                            key={`${slot.start}-${slot.end}`}
                                            variants={slotVariants}
                                            className={`bk__slot bk__slot--${slotModifier(slot)}`}
                                        >
                                            <div className="bk__slot__inner">
                                                <div className="bk__slot__time">
                                                    {dayjs(slot.start).format('HH:mm')} - {dayjs(slot.end).format('HH:mm')}
                                                </div>
                                                <div className="bk__slot__label">{slotLabel(slot)}</div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <Text type="secondary">
                                Khung giờ mở: {viewStart} - {viewEnd}.{' '}
                                {timeline ? flexLegend(timeline) : ''}
                            </Text>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RoomBookingTimeline;
