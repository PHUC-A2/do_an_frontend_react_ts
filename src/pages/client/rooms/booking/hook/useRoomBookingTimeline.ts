import { message } from 'antd';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useState } from 'react';

import { getAssetRoomTimeline } from '../../../../../config/Api';
import type { IAssetRoomTimeline, RoomTimelineMode } from '../../../../../types/roomTimeline';

export const useRoomBookingTimeline = (
    assetId: number,
    bookingDate: Dayjs | null,
    mode: RoomTimelineMode
) => {
    const [timeline, setTimeline] = useState<IAssetRoomTimeline | null>(null);
    const [timelineLoading, setTimelineLoading] = useState(false);

    const fetchTimeline = useCallback(async () => {
        if (!assetId || !bookingDate) return;
        setTimelineLoading(true);
        try {
            const res = await getAssetRoomTimeline(assetId, bookingDate.format('YYYY-MM-DD'), mode);
            if (res.data.statusCode === 200) {
                setTimeline(res.data.data ?? null);
            }
        } catch {
            message.error('Không lấy được timeline phòng');
        } finally {
            setTimelineLoading(false);
        }
    }, [assetId, bookingDate, mode]);

    useEffect(() => {
        void fetchTimeline();
    }, [fetchTimeline]);

    return { timeline, timelineLoading, reloadTimeline: fetchTimeline };
};
