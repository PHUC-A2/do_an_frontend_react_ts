import { Button, Flex, Radio, Switch, Typography } from 'antd';
import type { NotificationSoundPreset } from '../../utils/notificationSound';
import { NOTIFICATION_SOUND_PRESET_LABELS } from '../../utils/notificationSound';

const { Text } = Typography;

type Props = {
    bellSoundEnabled: boolean;
    onBellSoundChange: (checked: boolean) => void;
    soundPreset: NotificationSoundPreset;
    onSoundPresetChange: (preset: NotificationSoundPreset) => void;
    onTestSound: () => void;
};

/**
 * Khối cấu hình chuông + kiểu âm thanh (dùng trong Popover thông báo hoặc form tài khoản).
 */
const NotificationSoundSettingsPanel = ({
    bellSoundEnabled,
    onBellSoundChange,
    soundPreset,
    onSoundPresetChange,
    onTestSound,
}: Props) => (
    <Flex vertical gap={14} style={{ minWidth: 260, maxWidth: 320 }} onClick={(e) => e.stopPropagation()}>
        <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Bật chuông trên giao diện
            </Text>
            <Flex align="center" gap={10}>
                <Switch checked={bellSoundEnabled} onChange={onBellSoundChange} checkedChildren="Bật" unCheckedChildren="Tắt" />
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Khi tắt, không phát tiếng khi có thông báo mới (vẫn hiện danh sách).
                </Text>
            </Flex>
        </div>
        <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Kiểu âm thanh thông báo
            </Text>
            <Radio.Group
                value={soundPreset}
                onChange={(e) => onSoundPresetChange(e.target.value as NotificationSoundPreset)}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
                {(Object.keys(NOTIFICATION_SOUND_PRESET_LABELS) as NotificationSoundPreset[]).map((key) => (
                    <Radio key={key} value={key}>
                        {NOTIFICATION_SOUND_PRESET_LABELS[key]}
                    </Radio>
                ))}
            </Radio.Group>
        </div>
        <Button type="default" block onClick={onTestSound} disabled={!bellSoundEnabled}>
            Nghe thử
        </Button>
    </Flex>
);

export default NotificationSoundSettingsPanel;
