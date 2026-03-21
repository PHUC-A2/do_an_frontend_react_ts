import { BOOKING_EQUIPMENT_STATUS_META } from "./constants/bookingEquipment.constants";
import { formatDateTime } from "./format/localdatetime";
import { formatVND } from "./format/price";
import type { IBooking } from "../types/booking";
import type { IBookingEquipment } from "../types/bookingEquipment";

/** Dùng khi không tải được booking từ API — vẫn in bảng thiết bị đầy đủ cột. */
export function createFallbackBookingForHandover(bookingId: number): IBooking {
    const t = new Date().toISOString();
    return {
        id: bookingId,
        userId: 0,
        userName: "—",
        pitchId: 0,
        pitchName: "—",
        startDateTime: t,
        endDateTime: t,
        contactPhone: "—",
        durationMinutes: 0,
        totalPrice: 0,
        status: "PAID",
        deletedByUser: false,
        createdAt: t,
        updatedAt: null,
        createdBy: "",
        updatedBy: null,
    };
}

function esc(s: string) {
    return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Sau khi đã trả: hiển thị số; khi đang mượn: — */
function fmtQty(n: number | undefined | null, status: IBookingEquipment["status"]) {
    if (status === "BORROWED") return "—";
    if (n == null || Number.isNaN(n)) return "0";
    return String(n);
}

function borrowerCol(r: IBookingEquipment, booking: IBooking) {
    const k = r.borrowerSignName?.trim();
    if (k) return esc(k);
    const snap = r.bookingBorrowerSnapshot?.trim();
    if (snap) return esc(snap);
    return esc(booking.userName?.trim() || "—");
}

function staffCol(r: IBookingEquipment) {
    const s = r.staffSignName?.trim();
    return esc(s || "—");
}

/** In biên bản mượn/trả (client hoặc admin) — mở cửa sổ in, không bắt buộc. */
export function openBookingEquipmentHandoverPrint(booking: IBooking, lines: IBookingEquipment[]) {
    const visible = lines.filter(l => !l.deletedByClient);
    const rows = visible
        .map(
            l => `<tr>
<td>${esc(l.equipmentName)}</td>
<td>${l.quantity}</td>
<td>${fmtQty(l.quantityReturnedGood, l.status)}</td>
<td>${fmtQty(l.quantityLost, l.status)}</td>
<td>${fmtQty(l.quantityDamaged, l.status)}</td>
<td>${esc(BOOKING_EQUIPMENT_STATUS_META[l.status].label)}</td>
<td>${l.equipmentMobility === "MOVABLE" ? "Lưu động" : l.equipmentMobility === "FIXED" ? "Cố định" : "—"}</td>
<td>${esc(l.borrowConditionNote ?? "—")}</td>
<td>${esc(l.returnConditionNote ?? "—")}</td>
<td>${borrowerCol(l, booking)}</td>
<td>${staffCol(l)}</td>
<td>${formatVND(l.equipmentPrice)}</td>
</tr>`
        )
        .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Biên bản thiết bị</title>
<style>
body{font-family:system-ui,sans-serif;padding:20px;max-width:1100px;margin:0 auto;font-size:13px;}
h1{font-size:1.15rem;} .meta{margin:12px 0;} table{width:100%;border-collapse:collapse;}
th,td{border:1px solid #ccc;padding:5px 6px;text-align:left;font-size:11px;vertical-align:top;}
th{background:#f0f0f0;font-size:9px;}
@media print { body { padding: 12px; } }
</style></head><body>
<h1>Biên bản mượn / trả thiết bị</h1>
<div class="meta">
<div><strong>Booking:</strong> #${booking.id}</div>
<div><strong>Người đặt (hệ thống):</strong> ${esc(booking.userName ?? "")}</div>
<div><strong>Sân:</strong> ${esc(booking.pitchName ?? "")}</div>
<div><strong>Thời gian:</strong> ${formatDateTime(booking.startDateTime, "HH:mm DD/MM/YYYY")} → ${formatDateTime(booking.endDateTime, "HH:mm DD/MM/YYYY")}</div>
<div><strong>Liên hệ:</strong> ${esc(booking.contactPhone ?? "")}</div>
</div>
<table>
<thead><tr>
<th>Thiết bị</th><th>SL mượn</th><th>Trả tốt</th><th>Mất</th><th>Hỏng</th><th>TT</th><th>Loại</th><th>Ghi chú mượn</th><th>Ghi chú trả</th><th>Người mượn (ký / TM)</th><th>Người thu / NV</th><th>Giá ĐV</th>
</tr></thead>
<tbody>${rows || "<tr><td colspan=\"12\">Không có dòng thiết bị</td></tr>"}</tbody>
</table>
<p style="margin-top:16px;font-size:10px;color:#555;">Cột <em>Người mượn</em>: ưu tiên chữ ký biên bản, sau đó họ tên lưu tại thời điểm trả, cuối cùng là tên trên booking. Cột <em>Người thu / NV</em>: nhân viên hoặc bên nhận thiết bị (ghi trên biên bản).</p>
<p style="margin-top:20px;font-size:11px;color:#666;">In lúc ${formatDateTime(new Date().toISOString(), "DD/MM/YYYY HH:mm")}</p>
</body></html>`;

    const w = window.open("", "_blank");
    if (!w) return false;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    return true;
}
