import { Button, Collapse, Drawer, Empty, Space, Spin, Switch, Tag, Tooltip, Typography } from 'antd';
import type { CollapseProps } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { IPermission } from '../../../types/permission';
import { assignPlanPermissions, getAdminPlanPermissionNames, getAllPermissions } from '../../../config/Api';
import { usePermission } from '../../../hooks/common/usePermission';
import { splitPermission } from '../../../utils/constants/permission.utils';
import { PERMISSION_ACTION_COLOR } from '../../../utils/constants/permission-ui.constants';

type CollapseItem = NonNullable<CollapseProps['items']>[0];
const { Text } = Typography;

type Props = {
    open: boolean;
    onClose: () => void;
    planId: number | null;
    planName: string;
    onSaved?: () => void;
};

const PlanPermissionDrawer = ({ open, onClose, planId, planName, onSaved }: Props) => {
    const canViewPermissions = usePermission('PERMISSION_VIEW_LIST');
    const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);
    const [enabledIds, setEnabledIds] = useState<Set<number>>(new Set());
    const [loadingPerms, setLoadingPerms] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!open || !planId) return;
            setLoadingPerms(true);
            try {
                if (!canViewPermissions) {
                    toast.error('Bạn không có quyền xem danh sách quyền hệ thống');
                    setAllPermissions([]);
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
                const namesRes = await getAdminPlanPermissionNames(planId);
                const nameList = (namesRes.data as { data?: string[] } | undefined)?.data ?? [];
                const nameSet = new Set(nameList);
                const ids = all.filter((p) => nameSet.has(p.name)).map((p) => p.id);
                setEnabledIds(new Set(ids));
            } catch (e: unknown) {
                toast.error('Không tải được quyền gói');
            } finally {
                setLoadingPerms(false);
            }
        };
        void load();
    }, [open, planId, canViewPermissions]);

    const handleToggle = (id: number, checked: boolean) => {
        setEnabledIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const handleSave = async () => {
        if (!planId) return;
        setSaving(true);
        try {
            await assignPlanPermissions(planId, { permissionIds: Array.from(enabledIds) });
            toast.success('Đã lưu quyền cho gói');
            onSaved?.();
            onClose();
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Lưu thất bại';
            toast.error(m);
        } finally {
            setSaving(false);
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
            open={open}
            onClose={onClose}
            title={
                <Space>
                    <SafetyOutlined style={{ color: '#faad14' }} />
                    <span>
                        Phân quyền cho gói: <Tag color="blue">{planName}</Tag>
                    </span>
                </Space>
            }
            width={480}
            styles={{ body: { padding: '12px 20px' } }}
            extra={
                <Button type="primary" loading={saving} onClick={() => void handleSave()} disabled={!planId}>
                    Lưu
                </Button>
            }
        >
            <Spin spinning={loadingPerms}>
                {allPermissions.length > 0 && !loadingPerms && enabledIds.size === 0 && (
                    <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
                        Gói chưa gắn quyền: bật từng mục bên dưới (hoặc theo từng nhóm) rồi nhấn Lưu.
                    </Text>
                )}
                <Collapse
                    accordion
                    items={Object.entries(permsByResource).map(([resource, perms]): CollapseItem => {
                        const activeCount = perms.filter((p) => enabledIds.has(p.id)).length;
                        const allOn = perms.length > 0 && activeCount === perms.length;
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
                                            setEnabledIds((prev) => {
                                                const next = new Set(prev);
                                                perms.forEach((p) => (checked ? next.add(p.id) : next.delete(p.id)));
                                                return next;
                                            });
                                        }}
                                    />
                                </Tooltip>
                            ),
                            children: (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {perms.map((p) => {
                                        const { action } = splitPermission(p.name);
                                        const on = enabledIds.has(p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '7px 12px',
                                                    borderRadius: 8,
                                                    background: on ? 'rgba(82,196,26,0.06)' : 'rgba(0,0,0,0.02)',
                                                    border: `1px solid ${on ? 'rgba(82,196,26,0.3)' : 'rgba(0,0,0,0.06)'}`,
                                                    transition: 'all 0.18s',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => handleToggle(p.id, !on)}
                                            >
                                                <Space size={8} align="start">
                                                    <Tag
                                                        color={
                                                            action === 'ALL' ? 'volcano' : PERMISSION_ACTION_COLOR[action as keyof typeof PERMISSION_ACTION_COLOR]
                                                        }
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
                                                        handleToggle(p.id, checked);
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
                    <Empty description={!canViewPermissions ? 'Bạn không có quyền xem danh sách' : 'Chưa có quyền nào'} />
                )}
            </Spin>
        </Drawer>
    );
};

export default PlanPermissionDrawer;
