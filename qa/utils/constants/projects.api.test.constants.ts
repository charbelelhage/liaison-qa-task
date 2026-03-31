export const PROJECT_DEFAULTS = {
    TITLE_PREFIX: 'project_',
    DESCRIPTION: 'test description',
    HEX_COLOR: 'ff4136',
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    PRECONDITION_FAILED: 412,
    TOO_MANY_REQUESTS: 429,
};

export const PROJECT_ERROR_CODES = {
    INVALID_DATA: 2002,
};

/** Intentionally invalid bearer token for negative API tests */
export const INVALID_PROJECT_API_TOKEN = 'not-a-valid-jwt-token';