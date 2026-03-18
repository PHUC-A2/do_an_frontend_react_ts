import { useEffect, useMemo, useState } from "react";
import {
    Card,
    Row,
    Col,
    Statistic,
    Spin,
    Typography,
    Grid,
    DatePicker,
    Space,
    Button,
} from "antd";
import {
    DollarOutlined,
    CalendarOutlined,
    ShoppingOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    HomeOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { motion } from "framer-motion";
import RoleWrapper from "../../components/wrapper/AdminWrapper";
import { getRevenue } from "../../config/Api";
import type { IRevenueRes } from "../../types/revenue";
import { formatVND } from "../../utils/format/price";
import { formatLocalDate } from "../../utils/format/localdatetime";
import type { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import PermissionWrapper from "../../components/wrapper/PermissionWrapper";
import Forbidden from "../error/Forbbiden";
import { FaDownload } from "react-icons/fa";
import { exportRevenueReport } from "../../utils/export/exportRevenueReport";
import { useAppSelector } from "../../redux/hooks";

const { Title } = Typography;
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

    const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

    useEffect(() => {
        const fetchRevenue = async () => {
            if (!isAuthenticated) return; // chưa logn thì ko gọ api
            try {
                setLoading(true);

                const from = range?.[0]?.format("YYYY-MM-DD");
                const to = range?.[1]?.format("YYYY-MM-DD");

                const res = await getRevenue(from, to);

                if (res.data.statusCode === 200) {
                    setData(res.data.data ?? null);
                }
            } catch (error: any) {
                const m = error?.response?.data?.message ?? "Không xác định";
                toast.error(
                    <div>
                        <div>Có lỗi xảy ra</div>
                        <div>{m}</div>
                    </div>
                );
            } finally {
                setLoading(false);
            }
        };

        fetchRevenue();
    }, [isAuthenticated, range]);

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

    if (loading || !data) {
        return (
            <RoleWrapper>
                <Spin size="large" style={{ marginTop: 100 }} />
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
        <RoleWrapper>
            <PermissionWrapper required={"REVENUE_VIEW_DETAIL"}
                fallback={<Forbidden />}
            >
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



                    {/* KPI */}
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

                    {/* CHARTS */}
                    <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
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
                </div>
            </PermissionWrapper>
        </RoleWrapper>
    );
};

export default AdminPage;
