import type { IBackendRes } from "./common";

// ============= FILE===========
export interface IUploadFile {
    fileName: string;
    uploadedAt: string;
    url: string;
}

// upload file res

export type IGetUploadResponse = IBackendRes<IUploadFile>;
/**
 * 
 * {
    "statusCode": 200,
    "error": null,
    "message": "Upload image file",
    "data": {
        "fileName": "1768681185656-ao_02.jpg",
        "uploadedAt": "2026-01-17T20:19:45.658114100Z",
        "url": "http://localhost:8080/storage/avatar/1768681185656-ao_02.jpg"
    }
}
 */