import React, { useEffect } from "react";
import { Layout, Typography, Row, Col, Card, Image, Tag, Button } from "antd";
import { motion, type Variants } from "framer-motion";
import {
    EnvironmentOutlined,
    ClockCircleOutlined,
    ArrowRightOutlined
} from "@ant-design/icons";
import "./PitchPage.scss";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { useNavigate } from "react-router";
import { fetchPitches, selectPitches, selectPitchLoading } from "../../../redux/features/pitchSlice";
import type { IPitch } from "../../../types/pitch";
import { getPitchTypeLabel, PITCH_STATUS_META } from "../../../utils/constants/pitch.constants";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

interface PitchPageProps {
    theme: "light" | "dark";
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

const MotionCard = motion.create(Card);

const PitchPage: React.FC<PitchPageProps> = ({ theme }) => {
    const isDark = theme === "dark";
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const pitches = useAppSelector(selectPitches);
    const loading = useAppSelector(selectPitchLoading);

    useEffect(() => {
        dispatch(fetchPitches("page=1&pageSize=12"));
    }, [dispatch]);

    return (
        <Layout className={`pitch-page ${isDark ? "dark" : "light"}`}>
            <Content className="pitch-content">
                <div className="container-custom">

                    {/* HERO */}
                    <section className="hero-section">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                        >
                            <Title className="hero-title">
                                DANH SÁCH <br />
                                <span className="gold-text">SÂN BÓNG</span>
                            </Title>
                            <Paragraph className="hero-paragraph">
                                Chọn sân phù hợp, xem lịch trống và đặt sân ngay tức thì.
                            </Paragraph>
                        </motion.div>
                    </section>

                    {/* LIST PITCHES */}
                    <section style={{ paddingBottom: 80 }}>
                        <Row gutter={[24, 24]}>
                            {pitches.map((pitch: IPitch) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={pitch.id}>
                                    <MotionCard
                                        hoverable
                                        loading={loading}
                                        whileHover={{ y: -8 }}
                                        transition={{ type: "spring", stiffness: 200 }}
                                        cover={
                                            <Image
                                                src={pitch.pitchUrl ?? "/placeholder-pitch.jpg"}
                                                alt={pitch.name ?? "Pitch"}
                                                height={180}
                                                width="100%"
                                                preview={false}
                                                style={{ objectFit: "cover" }}
                                            />
                                        }
                                        onClick={() => navigate(`/booking/${pitch.id}`)}
                                    >
                                        <Title level={5} ellipsis>
                                            {pitch.name}
                                        </Title>

                                        <div style={{ marginBottom: 8 }}>
                                            <Tag color="blue">
                                                {getPitchTypeLabel(pitch.pitchType)}
                                            </Tag>
                                            <Tag color={PITCH_STATUS_META[pitch.status].color}>
                                                {PITCH_STATUS_META[pitch.status].label}
                                            </Tag>
                                        </div>

                                        <Text strong style={{ display: "block" }}>
                                            {pitch.pricePerHour.toLocaleString("vi-VN")} đ / giờ
                                        </Text>

                                        <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                                            <EnvironmentOutlined /> {pitch.address}
                                        </Text>

                                        <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                                            <ClockCircleOutlined />{" "}
                                            {pitch.open24h
                                                ? "Mở cửa 24/7"
                                                : `${pitch.openTime} - ${pitch.closeTime}`}
                                        </Text>

                                        <Button
                                            type="primary"
                                            block
                                            style={{ marginTop: 12 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/booking/${pitch.id}`);
                                            }}
                                        >
                                            Đặt sân <ArrowRightOutlined />
                                        </Button>
                                    </MotionCard>
                                </Col>
                            ))}
                        </Row>
                    </section>

                </div>
            </Content>
        </Layout>
    );
};

export default PitchPage;
