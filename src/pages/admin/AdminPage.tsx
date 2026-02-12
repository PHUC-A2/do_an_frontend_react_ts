import { useEffect, useMemo, useState } from "react";
import {
    Card,
    Row,
    Col,
    Statistic,
    Spin,
    Typography,
    Grid,
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

const { Title } = Typography;
const { useBreakpoint } = Grid;

const AdminPage = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<IRevenueRes | null>(null);

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                setLoading(true);
                const res = await getRevenue();
                if (res.data.statusCode === 200) {
                    setData(res.data.data ?? null);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchRevenue();
    }, []);

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

    const chartHeight = isMobile ? 300 : 400;

    /* ================= CHART COLORS ================= */

    const chartColors = [
        "#1677ff",
        "#52c41a",
        "#faad14",
        "#722ed1",
        "#13c2c2",
        "#eb2f96",
    ];

    return (
        <RoleWrapper>
            <div style={{ padding: "0 16px", overflowX: "hidden" }}>
                <Title level={isMobile ? 4 : 3} style={{ marginBottom: 24 }}>
                    Dashboard Thống Kê
                </Title>

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
                                    color: ["#1677ff"],
                                    tooltip: {
                                        trigger: "axis",
                                        formatter: (params: any) => {
                                            const p = params[0];
                                            return `${p.axisValue}<br/>${formatVND(p.data)}`;
                                        },
                                    },
                                    xAxis: {
                                        type: "category",
                                        data: data.revenueByDate.map(i => formatLocalDate(i.label)),
                                    },
                                    yAxis: {
                                        type: "value",
                                        axisLabel: {
                                            formatter: (v: number) => formatVND(v),
                                        },
                                    },
                                    series: [
                                        {
                                            data: data.revenueByDate.map(i => i.revenue),
                                            type: "line",
                                            smooth: true,
                                            showSymbol: false,
                                            areaStyle: {
                                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                                    { offset: 0, color: "rgba(22,119,255,0.4)" },
                                                    { offset: 1, color: "rgba(22,119,255,0.05)" },
                                                ]),
                                            },
                                            lineStyle: { width: 3 },
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
                                    color: ["#52c41a"],
                                    tooltip: {
                                        trigger: "axis",
                                        formatter: (params: any) => {
                                            const p = params[0];
                                            return `${p.name}<br/>${formatVND(p.value)}`;
                                        },
                                    },
                                    xAxis: {
                                        type: "value",
                                    },
                                    yAxis: {
                                        type: "category",
                                        data: groupedPitchRevenue.map((i: any) => i.pitchName),
                                    },
                                    series: [
                                        {
                                            data: groupedPitchRevenue.map((i: any) => i.revenue),
                                            type: "bar",
                                            label: {
                                                show: true,
                                                position: "right",
                                                formatter: (p: any) => formatVND(p.value),
                                            },
                                            itemStyle: {
                                                borderRadius: [0, 8, 8, 0],
                                            },
                                        },
                                    ],
                                }}
                                style={{ height: chartHeight }}
                            />
                        </Card>
                    </Col>

                    {/* PIE REVENUE */}
                    <Col xs={24} md={12}>
                        <Card title="Tỷ trọng doanh thu" size="small" variant="borderless">
                            <ReactECharts
                                option={{
                                    color: chartColors,
                                    tooltip: {
                                        trigger: "item",
                                        formatter: (p: any) =>
                                            `${p.name}<br/>${formatVND(p.value)} (${p.percent}%)`,
                                    },
                                    series: [
                                        {
                                            type: "pie",
                                            radius: ["45%", "70%"],
                                            label: {
                                                formatter: "{b}\n{d}%",
                                            },
                                            data: groupedPitchRevenue.map((i: any) => ({
                                                value: i.revenue,
                                                name: i.pitchName,
                                            })),
                                        },
                                    ],
                                }}
                                style={{ height: chartHeight }}
                            />
                        </Card>
                    </Col>

                    {/* BOOKING STATUS */}
                    <Col xs={24} md={12}>
                        <Card title="Tình trạng Booking" size="small" variant="borderless">
                            <ReactECharts
                                option={{
                                    color: ["#52c41a", "#ff4d4f"],
                                    tooltip: { trigger: "item" },
                                    series: [
                                        {
                                            type: "pie",
                                            radius: "65%",
                                            label: {
                                                formatter: "{b}\n{d}%",
                                            },
                                            data: [
                                                { value: data.paidBookings, name: "Đã thanh toán" },
                                                { value: data.cancelledBookings, name: "Đã hủy" },
                                            ],
                                        },
                                    ],
                                }}
                                style={{ height: chartHeight }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </RoleWrapper>
    );
};

export default AdminPage;
