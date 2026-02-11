
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
// import type { ColumnsType } from 'antd/es/table';

// type AnyObject = Record<string, any>;

// export const exportTableToExcel = <T extends AnyObject>(
//     columns: ColumnsType<T>,
//     dataSource: T[],
//     fileName = 'export'
// ) => {
//     /* =====================
//        1. Lọc column được export
//     ====================== */
//     const exportColumns = columns.filter(
//         (col: any) => col.dataIndex && !col.hidden
//     ) as any[];

//     /* =====================
//        2. Build data từ dataSource
//     ====================== */
//     const data = dataSource.map((record, rowIndex) => {
//         const row: AnyObject = {};

//         exportColumns.forEach((col) => {
//             const title =
//                 typeof col.title === 'string'
//                     ? col.title
//                     : String(col.key ?? col.dataIndex);

//             let value = record[col.dataIndex];

//             // xử lý render của antd Table
//             if (col.render) {
//                 const rendered = col.render(value, record, rowIndex);
//                 if (
//                     typeof rendered === 'string' ||
//                     typeof rendered === 'number'
//                 ) {
//                     value = rendered;
//                 }
//             }

//             row[title] = value ?? '';
//         });

//         return row;
//     });

//     /* =====================
//        3. Tạo worksheet
//     ====================== */
//     const worksheet = XLSX.utils.json_to_sheet(data);

//     /* =====================
//        4. FORMAT EXCEL (PHẦN QUAN TRỌNG)
//     ====================== */

//     const range = XLSX.utils.decode_range(worksheet['!ref']!);

//     // 4.1 Header: in đậm + căn giữa
//     for (let C = range.s.c; C <= range.e.c; C++) {
//         const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
//         const cell = worksheet[cellAddress];
//         if (!cell) continue;

//         cell.s = {
//             font: { bold: true },
//             alignment: {
//                 horizontal: 'center',
//                 vertical: 'center',
//             },
//             fill: {
//                 fgColor: { rgb: 'EDEDED' },
//             },
//             border: {
//                 top: { style: 'thin' },
//                 bottom: { style: 'thin' },
//                 left: { style: 'thin' },
//                 right: { style: 'thin' },
//             },
//         };
//     }

//     // 4.2 Body: border + căn giữa số
//     for (let R = 1; R <= range.e.r; R++) {
//         for (let C = range.s.c; C <= range.e.c; C++) {
//             const addr = XLSX.utils.encode_cell({ r: R, c: C });
//             const cell = worksheet[addr];
//             if (!cell) continue;

//             cell.s = {
//                 alignment: {
//                     horizontal:
//                         typeof cell.v === 'number' ? 'right' : 'left',
//                     vertical: 'center',
//                 },
//                 border: {
//                     top: { style: 'thin' },
//                     bottom: { style: 'thin' },
//                     left: { style: 'thin' },
//                     right: { style: 'thin' },
//                 },
//             };

//             // format tiền
//             if (typeof cell.v === 'number') {
//                 cell.z = '#,##0';
//             }
//         }
//     }

//     // 4.3 Set width cột tự động
//     worksheet['!cols'] = exportColumns.map((col) => ({
//         wch: Math.max(
//             14,
//             String(col.title ?? col.dataIndex).length + 6
//         ),
//     }));

//     // 4.4 Freeze header
//     worksheet['!freeze'] = { ySplit: 1 };

//     // 4.5 Enable filter
//     worksheet['!autofilter'] = { ref: worksheet['!ref'] };

//     /* =====================
//        5. Workbook
//     ====================== */
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

//     /* =====================
//        6. Xuất file
//     ====================== */
//     const buffer = XLSX.write(workbook, {
//         bookType: 'xlsx',
//         type: 'array',
//         cellStyles: true,
//     });

//     saveAs(
//         new Blob([buffer], { type: 'application/octet-stream' }),
//         `${fileName}_${Date.now()}.xlsx`
//     );
// };

// /* =====================
//    7. Fix TS khi thiếu type
// ====================== */
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
