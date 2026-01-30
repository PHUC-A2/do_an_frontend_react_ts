import { DatePicker, InputNumber, Modal, Select } from 'antd';
import { Form, Input } from 'antd';
import { createBooking } from '../../../../config/Api';
import { toast } from 'react-toastify';
import { useAppDispatch } from '../../../../redux/hooks';
import type { ICreateBookingReq, ShirtOptionEnum } from '../../../../types/booking';
import { fetchBookings } from '../../../../redux/features/bookingSlice';
import type { Dayjs } from 'dayjs';
import { SHIRT_OPTION_OPTIONS } from '../../../../utils/constants/booking.constants';

interface IProps {
    openModalAddBooking: boolean;
    setOpenModalAddBooking: (v: boolean) => void;
}

type BookingFormValues = {
    userId: number;
    pitchId: number;
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
    dateTimeRange: [Dayjs, Dayjs];
};

const ModalAddBooking = (props: IProps) => {
    const { openModalAddBooking, setOpenModalAddBooking } = props;
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();

    const handleAddBooking = async (values: BookingFormValues) => {

        const [start, end] = values.dateTimeRange;

        const payload: ICreateBookingReq = {
            userId: values.userId,
            pitchId: values.pitchId,
            shirtOption: values.shirtOption,
            contactPhone: values.contactPhone,
            startDateTime: start.format('YYYY-MM-DDTHH:mm:ss'),
            endDateTime: end.format('YYYY-MM-DDTHH:mm:ss'),
        };

        try {
            const res = await createBooking(payload);
            if (res.data.statusCode === 201) {
                await dispatch(fetchBookings(""));
                setOpenModalAddBooking(false);
                toast.success('Đặt sân thành công')
                form.resetFields(); // dùng để xóa các giá trị sau khi đã submit
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div><strong>Có lỗi xảy ra!</strong></div>
                    <div>{m}</div>
                </div>
            );
        }
    }

    return (
        <>
            <Modal
                title="Đặt sân"
                maskClosable={false}
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={openModalAddBooking}
                okText="Lưu"
                cancelText="Hủy"
                onOk={() => form.submit()}
                onCancel={() => setOpenModalAddBooking(false)}
            >
                <div>
                    <hr />
                    <Form
                        form={form}
                        onFinish={handleAddBooking}
                        layout='vertical'
                        autoComplete="off"
                    >
                        <Form.Item
                            label="ID người đặt"
                            name="userId"
                            rules={[{ required: true, message: 'Vui lòng nhập Id người đặt!' }]}
                        >
                            <InputNumber
                                style={{
                                    width: "100%"
                                }}
                            />
                        </Form.Item>

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
export default ModalAddBooking;