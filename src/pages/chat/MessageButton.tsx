import { Button } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";


const MotionButton = motion.create(Button);

const MessageButton = () => {

    const onClick = () => {
        window.open(`https://m.me/${import.meta.env.VITE_PAGE_ID}`, "_blank");
    };

    return (
        <MotionButton
            type="primary"
            shape="circle"
            icon={<MessageOutlined style={{ fontSize: 20 }} />}
            onClick={onClick}
            style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                zIndex: 1000,
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                background: "rgba(250, 173, 20, 0.9)",
            }}
            // Animation props của framer-motion
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.1, boxShadow: "0 8px 25px rgba(0,0,0,0.3)" }}
            whileTap={{ scale: 0.9 }}
        />
    );
};

export default MessageButton;