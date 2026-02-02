import { useCallback, useEffect, useState } from "react";
import type { Dayjs } from "dayjs";

import { message } from "antd";
import { getTimeline } from "../../../../config/Api";
import type { IPitchTimeline } from "../../../../types/timeline";

export const useBookingTimeline = (
    pitchId: number,
    bookingDate: Dayjs | null
) => {
    const [timeline, setTimeline] = useState<IPitchTimeline | null>(null);
    const [timelineLoading, setTimelineLoading] = useState(false);

    const fetchTimeline = useCallback(async () => {
        if (!pitchId || !bookingDate) return;

        setTimelineLoading(true);
        try {
            const res = await getTimeline(
                pitchId,
                bookingDate.format("YYYY-MM-DD")
            );

            if (res.data.statusCode === 200) {
                setTimeline(res.data.data ?? null);
            }
        } catch {
            message.error("Không lấy được timeline");
        } finally {
            setTimelineLoading(false);
        }
    }, [pitchId, bookingDate]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    return {
        timeline,
        timelineLoading,
        reloadTimeline: fetchTimeline,
    };
};
