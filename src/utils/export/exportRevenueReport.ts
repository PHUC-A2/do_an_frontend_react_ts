import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { IRevenueRes } from "../../types/revenue";
import { formatLocalDate } from "../format/localdatetime";
import { formatVND } from "../format/price";

export const exportRevenueReport = (
    data: IRevenueRes,
    from?: string,
    to?: string
) => {
    if (!data) return;

    const workbook = XLSX.utils.book_new();
    const exportTime = new Date().toLocaleString("vi-VN");

    /* ===================================================
       GOM TẤT CẢ DATA VÀO 1 MẢNG
    =================================================== */

    const finalData: any[] = [];

    /* ========= 1️ TIÊU ĐỀ ========= */
    finalData.push(
        { A: "BÁO CÁO DOANH THU HỆ THỐNG" },
        { A: "Thời gian xuất", B: exportTime },
        {
            A: "Khoảng thống kê",
            B: from && to ? `${from} - ${to}` : "Toàn thời gian",
        },
        {}
    );

    /* ========= 2️ KPI ========= */
    finalData.push(
        { A: "TỔNG QUAN" },
        { A: "Chỉ số", B: "Giá trị" },
        { A: "Tổng doanh thu", B: formatVND(data.totalRevenue) },
        { A: "Doanh thu hôm nay", B: formatVND(data.todayRevenue) },
        { A: "Doanh thu tuần này", B: formatVND(data.weekRevenue) },
        { A: "Doanh thu tháng này", B: formatVND(data.monthRevenue) },
        { A: "Tổng booking", B: data.totalBookings },
        { A: "Booking đã thanh toán", B: data.paidBookings },
        { A: "Booking đã hủy", B: data.cancelledBookings },
        { A: "Tổng người dùng", B: data.totalUsers },
        { A: "Tổng số sân", B: data.totalPitches },
        {}
    );

    /* ========= 3️ DOANH THU THEO NGÀY ========= */
    finalData.push(
        { A: "DOANH THU THEO NGÀY" },
        { A: "STT", B: "Ngày", C: "Doanh thu (VND)" }
    );

    data.revenueByDate.forEach((item, index) => {
        finalData.push({
            A: index + 1,
            B: formatLocalDate(item.label),
            C: formatVND(item.revenue),
        });
    });

    finalData.push({});

    /* ========= 4️ DOANH THU THEO SÂN ========= */
    finalData.push(
        { A: "DOANH THU THEO SÂN" },
        { A: "STT", B: "Mã sân", C: "Tên sân", D: "Doanh thu (VND)" }
    );

    data.revenueByPitch.forEach((item, index) => {
        finalData.push({
            A: index + 1,
            B: item.pitchId,
            C: item.pitchName,
            D: formatVND(item.revenue),
        });
    });

    finalData.push({});

    /* ========= 5️ TÌNH TRẠNG BOOKING ========= */
    finalData.push(
        { A: "TÌNH TRẠNG BOOKING" },
        { A: "STT", B: "Trạng thái", C: "Số lượng" },
        { A: 1, B: "Đã thanh toán", C: data.paidBookings },
        { A: 2, B: "Đã hủy", C: data.cancelledBookings }
    );

    /* ===================================================
       TẠO SHEET DUY NHẤT
    =================================================== */

    const sheet = XLSX.utils.json_to_sheet(finalData, {
        skipHeader: true,
    });

    sheet["!cols"] = [
        { wch: 8 },
        { wch: 20 },
        { wch: 30 },
        { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, sheet, "Báo cáo doanh thu");

    /* ===================================================
       EXPORT FILE
    =================================================== */

    const buffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
    });

    saveAs(
        new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `bao_cao_doanh_thu_${Date.now()}.xlsx`
    );
};
