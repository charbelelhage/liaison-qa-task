/**
 * Contract tests for the login JSON API (`LoginApiUser`, shared `baseURL` + headers from `.env`).
 *
 * One user is ensured once; each test gets a new API context so calls stay isolated.
 */
import { APIRequestContext, test } from '@playwright/test';
import { createApiContext } from '../../../api/users/apiClient';
import { user_data } from '../../../utils/test.data';
import { User } from '../../../utils/types';
import { LoginApiUser } from '../../../api/users/LoginApiUser';
import { ensureUserExists } from '../helpers/user.helper';

let user: User;
let api: APIRequestContext;
let loginUser: LoginApiUser;

test.beforeAll(async () => {
    user = user_data.valid.generateUser();
    await ensureUserExists(user);
});

test.beforeEach(async () => {
  api = await createApiContext();
  loginUser = new LoginApiUser(api);
});

test.afterEach(async () => {
  await api.dispose();
});


test.describe('Login API - Critical Flows', () => {
    test('User can login via API with valid credentials', { tag: ['@P0'] }, async () => {

        const response = await loginUser.login({
            username: user.username,
            password: user.password,
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectLoginSuccessWithTokenMessage(response);
        
    });

    test('User can login via API with email', { tag: ['@P0'] }, async () => {

        const response = await loginUser.login({
            username: user.email,
            password: user.password,
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectLoginSuccessTokenOnly(response);
        
    });

    test('User can login with correct username, password and missing long_token value', { tag: ['@P0'] }, async () => {

        const response = await loginUser.login({
            username: user.username,
            password: user.password,
        });
        await loginUser.expectLoginSuccessWithTokenMessage(response);
        
    });

    test('User can login with email in uppercase (case insensitive)', { tag: ['@P0'] }, async () => {

        const response = await loginUser.login({
            username: user.email.toUpperCase(),
            password: user.password,
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectLoginSuccessTokenOnly(response);
        
    });

    test('User can login with email in mixed case', { tag: ['@P0'] }, async () => {

        const response = await loginUser.login({
            username: LoginApiUser.mixedCaseEmail(user.email),
            password: user.password,
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectLoginSuccessTokenOnly(response);
        
    });

    test('User can login with username in different case', { tag: ['@P0'] }, async () => {

        const response = await loginUser.login({
            username: user.username.toUpperCase(),
            password: user.password,
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectLoginSuccessTokenOnly(response);
        
    });

    test('User cannot login with incorrect password', { tag: ['@P0'] }, async () => {

        const response = await loginUser.login({
            username: user.username,
            password: LoginApiUser.invalidPassword(),
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectWrongCredentialsWithPeriod(response);
        
    });

    test('User cannot login with incorrect username', { tag: ['@P0'] }, async () => {

        const response = await loginUser.login({
            username: LoginApiUser.invalidUsername(),
            password: user.password,
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectWrongCredentialsWithPeriod(response);
        
    });

    test('User cannot login with both incorrect username and password', { tag: ['@P0'] }, async () => {

        const response = await loginUser.login({
            username: LoginApiUser.invalidUsername(),
            password: LoginApiUser.invalidPassword(),
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectWrongCredentialsWithPeriod(response);
        
    });

    test('User cannot login when password case is different (case-sensitive)', { tag: ['@P0'] }, async () => {

        const response = await loginUser.login({
            username: user.username,
            password: user.password.toUpperCase(),
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectWrongCredentialsNoPeriod(response);
        
    });
});

test.describe('Login API - High Priority Validation', () => {
    test('User cannot login with missing username', { tag: ['@P1'] }, async () => {

        const response = await loginUser.login({
            password: user.password,
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectMissingUsernameOrPasswordMessage(response);
        
    });

    test('User cannot login with missing password', { tag: ['@P1'] }, async () => {

        const response = await loginUser.login({
            username: user.username,
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectMissingUsernameOrPasswordMessage(response);
        
    });

    test('User cannot login with missing both username and password', { tag: ['@P1'] }, async () => {

        const response = await loginUser.login({});
        await loginUser.expectMissingUsernameOrPasswordMessage(response);
        
    });

    test('User cannot login with invalid long_token value', { tag: ['@P1'] }, async () => {

        const response = await loginUser.login({
            username: user.username,
            password: user.password,
            long_token: LoginApiUser.longTokenInvalid(),
        });
        await loginUser.expectInvalidLongTokenMessage(response);
        
    });

    test('User can login with email having leading/trailing spaces', { tag: ['@P1'] }, async () => {

        const response = await loginUser.login({
            username: LoginApiUser.withLeadingTrailingSpaces(user.email),
            password: user.password,
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectLoginSuccessTokenOnly(response);
        
    });

    test('User can login with username having leading/trailing spaces', { tag: ['@P1'] }, async () => {

        const response = await loginUser.login({
            username: LoginApiUser.withLeadingTrailingSpaces(user.username),
            password: user.password,
            long_token: LoginApiUser.longTokenDisabled(),
        });
        await loginUser.expectLoginSuccessTokenOnly(response);
        
    });
});

test.describe('Login API - UX & Edge Cases', () => {
    test('User cannot login with very long input values', { tag: ['@P2'] }, async () => {

        const response = await loginUser.login(user_data.invalid.longData());
        await loginUser.expectResponseTextWrongCredsOrRateLimit(response);
        
    });

    test('User cannot login with special characters', { tag: ['@P2'] }, async () => {

        const response = await loginUser.login(user_data.invalid.usernameAndPasswordSpecialCharacters());
        await loginUser.expectResponseTextWrongCredsOrRateLimit(response);
        
    });
});
