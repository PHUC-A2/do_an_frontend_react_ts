import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, Input, Button } from 'antd';
import { RiRobot2Line } from 'react-icons/ri';
import { IoSend, IoClose } from 'react-icons/io5';
import { clientAiChat } from '../../../config/Api';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import { setClientChatOpen } from '../../../redux/features/messengerButtonUiSlice';
import styles from './ChatBot.module.scss';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    provider?: string;
}

const MotionDiv = motion.div;

const ChatBot = () => {
    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);

    const toggleOpen = (val: boolean) => {
        setOpen(val);
        dispatch(setClientChatOpen(val));
    };
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Xin chào! Tôi là trợ lý AI của TBU Sport. Tôi có thể giúp bạn đặt sân, xem lịch trống, hoặc giải đáp các thắc mắc. Bạn cần hỗ trợ gì?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [remaining, setRemaining] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const hidden = useAppSelector(state => state.messengerButtonUi.hidden);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 300);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [open, messages]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: Message = { role: 'user', content: text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const history = newMessages.slice(1, -1).map(m => ({ role: m.role, content: m.content }));
            const res = await clientAiChat({ message: text, history });
            const data = res.data?.data;
            if (data) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.reply,
                    provider: data.provider
                }]);
                setRemaining(data.remainingMessages);
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (hidden) return null;

    return (
        <>
            {/* Chat bubble button */}
            <Tooltip title="Chat với AI" placement="left">
                <motion.button
                    onClick={() => toggleOpen(!open)}
                    className={styles.chatBtn}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    aria-label="AI Chat"
                >
                    <motion.span
                        className={styles.chatBtnGlow}
                        animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.2, 0.9] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <RiRobot2Line size={22} />
                </motion.button>
            </Tooltip>

            {/* Chat window */}
            <AnimatePresence>
                {open && (
                    <MotionDiv
                        className={styles.chatWindow}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Header */}
                        <div className={styles.chatHeader}>
                            <div className={styles.chatHeaderLeft}>
                                <RiRobot2Line size={18} />
                                <span>TBU Sport AI</span>
                                <span className={styles.onlineDot} />
                            </div>
                            <button className={styles.closeBtn} onClick={() => toggleOpen(false)}>
                                <IoClose size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className={styles.messages}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`${styles.msgRow} ${msg.role === 'user' ? styles.userRow : styles.botRow}`}>
                                    {msg.role === 'assistant' && (
                                        <div className={styles.avatar}><RiRobot2Line size={14} /></div>
                                    )}
                                    <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.botBubble}`}>
                                        {msg.content}
                                        {msg.provider && msg.provider !== 'SYSTEM' && (
                                            <span className={styles.provider}>{msg.provider}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className={`${styles.msgRow} ${styles.botRow}`}>
                                    <div className={styles.avatar}><RiRobot2Line size={14} /></div>
                                    <div className={`${styles.bubble} ${styles.botBubble} ${styles.typingBubble}`}>
                                        <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Remaining info */}
                        {remaining !== null && remaining < 20 && (
                            <div className={styles.remainingInfo}>
                                Còn {remaining} tin nhắn hôm nay
                            </div>
                        )}

                        {/* Input */}
                        <div className={styles.inputRow}>
                            <Input
                                ref={inputRef as any}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập câu hỏi..."
                                disabled={loading}
                                className={styles.chatInput}
                                maxLength={2000}
                            />
                            <Button
                                type="primary"
                                icon={<IoSend size={14} />}
                                onClick={sendMessage}
                                loading={loading}
                                disabled={!input.trim()}
                                className={styles.sendBtn}
                            />
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBot;
