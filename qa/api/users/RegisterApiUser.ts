import { expect, APIRequestContext, APIResponse } from '@playwright/test';
import { User } from '../../utils/types';
import { REGISTER_API_PATH } from '../../utils/constants/api.constants';
import {
    AUTH_API_ERROR_CODE,
    AUTH_API_MESSAGE_PATTERN,
    HTTP_STATUS,
    INVALID_DATA_RESPONSE_MESSAGE,
    REGISTER_STATUS_DUPLICATE_OR_RATE_LIMIT,
    REGISTER_STATUS_VALIDATION_OR_RATE_LIMIT,
} from '../../utils/constants/auth.api.test.constants';

export class RegisterApiUser {
    constructor(private readonly api: APIRequestContext) {}

    async register(data: object): Promise<APIResponse> {
        return this.api.post(REGISTER_API_PATH, { data });
    }

    private async json(response: APIResponse): Promise<Record<string, unknown>> {
        return response.json() as Promise<Record<string, unknown>>;
    }

    async expectRegistrationSuccess(response: APIResponse, expected: User): Promise<void> {
        expect(response.status(), 'Register API should return 200').toBe(HTTP_STATUS.OK);
        const body = await this.json(response);
        expect(body.id).toBeTruthy();
        expect(body.username).toBe(expected.username);
        expect(body.email).toBe(expected.email);
        expect(body.created).toBeTruthy();
        expect(body.updated).toBeTruthy();
    }

    async expectRegistrationSuccessFromJsonFirst(
        response: APIResponse,
        expected: User
    ): Promise<void> {
        const body = await this.json(response);
        expect(response.status(), 'Register API should return 200').toBe(HTTP_STATUS.OK);
        expect(body.id).toBeTruthy();
        expect(body.username).toBe(expected.username);
        expect(body.email).toBe(expected.email);
        expect(body.created).toBeTruthy();
        expect(body.updated).toBeTruthy();
    }

    async expectDuplicateUsername(response: APIResponse): Promise<void> {
        expect(
            REGISTER_STATUS_DUPLICATE_OR_RATE_LIMIT,
            'Expected status to be either 400 (bad request) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        expect(body.code).toBe(AUTH_API_ERROR_CODE.DUPLICATE_USER);
        expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.register.duplicateOrRateLimit);
    }

    async expectUsernameDuplicateCaseInsensitiveBranch(response: APIResponse): Promise<void> {
        expect(
            REGISTER_STATUS_DUPLICATE_OR_RATE_LIMIT,
            'Expected status to be either 400 (bad request) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        if (response.status() === HTTP_STATUS.BAD_REQUEST) {
            expect(body.code).toBe(AUTH_API_ERROR_CODE.DUPLICATE_USER);
            expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.register.duplicateField);
        } else {
            expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.register.rateLimit);
        }
    }

    async expectDuplicateEmail(response: APIResponse): Promise<void> {
        expect(
            REGISTER_STATUS_DUPLICATE_OR_RATE_LIMIT,
            'Expected status to be either 400 (bad request) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.register.duplicateOrRateLimit);
    }

    async expectEmailDuplicateCaseInsensitiveBranch(response: APIResponse): Promise<void> {
        expect(
            REGISTER_STATUS_DUPLICATE_OR_RATE_LIMIT,
            'Expected status to be either 400 (bad request) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        if (response.status() === HTTP_STATUS.BAD_REQUEST) {
            expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.register.duplicateField);
        } else {
            expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.register.rateLimit);
        }
    }

    async expectMissingEmailMessage(response: APIResponse): Promise<void> {
        this.expectBadRequestOrRateLimit(response);
        const body = await this.json(response);
        expect(body.message, 'Response should contain that email is missing').toMatch(
            AUTH_API_MESSAGE_PATTERN.register.emailMissing
        );
    }

    async expectMissingUsernameOrPasswordMessage(response: APIResponse): Promise<void> {
        this.expectBadRequestOrRateLimit(response);
        const body = await this.json(response);
        expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.register.usernameOrPasswordMissing);
    }

    async expectInvalidUserModelMessage(response: APIResponse): Promise<void> {
        this.expectBadRequestOrRateLimit(response);
        const body = await this.json(response);
        expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.register.invalidUserModel);
    }

    async expectShortUsernameAndPasswordInvalidData(response: APIResponse): Promise<void> {
        expect(
            REGISTER_STATUS_VALIDATION_OR_RATE_LIMIT,
            'Expected status to be either 412 (invalid data) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        if (response.status() === HTTP_STATUS.PRECONDITION_FAILED) {
            expect(body.code).toBe(AUTH_API_ERROR_CODE.INVALID_DATA);
            expect(body.message).toBe(INVALID_DATA_RESPONSE_MESSAGE);
            expect(body.invalid_fields).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('username'),
                    expect.stringContaining('password'),
                ])
            );
        }
    }

    async expectLongDataInvalidFields(response: APIResponse): Promise<void> {
        expect(
            REGISTER_STATUS_VALIDATION_OR_RATE_LIMIT,
            'Expected status to be either 412 (invalid data) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        if (response.status() === HTTP_STATUS.PRECONDITION_FAILED) {
            expect(body.code).toBe(AUTH_API_ERROR_CODE.INVALID_DATA);
            expect(body.message).toBe(INVALID_DATA_RESPONSE_MESSAGE);
            expect(body.invalid_fields).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('username'),
                    expect.stringContaining('password'),
                    expect.stringContaining('email'),
                ])
            );
        }
    }

    async expectInvalidEmailInvalidFields(response: APIResponse): Promise<void> {
        expect(
            REGISTER_STATUS_VALIDATION_OR_RATE_LIMIT,
            'Expected status to be either 412 (invalid data) or 429 (rate limit)'
        ).toContain(response.status());
        const body = await this.json(response);
        if (response.status() === HTTP_STATUS.PRECONDITION_FAILED) {
            expect(body.code).toBe(AUTH_API_ERROR_CODE.INVALID_DATA);
            expect(body.message).toBe(INVALID_DATA_RESPONSE_MESSAGE);
            expect(body.invalid_fields).toEqual(
                expect.arrayContaining([expect.stringContaining('email')])
            );
        }
    }

    async expectXssPayloadRejected(response: APIResponse): Promise<void> {
        expect(response.status()).toBe(HTTP_STATUS.PRECONDITION_FAILED);
        const body = await this.json(response);
        expect(body.code).toBe(AUTH_API_ERROR_CODE.INVALID_DATA);
        expect(body.message).toMatch(AUTH_API_MESSAGE_PATTERN.validation.invalidDataOrRateLimit);
    }

    private expectBadRequestOrRateLimit(response: APIResponse): void {
        expect(
            REGISTER_STATUS_DUPLICATE_OR_RATE_LIMIT,
            'Expected status to be either 400 (bad request) or 429 (rate limit)'
        ).toContain(response.status());
    }
}
