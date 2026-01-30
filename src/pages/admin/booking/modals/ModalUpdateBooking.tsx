import { DatePicker, InputNumber, Modal, Select} from 'antd';
import { Form, Input } from 'antd';
import { updateBooking } from '../../../../config/Api';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch } from '../../../../redux/hooks';
import type { IBooking, IUpdateBookingReq, ShirtOptionEnum } from '../../../../types/booking';
import { SHIRT_OPTION_OPTIONS } from '../../../../utils/constants/booking.constants';
import dayjs, { Dayjs } from 'dayjs';
import { fetchBookings } from '../../../../redux/features/bookingSlice';

interface IProps {
    openModalUpdateBooking: boolean;
    setOpenModalUpdateBooking: (v: boolean) => void;
    bookingEdit: IBooking | null;
}

type BookingFormValues = {
    pitchId: number;
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
    dateTimeRange: [Dayjs, Dayjs];
};

const ModalUpdateBooking = (props: IProps) => {
    const { openModalUpdateBooking, setOpenModalUpdateBooking, bookingEdit } = props;
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();

    const handleEditBooking = async (values: BookingFormValues) => {
        try {
            if (!bookingEdit?.id) {
                toast.error("ID đặt sân không hợp lệ");
                return;
            }

            const [start, end] = values.dateTimeRange;

            const payload: IUpdateBookingReq = {
                pitchId: values.pitchId,
                shirtOption: values.shirtOption,
                contactPhone: values.contactPhone,
                startDateTime: start.format("YYYY-MM-DDTHH:mm:ss"),
                endDateTime: end.format("YYYY-MM-DDTHH:mm:ss"),
            };


            const res = await updateBooking(bookingEdit.id, payload);

            if (res.data.statusCode === 200) {
                toast.success("Cập nhật người dùng thành công");
                form.resetFields();
                await dispatch(fetchBookings(""));
                setOpenModalUpdateBooking(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra!</div>
                    <div>{m}</div>
                </div>
            );
        }
    };


    useEffect(() => {
        if (!bookingEdit) return;

        form.resetFields(); // reset data

        form.setFieldsValue({
            pitchId: bookingEdit.pitchId,
            startDateTime: bookingEdit.startDateTime,
            dateTimeRange: [
                dayjs(bookingEdit.startDateTime),
                dayjs(bookingEdit.endDateTime),
            ],
            shirtOption: bookingEdit.shirtOption,
            contactPhone: bookingEdit.contactPhone,

        });
    }, [bookingEdit]);

    return (
        <>
            <Modal
                title="Cập nhật lịch đặt sân"
                maskClosable={false}
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={openModalUpdateBooking}
                okText="Lưu"
                onOk={() => form.submit()}
                onCancel={() => setOpenModalUpdateBooking(false)}
                cancelText="Hủy"
            >
                <div>
                    <hr />
                    <Form
                        form={form}
                        onFinish={handleEditBooking}
                        layout='vertical'
                        autoComplete="off"
                    >

                        <Form.Item
                            label="ID sân"
                            name="pitchId"
                            rules={[{ required: true, message: 'Vui lòng nhập Id sân!' }]}
                        >
                            <InputNumber
                                style={{
                                    width: "100%"
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Thời gian đặt sân"
                            name="dateTimeRange"
                            rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
                        >
                            <DatePicker.RangePicker
                                showTime={{ format: 'HH:mm' }}
                                format="YYYY-MM-DD HH:mm"
                                style={{ width: '100%' }}
                                placeholder={["Thời gian bắt đầu", "Thời gian kết thúc"]}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Áo pitch"
                            name="shirtOption"
                            rules={[{ required: true, message: 'Vui lòng chọn loại áo!' }]}
                        >
                            <Select
                                placeholder="Chọn loại áo"
                                options={SHIRT_OPTION_OPTIONS}
                                allowClear
                            />
                        </Form.Item>

                        <Form.Item
                            label="Số điện thoại"
                            name="contactPhone"
                        // rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                        >
                            <Input />
                        </Form.Item>

                    </Form>
                </div>
            </Modal>
        </>
    )
}
export default ModalUpdateBooking;