import { CalendarOutlined } from '@ant-design/icons';
import { Card, DatePicker, Spin, Switch, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useMemo, useState } from 'react';

import { formatDateTime } from '../../../../utils/format/localdatetime';
import type { SlotStatus } from '../../../../types/timeline';
import { useRoomTimeline } from '../hooks/useRoomTimeline';

import './RoomTimelinePanel.scss';

const { Text, Title } = Typography;

interface RoomTimelinePanelProps {
    assetId: number;
}

/**
 * Ghép ngày đang xem với giờ mở cửa sổ (LocalTime từ API) để tính vị trí thanh timeline linh hoạt.
 */
const atTimeOnDate = (calendarDay: Dayjs, timeStr: string) => {
    const normalized = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    return dayjs(`${calendarDay.format('YYYY-MM-DD')}T${normalized}`);
};

/** Ánh xạ trạng thái slot sang hậu tố class SCSS (free | busy | past). */
const slotClassSuffix = (status: SlotStatus) => {
    if (status === 'BUSY') return 'busy';
    if (status === 'PAST') return 'past';
    return 'free';
};

/** Nhãn tiếng Việt thống nhất với màn đặt sân (TRỐNG / ĐÃ ĐẶT / ĐÃ QUA). */
const slotStatusLabelVi = (status: SlotStatus) => {
    if (status === 'BUSY') return 'ĐÃ ĐẶT';
    if (status === 'PAST') return 'ĐÃ QUA';
    return 'TRỐNG';
};

type FlexSeg = { left: number; width: number; key: string };

/**
 * Tính % left/width cho các khoảng bận trong thanh [viewStart, viewEnd] — cắt phần nằm ngoài cửa sổ.
 */
const buildFlexibleSegments = (
    calendarDay: Dayjs,
    viewStartStr: string,
    viewEndStr: string,
    busy: { start: string; end: string }[]
): FlexSeg[] => {
    const viewStart = atTimeOnDate(calendarDay, viewStartStr);
    const viewEnd = atTimeOnDate(calendarDay, viewEndStr);
    const totalMin = viewEnd.diff(viewStart, 'minute', true);
    if (totalMin <= 0) return [];

    const out: FlexSeg[] = [];
    busy.forEach((b, i) => {
        const s = dayjs(b.start);
        const e = dayjs(b.end);
        const clipStart = s.isBefore(viewStart) ? viewStart : s;
        const clipEnd = e.isAfter(viewEnd) ? viewEnd : e;
        if (!clipEnd.isAfter(clipStart)) return;
        const left = (clipStart.diff(viewStart, 'minute', true) / totalMin) * 100;
        const width = (clipEnd.diff(clipStart, 'minute', true) / totalMin) * 100;
        out.push({ left, width, key: `${b.start}-${b.end}-${i}` });
    });
    return out;
};

/** Khối lịch phòng: chọn ngày, bật/tắt xem theo tiết vs giờ linh hoạt — gọi API public room-timeline. */
const RoomTimelinePanel: React.FC<RoomTimelinePanelProps> = ({ assetId }) => {
    const [bookingDate, setBookingDate] = useState<Dayjs>(() => dayjs());
    const [flexMode, setFlexMode] = useState(false);
    const mode = flexMode ? 'FLEXIBLE' : 'PERIODS';

    const { timeline, timelineLoading } = useRoomTimeline(assetId, bookingDate, mode);

    const flexSegments = useMemo(() => {
        if (!timeline || timeline.mode !== 'FLEXIBLE') return [];
        return buildFlexibleSegments(
            bookingDate,
            timeline.flexibleViewStart,
            timeline.flexibleViewEnd,
            timeline.busyIntervals ?? []
        );
    }, [timeline, bookingDate]);

    return (
        <Card className="booking-card-glass" styles={{ body: { paddingTop: 16 } }}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
                <CalendarOutlined /> Lịch phòng theo ngày
            </Title>

            <div className="room-timeline-panel">
                <div className="room-timeline-panel__toolbar">
                    <DatePicker
                        className="room-timeline-panel__picker"
                        value={bookingDate}
                        onChange={(d) => d && setBookingDate(d)}
                        allowClear={false}
                        format="DD/MM/YYYY"
                    />
                    <div className="room-timeline-panel__mode">
                        <Text type="secondary">Theo 10 tiết</Text>
                        <Switch checked={flexMode} onChange={setFlexMode} />
                        <Text type="secondary">Giờ linh hoạt</Text>
                    </div>
                    <Text type="secondary" className="room-timeline-panel__hint">
                        {flexMode
                            ? 'Khoảng đỏ là thời gian đã có đăng ký; phần còn lại có thể chọn khi đặt phòng (sau khi đăng nhập).'
                            : 'Mỗi ô là một tiết (50 phút); ô xanh là còn trống trong ngày đã chọn.'}
                    </Text>
                </div>

                {timelineLoading ? (
                    <div style={{ textAlign: 'center', padding: 32 }}>
                        <Spin />
                    </div>
                ) : !timeline ? (
                    <Text type="secondary">Chưa có dữ liệu lịch.</Text>
                ) : timeline.mode === 'PERIODS' ? (
                    !timeline.periods?.length ? (
                        <Text type="secondary">Không có dữ liệu tiết cho ngày này.</Text>
                    ) : (
                        <div className="room-timeline-panel__grid">
                            {timeline.periods.map((p) => {
                                const st = p.status;
                                const suf = slotClassSuffix(st);
                                return (
                                    <div
                                        key={p.periodIndex}
                                        className={`room-timeline-panel__slot room-timeline-panel__slot--${suf}`}
                                    >
                                        <div className="room-timeline-panel__slot-label">{p.label}</div>
                                        <div className="room-timeline-panel__slot-time">
                                            {formatDateTime(p.start, 'HH:mm')} – {formatDateTime(p.end, 'HH:mm')}
                                        </div>
                                        <div className="room-timeline-panel__slot-status">{slotStatusLabelVi(st)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    <div className="room-timeline-panel__flex-wrap">
                        <div className="room-timeline-panel__flex-track">
                            {flexSegments.map((seg) => (
                                <div
                                    key={seg.key}
                                    className="room-timeline-panel__flex-busy"
                                    style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
                                    title="Đã đặt"
                                />
                            ))}
                        </div>
                        <div className="room-timeline-panel__flex-labels">
                            <span>{atTimeOnDate(bookingDate, timeline.flexibleViewStart).format('HH:mm')}</span>
                            <span>{atTimeOnDate(bookingDate, timeline.flexibleViewEnd).format('HH:mm')}</span>
                        </div>
                        <div className="room-timeline-panel__legend">
                            <span className="room-timeline-panel__legend-item">
                                <span className="room-timeline-panel__swatch room-timeline-panel__swatch--free" />
                                Khoảng trống (có thể đặt)
                            </span>
                            <span className="room-timeline-panel__legend-item">
                                <span className="room-timeline-panel__swatch room-timeline-panel__swatch--busy" />
                                Đã có đăng ký
                            </span>
                        </div>
                        {!timeline.busyIntervals?.length ? (
                            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                Chưa có khung giờ đã đặt trong khoảng hiển thị.
                            </Text>
                        ) : null}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default RoomTimelinePanel;
