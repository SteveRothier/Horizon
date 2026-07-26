export type ApiErrorCode =
  | "CITY_NOT_FOUND"
  | "API_UNAVAILABLE"
  | "GEOLOCATION_DENIED"
  | "OFFLINE"
  | "TIMEOUT"
  | "BAD_REQUEST"
  | "UNKNOWN";

export type ApiErrorBody = {
  error: true;
  code: ApiErrorCode;
  message: string;
};

export class AppApiError extends Error {
  code: ApiErrorCode;
  status: number;

  constructor(code: ApiErrorCode, message: string, status = 500) {
    super(message);
    this.name = "AppApiError";
    this.code = code;
    this.status = status;
  }
}
