import { Button, Collapse, Drawer, Empty, Space, Spin, Switch, Tag, Tooltip, Typography } from 'antd';
import type { CollapseProps } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { usePermission } from '../../../../hooks/common/usePermission';
import type { IRole } from '../../../../types/role';
import type { IPermission } from '../../../../types/permission';
import { assignPermission, getAllPermissions, getRoleById } from '../../../../config/Api';
import { fetchRoles, selectRoleLastListQuery } from '../../../../redux/features/roleSlice';
import { DEFAULT_ADMIN_LIST_QUERY } from '../../../../utils/pagination/defaultListQuery';
import { splitPermission } from '../../../../utils/constants/permission.utils';
import { PERMISSION_ACTION_COLOR } from '../../../../utils/constants/permission-ui.constants';

type CollapseItem = NonNullable<CollapseProps['items']>[0];
const { Text } = Typography;

interface IProps {
    openModalAssignPermisison: boolean;
    setOpenModalAssignPermisison: (v: boolean) => void;
    roleAssignPermission: IRole | null;
}

const AdminModalAssignPermission = (props: IProps) => {
    const { openModalAssignPermisison, setOpenModalAssignPermisison, roleAssignPermission } = props;
    const dispatch = useAppDispatch();
    const roleListQuery = useAppSelector(selectRoleLastListQuery);
    const canViewPermissions = usePermission('PERMISSION_VIEW_LIST');
    const canAssignPermission = usePermission('ROLE_ASSIGN_PERMISSION');
    const canViewRoleDetail = usePermission('ROLE_VIEW_DETAIL');

    const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);
    const [enabledIds, setEnabledIds] = useState<Set<number>>(new Set());
    const [loadingPerms, setLoadingPerms] = useState(false);
    const [savingPerms, setSavingPerms] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!openModalAssignPermisison || !roleAssignPermission?.id) return;
            setLoadingPerms(true);
            try {
                if (!canViewPermissions) {
                    toast.error('Bạn không có quyền xem danh sách quyền');
                    setAllPermissions([]);
                    return;
                }
                if (!canViewRoleDetail) {
                    toast.error('Bạn không có quyền xem chi tiết vai trò');
                    return;
                }

                const first = await getAllPermissions('page=1&pageSize=100');
                let all: IPermission[] = first.data.data?.result ?? [];
                const pages = first.data.data?.meta?.pages ?? 1;
                for (let p = 2; p <= pages; p++) {
                    const res = await getAllPermissions(`page=${p}&pageSize=100`);
                    all = all.concat(res.data.data?.result ?? []);
                }
                setAllPermissions(all);

                const detail = await getRoleById(roleAssignPermission.id);
                const current: number[] = (detail.data.data?.permissions ?? []).map((p: any) => p.id);
                setEnabledIds(new Set(current));
            } catch {
                toast.error('Không tải được danh sách quyền');
            } finally {
                setLoadingPerms(false);
            }
        };
        load();
    }, [canViewPermissions, openModalAssignPermisison, roleAssignPermission?.id]);

    const handleTogglePerm = (id: number, checked: boolean) => {
        setEnabledIds(prev => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleSavePerms = async () => {
        if (!roleAssignPermission) return;
        if (!canAssignPermission) {
            toast.error('Bạn không có quyền gắn quyền cho vai trò');
            return;
        }
        setSavingPerms(true);
        try {
            await assignPermission(roleAssignPermission.id, { permissionIds: Array.from(enabledIds) });
            toast.success('Đã cập nhật quyền cho vai trò');
            dispatch(fetchRoles(roleListQuery || DEFAULT_ADMIN_LIST_QUERY));
            setOpenModalAssignPermisison(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Lưu thất bại');
        } finally {
            setSavingPerms(false);
        }
    };

    const permsByResource = allPermissions.reduce<Record<string, IPermission[]>>((acc, p) => {
        const { resource } = splitPermission(p.name);
        if (!acc[resource]) acc[resource] = [];
        acc[resource].push(p);
        return acc;
    }, {});

    return (
        <Drawer
            open={openModalAssignPermisison}
            onClose={() => setOpenModalAssignPermisison(false)}
            title={
                <Space>
                    <SafetyOutlined />
                    <span>Phân quyền: <Tag color="blue">{roleAssignPermission?.name}</Tag></span>
                </Space>
            }
            styles={{ body: { padding: '12px 20px' }, wrapper: { width: 480 } }}
            extra={
                <Button
                    type="primary"
                    loading={savingPerms}
                    onClick={handleSavePerms}
                    disabled={!canAssignPermission || !canViewPermissions || !canViewRoleDetail}
                >
                    Lưu
                </Button>
            }
        >
            <Spin spinning={loadingPerms}>
                <Collapse
                    accordion
                    items={Object.entries(permsByResource).map(([resource, perms]): CollapseItem => {
                        const activeCount = perms.filter(p => enabledIds.has(p.id)).length;
                        const allOn = activeCount === perms.length;
                        const someOn = activeCount > 0 && !allOn;
                        return {
                            key: resource,
                            label: (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Tag
                                        color="geekblue"
                                        style={{ margin: 0, fontWeight: 700, letterSpacing: 1, minWidth: 80, textAlign: 'center' }}
                                    >
                                        {resource}
                                    </Tag>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {activeCount}/{perms.length} quyền
                                    </Text>
                                </div>
                            ),
                            extra: (
                                <Tooltip title={allOn ? 'Tắt tất cả' : 'Bật tất cả'}>
                                    <Switch
                                        size="small"
                                        checked={allOn}
                                        style={someOn ? { backgroundColor: '#faad14' } : undefined}
                                        onChange={(checked, e) => {
                                            e.stopPropagation();
                                            setEnabledIds(prev => {
                                                const next = new Set(prev);
                                                perms.forEach(p => checked ? next.add(p.id) : next.delete(p.id));
                                                return next;
                                            });
                                        }}
                                    />
                                </Tooltip>
                            ),
                            children: (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {perms.map(p => {
                                        const { action } = splitPermission(p.name);
                                        const on = enabledIds.has(p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                style={{
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '7px 12px',
                                                    borderRadius: 8,
                                                    background: on ? 'rgba(82,196,26,0.06)' : 'rgba(0,0,0,0.02)',
                                                    border: `1px solid ${on ? 'rgba(82,196,26,0.3)' : 'rgba(0,0,0,0.06)'}`,
                                                    transition: 'all 0.18s',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => handleTogglePerm(p.id, !on)}
                                            >
                                                <Space size={8} align="start">
                                                    <Tag
                                                        color={action === 'ALL' ? 'volcano' : PERMISSION_ACTION_COLOR[action as keyof typeof PERMISSION_ACTION_COLOR]}
                                                        style={{ margin: '3px 0 0', fontSize: 11, minWidth: 56, textAlign: 'center' }}
                                                    >
                                                        {action}
                                                    </Tag>
                                                    <div>
                                                        <Text style={{ fontSize: 13, fontWeight: 600, display: 'block', lineHeight: '1.3' }}>
                                                            {p.name}
                                                        </Text>
                                                        {p.description && (
                                                            <Text type="secondary" style={{ fontSize: 11, lineHeight: '1.3' }}>
                                                                {p.description}
                                                            </Text>
                                                        )}
                                                    </div>
                                                </Space>
                                                <Switch
                                                    size="small"
                                                    checked={on}
                                                    onChange={(checked, e) => {
                                                        e.stopPropagation();
                                                        handleTogglePerm(p.id, checked);
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ),
                        };
                    })}
                    style={{ background: 'transparent' }}
                />
                {allPermissions.length === 0 && !loadingPerms && (
                    <Empty description={
                        !canViewPermissions ? 'Bạn không có quyền xem danh sách quyền'
                            : !canViewRoleDetail ? 'Bạn không có quyền xem chi tiết vai trò'
                                : 'Chưa có quyền nào'
                    } />
                )}
            </Spin>
        </Drawer>
    );
};

export default AdminModalAssignPermission;
