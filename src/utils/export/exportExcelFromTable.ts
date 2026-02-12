// declare module 'xlsx';
// declare module 'file-saver';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { ColumnsType } from 'antd/es/table';

type AnyObject = Record<string, any>;

export const exportTableToExcel = <T extends AnyObject>(
    columns: ColumnsType<T>,
    dataSource: T[],
    fileName = 'export'
) => {

    /* =========================
       1. Lọc column hợp lệ
    ========================== */
    const exportColumns = columns.filter(
        (col: any) =>
            col.dataIndex &&
            !col.hidden &&
            col.key !== 'actions'
    ) as any[];

    /* =========================
       2. Convert value an toàn
    ========================== */
    const normalizeValue = (value: any): string | number => {

        if (value === null || value === undefined) return '';

        // Nếu là array (ví dụ roles)
        if (Array.isArray(value)) {
            return value
                .map((v) =>
                    typeof v === 'object'
                        ? v.name ?? JSON.stringify(v)
                        : v
                )
                .join(', ');
        }

        // Nếu là object
        if (typeof value === 'object') {
            if (value.name) return value.name;
            return JSON.stringify(value);
        }

        return value;
    };

    /* =========================
       3. Build data export
    ========================== */
    const data = dataSource.map((record, rowIndex) => {

        const row: AnyObject = {};

        exportColumns.forEach((col) => {

            const title =
                typeof col.title === 'string'
                    ? col.title
                    : String(col.key ?? col.dataIndex);

            let value = record[col.dataIndex];

            // xử lý render nếu có
            if (col.render) {
                const rendered = col.render(value, record, rowIndex);

                if (
                    typeof rendered === 'string' ||
                    typeof rendered === 'number'
                ) {
                    value = rendered;
                }
            }

            row[title] = normalizeValue(value);
        });

        return row;
    });

    if (!data.length) {
        return;
    }

    /* =========================
       4. Tạo file Excel
    ========================== */
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto width
    const colWidths = Object.keys(data[0]).map((key) => ({
        wch: Math.max(
            14,
            key.length + 5
        )
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const buffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
    });

    saveAs(
        new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `${fileName}_${Date.now()}.xlsx`
    );
};
