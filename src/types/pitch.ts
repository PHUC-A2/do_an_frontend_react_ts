export type PitchStatusEnum = "ACTIVE" | "MAINTENANCE";// đang HD, đang bảo trì
export type PitchTypeEnum = "THREE" | "SEVEN"; // 3 hoặc 7

export interface IPitch {
    id: number;
    name?: string | null;
    pitchType: PitchTypeEnum;
    pricePerHour: number;
    pitchUrl?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
    open24h?: boolean | null;
    status: PitchStatusEnum;
    address?: string | null;
    latitude: number;
    longitude: number;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
}

export interface ICreatePitchReq {
    name?: string | null;
    pitchType: PitchTypeEnum;
    pricePerHour: number;
    pitchUrl?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
    open24h?: boolean | null;
    address?: string | null;
    latitude: number;
    longitude: number;
}

export interface IUpdatePitchReq {
    name?: string | null;
    pitchType: PitchTypeEnum;
    pricePerHour: number;
    pitchUrl?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
    open24h?: boolean | null;
    status: PitchStatusEnum;
    address?: string | null;
    latitude: number;
    longitude: number;
}

/**
 * 
 * {
  "name": "Sân bóng mini 3 người",
  "pitchType": "THREE",
  "pricePerHour": 250000,
  "pitchUrl": "https://example.com/pitch-24h.jpg",
  "open24h": true,
  "status": "ACTIVE",
  "address": "ĐH Tây Bắc 1"
}
{
    "statusCode": 201,
    "error": null,
    "message": "Tạo sân mới",
    "data": {
        "id": 4,
        "name": "Sân bóng mini 3 người",
        "pitchType": "THREE",
        "pricePerHour": 250000,
        "pitchUrl": "https://example.com/pitch-24h.jpg",
        "openTime": null,
        "closeTime": null,
        "open24h": true,
        "status": "ACTIVE",
        "address": "ĐH Tây Bắc 1",
        "createdAt": "2026-01-22T17:44:19.822125300Z",
        "createdBy": "admin@gmail.com"
    }
}
    {
  "name": "Sân bóng mini 3 người",
  "pitchType": "THREE",
  "pricePerHour": 250000,
  "pitchUrl": "https://example.com/pitch-24h.jpg",
//   "open24h": true,
  "openTime":"06:00",
  "closeTime":"22:30",
  "status": "ACTIVE",
  "address": "ĐH Tây Bắc 3"
}
{
    "statusCode": 201,
    "error": null,
    "message": "Tạo sân mới",
    "data": {
        "id": 7,
        "name": "Sân bóng mini 3 người",
        "pitchType": "THREE",
        "pricePerHour": 250000,
        "pitchUrl": "https://example.com/pitch-24h.jpg",
        "openTime": "06:00:00",
        "closeTime": "22:30:00",
        "open24h": false,
        "status": "ACTIVE",
        "address": "ĐH Tây Bắc 3",
        "createdAt": "2026-01-22T17:47:09.398457Z",
        "createdBy": "admin@gmail.com"
    }
}
 */