import { Page, Locator, expect } from '@playwright/test';
import { User } from '../../utils/types';
import { REGISTER_ENDPOINT } from '../../utils/constants/api.constants';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '../../utils/constants/validation.constants';

/**
 * Create-account form: username, email, password, submit to `/register`.
 * Field errors live under `.help.is-danger`; server errors use `.message.danger`.
 */
export class RegisterPage {
    readonly page: Page;

    // Inputs
    readonly usernameInput: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;

    // Actions
    readonly createAccountButton: Locator;
    readonly togglePasswordButton: Locator;
    readonly loginLink: Locator;

    readonly usernameError: Locator;
    readonly emailError: Locator;
    readonly passwordError: Locator;
    readonly dangerMessage: Locator;

    // Success
    readonly loggedUsername: Locator;

    constructor(page: Page) {
        this.page = page;

        // Inputs
        this.usernameInput = page.locator('#username');
        this.emailInput = page.locator('#email');
        this.passwordInput = page.locator('#password');

        // Buttons & links
        this.createAccountButton = page.locator('#register-submit');
        this.togglePasswordButton = page.locator('button[aria-label="Show the password"]');
        this.loginLink = page.locator('a[href="/login"]');

        // Error messages (text-based)
        this.usernameError = page.locator('.field:has(#username) .help.is-danger');
        this.emailError = page.locator('.field:has(#email) .help.is-danger');
        this.passwordError = page.locator('.field:has(#password) .help.is-danger');
        this.dangerMessage = page.locator('.message.danger');

        // After successful login/registration
        this.loggedUsername = page.locator('.username');
    }

    /** Opens the register route (same path the SPA uses for this screen). */
    async navigate() {
        await this.page.goto(REGISTER_ENDPOINT);
    }

    // ——— Actions ———
    async fillUsername(username: string) {
        await this.usernameInput.fill(username);
    }

    async fillEmail(email: string) {
        await this.emailInput.fill(email);
    }

    async fillPassword(password: string) {
        await this.passwordInput.fill(password);
    }

    async clickCreateAccount() {
        await this.createAccountButton.click();
    }

    async togglePasswordVisibility() {
        await this.togglePasswordButton.click();
    }

    async clickLoginLink() {
        await this.loginLink.click();
    }

    async register(username: string, email: string, password: string) {
        await this.fillUsername(username);
        await this.fillEmail(email);
        await this.fillPassword(password);
        await this.clickCreateAccount();
    }

    async fillFields(username: string, email: string, password: string) {
        await this.fillUsername(username);
        await this.fillEmail(email);
        await this.fillPassword(password);
    }

    async registerUser(user: User) {
        await this.fillUsername(user.username);
        await this.fillEmail(user.email);
        await this.fillPassword(user.password);
        await this.clickCreateAccount();
    }

    // ——— Field values ———

    async getUsername(): Promise<string> {
        return await this.usernameInput.inputValue();
    }

    async getEmail(): Promise<string> {
        return await this.emailInput.inputValue();
    }

    async getPassword(): Promise<string> {
        return await this.passwordInput.inputValue();
    }

    // ——— Assertions ———

    async isCreateButtonDisabled(): Promise<boolean> {
    return await this.createAccountButton.isDisabled();
}

async expectUsernameError() {
    await expect(
        this.usernameError,
        'Username error should be visible when username is invalid'
    ).toBeVisible();
}

async expectShortUsernameError() {
    await expect(
        this.usernameError,
        'Username error should be visible for short username'
    ).toBeVisible();

    await expect(
        this.usernameError,
        `Expected username error to mention minimum length (${USERNAME_MIN_LENGTH})`
    ).toContainText(
        `Username must have at least ${USERNAME_MIN_LENGTH} characters.`
    );
}

async expectLongUsernameError() {
    await expect(
        this.usernameError,
        'Username error should be visible for long username'
    ).toBeVisible();

    await expect(
        this.usernameError,
        `Expected username error to mention maximum length (${USERNAME_MAX_LENGTH})`
    ).toContainText(
        `Username must have at most ${USERNAME_MAX_LENGTH} characters.`
    );
}

async expectEmailError() {
    await expect(
        this.emailError,
        'Email error should be visible when email is invalid'
    ).toBeVisible();
}

async expectPasswordError() {
    await expect(
        this.passwordError,
        'Password error should be visible when password is invalid'
    ).toBeVisible();
}

async expectShortPasswordError() {
    await expect(
        this.passwordError,
        'Password error should be visible for short password'
    ).toBeVisible();

    await expect(
        this.passwordError,
        `Expected password error to mention minimum length (${PASSWORD_MIN_LENGTH})`
    ).toContainText(
        `Password must have at least ${PASSWORD_MIN_LENGTH} characters.`
    );
}

async expectLongPasswordError() {
    await expect(
        this.passwordError,
        'Password error should be visible for long password'
    ).toBeVisible();

    await expect(
        this.passwordError,
        `Expected password error to mention maximum length (${PASSWORD_MAX_LENGTH})`
    ).toContainText(
        `Password must have at most ${PASSWORD_MAX_LENGTH} characters.`
    );
}

async expectSuccessfulRegistration(username: string) {
    await expect(
        this.page,
        'User should be redirected to home page after successful registration'
    ).toHaveURL('/');

    await expect(
        this.loggedUsername,
        `Logged username should be "${username}" after successful registration`
    ).toHaveText(username);
}

async expectDangerMessage() {
    await expect(
        this.dangerMessage,
        'Danger (error) message should be visible'
    ).toBeVisible();
}

async expectDangerMessageText(text: RegExp | string) {
    await expect(
        this.dangerMessage,
        'Danger (error) message should be visible before validating its content'
    ).toBeVisible();

    await expect(
        this.dangerMessage,
        `Danger message should match expected text: ${text}`
    ).toHaveText(text);
}

async blurField() {
    await this.page.keyboard.press('Tab');
}

}