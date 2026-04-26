import { Badge, Button, Drawer, Empty, Space, Spin, Switch, Tag, Typography } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import type { IUser } from '../../../../types/user';
import { assignRole, getUserById } from '../../../../config/Api';
import { fetchRoles, selectRoles, selectRoleLastListQuery } from '../../../../redux/features/roleSlice';
import { fetchUsers, selectUserLastListQuery } from '../../../../redux/features/userSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import { usePermission } from '../../../../hooks/common/usePermission';

const { Text } = Typography;

interface IProps {
    openModalAssignRole: boolean;
    setOpenModalAssignRole: (v: boolean) => void;
    userAssignRole: IUser | null;
}

const AdminModalAssignRole = (props: IProps) => {
    const { openModalAssignRole, setOpenModalAssignRole, userAssignRole } = props;
    const dispatch = useAppDispatch();
    const allRoles = useAppSelector(selectRoles);
    const userListQuery = useAppSelector(selectUserLastListQuery);
    const roleListQuery = useAppSelector(selectRoleLastListQuery);

    const [enabledRoleIds, setEnabledRoleIds] = useState<Set<number>>(new Set());
    const [loadingDrawer, setLoadingDrawer] = useState(false);
    const [savingRoles, setSavingRoles] = useState(false);

    const canViewRoles = usePermission('ROLE_VIEW_LIST');
    const canViewUserDetail = usePermission('USER_VIEW_DETAIL');
    const canAssignRole = usePermission('USER_ASSIGN_ROLE');

    useEffect(() => {
        const load = async () => {
            if (!openModalAssignRole || !userAssignRole?.id) return;
            setLoadingDrawer(true);
            try {
                if (!canViewRoles) {
                    toast.error('Bạn không có quyền xem danh sách vai trò');
                    return;
                }
                if (!canViewUserDetail) {
                    toast.error('Bạn không có quyền xem chi tiết người dùng');
                    return;
                }
                await dispatch(fetchRoles(roleListQuery || DEFAULT_ADMIN_LIST_QUERY)).unwrap();
                const res = await getUserById(userAssignRole.id);
                const current: number[] = (res.data.data?.roles ?? []).map((r: any) => r.id);
                setEnabledRoleIds(new Set(current));
            } catch {
                toast.error('Không tải được thông tin vai trò');
            } finally {
                setLoadingDrawer(false);
            }
        };
        load();
    }, [openModalAssignRole, userAssignRole?.id]);

    const handleToggleRole = (id: number, checked: boolean) => {
        setEnabledRoleIds(prev => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleSaveRoles = async () => {
        if (!userAssignRole) return;
        if (!canAssignRole) {
            toast.error('Bạn không có quyền gắn vai trò cho người dùng');
            return;
        }
        setSavingRoles(true);
        try {
            await assignRole(userAssignRole.id, { roleIds: Array.from(enabledRoleIds) });
            toast.success('Đã cập nhật vai trò cho người dùng');
            dispatch(fetchUsers(userListQuery || DEFAULT_ADMIN_LIST_QUERY));
            setOpenModalAssignRole(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Lưu thất bại');
        } finally {
            setSavingRoles(false);
        }
    };

    return (
        <Drawer
            open={openModalAssignRole}
            onClose={() => setOpenModalAssignRole(false)}
            title={
                <Space>
                    <SafetyOutlined />
                    <span>
                        Gắn vai trò:{' '}
                        <Tag color="blue">{userAssignRole?.name ?? userAssignRole?.email}</Tag>
                    </span>
                </Space>
            }
            styles={{ body: { padding: '16px 20px' }, wrapper: { width: 480 } }}
            extra={
                <Button
                    type="primary"
                    loading={savingRoles}
                    onClick={handleSaveRoles}
                    disabled={!canAssignRole || !canViewRoles || !canViewUserDetail}
                >
                    Lưu
                </Button>
            }
        >
            <Spin spinning={loadingDrawer}>
                <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Bật/tắt từng vai trò để phân quyền cho người dùng này.
                    </Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {allRoles.map(role => {
                        const on = enabledRoleIds.has(role.id);
                        return (
                            <div
                                key={role.id}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: on ? 'rgba(82,196,26,0.06)' : 'rgba(0,0,0,0.02)',
                                    border: `1px solid ${on ? 'rgba(82,196,26,0.3)' : 'rgba(0,0,0,0.06)'}`,
                                    transition: 'all 0.18s',
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleToggleRole(role.id, !on)}
                            >
                                <Space size={10}>
                                    <Badge
                                        dot
                                        color={on ? '#52c41a' : '#d9d9d9'}
                                        style={{ marginTop: 2 }}
                                    />
                                    <div>
                                        <Text strong style={{ fontSize: 13, display: 'block', lineHeight: '1.2' }}>
                                            <Tag
                                                color={
                                                    role.name === 'ADMIN' &&
                                                    (role.tenantId == null || role.tenantId === undefined)
                                                        ? 'warning'
                                                        : 'blue'
                                                }
                                                style={{ margin: 0 }}
                                            >
                                                {role.name}
                                            </Tag>
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
                                            {role.tenantId == null || role.tenantId === undefined
                                                ? 'Phạm vi: toàn hệ thống'
                                                : `Phạm vi: shop #${role.tenantId}`}
                                        </Text>
                                        {role.description && (
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                {role.description}
                                            </Text>
                                        )}
                                    </div>
                                </Space>
                                <Switch
                                    size="small"
                                    checked={on}
                                    onChange={(checked, e) => {
                                        e.stopPropagation();
                                        handleToggleRole(role.id, checked);
                                    }}
                                />
                            </div>
                        );
                    })}
                    {allRoles.length === 0 && !loadingDrawer && (
                        <Empty description={
                            !canViewRoles ? 'Bạn không có quyền xem danh sách vai trò'
                                : !canViewUserDetail ? 'Bạn không có quyền xem chi tiết người dùng'
                                    : 'Chưa có vai trò nào'
                        } />
                    )}
                </div>
            </Spin>
        </Drawer>
    );
};

export default AdminModalAssignRole;
