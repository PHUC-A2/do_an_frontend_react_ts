import { Tooltip } from "antd";
import { motion } from "framer-motion";
import { FaFacebookMessenger } from "react-icons/fa";
import { useAppSelector } from "../../../redux/hooks";

const MotionIcon = motion.create(FaFacebookMessenger);

const MessageButton = () => {

    // đọc state ẩn/hiện
    const hidden = useAppSelector(
        state => state.messengerButtonUi.hidden
    );

    if (hidden) return null; // DÒNG QUYẾT ĐỊNH

    const onClick = () => {
        window.open(
            `https://m.me/${import.meta.env.VITE_PAGE_ID}`,
            "_blank"
        );
    };

    return (
        <Tooltip title="Chat Messenger" placement="left">
            <MotionIcon
                onClick={onClick}
                size={36}
                tabIndex={-1} // rất quan trọng
                style={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: 2000,
                    cursor: "pointer",
                    color: "#0084FF",
                    filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.25))",
                    outline: "none",
                    border: "none",
                    WebkitTapHighlightColor: "transparent", // mobile
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
            />
        </Tooltip>

    );
};

export default MessageButton;
