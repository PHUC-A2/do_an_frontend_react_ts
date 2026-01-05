import { Button, Card } from "antd";

const AdminPage = () => {
    return (
        <Card
            title="Object Card"
            extra={<Button type="link">More</Button>}
            hoverable // bật hover
            style={{
                boxShadow: '0 2px 8px rgba(211, 14, 14, 0.06)',
                borderRadius: 8,
            }}
        >
            Content
        </Card>
    );
};

export default AdminPage;
