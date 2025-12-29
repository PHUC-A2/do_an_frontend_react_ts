import { Result, Button } from "antd";
import { useNavigate } from "react-router";

const NotFoundPage = () => {
    const navigate = useNavigate();
    return (
        <Result
            status="404"
            title="404"
            subTitle="Sorry, the page you visited does not exist."
            extra={<Button variant="outlined" onClick={() => {
                const targetPath = location.pathname.startsWith("/admin") ? "/admin" : "/";
                navigate(targetPath);
            }}>
                Quay lại trang chủ
            </Button>}
        />
    );
};

export default NotFoundPage;