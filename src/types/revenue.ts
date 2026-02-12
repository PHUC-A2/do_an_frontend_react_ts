// revenue.ts

// revenue.ts
export interface IRevenueRes {
    /** Tổng doanh thu toàn hệ thống */
    totalRevenue: number;

    /** Doanh thu trong ngày hôm nay */
    todayRevenue: number;

    /** Doanh thu trong tuần này */
    weekRevenue: number;

    /** Doanh thu trong tháng hiện tại */
    monthRevenue: number;

    /** Tổng số booking */
    totalBookings: number;

    /** Số booking đã thanh toán */
    paidBookings: number;

    /** Số booking đã bị huỷ */
    cancelledBookings: number;

    totalUsers: number; // tổng số người dùng
    totalPitches: number // tổng số sân

    /** 
     * Doanh thu theo từng ngày
     * label: định dạng yyyy-MM-dd
     */
    revenueByDate: {
        label: string;      // Ví dụ: "2026-02-11"
        revenue: number;    // Doanh thu của ngày đó
    }[];

    /**
     * Doanh thu theo từng sân
     */
    revenueByPitch: {
        pitchId: number;     // ID sân
        pitchName: string;   // Tên sân
        revenue: number;     // Doanh thu của sân đó
    }[];
}
