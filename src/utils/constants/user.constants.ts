import type { UserEnum } from "../../types/user";

export const USER_STATUS: readonly UserEnum[] = [
    "ACTIVE",
    "INACTIVE",
    "PENDING_VERIFICATION",
    "BANNED",
    "DELETED",
];
