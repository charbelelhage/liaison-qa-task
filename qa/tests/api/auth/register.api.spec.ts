/**
 * Contract tests for the register JSON API (`RegisterApiUser`).
 *
 * Each test uses a fresh generated user and a new API client; duplicate-user cases call `ensureUserExists` inside the test.
 */
import { test, APIRequestContext } from '@playwright/test';
import { createApiContext } from '../../../api/users/apiClient';
import { user_data } from '../../../utils/test.data';
import { User } from '../../../utils/types';
import { RegisterApiUser } from '../../../api/users/RegisterApiUser';
import {
    DUPLICATE_REGISTRATION_ALT_PASSWORD,
    buildUniqueTestEmail,
    buildUniqueTestUsername,
} from '../../../utils/constants/auth.api.test.constants';
import { ensureUserExists } from '../helpers/user.helper';

let user: User;
let api: APIRequestContext;
let registerUser: RegisterApiUser;

test.beforeEach(async () => {
    user = user_data.valid.generateUser();
    api = await createApiContext();
    registerUser = new RegisterApiUser(api);
});

test.afterEach(async () => {
    await api.dispose();
});

test.describe('Register API - Critical Flows', () => {
    test('User can register with valid username, email and password', { tag: ['@P0'] }, async () => {
        const response = await registerUser.register(user);
        await registerUser.expectRegistrationSuccess(response, user);
    });

    test('User can register with minimum valid username and password length', { tag: ['@P0'] }, async () => {
        user = user_data.valid.minLengthUsernameAndPassword();
        const response = await registerUser.register(user);
        await registerUser.expectRegistrationSuccessFromJsonFirst(response, user);
    });

    test('User can register with maximum valid username and password length', { tag: ['@P0'] }, async () => {
        user = user_data.valid.maxLengthUsernameAndPassword();
        const response = await registerUser.register(user);
        await registerUser.expectRegistrationSuccessFromJsonFirst(response, user);
    });

    test('User cannot register with existing username', { tag: ['@P0'] }, async () => {
        await ensureUserExists(user);
        const response = await registerUser.register({
            username: user.username,
            email: buildUniqueTestEmail(),
            password: DUPLICATE_REGISTRATION_ALT_PASSWORD,
        });

        await registerUser.expectDuplicateUsername(response);
    });

    test('Username is not case sensitive for creation', { tag: ['@P0'] }, async () => {
        await ensureUserExists(user);
        const response = await registerUser.register({
            username: user.username.toUpperCase(),
            email: buildUniqueTestEmail(),
            password: DUPLICATE_REGISTRATION_ALT_PASSWORD,
        });

        await registerUser.expectUsernameDuplicateCaseInsensitiveBranch(response);
    });

    test('User cannot register with existing email', { tag: ['@P0'] }, async () => {
        await ensureUserExists(user);

        const response = await registerUser.register({
            username: buildUniqueTestUsername(),
            email: user.email,
            password: DUPLICATE_REGISTRATION_ALT_PASSWORD,
        });

        await registerUser.expectDuplicateEmail(response);
    });

    test('Email is not case-sensitive during registration', { tag: ['@P0'] }, async () => {
        await ensureUserExists(user);

        const response = await registerUser.register({
            username: buildUniqueTestUsername(),
            email: user.email.toUpperCase(),
            password: DUPLICATE_REGISTRATION_ALT_PASSWORD,
        });

        await registerUser.expectEmailDuplicateCaseInsensitiveBranch(response);
    });
});

test.describe('Register API - High Priority Validation', () => {
    test('User cannot register with missing email', { tag: ['@P1'] }, async () => {
        const { email: _email, ...payload } = user;
        const response = await registerUser.register(payload);
        await registerUser.expectMissingEmailMessage(response);
    });

    test('User cannot register with missing username', { tag: ['@P1'] }, async () => {
        const { username: _username, ...payload } = user;
        const response = await registerUser.register(payload);
        await registerUser.expectMissingUsernameOrPasswordMessage(response);
    });

    test('User cannot register with missing password', { tag: ['@P1'] }, async () => {
        const { password: _password, ...payload } = user;
        const response = await registerUser.register(payload);
        await registerUser.expectMissingUsernameOrPasswordMessage(response);
    });

    test('User cannot register with missing username and password', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register({ email: user.email });
        await registerUser.expectMissingUsernameOrPasswordMessage(response);
    });

    test('User cannot register with  no data', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register({});
        await registerUser.expectMissingUsernameOrPasswordMessage(response);
    });

    test('User cannot register with whitespace values for username,password and email', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register(user_data.invalid.emptyStringsData());
        await registerUser.expectMissingUsernameOrPasswordMessage(response);
    });

    test('User cannot register with empty values for username,password and email', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register(user_data.invalid.whitespaceOnlyValues());
        await registerUser.expectMissingUsernameOrPasswordMessage(response);
    });

    test('User cannot register with null values for username,password and email', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register(user_data.invalid.nullValues());
        await registerUser.expectMissingUsernameOrPasswordMessage(response);
    });

    test('User cannot register with username having leading/trailing spaces', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register(user_data.valid.usernameWithLeadingSpaces());
        await registerUser.expectMissingUsernameOrPasswordMessage(response);
    });

    test('User cannot register with email having leading/trailing spaces', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register(user_data.valid.emailWithLeadingSpaces());
        await registerUser.expectMissingUsernameOrPasswordMessage(response);
    });

    test('User cannot register with wrong data types for username,password and email', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register(user_data.invalid.wrongDataTypes());
        await registerUser.expectInvalidUserModelMessage(response);
    });

    test('User cannot register with username and password values shorter than minimum length', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register(user_data.invalid.shortUsernameAndPassword());
        await registerUser.expectShortUsernameAndPasswordInvalidData(response);
    });

    test('User cannot register with data values longer than maximum length', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register(user_data.invalid.longData());
        await registerUser.expectLongDataInvalidFields(response);
    });

    test('User cannot register with invalid email', { tag: ['@P1'] }, async () => {
        const response = await registerUser.register(user_data.invalid.emailFormat());
        await registerUser.expectInvalidEmailInvalidFields(response);
    });
});

test.describe('Register API - Security & Edge Cases', () => {
    test('User cannot register with XSS payload in username', { tag: ['@P2'] }, async () => {
        const response = await registerUser.register(user_data.security.maliciousXSSPayload());
        await registerUser.expectXssPayloadRejected(response);
    });
});
