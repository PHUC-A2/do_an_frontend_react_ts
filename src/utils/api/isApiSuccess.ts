/** Backend RestResponse + HTTP: statusCode có thể là number hoặc string. */
export function isApiSuccess(statusCode: unknown): boolean {
    return Number(statusCode) === 200;
}
