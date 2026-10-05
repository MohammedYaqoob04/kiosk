import { httpApi } from "@/api/http";

export const isMockApi = (import.meta.env["VITE_USE_MOCK"] ?? "false").toLowerCase() === "true";

export const api = httpApi;

export { ApiError, formatServerError } from "@/api/http";
export { noticeCategories, noticeAudienceSelection } from "@/api/types";
export type * from "@/api/types";
