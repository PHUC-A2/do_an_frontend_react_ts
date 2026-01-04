import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tooltip } from "antd";
import { UpOutlined } from "@ant-design/icons";

const BackToTop: React.FC = () => {
    const [visible, setVisible] = useState<boolean>(false);

    useEffect(() => {
        const onScroll = (): void => {
            setVisible(window.scrollY > 300);
        };

        window.addEventListener("scroll", onScroll);

        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    const scrollToTop = (): void => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (!visible) return null;

    return (
        <Tooltip title="Cuộn lên đầu trang" placement="left">
            <motion.div
                onClick={scrollToTop}
                role="button"
                aria-label="Back to top"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && scrollToTop()}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                    position: "fixed",
                    bottom: 90,
                    right: 24,
                    width: 35,
                    height: 35,
                    borderRadius: "50%",
                    background: "var(--backtotop-bg)",
                    color: "var(--backtotop-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 2000,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                    outline: "none",
                }}
            >
                <UpOutlined />
            </motion.div>
        </Tooltip>
    );
};

export default BackToTop;
