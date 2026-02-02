import { Spin } from "antd";
import { formatDateTime } from "../../../../utils/format/localdatetime";
import type { IPitchTimeline } from "../../../../types/timeline";


interface IProps {
    timelineLoading: boolean;
    timeline: IPitchTimeline | null;
}

const BookingTime = (props: IProps) => {

    const { timelineLoading, timeline } = props;

    return (
        <>
            {timelineLoading ? (
                <Spin />
            ) : (
                <div className="time-grid-wrapper">
                    <div className="time-grid">
                        {timeline?.slots.map(slot => {
                            const isBusy = slot.status === "BUSY";

                            return (
                                <div
                                    key={slot.start}
                                    className={`time-slot luxury ${isBusy ? "booked" : "free"}`}
                                >
                                    <div className="slot-inner">
                                        <div className="time">
                                            {formatDateTime(slot.start, "HH:mm")}
                                        </div>
                                        <div className="label">
                                            {isBusy ? "ĐÃ ĐẶT" : "TRỐNG"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    )
}

export default BookingTime;

