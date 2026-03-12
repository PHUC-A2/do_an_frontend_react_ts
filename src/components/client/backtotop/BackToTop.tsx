import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tooltip } from "antd";
import { UpOutlined } from "@ant-design/icons";

interface BackToTopProps {
    theme: "light" | "dark";
}

const BackToTop: React.FC<BackToTopProps> = ({ theme }) => {
    const [visible, setVisible] = useState<boolean>(false);
    const isDark = theme === "dark";

    useEffect(() => {
        const onScroll = (): void => {
            setVisible(window.scrollY > 320);
        };

        onScroll();
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
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && scrollToTop()}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}

                style={{
                    position: "fixed",
                    bottom: 64,
                    right: 18,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: isDark ? "rgba(250, 173, 20, 0.30)" : "rgba(0, 21, 41, 0.30)",
                    color: isDark ? "#001529" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 2000,
                    boxShadow: isDark
                        ? "0 8px 18px rgba(250, 173, 20, 0.32)"
                        : "0 8px 18px rgba(0, 21, 41, 0.30)",
                    outline: "none",
                    overflow: "visible",
                }}
            >
                <motion.span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: -8,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255,160,0,0.44) 0%, rgba(255,88,0,0.25) 38%, rgba(255,88,0,0) 72%)",
                        filter: "blur(3px)",
                        pointerEvents: "none",
                    }}
                    animate={{ opacity: [0.4, 0.86, 0.4], scale: [0.88, 1.18, 0.88] }}
                    transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
                />
                <UpOutlined />
            </motion.div>
        </Tooltip>
    );
};

export default BackToTop;
