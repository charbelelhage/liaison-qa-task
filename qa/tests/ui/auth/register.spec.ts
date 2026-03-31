/**
 * UI tests for account registration (success, duplicates, field validation, UX).
 *
 * A brand-new user is generated on each test in beforeEach, so tests don’t step on each other.
 * Some cases pre-create the same user via API to simulate “already registered” errors.
 */
import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../../pages/auth/RegisterPage';
import { user_data } from '../../../utils/test.data';
import * as test_data from '../../../utils/test.data';
import { User } from '../../../utils/types';
import { createUser } from '../../../api/users/registerApi';
import { INVALID_LONG_PASSWORD, INVALID_LONG_USERNAME, INVALID_SHORT_PASSWORD, INVALID_SHORT_USERNAME, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '../../../utils/constants/validation.constants';
import { REGISTER_ENDPOINT } from '../../../utils/constants/api.constants';
import { countRequests } from '../../../utils/helpers/network.helper';
import { LOGIN_ROUTE } from '../../../utils/constants/routes.constants';

let user: User;
let registerPage: RegisterPage;

test.beforeEach(async ({ page }) => {
    user = user_data.valid.generateUser();
    registerPage = new RegisterPage(page);
    await registerPage.navigate();
});

test.describe('Register Page - Critical Flows', () => {

    test('User can create an account with valid username, email, and password', {
        tag: ['@P0']
    }, async () => {

        await registerPage.registerUser(user);

        await registerPage.expectSuccessfulRegistration(user.username);
    });

    test('User cannot register with an existing username', {
        tag: ['@P0']
    }, async () => {

        try {
            await createUser(user);
        } catch (error: any) {
            const message = error.message || '';

            if (message.includes('1001') ||
                message.includes('Too Many Requests')) {
                console.warn('User already exists, continuing...');
            } else {
                throw error;
            }
        }


        // Try again with same username
        await registerPage.register(
            user.username,
            `new_${Date.now()}@test.com`,
            user.password
        );

        // Expect error (backend response shown in UI)
        await registerPage.expectDangerMessageText(/already exists/i);
    });

    test('User cannot register with an existing email', {
        tag: ['@P0']
    }, async () => {

        try {
            await createUser(user);
        } catch (error: any) {
            const message = error.message || '';

            if (message.includes('1001') ||
                message.includes('Too Many Requests')) {
                console.warn('User already exists, continuing...');
            } else {
                throw error;
            }
        }


        // Try again with same email
        // Fresh username so the clash is only on email (same email as the pre-created user).
        await registerPage.register(
            test_data.generateRandomChars(USERNAME_MIN_LENGTH * 2),
            user.email,
            user.password
        );

        // Expect error (backend response shown in UI)
        await registerPage.expectDangerMessageText(/already exists/i);
    });
    test('User can register with username at minimum allowed length', {
        tag: ['@P0']
    }, async () => {

        const validUser = {
            ...user,
            username: test_data.generateRandomChars(USERNAME_MIN_LENGTH)
        };

        await registerPage.registerUser(validUser);

        await registerPage.expectSuccessfulRegistration(validUser.username);
    });


    test('User can register with username at maximum allowed length', {
        tag: ['@P0']
    }, async () => {

        const validUser = {
            ...user,
            username: test_data.generateRandomChars(USERNAME_MAX_LENGTH)
        };

        await registerPage.registerUser(validUser);

        await registerPage.expectSuccessfulRegistration(validUser.username);
    });


    test('User can register with password at minimum allowed length', {
        tag: ['@P0']
    }, async () => {

        const validUser = {
            ...user,
            password: test_data.generateRandomChars(PASSWORD_MIN_LENGTH)
        };

        await registerPage.registerUser(validUser);

        await registerPage.expectSuccessfulRegistration(validUser.username);
    });


    test('User can register with password at maximum allowed length', {
        tag: ['@P0']
    }, async () => {

        const validUser = {
            ...user,
            password: test_data.generateRandomChars(PASSWORD_MAX_LENGTH)
        };

        await registerPage.registerUser(validUser);

        await registerPage.expectSuccessfulRegistration(validUser.username);
    });

});

test.describe('Register Page - High Priority Validation', () => {
    test('Create account button is disabled when required fields are empty', {
        tag: ['@P1']
    }, async () => {
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('User cannot submit the form with empty username with error message displayed', {
        tag: ['@P1']
    }, async () => {
        await registerPage.fillFields('', user.email, user.password);

        await registerPage.expectUsernameError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('User cannot submit the form with empty email with error message displayed', {
        tag: ['@P1']
    }, async () => {
        await registerPage.fillFields(user.username, '', user.password);

        await registerPage.expectEmailError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('User cannot submit the form with empty password with error message displayed', {
        tag: ['@P1']
    }, async () => {
        await registerPage.fillFields(user.username, user.email, '');
        await registerPage.blurField();
        await registerPage.expectPasswordError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('Error message is displayed when email is invalid', {
        tag: ['@P1']
    }, async () => {
        user = user_data.invalid.emailFormat();
        await registerPage.fillFields(user.username, user.email, user.password);

        await registerPage.expectEmailError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });
    test('User cannot register with username shorter than minimum length', {
        tag: ['@P1']
    }, async () => {

        await registerPage.register(test_data.generateRandomChars(INVALID_SHORT_USERNAME), user.email, user.password);

        await registerPage.expectUsernameError();
    });

    test('User cannot register with password shorter than minimum length', {
        tag: ['@P1']
    }, async () => {

        await registerPage.fillFields(user.username, user.email, test_data.generateRandomChars(INVALID_SHORT_PASSWORD));
        await registerPage.blurField();

        await registerPage.expectPasswordError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('Error messages disappear when user corrects the input', {
        tag: ['@P1']
    }, async () => {
        // Trigger error
        user = user_data.invalid.emptyStringsData();
        await registerPage.fillFields(user.username, user.email, user.password);
        await registerPage.blurField();

        await registerPage.expectUsernameError();
        await registerPage.expectEmailError();
        await registerPage.expectPasswordError();
        user = user_data.valid.generateUser();
        // Fix input
        await registerPage.fillFields(user.username, user.email, user.password);
        await registerPage.blurField();
        // Expect error gone

        await expect(registerPage.usernameError).not.toBeVisible();
        await expect(registerPage.emailError).not.toBeVisible();
        await expect(registerPage.passwordError).not.toBeVisible();
    });

    test('Create account button becomes enabled when all fields are valid', {
        tag: ['@P1']
    }, async () => {
        await registerPage.fillFields(user.username, user.email, user.password);

        expect(await registerPage.isCreateButtonDisabled()).toBeFalsy();
    });

    test('User cannot register with whitespace-only values', {
        tag: ['@P1']
    }, async () => {
        user = user_data.invalid.whitespaceOnlyValues();
        await registerPage.fillFields(user.username, user.email, user.password);
        await registerPage.blurField();

        await registerPage.expectUsernameError();
        await registerPage.expectEmailError();
        await registerPage.expectPasswordError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('User cannot register with empty string values', {
        tag: ['@P1']
    }, async () => {
        user = user_data.invalid.emptyStringsData();
        await registerPage.fillFields(user.username, user.email, user.password);
        await registerPage.blurField();
        await registerPage.expectUsernameError();
        await registerPage.expectEmailError();
        await registerPage.expectPasswordError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('User cannot register with leading/trailing spaces in username', {
        tag: ['@P1']
    }, async () => {
        user = user_data.valid.usernameWithLeadingSpaces();
        await registerPage.fillFields(user.username, user.email, user.password);
        await registerPage.blurField();
        await registerPage.expectUsernameError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('User cannot submit the form multiple times rapidly (only one request is sent)', {
        tag: ['@P1']
    }, async ({ page }) => {

        const requests = countRequests(page, REGISTER_ENDPOINT);

        await registerPage.fillFields(user.username, user.email, user.password);

        await Promise.all([
            registerPage.clickCreateAccount(),
            registerPage.clickCreateAccount(),
            registerPage.clickCreateAccount(),
        ]);

        await registerPage.expectSuccessfulRegistration(user.username);

        expect(requests.getCount()).toBe(1);

        requests.dispose();
    });

});


test.describe('Register Page - UX & Usability', () => {

    test('User registering with a short username is shown a clear and user-friendly validation message', {
        tag: ['@P2']
    }, async () => {

        await registerPage.register(test_data.generateRandomChars(INVALID_SHORT_USERNAME), user.email, user.password);

        await registerPage.expectShortUsernameError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('User registering with a short password is shown a clear and user-friendly validation message', {
        tag: ['@P2']
    }, async () => {

        await registerPage.fillFields(user.username, user.email, test_data.generateRandomChars(INVALID_SHORT_PASSWORD));
        await registerPage.blurField();
        await registerPage.expectShortPasswordError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('User registering with a long username is shown a clear and user-friendly validation message', {
        tag: ['@P2']
    }, async () => {

        await registerPage.register(test_data.generateRandomChars(INVALID_LONG_USERNAME), user.email, user.password);

        await registerPage.expectLongUsernameError();
    });

    test('User registering with a long password is shown a clear and user-friendly validation message', {
        tag: ['@P2']
    }, async () => {

        await registerPage.fillFields(user.username, user.email, test_data.generateRandomChars(INVALID_LONG_PASSWORD));
        await registerPage.blurField();
        await registerPage.expectLongPasswordError();
        expect(await registerPage.isCreateButtonDisabled()).toBeTruthy();
    });

    test('User can toggle password visibility using eye icon', {
        tag: ['@P2']
    }, async () => {
        await registerPage.fillPassword(test_data.generateRandomChars(PASSWORD_MIN_LENGTH * 2));

        // Initially masked
        await expect(registerPage.passwordInput).toHaveAttribute('type', 'password');

        // Toggle visibility
        await registerPage.togglePasswordVisibility();

        // Now visible
        await expect(registerPage.passwordInput).toHaveAttribute('type', 'text');
    });

    test('Password field masks input by default', {
        tag: ['@P2']
    }, async () => {
        await expect(registerPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('Form preserves values after validation error', {
        tag: ['@P2']
    }, async () => {
        const invalidUser = {
            ...user,
            username: test_data.generateRandomChars(INVALID_LONG_USERNAME)
        };

        await registerPage.fillFields(invalidUser.username, invalidUser.email, invalidUser.password);;

        await registerPage.clickCreateAccount();

        // Trigger validation error (email invalid)
        await registerPage.expectUsernameError();

        // Values should still be present
        expect(await registerPage.getUsername()).toBe(invalidUser.username);
        expect(await registerPage.getEmail()).toBe(invalidUser.email);
        expect(await registerPage.getPassword()).toBe(invalidUser.password);
    });

    test('User can navigate to login page via "Login" link', {
        tag: ['@P2']
    }, async ({ page }) => {
        await registerPage.clickLoginLink();

        await expect(page).toHaveURL(LOGIN_ROUTE);
    });

});