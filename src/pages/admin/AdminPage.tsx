import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    Card,
    Row,
    Col,
    Statistic,
    Spin,
    Empty,
    Typography,
    Grid,
    DatePicker,
    Space,
    Button,
    Collapse,
} from "antd";
import {
    DollarOutlined,
    CalendarOutlined,
    ShoppingOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    HomeOutlined,
    TeamOutlined,
    CreditCardOutlined,
    BellOutlined,
    SafetyCertificateOutlined,
    RobotOutlined,
    ContainerOutlined,
    CommentOutlined,
    ToolOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { motion } from "framer-motion";
import RoleWrapper from "../../components/wrapper/AdminWrapper";
import PermissionWrapper from "../../components/wrapper/PermissionWrapper";
import { getAdminSystemOverview, getRevenue } from "../../config/Api";
import type { IAdminSystemOverview } from "../../types/adminDashboardOverview";
import type { IRevenueRes } from "../../types/revenue";
import { formatVND } from "../../utils/format/price";
import { formatLocalDate } from "../../utils/format/localdatetime";
import type { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import Forbidden from "../error/Forbbiden";
import { FaDownload } from "react-icons/fa";
import { exportRevenueReport } from "../../utils/export/exportRevenueReport";
import { useAppSelector } from "../../redux/hooks";
import { usePermission } from "../../hooks/common/usePermission";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AdminPage = () => {
    // Detect dark: App.tsx sets document.body.className = theme ('dark' | 'light')
    const isDark = document.body.classList.contains('dark');
    const axisTextColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
    const axisLineColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
    const splitLineColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    const legendTextColor = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)';
    const labelColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)';
    const tooltipBg = isDark ? 'rgba(15,15,30,0.92)' : 'rgba(255,255,255,0.97)';
    const tooltipText = isDark ? '#fff' : '#1a1a2e';
    const tooltipBorder = isDark ? 'rgba(250,173,20,0.3)' : 'rgba(250,173,20,0.5)';

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<IRevenueRes | null>(null);
    const [overview, setOverview] = useState<IAdminSystemOverview | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [forbiddenByApi, setForbiddenByApi] = useState(false);

    const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
    const canViewRevenue = usePermission(["REVENUE_VIEW_DETAIL"]);

    useEffect(() => {
        const loadDashboard = async () => {
            if (!isAuthenticated || !canViewRevenue) {
                setLoading(false);
                setHasFetched(false);
                setForbiddenByApi(false);
                setData(null);
                setOverview(null);
                return;
            }

            try {
                setLoading(true);
                setHasFetched(false);
                setForbiddenByApi(false);

                const from = range?.[0]?.format("YYYY-MM-DD");
                const to = range?.[1]?.format("YYYY-MM-DD");

                const [revResult, ovResult] = await Promise.allSettled([
                    getRevenue(from, to),
                    getAdminSystemOverview(),
                ]);

                if (revResult.status === "fulfilled") {
                    const res = revResult.value;
                    if (res.data.statusCode === 200) {
                        setData(res.data.data ?? null);
                    } else {
                        setData(null);
                    }
                } else {
                    const error: any = revResult.reason;
                    const status = error?.response?.status;
                    if (status === 401 || status === 403) {
                        setForbiddenByApi(true);
                        setData(null);
                    } else {
                        setData(null);
                        const m = error?.response?.data?.message ?? "Không xác định";
                        toast.error(
                            <div>
                                <div>Có lỗi xảy ra khi tải doanh thu</div>
                                <div>{m}</div>
                            </div>
                        );
                    }
                }

                if (ovResult.status === "fulfilled") {
                    const res = ovResult.value;
                    if (res.data.statusCode === 200) {
                        setOverview(res.data.data ?? null);
                    } else {
                        setOverview(null);
                    }
                } else {
                    setOverview(null);
                    if (revResult.status === "fulfilled") {
                        toast.warning("Không tải được thống kê tổng quan hệ thống.");
                    }
                }
            } finally {
                setLoading(false);
                setHasFetched(true);
            }
        };

        void loadDashboard();
    }, [canViewRevenue, isAuthenticated, range]);

    /* ================= GROUP PITCH ================= */

    const groupedPitchRevenue = useMemo(() => {
        if (!data) return [];

        const grouped = Object.values(
            data.revenueByPitch.reduce((acc: any, curr) => {
                if (!acc[curr.pitchName]) {
                    acc[curr.pitchName] = { ...curr };
                } else {
                    acc[curr.pitchName].revenue += curr.revenue;
                }
                return acc;
            }, {})
        );

        return grouped.sort((a: any, b: any) => b.revenue - a.revenue);
    }, [data]);

    const avgBookingValue = useMemo(() => {
        if (!data || data.paidBookings === 0) return 0;
        return data.totalRevenue / data.paidBookings;
    }, [data]);

    /** Thẻ số liệu tổng quan hệ thống — dùng khi API overview trả về. */
    const systemStatCards = useMemo(() => {
        if (!overview) {
            return [] as {
                title: string;
                value: number;
                icon: ReactNode;
                color: string;
                isCurrency?: boolean;
            }[];
        }
        const o = overview;
        return [
            { title: "Tài khoản (tổng)", value: o.usersTotal, icon: <TeamOutlined />, color: "#722ed1" },
            { title: "User hoạt động", value: o.usersActive, icon: <UserOutlined />, color: "#52c41a" },
            { title: "User không hoạt động", value: o.usersInactive, icon: <UserOutlined />, color: "#8c8c8c" },
            { title: "Chờ xác minh", value: o.usersPendingVerification, icon: <UserOutlined />, color: "#faad14" },
            { title: "Bị cấm", value: o.usersBanned, icon: <UserOutlined />, color: "#ff4d4f" },
            { title: "Đã xóa / lưu trữ", value: o.usersDeleted, icon: <UserOutlined />, color: "#595959" },
            { title: "Vai trò", value: o.rolesTotal, icon: <SafetyCertificateOutlined />, color: "#2f54eb" },
            { title: "Quyền (permission)", value: o.permissionsTotal, icon: <SafetyCertificateOutlined />, color: "#13c2c2" },
            { title: "Booking (hiển thị)", value: o.bookingsTotalVisible, icon: <ShoppingOutlined />, color: "#1677ff" },
            { title: "Booking chờ", value: o.bookingsPending, icon: <ShoppingOutlined />, color: "#faad14" },
            { title: "Booking đang đặt", value: o.bookingsActive, icon: <ShoppingOutlined />, color: "#52c41a" },
            { title: "Booking đã trả (trạng thái)", value: o.bookingsPaidStatus, icon: <CheckCircleOutlined />, color: "#389e0d" },
            { title: "Booking hủy", value: o.bookingsCancelled, icon: <CloseCircleOutlined />, color: "#ff4d4f" },
            { title: "Giao dịch TT (tổng)", value: o.paymentsTotal, icon: <CreditCardOutlined />, color: "#1677ff" },
            { title: "TT chờ xác nhận", value: o.paymentsPendingCount, icon: <CreditCardOutlined />, color: "#faad14" },
            { title: "TT đã thanh toán", value: o.paymentsPaidCount, icon: <CreditCardOutlined />, color: "#52c41a" },
            { title: "TT đã hủy", value: o.paymentsCancelledCount, icon: <CreditCardOutlined />, color: "#ff4d4f" },
            {
                title: "Số tiền đang chờ TT",
                value: Number(o.paymentsPendingAmount ?? 0),
                icon: <DollarOutlined />,
                color: "#fa8c16",
                isCurrency: true,
            },
            { title: "Sân (tổng)", value: o.pitchesTotal, icon: <HomeOutlined />, color: "#13c2c2" },
            { title: "Sân hoạt động", value: o.pitchesActive, icon: <HomeOutlined />, color: "#52c41a" },
            { title: "Sân bảo trì", value: o.pitchesMaintenance, icon: <HomeOutlined />, color: "#faad14" },
            { title: "Thiết bị kho (dòng)", value: o.equipmentsTotal, icon: <ContainerOutlined />, color: "#722ed1" },
            { title: "TB kho ACTIVE", value: o.equipmentsActive, icon: <ToolOutlined />, color: "#52c41a" },
            { title: "TB kho bảo trì", value: o.equipmentsMaintenance, icon: <ToolOutlined />, color: "#faad14" },
            { title: "TB kho ngưng", value: o.equipmentsInactive, icon: <ToolOutlined />, color: "#8c8c8c" },
            { title: "TB kho hỏng", value: o.equipmentsBroken, icon: <ToolOutlined />, color: "#ff7a45" },
            { title: "TB kho mất", value: o.equipmentsLost, icon: <ToolOutlined />, color: "#ff4d4f" },
            { title: "Gán TB ↔ sân (dòng)", value: o.pitchEquipmentLinks, icon: <HomeOutlined />, color: "#2f54eb" },
            { title: "Dòng mượn TB booking", value: o.bookingEquipmentsTotal, icon: <ShoppingOutlined />, color: "#1677ff" },
            { title: "Đang mượn", value: o.bookingEquipmentsBorrowed, icon: <ShoppingOutlined />, color: "#faad14" },
            { title: "Đã trả", value: o.bookingEquipmentsReturned, icon: <CheckCircleOutlined />, color: "#52c41a" },
            { title: "Mất", value: o.bookingEquipmentsLost, icon: <CloseCircleOutlined />, color: "#ff4d4f" },
            { title: "Hỏng khi trả", value: o.bookingEquipmentsDamaged, icon: <ToolOutlined />, color: "#d46b08" },
            { title: "Chờ admin xác nhận trả", value: o.bookingEquipmentsAwaitingAdminConfirm, icon: <BellOutlined />, color: "#eb2f96" },
            { title: "Nhật ký mượn/trả TB", value: o.equipmentBorrowLogsTotal, icon: <CommentOutlined />, color: "#13c2c2" },
            { title: "Đánh giá (tổng)", value: o.reviewsTotal, icon: <CommentOutlined />, color: "#faad14" },
            { title: "ĐG chờ duyệt", value: o.reviewsPending, icon: <CommentOutlined />, color: "#fa8c16" },
            { title: "ĐG đã duyệt", value: o.reviewsApproved, icon: <CommentOutlined />, color: "#52c41a" },
            { title: "ĐG đã ẩn", value: o.reviewsHidden, icon: <CommentOutlined />, color: "#8c8c8c" },
            { title: "Tin nhắn chat đánh giá", value: o.reviewMessagesTotal, icon: <CommentOutlined />, color: "#1677ff" },
            { title: "Thông báo (tổng)", value: o.notificationsTotal, icon: <BellOutlined />, color: "#2f54eb" },
            { title: "TB chưa đọc", value: o.notificationsUnread, icon: <BellOutlined />, color: "#ff4d4f" },
            { title: "Khóa API AI", value: o.aiApiKeysTotal, icon: <RobotOutlined />, color: "#722ed1" },
            { title: "Khóa AI đang bật", value: o.aiApiKeysActive, icon: <RobotOutlined />, color: "#52c41a" },
            { title: "Phiên chat AI", value: o.aiChatSessionsTotal, icon: <RobotOutlined />, color: "#13c2c2" },
        ];
    }, [overview]);

    if (forbiddenByApi) {
        return <Forbidden />;
    }

    if (loading) {
        return (
            <RoleWrapper fallback={<Forbidden />}>
                <PermissionWrapper required={"REVENUE_VIEW_DETAIL"} fallback={<Forbidden />}>
                    <Spin size="large" style={{ marginTop: 100 }} />
                </PermissionWrapper>
            </RoleWrapper>
        );
    }

    if (hasFetched && !data) {
        return (
            <RoleWrapper fallback={<Forbidden />}>
                <PermissionWrapper required={"REVENUE_VIEW_DETAIL"} fallback={<Forbidden />}>
                    <Empty description="Không có dữ liệu doanh thu" style={{ marginTop: 100 }} />
                </PermissionWrapper>
            </RoleWrapper>
        );
    }

    if (!data) {
        return (
            <RoleWrapper fallback={<Forbidden />}>
                <PermissionWrapper required={["REVENUE_VIEW_DETAIL"]} fallback={<Forbidden />}>
                    <Spin size="large" style={{ marginTop: 100 }} />
                </PermissionWrapper>
            </RoleWrapper>
        );
    }

    /* ================= KPI ================= */

    const kpis = [
        {
            title: "Tổng doanh thu",
            value: data.totalRevenue,
            icon: <DollarOutlined />,
            color: "#1677ff",
            isCurrency: true,
        },
        {
            title: "Hôm nay",
            value: data.todayRevenue,
            icon: <CalendarOutlined />,
            color: "#52c41a",
            isCurrency: true,
        },
        {
            title: "Tuần này",
            value: data.weekRevenue,
            icon: <CalendarOutlined />,
            color: "#2f54eb",
            isCurrency: true,
        },
        {
            title: "Tháng này",
            value: data.monthRevenue,
            icon: <DollarOutlined />,
            color: "#faad14",
            isCurrency: true,
        },
        {
            title: "Booking",
            value: data.totalBookings,
            icon: <ShoppingOutlined />,
            color: "#13c2c2",
        },
        {
            title: "Đã thanh toán",
            value: data.paidBookings,
            icon: <CheckCircleOutlined />,
            color: "#52c41a",
        },
        {
            title: "Đã hủy",
            value: data.cancelledBookings,
            icon: <CloseCircleOutlined />,
            color: "#ff4d4f",
        },
        {
            title: "Người dùng",
            value: data.totalUsers,
            icon: <UserOutlined />,
            color: "#722ed1",
        },
        {
            title: "Tổng sân",
            value: data.totalPitches,
            icon: <HomeOutlined />,
            color: "#13c2c2",
        },
        {
            title: "TB / Booking",
            value: avgBookingValue,
            icon: <DollarOutlined />,
            color: "#fa8c16",
            isCurrency: true,
        },
    ];

    const chartHeight = isMobile ? 280 : 360;

    /* ================= CHART COLORS ================= */

    const chartColors = [
        "#faad14",
        "#1677ff",
        "#52c41a",
        "#722ed1",
        "#13c2c2",
        "#eb2f96",
        "#fa541c",
        "#a0d911",
    ];

    const darkAxisStyle = {
        axisLine: { lineStyle: { color: axisLineColor } },
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: axisTextColor, fontSize: 11 },
        axisTick: { show: false },
    };

    const tooltipStyle = {
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        textStyle: { color: tooltipText, fontSize: 12 },
        extraCssText: "border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.3)",
    };


    return (
        <RoleWrapper fallback={<Forbidden />}>
            <PermissionWrapper required={["REVENUE_VIEW_DETAIL"]} fallback={<Forbidden />}>
                <div style={{ padding: "0 16px", overflowX: "hidden" }}>
                    {/* <Row justify="space-between" align="middle" style={{ marginBottom: 24, gap: 10 }}>
                        <Col>
                            <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
                                Dashboard Thống Kê
                            </Title>
                        </Col>

                        <Col>
                            <DatePicker.RangePicker
                                value={range}
                                onChange={(values) => setRange(values)}
                                format="DD/MM/YYYY"
                                allowClear
                                placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                            />
                        </Col>
                    </Row> */}

                    <Row justify="space-between" align="middle" style={{ marginBottom: 24, gap: 10 }}>
                        <Col>
                            <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
                                Dashboard Thống Kê
                            </Title>
                        </Col>

                        <Col>
                            <Space>
                                <DatePicker.RangePicker
                                    value={range}
                                    onChange={(values) => setRange(values)}
                                    format="DD/MM/YYYY"
                                    allowClear
                                    placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                                />

                                <Button
                                    icon={<FaDownload />}
                                    onClick={() =>
                                        data &&
                                        exportRevenueReport(
                                            data,
                                            range?.[0]?.format("DD/MM/YYYY"),
                                            range?.[1]?.format("DD/MM/YYYY")
                                        )
                                    }
                                >
                                    Xuất Excel
                                </Button>

                            </Space>
                        </Col>
                    </Row>



                    <Collapse
                        bordered={false}
                        style={{ marginTop: 8, background: "transparent" }}
                        defaultActiveKey={["kpi", "revenue-charts"]}
                        items={[
                            {
                                key: "kpi",
                                label: "Chỉ số KPI — doanh thu & đặt sân",
                                children: (
                                    <Row gutter={[16, 16]}>
                                        {kpis.map((item, index) => (
                                            <Col xs={12} md={8} lg={4} key={index}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <Card size="small" variant="borderless">
                                                        <Statistic
                                                            title={item.title}
                                                            value={
                                                                item.isCurrency
                                                                    ? formatVND(item.value)
                                                                    : item.value
                                                            }
                                                            prefix={
                                                                <span style={{ color: item.color }}>
                                                                    {item.icon}
                                                                </span>
                                                            }
                                                        />
                                                    </Card>
                                                </motion.div>
                                            </Col>
                                        ))}
                                    </Row>
                                ),
                            },
                            ...(overview && systemStatCards.length > 0
                                ? [
                                      {
                                          key: "system-stats",
                                          label: (
                                              <span>
                                                  Bảng số liệu tổng quan hệ thống{" "}
                                                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                                                      (cập nhật{" "}
                                                      {new Date(overview.generatedAt).toLocaleString("vi-VN", {
                                                          hour12: false,
                                                      })}
                                                      )
                                                  </Text>
                                              </span>
                                          ),
                                          children: (
                                              <Row gutter={[12, 12]}>
                                                  {systemStatCards.map((item, index) => (
                                                      <Col xs={12} sm={8} md={6} lg={4} key={`sys-${index}`}>
                                                          <Card size="small" variant="borderless">
                                                              <Statistic
                                                                  title={item.title}
                                                                  value={
                                                                      item.isCurrency
                                                                          ? formatVND(item.value)
                                                                          : item.value
                                                                  }
                                                                  prefix={
                                                                      <span style={{ color: item.color }}>
                                                                          {item.icon}
                                                                      </span>
                                                                  }
                                                              />
                                                          </Card>
                                                      </Col>
                                                  ))}
                                              </Row>
                                          ),
                                      },
                                      {
                                          key: "system-charts",
                                          label:
                                              "Biểu đồ phân bổ hệ thống (user, booking, thanh toán, đánh giá, thiết bị…)",
                                          children: (
                                              <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <Card title="Người dùng theo trạng thái" size="small" variant="borderless">
                                        <ReactECharts
                                            option={{
                                                color: chartColors,
                                                backgroundColor: "transparent",
                                                tooltip: {
                                                    trigger: "item",
                                                    ...tooltipStyle,
                                                    formatter: (p: { name: string; value: number; percent: number }) =>
                                                        `<b>${p.name}</b><br/>${p.value} (${p.percent}%)`,
                                                },
                                                series: [
                                                    {
                                                        type: "pie",
                                                        radius: ["36%", "62%"],
                                                        center: ["50%", "50%"],
                                                        label: { color: labelColor, fontSize: 11 },
                                                        data: [
                                                            { value: overview.usersActive, name: "Hoạt động" },
                                                            { value: overview.usersInactive, name: "Không HĐ" },
                                                            {
                                                                value: overview.usersPendingVerification,
                                                                name: "Chờ xác minh",
                                                            },
                                                            { value: overview.usersBanned, name: "Bị cấm" },
                                                            { value: overview.usersDeleted, name: "Đã xóa" },
                                                        ].filter((d) => d.value > 0),
                                                    },
                                                ],
                                            }}
                                            style={{ height: isMobile ? 260 : chartHeight }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Card title="Booking (chưa ẩn bởi user) theo trạng thái" size="small" variant="borderless">
                                        <ReactECharts
                                            option={{
                                                color: chartColors,
                                                backgroundColor: "transparent",
                                                tooltip: {
                                                    trigger: "item",
                                                    ...tooltipStyle,
                                                    formatter: (p: { name: string; value: number; percent: number }) =>
                                                        `<b>${p.name}</b><br/>${p.value} (${p.percent}%)`,
                                                },
                                                series: [
                                                    {
                                                        type: "pie",
                                                        radius: ["36%", "62%"],
                                                        center: ["50%", "50%"],
                                                        label: { color: labelColor, fontSize: 11 },
                                                        data: [
                                                            { value: overview.bookingsPending, name: "Chờ" },
                                                            { value: overview.bookingsActive, name: "Đang đặt" },
                                                            { value: overview.bookingsPaidStatus, name: "Đã TT (status)" },
                                                            { value: overview.bookingsCancelled, name: "Đã hủy" },
                                                        ].filter((d) => d.value > 0),
                                                    },
                                                ],
                                            }}
                                            style={{ height: isMobile ? 260 : chartHeight }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Card title="Thanh toán theo trạng thái" size="small" variant="borderless">
                                        <ReactECharts
                                            option={{
                                                color: ["#faad14", "#52c41a", "#ff4d4f"],
                                                backgroundColor: "transparent",
                                                tooltip: {
                                                    trigger: "item",
                                                    ...tooltipStyle,
                                                    formatter: (p: { name: string; value: number; percent: number }) =>
                                                        `<b>${p.name}</b><br/>${p.value} (${p.percent}%)`,
                                                },
                                                series: [
                                                    {
                                                        type: "pie",
                                                        radius: ["36%", "62%"],
                                                        center: ["50%", "50%"],
                                                        label: { color: labelColor, fontSize: 11 },
                                                        data: [
                                                            { value: overview.paymentsPendingCount, name: "Chờ xác nhận" },
                                                            { value: overview.paymentsPaidCount, name: "Đã thanh toán" },
                                                            { value: overview.paymentsCancelledCount, name: "Đã hủy" },
                                                        ].filter((d) => d.value > 0),
                                                    },
                                                ],
                                            }}
                                            style={{ height: isMobile ? 260 : chartHeight }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Card title="Đánh giá theo trạng thái" size="small" variant="borderless">
                                        <ReactECharts
                                            option={{
                                                color: ["#faad14", "#52c41a", "#8c8c8c"],
                                                backgroundColor: "transparent",
                                                tooltip: {
                                                    trigger: "item",
                                                    ...tooltipStyle,
                                                    formatter: (p: { name: string; value: number; percent: number }) =>
                                                        `<b>${p.name}</b><br/>${p.value} (${p.percent}%)`,
                                                },
                                                series: [
                                                    {
                                                        type: "pie",
                                                        radius: ["36%", "62%"],
                                                        center: ["50%", "50%"],
                                                        label: { color: labelColor, fontSize: 11 },
                                                        data: [
                                                            { value: overview.reviewsPending, name: "Chờ duyệt" },
                                                            { value: overview.reviewsApproved, name: "Đã duyệt" },
                                                            { value: overview.reviewsHidden, name: "Đã ẩn" },
                                                        ].filter((d) => d.value > 0),
                                                    },
                                                ],
                                            }}
                                            style={{ height: isMobile ? 260 : chartHeight }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Card title="Thiết bị kho theo trạng thái" size="small" variant="borderless">
                                        <ReactECharts
                                            option={{
                                                color: chartColors,
                                                backgroundColor: "transparent",
                                                tooltip: {
                                                    trigger: "item",
                                                    ...tooltipStyle,
                                                    formatter: (p: { name: string; value: number; percent: number }) =>
                                                        `<b>${p.name}</b><br/>${p.value} (${p.percent}%)`,
                                                },
                                                series: [
                                                    {
                                                        type: "pie",
                                                        radius: ["36%", "62%"],
                                                        center: ["50%", "50%"],
                                                        label: { color: labelColor, fontSize: 11 },
                                                        data: [
                                                            { value: overview.equipmentsActive, name: "ACTIVE" },
                                                            { value: overview.equipmentsMaintenance, name: "Bảo trì" },
                                                            { value: overview.equipmentsInactive, name: "Ngưng" },
                                                            { value: overview.equipmentsBroken, name: "Hỏng" },
                                                            { value: overview.equipmentsLost, name: "Mất" },
                                                        ].filter((d) => d.value > 0),
                                                    },
                                                ],
                                            }}
                                            style={{ height: isMobile ? 260 : chartHeight }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Card title="Dòng mượn thiết bị (booking) theo trạng thái" size="small" variant="borderless">
                                        <ReactECharts
                                            option={{
                                                color: chartColors,
                                                backgroundColor: "transparent",
                                                tooltip: {
                                                    trigger: "item",
                                                    ...tooltipStyle,
                                                    formatter: (p: { name: string; value: number; percent: number }) =>
                                                        `<b>${p.name}</b><br/>${p.value} (${p.percent}%)`,
                                                },
                                                series: [
                                                    {
                                                        type: "pie",
                                                        radius: ["36%", "62%"],
                                                        center: ["50%", "50%"],
                                                        label: { color: labelColor, fontSize: 11 },
                                                        data: [
                                                            { value: overview.bookingEquipmentsBorrowed, name: "Đang mượn" },
                                                            { value: overview.bookingEquipmentsReturned, name: "Đã trả" },
                                                            { value: overview.bookingEquipmentsLost, name: "Mất" },
                                                            { value: overview.bookingEquipmentsDamaged, name: "Hỏng" },
                                                        ].filter((d) => d.value > 0),
                                                    },
                                                ],
                                            }}
                                            style={{ height: isMobile ? 260 : chartHeight }}
                                        />
                                    </Card>
                                </Col>
                                              </Row>
                                          ),
                                      },
                                  ]
                                : []),
                            {
                                key: "revenue-charts",
                                label: "Biểu đồ doanh thu & tình trạng booking (theo khoảng ngày đã chọn)",
                                children: (
                                    <Row gutter={[16, 16]}>
                        {/* LINE CHART */}
                        <Col xs={24}>
                            <Card title="Doanh thu theo ngày" size="small" variant="borderless">
                                <ReactECharts
                                    option={{
                                        color: ["#faad14"],
                                        backgroundColor: "transparent",
                                        tooltip: {
                                            trigger: "axis",
                                            ...tooltipStyle,
                                            formatter: (params: any) => {
                                                const p = params[0];
                                                return `<b>${p.axisValue}</b><br/>💰 ${formatVND(p.data)}`;
                                            },
                                        },
                                        grid: { left: 16, right: 24, top: 16, bottom: 32, containLabel: true },
                                        xAxis: {
                                            type: "category",
                                            data: data.revenueByDate.map(i => formatLocalDate(i.label)),
                                            boundaryGap: false,
                                            ...darkAxisStyle,
                                        },
                                        yAxis: {
                                            type: "value",
                                            ...darkAxisStyle,
                                            axisLabel: {
                                                ...darkAxisStyle.axisLabel,
                                                formatter: (v: number) => {
                                                    if (v >= 1_000_000) return `${v / 1_000_000}M`;
                                                    if (v >= 1_000) return `${v / 1_000}K`;
                                                    return `${v}`;
                                                },
                                            },
                                        },
                                        series: [
                                            {
                                                name: "Doanh thu",
                                                data: data.revenueByDate.map(i => i.revenue),
                                                type: "line",
                                                smooth: true,
                                                showSymbol: false,
                                                symbolSize: 6,
                                                areaStyle: {
                                                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                                        { offset: 0, color: "rgba(250,173,20,0.35)" },
                                                        { offset: 1, color: "rgba(250,173,20,0.02)" },
                                                    ]),
                                                },
                                                lineStyle: { width: 2.5, color: "#faad14" },
                                                itemStyle: { color: "#faad14" },
                                            },
                                        ],
                                    }}
                                    style={{ height: chartHeight }}
                                />
                            </Card>
                        </Col>

                        {/* BAR CHART */}
                        <Col xs={24} md={12}>
                            <Card title="Doanh thu theo sân" size="small" variant="borderless">
                                <ReactECharts
                                    option={{
                                        backgroundColor: "transparent",
                                        tooltip: {
                                            trigger: "axis",
                                            ...tooltipStyle,
                                            formatter: (params: any) => {
                                                const p = params[0];
                                                return `<b>${p.name}</b><br/>💰 ${formatVND(p.value)}`;
                                            },
                                        },
                                        grid: { left: 16, right: 80, top: 12, bottom: 12, containLabel: true },
                                        xAxis: {
                                            type: "value",
                                            ...darkAxisStyle,
                                            axisLabel: {
                                                ...darkAxisStyle.axisLabel,
                                                formatter: (v: number) => {
                                                    if (v >= 1_000_000) return `${v / 1_000_000}M`;
                                                    if (v >= 1_000) return `${v / 1_000}K`;
                                                    return `${v}`;
                                                },
                                            },
                                        },
                                        yAxis: {
                                            type: "category",
                                            data: groupedPitchRevenue.map((i: any) => i.pitchName),
                                            ...darkAxisStyle,
                                            axisLabel: { ...darkAxisStyle.axisLabel, width: 90, overflow: "truncate" },
                                        },
                                        series: [
                                            {
                                                data: groupedPitchRevenue.map((i: any) => ({
                                                    value: i.revenue,
                                                    itemStyle: {
                                                        color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                                                            { offset: 0, color: "#faad14" },
                                                            { offset: 1, color: "#ff7a00" },
                                                        ]),
                                                    },
                                                })),
                                                type: "bar",
                                                barMaxWidth: 22,
                                                label: {
                                                    show: true,
                                                    position: "right",
                                                    color: axisTextColor,
                                                    fontSize: 11,
                                                    formatter: (p: any) => {
                                                        const v = p.value;
                                                        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                                                        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                                                        return `${v}`;
                                                    },
                                                },
                                                itemStyle: { borderRadius: [0, 6, 6, 0] },
                                            },
                                        ],
                                    }}
                                    style={{ height: chartHeight }}
                                />
                            </Card>
                        </Col>

                        {/* PIE REVENUE */}
                        <Col xs={24} md={12}>
                            <Card title="Tỷ trọng doanh thu theo sân" size="small" variant="borderless">
                                <ReactECharts
                                    option={{
                                        color: chartColors,
                                        backgroundColor: "transparent",
                                        tooltip: {
                                            trigger: "item",
                                            ...tooltipStyle,
                                            formatter: (p: any) =>
                                                `<b>${p.name}</b><br/>💰 ${formatVND(p.value)}<br/>📊 ${p.percent}%`,
                                        },
                                        legend: isMobile ? {
                                            orient: "horizontal",
                                            bottom: 4,
                                            left: "center",
                                            textStyle: { color: legendTextColor, fontSize: 10 },
                                            itemWidth: 8,
                                            itemHeight: 8,
                                        } : {
                                            orient: "vertical",
                                            right: 8,
                                            top: "center",
                                            textStyle: { color: legendTextColor, fontSize: 11 },
                                            itemWidth: 10,
                                            itemHeight: 10,
                                        },
                                        series: [
                                            {
                                                type: "pie",
                                                radius: ["40%", "65%"],
                                                center: isMobile ? ["50%", "44%"] : ["38%", "50%"],
                                                label: { show: false },
                                                labelLine: { show: false },
                                                emphasis: {
                                                    itemStyle: { shadowBlur: 12, shadowColor: "rgba(0,0,0,0.4)" },
                                                    scale: true,
                                                    scaleSize: 6,
                                                },
                                                data: groupedPitchRevenue.map((i: any) => ({
                                                    value: i.revenue,
                                                    name: i.pitchName,
                                                })),
                                            },
                                        ],
                                    }}
                                    style={{ height: isMobile ? 260 : chartHeight }}
                                />
                            </Card>
                        </Col>

                        {/* BOOKING STATUS */}
                        <Col xs={24} md={12}>
                            <Card title="Tình trạng Booking" size="small" variant="borderless">
                                <ReactECharts
                                    option={{
                                        color: ["#52c41a", "#ff4d4f", "#faad14"],
                                        backgroundColor: "transparent",
                                        tooltip: {
                                            trigger: "item",
                                            ...tooltipStyle,
                                            formatter: (p: any) =>
                                                `<b>${p.name}</b><br/>📦 ${p.value} booking (${p.percent}%)`,
                                        },
                                        legend: {
                                            bottom: 4,
                                            left: "center",
                                            textStyle: { color: legendTextColor, fontSize: isMobile ? 10 : 11 },
                                            itemWidth: isMobile ? 8 : 10,
                                            itemHeight: isMobile ? 8 : 10,
                                        },
                                        series: [
                                            {
                                                type: "pie",
                                                radius: ["38%", "62%"],
                                                center: ["50%", isMobile ? "42%" : "44%"],
                                                label: {
                                                    show: true,
                                                    formatter: "{d}%",
                                                    color: labelColor,
                                                    fontSize: isMobile ? 11 : 12,
                                                    fontWeight: 600,
                                                },
                                                labelLine: { lineStyle: { color: axisLineColor } },
                                                emphasis: {
                                                    itemStyle: { shadowBlur: 12, shadowColor: "rgba(0,0,0,0.4)" },
                                                    scale: true,
                                                    scaleSize: 6,
                                                },
                                                data: [
                                                    { value: data.paidBookings, name: "Đã thanh toán" },
                                                    { value: data.cancelledBookings, name: "Đã hủy" },
                                                    { value: Math.max(0, data.totalBookings - data.paidBookings - data.cancelledBookings), name: "Chờ xử lý" },
                                                ].filter(d => d.value > 0),
                                            },
                                        ],
                                    }}
                                    style={{ height: isMobile ? 260 : chartHeight }}
                                />
                            </Card>
                        </Col>
                                    </Row>
                                ),
                            },
                        ]}
                    />
                </div>
            </PermissionWrapper>
        </RoleWrapper>
    );
};

export default AdminPage;
