import { Spin } from "antd";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { formatDateTime } from "../../../../utils/format/localdatetime";
import type { IPitchTimeline, SlotStatus } from "../../../../types/timeline";

interface IProps {
    timelineLoading: boolean;
    timeline: IPitchTimeline | null;
}

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.035, delayChildren: 0.05 },
    },
};

const slotVariants: Variants = {
    hidden: { opacity: 0, scale: 0.82, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};

const slotClass = (status: SlotStatus) => {
    if (status === "PENDING") return "pending";
    if (status === "BOOKED") return "booked";
    if (status === "BOOKED_BY_OTHER") return "booked-by-other";
    if (status === "PAST") return "past";
    return "free";
};

const slotLabel = (status: SlotStatus) => {
    if (status === "PENDING") return "BẬN";
    if (status === "BOOKED") return "ĐÃ ĐẶT";
    if (status === "BOOKED_BY_OTHER") return "ĐÃ CÓ NGƯỜI ĐẶT";
    if (status === "PAST") return "ĐÃ QUA";
    return "TRỐNG";
};

interface IDisplaySlot {
    start: string;
    end: string;
    status: SlotStatus;
}

const DISPLAY_SLOT_MINUTES = 5;

const addMinutesToIso = (iso: string, minutes: number) => {
    const dt = new Date(iso);
    return new Date(dt.getTime() + minutes * 60_000).toISOString();
};

const buildFiveMinuteTimeline = (timeline: IPitchTimeline | null): IDisplaySlot[] => {
    if (!timeline?.slots || timeline.slots.length === 0) return [];
    const nowMs = Date.now();

    // Chỉ thay đổi phần HIỂN THỊ: chia mỗi slot backend thành các mốc 5 phút.
    return timeline.slots.flatMap((slot) => {
        const startMs = new Date(slot.start).getTime();
        const endMs = new Date(slot.end).getTime();
        const durationMinutes = Math.max(0, Math.floor((endMs - startMs) / 60_000));
        const chunks = Math.max(1, Math.floor(durationMinutes / DISPLAY_SLOT_MINUTES));

        return Array.from({ length: chunks }, (_, idx) => {
            const start = addMinutesToIso(slot.start, idx * DISPLAY_SLOT_MINUTES);
            const end =
                idx === chunks - 1
                    ? slot.end
                    : addMinutesToIso(slot.start, (idx + 1) * DISPLAY_SLOT_MINUTES);
            const endMs = new Date(end).getTime();
            const isPastByNow = endMs <= nowMs;
            const status: SlotStatus = isPastByNow ? "PAST" : slot.status;
            return {
                start,
                end,
                status,
            };
        });
    });
};

/** Kiểm tra một ISO string có thuộc ngày hôm nay không */
const isSameDay = (iso: string, ref: Date): boolean => {
    const d = new Date(iso);
    return (
        d.getFullYear() === ref.getFullYear() &&
        d.getMonth() === ref.getMonth() &&
        d.getDate() === ref.getDate()
    );
};

const BookingTime = ({ timelineLoading, timeline }: IProps) => {
    const allSlots = buildFiveMinuteTimeline(timeline);

    // Ẩn slot "ĐÃ QUA" chỉ khi đang xem ngày hôm nay
    const today = new Date();
    const displaySlots = allSlots.filter(
        s => !(s.status === "PAST" && isSameDay(s.start, today))
    );

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
                <motion.div
                    key={String(timeline?.slots?.length ?? "empty")}
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    {displaySlots.length === 0 ? (
                        <motion.p
                            variants={slotVariants}
                            className="bk__time-empty"
                        >
                            {allSlots.length > 0
                                ? "Hôm nay không còn khung giờ nào"
                                : "Không có dữ liệu khung giờ cho ngày này"}
                        </motion.p>
                    ) : (
                        <div className="bk__time-grid">
                            {displaySlots.map(slot => {
                                const st = slot.status;
                                const isFree = st === "FREE";
                                return (
                                    <motion.div
                                        key={`${slot.start}-${slot.end}`}
                                        variants={slotVariants}
                                        whileHover={isFree ? { scale: 1.05, y: -4 } : {}}
                                        className={`bk__slot bk__slot--${slotClass(st)}`}
                                    >
                                        <div className="bk__slot__inner">
                                            <div className="bk__slot__time">
                                                {formatDateTime(slot.start, "HH:mm")} – {formatDateTime(slot.end, "HH:mm")}
                                            </div>
                                            <div className="bk__slot__label">
                                                {slotLabel(st)}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BookingTime;
