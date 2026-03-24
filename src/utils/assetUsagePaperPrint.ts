import dayjs from 'dayjs';

import type { IAssetUsage } from '../types/assetUsage';
import type { ICheckout } from '../types/checkout';
import type { IDeviceReturn } from '../types/deviceReturn';
import { ASSET_USAGE_STATUS_META } from './constants/assetUsage.constants';
import { DEVICE_CONDITION_META } from './constants/deviceReturn.constants';
import { DEVICE_TYPE_META } from './constants/device.constants';

const esc = (value?: string | null) => (value ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Escaper cho attribute HTML (để tránh lỗi HTML khi nhúng src). */
const escAttr = (value?: string | null) =>
    (value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

/** Ghép đường dẫn ảnh thiết bị cho deviceImageUrl (lưu tên file hoặc URL). */
function deviceImageSrc(deviceImageUrl?: string | null): string | null {
    const t = deviceImageUrl?.trim();
    if (!t) return null;
    if (/^https?:\/\//i.test(t)) return t;
    if (t.startsWith('/')) return t;
    return `/storage/device/${t}`;
}

/** Parse JSON thiết bị mượn đã lưu trên booking. */
function safeParseBorrowDevicesJson(borrowDevicesJson?: string | null): Array<any> {
    if (!borrowDevicesJson) return [];
    try {
        const v = JSON.parse(borrowDevicesJson);
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
}

/**
 * In biên bản mượn/trả tài sản cho luồng phòng tin (asset usage).
 */
export const openAssetUsagePaperPrint = (
    usage: IAssetUsage,
    checkout?: ICheckout | null,
    deviceReturn?: IDeviceReturn | null,
    options?: { doPrint?: boolean }
) => {
    const doPrint = options?.doPrint ?? true;
    const borrowDevices = safeParseBorrowDevicesJson(usage.borrowDevicesJson);

    // Bóc tách các dòng thiết bị được chọn mượn để in trong biên bản.
    const deviceRows = borrowDevices
        .filter((d: any) => d && (d.quantity ?? 0) > 0)
        .map(
            (d: any) => `<tr>
<td>${esc(d.deviceName ?? '—')}</td>
<td>${
                deviceImageSrc(d.deviceImageUrl ?? d.imageUrl)
                    ? `<img src="${escAttr(deviceImageSrc(d.deviceImageUrl ?? d.imageUrl))}" alt="${escAttr(d.deviceName ?? 'Thiết bị')}" style="width:46px;height:46px;object-fit:cover;border-radius:6px;" />`
                    : '—'
            }</td>
<td>${esc(String(d.quantity ?? '0'))}</td>
<td>${
                esc(
                    d.deviceType === 'MOVABLE' || d.deviceType === 'FIXED'
                        ? DEVICE_TYPE_META[d.deviceType as keyof typeof DEVICE_TYPE_META].label
                        : d.deviceType ?? '—'
                )
            }</td>
<td>${esc(d.deviceNote ?? d.note ?? '—')}</td>
</tr>`
        )
        .join('');

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Biên bản phòng tin</title>
<style>
body{font-family:Arial,sans-serif;padding:20px;max-width:900px;margin:0 auto;font-size:13px;}
h1{font-size:20px;margin-bottom:8px;}
.meta{margin:10px 0;}
table{width:100%;border-collapse:collapse;margin-top:10px;}
th,td{border:1px solid #ddd;padding:8px;text-align:left;}
th{background:#f6f6f6;}
</style>
</head>
<body>
<h1>Biên bản sử dụng phòng tin</h1>
${usage.assetAssetsUrl ? `<div style="margin:10px 0;">
<img src="${esc(usage.assetAssetsUrl)}" alt="Phòng/tài sản" style="max-width:100%;height:auto;border-radius:6px;" />
</div>` : ''}
<div class="meta"><strong>Mã đăng ký:</strong> #${usage.id}</div>
<div class="meta"><strong>Phòng:</strong> ${esc(usage.assetName)} (#${usage.assetId})</div>
<div class="meta"><strong>Người dùng:</strong> ${esc(usage.userName)} (${esc(usage.userEmail)})</div>
<div class="meta"><strong>SĐT liên hệ:</strong> ${esc(usage.contactPhone ?? '—')}</div>
<div class="meta"><strong>Thời gian:</strong> ${usage.startTime} - ${usage.endTime} ngày ${dayjs(usage.date).format('DD/MM/YYYY')}</div>
<div class="meta"><strong>Mục đích:</strong> ${esc(usage.subject)}</div>
<div class="meta"><strong>Trạng thái:</strong> ${esc(usage.status ? (ASSET_USAGE_STATUS_META[usage.status]?.label ?? usage.status) : '—')}</div>
<div class="meta"><strong>Người phụ trách phòng:</strong> ${esc(usage.assetResponsibleName ?? '—')}</div>
${usage.bookingNote ? `<div class="meta"><strong>Ghi chú booking:</strong> ${esc(usage.bookingNote)}</div>` : ''}

<table>
<thead>
<tr><th>Hạng mục</th><th>Nội dung</th></tr>
</thead>
<tbody>
<tr><td>Biên bản nhận</td><td>${checkout ? `Nhận lúc ${dayjs(checkout.receiveTime).format('HH:mm DD/MM/YYYY')} - ${esc(checkout.conditionNote)}` : 'Chưa có'}</td></tr>
<tr><td>Biên bản trả</td><td>${deviceReturn ? `Trả lúc ${dayjs(deviceReturn.returnTime).format('HH:mm DD/MM/YYYY')} - Tình trạng: ${esc((DEVICE_CONDITION_META as any)[deviceReturn.deviceStatus]?.label ?? deviceReturn.deviceStatus)}
<br/>Kiểm đếm: Trả tốt ${esc(String(deviceReturn.quantityReturnedGood ?? 0))} - Mất ${esc(String(deviceReturn.quantityLost ?? 0))} - Hỏng ${esc(String(deviceReturn.quantityDamaged ?? 0))}
${deviceReturn.returnerNameSnapshot || deviceReturn.returnerPhoneSnapshot ? `<br/>Người trả: ${esc(deviceReturn.returnerNameSnapshot ?? '—')}${deviceReturn.returnerPhoneSnapshot ? ` - ${esc(deviceReturn.returnerPhoneSnapshot)}` : ''}` : ''}
${deviceReturn.receiverNameSnapshot || deviceReturn.receiverPhoneSnapshot ? `<br/>Người nhận: ${esc(deviceReturn.receiverNameSnapshot ?? '—')}${deviceReturn.receiverPhoneSnapshot ? ` - ${esc(deviceReturn.receiverPhoneSnapshot)}` : ''}` : ''}
${deviceReturn.borrowerSignName || deviceReturn.staffSignName ? `<br/>Ký xác nhận: ${(esc(deviceReturn.borrowerSignName ?? '—'))} / ${(esc(deviceReturn.staffSignName ?? '—'))}` : ''}
${deviceReturn.returnConditionNote ? `<br/>Ghi chú trả: ${esc(deviceReturn.returnConditionNote)}` : ''}` : 'Chưa có'}</td></tr>
</tbody>
</table>

<h2 style="font-size:15px;margin-top:18px;">Thiết bị mượn (kèm booking)</h2>
<table>
<thead>
<tr><th>Thiết bị</th><th>Ảnh</th><th>SL</th><th>Loại</th><th>Ghi chú thiết bị</th></tr>
</thead>
<tbody>
${deviceRows || '<tr><td colspan="5">Không có thiết bị mượn kèm</td></tr>'}
</tbody>
</table>

<p style="margin-top:16px;font-size:11px;color:#666;">In lúc ${dayjs().format('HH:mm DD/MM/YYYY')}</p>
</body>
</html>`;

    const popup = window.open('', '_blank');
    if (!popup) return false;
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    if (doPrint) popup.print();
    return true;
};
