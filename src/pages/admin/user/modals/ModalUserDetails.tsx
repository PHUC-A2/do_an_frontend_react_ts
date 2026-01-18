import { Descriptions, Drawer, Spin, Tag } from "antd";
import type { IUser } from "../../../../types/user";
import dayjs from "dayjs";
interface IProps {
    setOpenModalUserDetails: (v: boolean) => void;
    openModalUserDetails: boolean;
    user: IUser | null;
    isLoading: boolean;
}

type UserStatus = NonNullable<IUser['status']>;

const statusColors: Record<UserStatus, string> = {
    ACTIVE: 'green',
    INACTIVE: 'volcano',
    PENDING_VERIFICATION: 'gold',
    BANNED: 'red',
    DELETED: 'gray',
};

const ModalUserDetails = (props: IProps) => {

    const {
        openModalUserDetails,
        setOpenModalUserDetails,
        user,
        isLoading
    } = props;
    console.log(user);
    return (
        <Drawer
            title="Chi tiết người dùng"
            placement="right"
            closable={false}
            onClose={() => setOpenModalUserDetails(false)}
            open={openModalUserDetails}
        >
            <Spin spinning={isLoading}>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="ID">{user?.id}</Descriptions.Item>
                    <Descriptions.Item label="Tên">{user?.name ?? "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Họ và tên">{user?.fullName ?? "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Email">{user?.email ?? "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{user?.phoneNumber ?? "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái người dùng">
                        {user?.status ? (
                            <Tag color={statusColors[user.status]}>
                                {user.status}
                            </Tag>
                        ) : (
                            "N/A"
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Vai trò">
                        {user?.roles?.length ? (
                            user?.roles.map((r) => (
                                <Tag color="orange" key={r.id}>
                                    {r.name}
                                </Tag>
                            ))
                        ) : (
                            "N/A"
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {user?.createdBy ? user.createdBy : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {user?.updatedBy ? user.updatedBy : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                        {user?.createdAt ? dayjs(user.createdAt).format("DD/MM/YYYY HH:mm:ss") : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">
                        {user?.updatedAt ? dayjs(user.updatedAt).format("DD/MM/YYYY HH:mm:ss") : "N/A"}
                    </Descriptions.Item>
                </Descriptions>
            </Spin>
        </Drawer>
    )
}

export default ModalUserDetails;