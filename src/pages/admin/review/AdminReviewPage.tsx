import { Typography } from 'antd';
import { MdRateReview } from 'react-icons/md';
import RoleWrapper from '../../../components/wrapper/AdminWrapper';
import AdminReviewManager from '../support/AdminReviewManager';

const { Title } = Typography;

const AdminReviewPage = () => {
    return (
        <RoleWrapper>
            <div style={{ padding: '0 4px' }}>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MdRateReview size={26} color="#faad14" />
                    <Title level={3} style={{ margin: 0 }}>
                        Quản lý đánh giá & chat người dùng
                    </Title>
                </div>
                <AdminReviewManager />
            </div>
        </RoleWrapper>
    );
};

export default AdminReviewPage;
