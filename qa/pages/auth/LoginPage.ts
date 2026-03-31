import { Page, expect } from '@playwright/test';
import { HOME_ROUTE, LOGIN_ROUTE, PASSWORD_RESET_ROUTE, REGISTER_ROUTE } from '../../utils/constants/routes.constants';

/**
 * Login screen: username/email + password, links to register and password reset.
 * Success = redirect to `/` and `.username` shows the account name (not email).
 */
export class LoginPage {
    constructor(public page: Page) { }

    async goto() {
        await this.page.goto(LOGIN_ROUTE);
    }

    async fillUsername(username: string) {
        await this.page.fill('#username', username);
    }

    async fillPassword(password: string) {
        await this.page.fill('#password', password);
    }

    async submit() {
        await this.page.getByRole('button', { name: 'Login' }).click();
    }

    async login(username: string, password: string) {
        await this.fillUsername(username);
        await this.fillPassword(password);
        await this.submit();
    }

    // ——— Locators ———

    /** Shown in the header after login (displays username). */
    usernameLabel = () => this.page.locator('.username');
    errorMessage = () => this.page.locator('.message.danger');

    usernameFieldError = () =>
        this.page.locator('.field')
            .filter({ has: this.page.locator('#username') })
            .locator('.help.is-danger');

    passwordFieldError = () =>
        this.page.locator('.field')
            .filter({ has: this.page.locator('#password') })
            .locator('.help.is-danger');

    registerLink = () => this.page.getByText('Create account');
    forgotPasswordLink = () => this.page.getByText('Forgot your password?');

    loginForm = () => this.page.locator('#loginform');

    passwordInput = () => this.page.locator('#password');
    togglePasswordButton = () =>
        this.page.getByRole('button', { name: /password/i });

    // ——— Assertions ———

    async expectSuccessfulLogin(username: string) {
        await expect(
            this.page,
            'User should be redirected to home page after successful login'
        ).toHaveURL(HOME_ROUTE);

        await expect(
            this.usernameLabel(),
            `Logged-in username should be "${username}"`
        ).toHaveText(username);
    }

    async expectLoginError() {
        await expect(
            this.errorMessage(),
            'Login error message should be displayed for invalid credentials or rate limiting'
        ).toHaveText(/Wrong username or password|Too Many Requests/);
    }

    async expectUsernameRequiredError() {
        await expect(
            this.usernameFieldError(),
            'Username required validation message should be displayed'
        ).toContainText('Please provide a username');
    }

    async expectPasswordRequiredError() {
        await expect(
            this.passwordFieldError(),
            'Password required validation message should be displayed'
        ).toContainText('Please provide a password');
    }

    async expectOnLoginPage() {
        await expect(
            this.page,
            'User should remain on login page'
        ).toHaveURL(LOGIN_ROUTE);
    }

    async expectLoginFormVisible() {
        await expect(
            this.loginForm(),
            'Login form should be visible to the user'
        ).toBeVisible();
    }
    async expectPasswordHidden() {
        await expect(
            this.passwordInput(),
            'Password field should be hidden (type="password") by default or after toggle'
        ).toHaveAttribute('type', 'password');
    }

    async expectPasswordVisible() {
        await expect(
            this.passwordInput(),
            'Password field should be visible (type="text") after toggling visibility'
        ).toHaveAttribute('type', 'text');
    }

    async expectOnRegisterPage() {
        await expect(
            this.page,
            'User should be redirected to the register page after clicking "Create account"'
        ).toHaveURL(REGISTER_ROUTE);
    }

    async expectOnPasswordResetPage() {
        await expect(
            this.page,
            'User should be redirected to the password reset page after clicking "Forgot your password?"'
        ).toHaveURL(PASSWORD_RESET_ROUTE);
    }
    async navigateTo(route: string) {
        await this.page.goto(route);
    }

    // ——— Actions ———

    async clickRegisterLink() {
        await this.registerLink().click();
    }

    async clickForgotPassword() {
        await this.forgotPasswordLink().click();
    }

    async togglePasswordVisibility() {
        await this.togglePasswordButton().click();
    }
}