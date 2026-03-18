import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, Input, Button } from 'antd';
import { RiRobot2Line } from 'react-icons/ri';
import { IoSend, IoClose } from 'react-icons/io5';
import { adminAiChat } from '../../../config/Api';
import { useAppDispatch } from '../../../redux/hooks';
import { setAdminChatOpen } from '../../../redux/features/messengerButtonUiSlice';
import styles from './AdminChatBot.module.scss';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    provider?: string;
}

const MotionDiv = motion.div;

const AdminChatBot = () => {
    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);

    const toggleOpen = (val: boolean) => {
        setOpen(val);
        dispatch(setAdminChatOpen(val));
    };
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Xin chào Admin! Tôi có thể phân tích thống kê hệ thống, doanh thu, booking và hỗ trợ quản lý. Bạn cần gì?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
            const res = await adminAiChat({ message: text, history });
            const data = res.data?.data;
            if (data) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.reply,
                    provider: data.provider
                }]);
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

    return (
        <>
            <Tooltip title="AI Trợ lý quản trị" placement="left">
                <motion.button
                    onClick={() => toggleOpen(!open)}
                    className={styles.chatBtn}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    aria-label="Admin AI Chat"
                >
                    <motion.span
                        className={styles.chatBtnGlow}
                        animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.2, 0.9] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <RiRobot2Line size={22} />
                </motion.button>
            </Tooltip>

            <AnimatePresence>
                {open && (
                    <MotionDiv
                        className={styles.chatWindow}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className={styles.chatHeader}>
                            <div className={styles.chatHeaderLeft}>
                                <RiRobot2Line size={18} />
                                <span>AI Admin</span>
                                <span className={styles.onlineDot} />
                            </div>
                            <button className={styles.closeBtn} onClick={() => toggleOpen(false)}>
                                <IoClose size={18} />
                            </button>
                        </div>

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

                        <div className={styles.inputRow}>
                            <Input
                                ref={inputRef as any}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Hỏi về thống kê, doanh thu..."
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

export default AdminChatBot;
