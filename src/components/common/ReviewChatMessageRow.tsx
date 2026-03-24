import type { CSSProperties } from 'react';
import { Avatar, Popover } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { IReviewMessage } from '../../types/review';

export interface ReviewChatMessageRowProps {
    msg: IReviewMessage;
    /** true = tin của tài khoản đang đăng nhập → canh phải, bubble xanh Messenger */
    isMine: boolean;
    isMobile: boolean;
    /** Trạng thái gửi/nhận/đã xem — chỉ hiển thị trên tin của mình */
    statusLabel?: string;
}

/**
 * Một dòng chat đánh giá: tin nhận trái (xám #e4e6eb), tin gửi phải (xanh #0084ff), kiểu Messenger.
 */
const ReviewChatMessageRow = ({ msg, isMine, isMobile, statusLabel }: ReviewChatMessageRowProps) => {
    const senderName = msg.senderFullName || msg.senderName || 'Người dùng';
    const senderAvatar = msg.senderAvatarUrl || undefined;
    const sentAt = dayjs(msg.createdAt).format('HH:mm DD/MM/YYYY');

    const bubbleStyle: CSSProperties = isMine
        ? {
              background: '#0084ff',
              color: '#fff',
              borderRadius: '18px 18px 4px 18px',
              padding: '10px 14px',
              maxWidth: '100%',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
          }
        : {
              background: '#e4e6eb',
              color: '#050505',
              borderRadius: '18px 18px 18px 4px',
              padding: '10px 14px',
              maxWidth: '100%',
              boxShadow: '0 1px 1px rgba(0, 0, 0, 0.06)',
          };

    const nameStyle: CSSProperties = {
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 4,
        opacity: isMine ? 0.9 : 0.75,
        color: isMine ? 'rgba(255,255,255,0.92)' : undefined,
    };

    const metaStyle: CSSProperties = {
        fontSize: 11,
        marginTop: 6,
        opacity: isMine ? 0.72 : 0.55,
        textAlign: isMine ? 'right' : 'left',
        color: isMine ? 'rgba(255,255,255,0.85)' : undefined,
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                width: '100%',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: isMine ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                    maxWidth: isMobile ? 'min(100%, 100%)' : 'min(86%, 440px)',
                }}
            >
                <Popover
                    trigger="click"
                    content={
                        <div style={{ minWidth: isMobile ? 170 : 220 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>{senderName}</div>
                            <div style={{ fontSize: 12, opacity: 0.78 }}>ID người dùng: {msg.senderId}</div>
                            <div style={{ fontSize: 12, opacity: 0.78 }}>Gửi lúc: {sentAt}</div>
                            {isMine && statusLabel ? (
                                <div style={{ fontSize: 12, opacity: 0.78 }}>Trạng thái: {statusLabel}</div>
                            ) : null}
                        </div>
                    }
                >
                    <Avatar
                        size={isMobile ? 28 : 32}
                        src={senderAvatar}
                        icon={<UserOutlined />}
                        style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                </Popover>

                <div style={bubbleStyle}>
                    {!isMine ? <div style={nameStyle}>{senderName}</div> : null}
                    <div style={{ wordBreak: 'break-word', lineHeight: 1.45 }}>{msg.content}</div>
                    <div style={metaStyle}>
                        {sentAt}
                        {isMine && statusLabel ? ` · ${statusLabel}` : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewChatMessageRow;
