import { Space, Spin, Tag, Typography } from "antd";
import { IoMdClock } from "react-icons/io";
import { formatDateTime } from "../../../../utils/format/localdatetime";
import type { IPitchTimeline } from "../../../../types/timeline";

const { Title } = Typography;

interface IProps {
    timelineLoading: boolean;
    timeline: IPitchTimeline | null;
}

const BookingTime = (props: IProps) => {

    const { timelineLoading, timeline } = props;

    return (
        <>
            <Title level={5}>
                <Space>
                    <IoMdClock size={22} />
                    <span>Timeline</span>
                </Space>
            </Title>

            <Space style={{ marginBottom: 12 }}>
                <Tag color="green">Trống</Tag>
                <Tag color="red">Đã đặt</Tag>
            </Space>

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

