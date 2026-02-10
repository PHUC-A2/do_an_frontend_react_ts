import {
    Drawer,
    Space,
    Typography,
    Select,
    Button,
    Divider,
    Image
} from "antd";
import {
    DollarCircleOutlined
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { IPaymentRes, PaymentMethodEnum } from "../../../../types/payment";
import { createPayment, getQR } from "../../../../config/Api";
import { PAYMENT_METHOD_OPTIONS } from "../../../../utils/constants/payment.constanst";
import { formatVND } from "../../../../utils/format/price";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { fetchBookingsClient, selectBookingsClient } from "../../../../redux/features/bookingClientSlice";

const { Text } = Typography;

interface Props {
    open: boolean;
    bookingId: number | null;
    onClose: () => void;
}

const PaymentDrawer = ({ open, bookingId, onClose }: Props) => {
    const [method, setMethod] = useState<PaymentMethodEnum>("BANK_TRANSFER");
    const [loading, setLoading] = useState(false);
    const [qr, setQr] = useState<IPaymentRes | null>(null);
    const bookings = useAppSelector(selectBookingsClient);
    const dispatch = useAppDispatch();

    const booking = bookings.find(b => b.id === bookingId);

    const paymentKey = (bookingId: number) =>
        `PAYMENT_CODE_BOOKING_${bookingId}`;

    const loadQR = async (paymentCode: string) => {
        const res = await getQR(paymentCode);
        if (!open) return;

        if (res.data.statusCode !== 200) {
            throw new Error("Không lấy được QR");
        }

        setQr(res.data.data ?? null);
    };



    const handlePay = async () => {
        if (!bookingId || booking?.status === "PAID") return;

        try {
            setLoading(true);
            setQr(null);

            const res = await createPayment({ bookingId, method });

            const paymentCode = res.data.data?.paymentCode;
            if (res.data.statusCode !== 201 || !paymentCode) {
                toast.error(res.data.message || "Không tạo được payment");
                return;
            }

            localStorage.setItem(paymentKey(bookingId), paymentCode);
            await loadQR(paymentCode);

            toast.success("Tạo thanh toán thành công");
        } catch (err: any) {
            const message = err?.response?.data?.message;

            // CASH: backend trả 400 nhưng là hợp lệ
            if (method === "CASH" && message === "Thanh toán tiền mặt không hỗ trợ QR") {
                toast.success("Đã ghi nhận thanh toán tiền mặt");
                return;
            }

            toast.error(message || "Thanh toán thất bại");
        }
        finally {
            setLoading(false);
        }
    };

    const [paidNotified, setPaidNotified] = useState(false);

    useEffect(() => {
        setPaidNotified(false);
    }, [bookingId]);


    useEffect(() => {
        if (!bookingId || !booking) return;

        if (booking.status === "PAID" && !paidNotified) {
            localStorage.removeItem(paymentKey(bookingId));
            setQr(null);
            toast.success("Thanh toán đã được xác nhận");
            setPaidNotified(true);
        }
    }, [booking?.status, bookingId, paidNotified]);


    useEffect(() => {
        if (!bookingId) return;

        setQr(null);
        setMethod("BANK_TRANSFER");

        if (!open) return;

        const storedPaymentCode = localStorage.getItem(paymentKey(bookingId));
        if (storedPaymentCode && booking?.status !== "PAID") {
            loadQR(storedPaymentCode);
        }
    }, [bookingId, open]);

    useEffect(() => {
        if (!open) return;
        if (!qr) return;
        if (booking?.status === "PAID") return;

        const interval = setInterval(() => {
            dispatch(fetchBookingsClient(""));
        }, 15000); // 15s

        return () => clearInterval(interval);
    }, [open, qr, booking?.status, dispatch]);

    const handleClose = () => {
        setQr(null);
        onClose();
    };

    return (
        <Drawer
            title="Thanh toán booking"
            open={open}
            onClose={handleClose}
            placement="right"
            size={360}
        >
            <Space orientation="vertical" style={{ width: "100%" }} size={16}>
                {/* Phương thức */}
                <div>
                    <Text strong>Phương thức thanh toán</Text>
                    <Select
                        disabled={!!qr || booking?.status === "PAID"}
                        style={{ width: "100%", marginTop: 8 }}
                        options={PAYMENT_METHOD_OPTIONS}
                        value={method}
                        onChange={setMethod}
                    />
                </div>

                {/* Button */}
                {!qr && booking?.status !== "PAID" && (
                    <Button
                        icon={<DollarCircleOutlined />}
                        size="small"
                        type="primary"
                        block
                        loading={loading}
                        onClick={handlePay}
                    >
                        Thanh toán
                    </Button>
                )}


                {booking?.status === "PAID" && (
                    <Text type="success">✅ Đã thanh toán</Text>
                )}


                {/* QR */}
                {qr && method === "BANK_TRANSFER" &&(
                    <>
                        <Divider />
                        <Space orientation="vertical" align="center" style={{ width: "100%" }}>
                            <Text strong>Quét QR để thanh toán</Text>

                            <Image
                                src={qr.vietQrUrl}
                                width={220}
                                preview={false}
                            />

                            <Text type="secondary">
                                Nội dung: <b>{qr.content}</b>
                            </Text>

                            <Text type="secondary">
                                Số tiền: <b>{formatVND(qr.amount)}</b>
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                ⏳ Đang chờ xác nhận thanh toán...
                            </Text>
                        </Space>
                    </>
                )}
            </Space>
        </Drawer>
    );
};

export default PaymentDrawer;
