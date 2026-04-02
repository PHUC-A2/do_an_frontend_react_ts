import { useEffect, useState } from "react";
import { Tooltip } from "antd";
import { motion } from "framer-motion";
import { FaFacebookMessenger } from "react-icons/fa";
import { useAppSelector } from "../../../redux/hooks";
import { getPublicMessengerConfig } from "../../../config/Api";

const MotionButton = motion.button;

const MessageButton = () => {
    const [visible, setVisible] = useState<boolean>(false);
    const [pageId, setPageId] = useState<string>("");

    // đọc state ẩn/hiện
    const hidden = useAppSelector(
        state => state.messengerButtonUi.hidden
    );

    useEffect(() => {
        const onScroll = (): void => {
            setVisible(window.scrollY > 80);
        };

        onScroll();
        window.addEventListener("scroll", onScroll);

        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await getPublicMessengerConfig();
                setPageId(res.data?.data?.pageId ?? "");
            } catch {
                setPageId("");
            }
        };
        void loadConfig();
    }, []);

    if (hidden) return null; // DÒNG QUYẾT ĐỊNH
    if (!visible) return null;
    if (!pageId) return null;

    const onClick = () => {
        window.open(
            `https://m.me/${pageId}`,
            "_blank"
        );
    };

    return (
        <Tooltip title="Chat Messenger" placement="left">
            <MotionButton
                onClick={onClick}
                aria-label="Chat Messenger"
                tabIndex={0}
                style={{
                    position: "fixed",
                    bottom: 20,
                    right: 18,
                    zIndex: 2000,
                    cursor: "pointer",
                    color: "#0084FF",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,132,255,0.18)",
                    boxShadow: "0 8px 18px rgba(0, 132, 255, 0.32)",
                    outline: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    WebkitTapHighlightColor: "transparent",
                    overflow: "visible",
                }}
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
            >
                <motion.span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: -8,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255,160,0,0.46) 0%, rgba(255,90,0,0.27) 40%, rgba(255,90,0,0) 72%)",
                        filter: "blur(3px)",
                        pointerEvents: "none",
                    }}
                    animate={{ opacity: [0.42, 0.88, 0.42], scale: [0.88, 1.18, 0.88] }}
                    transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                />
                <FaFacebookMessenger size={24} />
            </MotionButton>
        </Tooltip>

    );
};

export default MessageButton;
