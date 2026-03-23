import { Spin, Typography } from 'antd';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import dayjs from 'dayjs';

import type { IAssetRoomTimeline } from '../../../../../types/roomTimeline';
import type { SlotStatus } from '../../../../../types/timeline';

const { Text } = Typography;

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

const slotClass = (status: SlotStatus) => {
    if (status === 'BUSY') return 'booked';
    if (status === 'PAST') return 'past';
    return 'free';
};

const slotLabel = (status: SlotStatus) => {
    if (status === 'BUSY') return 'ĐÃ ĐẶT';
    if (status === 'PAST') return 'ĐÃ QUA';
    return 'TRỐNG';
};

const RoomBookingTimeline = ({ timelineLoading, timeline }: IProps) => {
    const viewStart = timeline?.flexibleViewStart ?? '07:00';
    const viewEnd = timeline?.flexibleViewEnd ?? '22:00';
    const totalMinutes = Math.max(dayjs(`2000-01-01T${viewEnd}`).diff(dayjs(`2000-01-01T${viewStart}`), 'minute'), 1);

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
                        <div className="bk__time-grid">
                            {timeline.periods.map((slot) => {
                                const st = slot.status;
                                return (
                                    <motion.div
                                        key={slot.periodIndex}
                                        variants={slotVariants}
                                        className={`bk__slot bk__slot--${slotClass(st)}`}
                                    >
                                        <div className="bk__slot__inner">
                                            <div className="bk__slot__time">
                                                {dayjs(slot.start).format('HH:mm')} - {dayjs(slot.end).format('HH:mm')}
                                            </div>
                                            <div className="bk__slot__label">{slotLabel(st)}</div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div>
                            <div className="room-timeline-panel__flex-track">
                                {(timeline.busyIntervals ?? []).map((it, idx) => {
                                    const start = dayjs(it.start);
                                    const end = dayjs(it.end);
                                    const leftMinutes = Math.max(start.diff(dayjs(`2000-01-01T${viewStart}`), 'minute'), 0);
                                    const widthMinutes = Math.max(end.diff(start, 'minute'), 1);
                                    const leftPct = (leftMinutes / totalMinutes) * 100;
                                    const widthPct = (widthMinutes / totalMinutes) * 100;
                                    return (
                                        <div
                                            key={`${it.start}-${it.end}-${idx}`}
                                            className="room-timeline-panel__flex-busy"
                                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                        />
                                    );
                                })}
                            </div>
                            <div className="room-timeline-panel__flex-labels">
                                <span>{viewStart}</span>
                                <span>{viewEnd}</span>
                            </div>
                            <Text type="secondary">
                                Thanh màu đỏ là khoảng đã có đăng ký. Phần còn lại là khung giờ có thể đặt.
                            </Text>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RoomBookingTimeline;
