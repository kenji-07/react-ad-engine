export enum VastErrorCode {
  XML_PARSING_ERROR = 100,
  VAST_SCHEMA_VALIDATION_ERROR = 101,
  UNSUPPORTED_VAST_VERSION = 102,
  TRAFFICKING_ERROR = 200,
  GENERAL_WRAPPER_ERROR = 300,
  WRAPPER_TIMEOUT = 301,
  WRAPPER_LIMIT_REACHED = 302,
  NO_VAST_RESPONSE = 303,
  GENERAL_LINEAR_ERROR = 400,
  MEDIA_FILE_NOT_FOUND = 401,
  MEDIA_FILE_TIMEOUT = 402,
  MEDIA_FILE_UNSUPPORTED = 403,
  MEDIA_FILE_DISPLAY_ERROR = 405,
  GENERAL_NONLINEAR_ERROR = 500,
  GENERAL_COMPANION_ERROR = 600,
  UNDEFINED_ERROR = 900,
}

export class VastError extends Error {
  readonly code: VastErrorCode;
  readonly errorUrls: string[];

  constructor(message: string, code: VastErrorCode = VastErrorCode.UNDEFINED_ERROR, errorUrls: string[] = []) {
    super(`[VAST Error ${code}] ${message}`);
    this.name = 'VastError';
    this.code = code;
    this.errorUrls = errorUrls;
    Object.setPrototypeOf(this, VastError.prototype);
  }
}
