import { Spin } from "antd";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { formatDateTime } from "../../../../utils/format/localdatetime";
import type { IPitchTimeline } from "../../../../types/timeline";

interface IProps {
    timelineLoading: boolean;
    timeline       : IPitchTimeline | null;
}

const containerVariants: Variants = {
    hidden : {},
    visible: {
        transition: { staggerChildren: 0.035, delayChildren: 0.05 },
    },
};

const slotVariants: Variants = {
    hidden : { opacity: 0, scale: 0.82, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};

const BookingTime = ({ timelineLoading, timeline }: IProps) => {
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
                    {(!timeline?.slots || timeline.slots.length === 0) ? (
                        <motion.p
                            variants={slotVariants}
                            className="bk__time-empty"
                        >
                            Không có dữ liệu khung giờ cho ngày này
                        </motion.p>
                    ) : (
                        <div className="bk__time-grid">
                            {timeline.slots.map(slot => {
                                const isBusy = slot.status === "BUSY";
                                return (
                                    <motion.div
                                        key={slot.start}
                                        variants={slotVariants}
                                        whileHover={!isBusy ? { scale: 1.05, y: -4 } : {}}
                                        className={`bk__slot bk__slot--${isBusy ? "booked" : "free"}`}
                                    >
                                        <div className="bk__slot__inner">
                                            <div className="bk__slot__time">
                                                {formatDateTime(slot.start, "HH:mm")}
                                            </div>
                                            <div className="bk__slot__label">
                                                {isBusy ? "ĐÃ ĐẶT" : "TRỐNG"}
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
