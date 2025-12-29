import { Button, Result } from "antd";
import { useNavigate } from "react-router";

// pages/error/Forbidden.tsx
const Forbidden = () => {
    const navigate = useNavigate();
    return (
        <Result
            status="403"
            title="403"
            subTitle="Bạn không có quyền truy cập trang này."
            extra={<Button variant="outlined" onClick={() => {
                const targetPath = location.pathname.startsWith("/admin") ? "/admin" : "/";
                navigate(targetPath);
            }}>
                Quay lại trang chủ
            </Button>}
        />
    );
};

export default Forbidden;
