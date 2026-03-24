import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Grid, Input, Modal, Popover, Rate, Select, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { adminGetReviewMessages, adminGetReviews, adminSendReviewMessage, adminUpdateReviewStatus } from '../../../config/Api';
import type { IReview, IReviewMessage, ReviewStatus } from '../../../types/review';
import { buildSpringListQuery } from '../../../utils/pagination/buildSpringPageQuery';
import { toast } from 'react-toastify';
import { SendOutlined, SmileOutlined } from '@ant-design/icons';
import { useAppSelector } from '../../../redux/hooks';
import ReviewChatMessageRow from '../../../components/common/ReviewChatMessageRow';
import '../../../styles/reviewChatScroll.scss';

const REVIEW_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'HIDDEN', label: 'Đã ẩn' },
] as const;
const { Text } = Typography;
const { useBreakpoint } = Grid;
const QUICK_EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '🎉', '⚽', '🔥', '💯', '🥳', '🤝', '❤️'];

const AdminReviewManager = () => {
    const account = useAppSelector((state) => state.account.account);
    const screens = useBreakpoint();
    const isMobile = screens.md !== true;
    const [reviews, setReviews] = useState<IReview[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [activeReview, setActiveReview] = useState<IReview | null>(null);
    const [chatMessages, setChatMessages] = useState<IReviewMessage[]>([]);
    const [chatContent, setChatContent] = useState('');
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [forbidden, setForbidden] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);

    const query = useMemo(() => buildSpringListQuery({
        page,
        pageSize,
        sort: [{ property: 'id', direction: 'desc' }],
    }), [page, pageSize]);

    const loadReviews = useCallback(async (opts?: { silent?: boolean }) => {
        const silent = Boolean(opts?.silent);
        if (!silent) {
            setLoading(true);
        }
        try {
            const res = await adminGetReviews(query);
            setReviews(res.data.data?.result ?? []);
            setTotal(res.data.data?.meta?.total ?? 0);
            setForbidden(false);
        } catch {
            setReviews([]);
            setTotal(0);
            setForbidden(true);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [query]);

    useEffect(() => {
        void loadReviews();
    }, [loadReviews]);

    // Bảng đánh giá không có WebSocket — refetch định kỳ (không bật Spin) để thấy đánh giá mới
    useEffect(() => {
        if (forbidden) return;
        const timer = window.setInterval(() => {
            void loadReviews({ silent: true });
        }, 20000);
        return () => window.clearInterval(timer);
    }, [forbidden, loadReviews]);

    // Modal chat mở: poll tin nhắn để luôn khớp DB khi WebSocket không đẩy được tới tab này
    useEffect(() => {
        if (!chatModalOpen || !activeReview) {
            return;
        }
        const reviewId = activeReview.id;
        const syncMessages = async () => {
            try {
                const res = await adminGetReviewMessages(reviewId);
                setChatMessages(res.data.data ?? []);
            } catch {
                /* bỏ qua một nhịp */
            }
        };
        const quickSync = window.setTimeout(() => {
            void syncMessages();
        }, 600);
        const timer = window.setInterval(() => {
            void syncMessages();
        }, 4000);
        return () => {
            window.clearTimeout(quickSync);
            window.clearInterval(timer);
        };
    }, [chatModalOpen, activeReview?.id]);

    const closeSocket = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
    };

    const openChat = async (review: IReview) => {
        setActiveReview(review);
        setChatModalOpen(true);
        closeSocket();
        try {
            const res = await adminGetReviewMessages(review.id);
            setChatMessages(res.data.data ?? []);
        } catch {
            toast.error('Không thể tải hội thoại');
        }

        const token = localStorage.getItem('access_token');
        if (!token) return;
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${protocol}://${window.location.host}/ws/reviews/${review.id}?token=${encodeURIComponent(token)}`);
        ws.onerror = () => {
            toast.warn(
                'Kết nối chat realtime lỗi (cấu hình nginx/Vite cần proxy /ws). Tin gửi qua API vẫn được; mở lại chat để đồng bộ.',
                { autoClose: 8000 },
            );
        };
        ws.onmessage = (event) => {
            try {
                const incoming: IReviewMessage = JSON.parse(event.data);
                setChatMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
            } catch {
                // ignore malformed payload
            }
        };
        socketRef.current = ws;
    };

    const sendChat = async () => {
        if (!activeReview || !chatContent.trim()) return;
        const payload = { content: chatContent.trim() };
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(payload));
            setChatContent('');
            return;
        }
        try {
            await adminSendReviewMessage(activeReview.id, payload);
            const res = await adminGetReviewMessages(activeReview.id);
            setChatMessages(res.data.data ?? []);
            setChatContent('');
        } catch {
            toast.error('Không thể gửi tin nhắn');
        }
    };

    const insertEmoji = (emoji: string) => {
        setChatContent((prev) => `${prev}${emoji}`);
        setEmojiOpen(false);
    };

    const getChatStatusLabel = (msg: IReviewMessage) => {
        if (msg.readAt) return 'Đã xem';
        if (msg.deliveredAt) return 'Đã nhận';
        return 'Đã gửi';
    };

    useEffect(() => () => closeSocket(), []);

    const updateStatus = async (review: IReview, status: ReviewStatus) => {
        try {
            await adminUpdateReviewStatus(review.id, { status });
            toast.success('Cập nhật trạng thái thành công');
            loadReviews();
        } catch {
            toast.error('Không thể cập nhật trạng thái');
        }
    };

    const columns: ColumnsType<IReview> = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 72,
        },
        {
            title: 'Người đánh giá',
            render: (_, row) => row.userFullName || row.userName || `User #${row.userId}`,
        },
        {
            title: 'Đối tượng',
            render: (_, row) => (
                <Tag color={row.targetType === 'PITCH' ? 'gold' : 'blue'}>
                    {row.targetType === 'PITCH' ? (row.pitchName || 'Sân') : 'Hệ thống'}
                </Tag>
            ),
        },
        {
            title: 'Sao',
            dataIndex: 'rating',
            render: (rating: number) => <Rate disabled value={rating} style={{ fontSize: 14 }} />,
        },
        {
            title: 'Nhận xét',
            dataIndex: 'content',
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            render: (_, row) => (
                <Select
                    value={row.status}
                    style={{ minWidth: 132 }}
                    options={REVIEW_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                    onChange={(value) => updateStatus(row, value as ReviewStatus)}
                />
            ),
        },
        {
            title: 'Thao tác',
            render: (_, row) => (
                <Button type="link" onClick={() => openChat(row)}>
                    Chat
                </Button>
            ),
        },
    ];

    return (
        <>
            <Card
                title="Quản lý đánh giá sao & nhận xét"
                size="small"
                variant="borderless"
                style={{ marginTop: 16 }}
            >
                {forbidden ? (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message="Tài khoản hiện tại chưa có quyền xem đánh giá. Cần quyền BOOKING_VIEW_LIST."
                    />
                ) : null}
                <Table
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={reviews}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        onChange: (nextPage, nextPageSize) => {
                            setPage(nextPage);
                            setPageSize(nextPageSize);
                        },
                    }}
                    scroll={{ x: 980 }}
                />
            </Card>

            <Modal
                title={`Trao đổi đánh giá${activeReview ? ` #${activeReview.id}` : ''}`}
                open={chatModalOpen}
                onCancel={() => {
                    setChatModalOpen(false);
                    closeSocket();
                }}
                footer={null}
                width={isMobile ? 'calc(100vw - 16px)' : 760}
            >
                <div
                    className="review-chat-scroll"
                    style={{ maxHeight: isMobile ? 320 : 360, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                    {chatMessages.length === 0 ? (
                        <Text type="secondary">Chưa có tin nhắn nào trong đoạn chat này</Text>
                    ) : (
                        chatMessages.map((item) => {
                            const mine =
                                account?.id != null && Number(item.senderId) === Number(account.id);
                            return (
                                <ReviewChatMessageRow
                                    key={item.id}
                                    msg={item}
                                    isMine={mine}
                                    isMobile={isMobile}
                                    statusLabel={getChatStatusLabel(item)}
                                />
                            );
                        })
                    )}
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                    }}
                >
                    <Popover
                        trigger="click"
                        open={emojiOpen}
                        onOpenChange={setEmojiOpen}
                        content={
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(6, minmax(26px, 1fr))',
                                    gap: 6,
                                    maxWidth: 220,
                                }}
                            >
                                {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => insertEmoji(emoji)}
                                        style={{
                                            border: '1px solid rgba(148,163,184,0.3)',
                                            background: 'transparent',
                                            borderRadius: 8,
                                            height: 30,
                                            cursor: 'pointer',
                                            fontSize: 18,
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        <Button icon={<SmileOutlined />} />
                    </Popover>
                    <Input
                        value={chatContent}
                        onChange={(e) => setChatContent(e.target.value)}
                        onPressEnter={sendChat}
                        placeholder="Nhập phản hồi cho người dùng..."
                        style={{ flex: 1, minWidth: isMobile ? '100%' : 180 }}
                    />
                    <Button type="primary" icon={<SendOutlined />} onClick={sendChat}>
                        Gửi
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default AdminReviewManager;
