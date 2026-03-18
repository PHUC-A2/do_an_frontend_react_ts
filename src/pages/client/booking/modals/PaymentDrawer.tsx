import {
    Drawer,
    Space,
    Typography,
    Select,
    Button,
    Divider,
} from "antd";
import {
    DollarCircleOutlined
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { IPaymentRes, PaymentMethodEnum } from "../../../../types/payment";
import { attachPaymentProof, createPayment, getQR } from "../../../../config/Api";
import { PAYMENT_METHOD_OPTIONS } from "../../../../utils/constants/payment.constanst";
import { formatVND } from "../../../../utils/format/price";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { fetchBookingsClient, selectBookingsClient } from "../../../../redux/features/bookingClientSlice";
import type { UploadFile, UploadProps, GetProp } from "antd";
import { Upload, Image } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import { uploadImagePayment } from "../../../../config/Api";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

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
    const canPay = booking?.status === "ACTIVE";

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    const getBase64 = (file: FileType): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };


    const handleUploadProof = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImagePayment(file);
            const url = res.data?.url;

            if (!url || !qr) {
                throw new Error("Thiếu url hoặc payment");
            }

            await attachPaymentProof(qr.paymentId, url);

            setFileList([
                {
                    uid: file.uid,
                    name: file.name,
                    status: "done",
                    url,
                },
            ]);

            onSuccess?.("ok");
            toast.success("Tải ảnh minh chứng thành công");
        } catch (err) {
            onError?.(err);
            toast.error("Tải ảnh thất bại");
        }
    };

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
        if (booking?.status === "PENDING") {
            toast.warning("Booking đang chờ admin xác nhận, chưa thể thanh toán");
            return;
        }

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
        if (storedPaymentCode && canPay) {
            loadQR(storedPaymentCode);
        }
    }, [bookingId, open, canPay]);

    useEffect(() => {
        if (!open) return;
        if (!qr) return;
        if (booking?.status === "PAID") return;

        const interval = setInterval(() => {
            dispatch(fetchBookingsClient(""));
        }, 15000); // 15s

        return () => clearInterval(interval);
    }, [open, qr, booking?.status, dispatch]);

    // const handleClose = () => {
    //     setQr(null);
    //     onClose();
    // };

    const handleClose = () => {
        setQr(null);
        setFileList([]);
        setPreviewImage("");
        setPreviewOpen(false);
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
                        disabled={!!qr || booking?.status === "PAID" || !canPay}
                        style={{ width: "100%", marginTop: 8 }}
                        options={PAYMENT_METHOD_OPTIONS}
                        value={method}
                        onChange={setMethod}
                    />
                    {booking?.status === "PENDING" && (
                        <Text type="warning" style={{ fontSize: 12 }}>
                            ⏳ Booking đang chờ admin xác nhận. Bạn chỉ có thể thanh toán sau khi được duyệt.
                        </Text>
                    )}
                    {method === "CASH" && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            💵 Thanh toán tiền mặt tại sân, không cần quét QR
                        </Text>
                    )}

                </div>

                {/* Button */}
                {!qr && booking?.status !== "PAID" && canPay && (
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
                {qr && method === "BANK_TRANSFER" && (
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

                {/* Upload proof */}
                {qr && booking?.status !== "PAID" && canPay && (
                    <>
                        <Divider />
                        <Text strong>Ảnh minh chứng thanh toán (không bắt buộc)</Text>

                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            customRequest={handleUploadProof}
                            onPreview={handlePreview}
                            onChange={({ fileList }) => setFileList(fileList)}
                            maxCount={1}
                            accept=".jpg,.jpeg,.png,.webp"
                        >
                            {fileList.length >= 1 ? null : (
                                <div>
                                    <CameraOutlined />
                                    <div style={{ marginTop: 8, fontSize: 12 }}>
                                        Upload ảnh
                                    </div>
                                </div>
                            )}
                        </Upload>

                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Có thể upload sau
                        </Text>
                    </>
                )}

                {previewImage && (
                    <Image
                        style={{ display: "none" }}
                        preview={{
                            open: previewOpen,
                            onOpenChange: setPreviewOpen,
                        }}
                        src={previewImage}
                    />
                )}


            </Space>
        </Drawer>
    );
};

export default PaymentDrawer;
