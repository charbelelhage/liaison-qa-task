import { expect, APIRequestContext, APIResponse } from '@playwright/test';
import {
    AUTH_API_MESSAGE_PATTERN,
    HTTP_STATUS,
    LOGIN_LONG_TOKEN_DISABLED,
    LOGIN_LONG_TOKEN_INVALID,
    LOGIN_STATUS_AUTH_FAIL_OR_RATE_LIMIT,
    LOGIN_STATUS_VALIDATION_OR_RATE_LIMIT,
    MIXED_CASE_EMAIL_UPPER_PREFIX_LENGTH,
    LOGIN_INPUT_LEADING_TRAILING_SPACES,
    INVALID_LOGIN_PASSWORD,
    INVALID_LOGIN_USERNAME,
} from '../../utils/constants/auth.api.test.constants';
import { LOGIN_API_PATH } from '../../utils/constants/api.constants';

export type LoginPayload = Record<string, unknown>;

export class LoginApiUser {
    constructor(private readonly api: APIRequestContext) {}

    async login(data: LoginPayload): Promise<APIResponse> {
        return this.api.post(LOGIN_API_PATH, { data });
    }

    private async json(response: APIResponse): Promise<{ token?: string; message?: string }> {
        return response.json();
    }

    async expectLoginSuccessWithTokenMessage(response: APIResponse): Promise<void> {
        expect(response.status(), 'Login API should return 200').toBe(HTTP_STATUS.OK);
        const body = await this.json(response);
        expect(body, 'Response body should exist').toBeTruthy();
        expect(body.token, 'Login should return a valid authentication token').toBeTruthy();
    }

    async expectLoginSuccessTokenOnly(response: APIResponse): Promise<void> {
        expect(response.status()).toBe(HTTP_STATUS.OK);
        const body = await this.json(response);
        expect(body.token).toBeTruthy();
    }

    async expectWrongCredentialsWithPeriod(response: APIResponse): Promise<void> {
        expect(
            LOGIN_STATUS_AUTH_FAIL_OR_RATE_LIMIT,
            'Expected status to be either 403 (invalid creds) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.login.wrongCredsWithPeriod);
    }

    async expectWrongCredentialsNoPeriod(response: APIResponse): Promise<void> {
        expect(
            LOGIN_STATUS_AUTH_FAIL_OR_RATE_LIMIT,
            'Expected status to be either 403 (invalid creds due to case sensitivity) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        expect(
            body.message,
            'Expected error message for wrong password or rate limiting'
        ).toMatch(AUTH_API_MESSAGE_PATTERN.login.wrongCredsNoPeriod);
    }

    async expectMissingUsernameOrPasswordMessage(response: APIResponse): Promise<void> {
        expect(
            LOGIN_STATUS_VALIDATION_OR_RATE_LIMIT,
            'Expected status to be either 400 (bad request) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.login.missingFields);
    }

    async expectInvalidLongTokenMessage(response: APIResponse): Promise<void> {
        expect(
            LOGIN_STATUS_VALIDATION_OR_RATE_LIMIT,
            'Expected status to be either 400 (bad request) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.login.invalidLongToken);
    }

    async expectResponseTextWrongCredsOrRateLimit(response: APIResponse): Promise<void> {
        expect(
            LOGIN_STATUS_AUTH_FAIL_OR_RATE_LIMIT,
            'Expected status to be 403 (invalid creds), or 429 (rate limit)'
        ).toContain(response.status());
        const text = await response.text();
        expect(text, 'Expected error message for invalid input or rate limiting').toMatch(
            AUTH_API_MESSAGE_PATTERN.login.wrongCredsCaseInsensitiveFlag
        );
    }

    static longTokenDisabled(): boolean {
        return LOGIN_LONG_TOKEN_DISABLED;
    }

    static longTokenInvalid(): string {
        return LOGIN_LONG_TOKEN_INVALID;
    }

    static invalidUsername(): string {
        return INVALID_LOGIN_USERNAME;
    }

    static invalidPassword(): string {
        return INVALID_LOGIN_PASSWORD;
    }

    static mixedCaseEmail(email: string): string {
        return (
            email.slice(0, MIXED_CASE_EMAIL_UPPER_PREFIX_LENGTH).toUpperCase() +
            email.slice(MIXED_CASE_EMAIL_UPPER_PREFIX_LENGTH)
        );
    }

    static withLeadingTrailingSpaces(value: string): string {
        return `${LOGIN_INPUT_LEADING_TRAILING_SPACES}${value}${LOGIN_INPUT_LEADING_TRAILING_SPACES}`;
    }
}
