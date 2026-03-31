/**
 * HTTP statuses, backend codes, and message patterns for auth API contract tests.
 */

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  PRECONDITION_FAILED: 412,
  TOO_MANY_REQUESTS: 429,
} as const;

export const AUTH_API_ERROR_CODE = {
  DUPLICATE_USER: 1001,
  INVALID_DATA: 2002,
} as const;

/** Substrings from registerApi / API when user exists or rate-limit hits */
export const BACKEND_ERROR_SUBSTRINGS = {
  DUPLICATE_USER_CODE: '1001',
  RATE_LIMIT: 'Too Many Requests',
} as const;

/** Password used on conflicting duplicate-registration requests (username/email tests) */
export const DUPLICATE_REGISTRATION_ALT_PASSWORD = 'Test1234';

/** Invalid credentials for negative login API tests */
export const INVALID_LOGIN_USERNAME = 'wrongUser';
export const INVALID_LOGIN_PASSWORD = 'wrongPassword';

export const LOGIN_LONG_TOKEN_DISABLED = false;

/** Deliberately invalid `long_token` payload for negative login API test */
export const LOGIN_LONG_TOKEN_INVALID = 'invalid';

export const LOGIN_INPUT_LEADING_TRAILING_SPACES = '  ';

/** Uppercased prefix length for mixed-case email login (API test intent; keep in sync with case test) */
export const MIXED_CASE_EMAIL_UPPER_PREFIX_LENGTH = 2;

export const INVALID_DATA_RESPONSE_MESSAGE = 'Invalid Data';

export const AUTH_API_MESSAGE_PATTERN = {
  register: {
    emailMissing: /Please specify an email|Too Many Requests/,
    usernameOrPasswordMissing: /Please specify a username and a password|Too Many Requests/,
    invalidUserModel: /No or invalid user model provided.|Too Many Requests/,
    duplicateOrRateLimit: /already exists|Too Many Requests/,
    duplicateField: /already exists/,
    rateLimit: /Too Many Requests/,
  },
  login: {
    wrongCredsWithPeriod: /Wrong username or password.|Too Many Requests/,
    wrongCredsNoPeriod: /Wrong username or password|Too Many Requests/,
    missingFields: /Please specify a username and a password.|Too Many Requests/,
    invalidLongToken: /Please provide a username and a password.|Too Many Requests/,
    wrongCredsCaseInsensitiveFlag: /Wrong username or password|Too Many Requests/i,
  },
  validation: {
    invalidDataOrRateLimit: /Invalid Data|Too Many Requests/,
  },
} as const;

export const buildUniqueTestEmail = (): string => `user_${Date.now()}@test.com`;

export const buildUniqueTestUsername = (): string => `user_${Date.now()}`;

export const REGISTER_STATUS_DUPLICATE_OR_RATE_LIMIT: number[] = [
  HTTP_STATUS.BAD_REQUEST,
  HTTP_STATUS.TOO_MANY_REQUESTS,
];

export const REGISTER_STATUS_VALIDATION_OR_RATE_LIMIT: number[] = [
  HTTP_STATUS.PRECONDITION_FAILED,
  HTTP_STATUS.TOO_MANY_REQUESTS,
];

export const LOGIN_STATUS_AUTH_FAIL_OR_RATE_LIMIT: number[] = [
  HTTP_STATUS.FORBIDDEN,
  HTTP_STATUS.TOO_MANY_REQUESTS,
];

export const LOGIN_STATUS_VALIDATION_OR_RATE_LIMIT: number[] = [
  HTTP_STATUS.BAD_REQUEST,
  HTTP_STATUS.TOO_MANY_REQUESTS,
];
