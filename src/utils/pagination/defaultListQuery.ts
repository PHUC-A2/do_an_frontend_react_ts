import { buildSpringPageQuery } from "./buildSpringPageQuery";

/** Khi chưa có lần tải danh sách thành công (modal refetch). */
export const DEFAULT_ADMIN_LIST_QUERY = buildSpringPageQuery(1, 10);
