/**
 * UI tests for the login page (happy paths, validation, navigation, password toggle).
 *
 * One test user is created via the register API in beforeAll so sign-in tests stay fast and stable.
 * Each test opens a fresh /login — no shared session by default.
 */
import { test } from '@playwright/test';
import { LoginPage } from '../../../pages/auth/LoginPage';
import { createUser } from '../../../api/users/registerApi';
import { user_data } from '../../../utils/test.data';
import { User } from '../../../utils/types';
import { PROJECTS_ROUTE } from '../../../utils/constants/routes.constants';

let user: User;
let loginPage: LoginPage;

// Seed credentials: duplicate user (1001) or rate limit is ignored so re-runs are safe.
test.beforeAll(async () => {
  user = user_data.valid.generateUser();

  try {
    await createUser(user);
  } catch (error: any) {
    const message = error.message || '';

    if (message.includes('1001') || message.includes('Too Many Requests')) {
      console.warn('User already exists, continuing...');
    } else {
      throw error;
    }
  }
});

// Start from the login screen every time (not logged in).
test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.goto();
});


test.describe('Login Page - Critical Flows', () => {

  test('User can login with correct username and password', { tag: ['@P0'] }, async () => {
    await loginPage.login(user.username, user.password);
    await loginPage.expectSuccessfulLogin(user.username);
  });

  test('User can login with correct email and password', { tag: ['@P0'] }, async () => {
    await loginPage.login(user.email, user.password);
    await loginPage.expectSuccessfulLogin(user.username);
  });

  test('User can login with email in uppercase (case insensitive)', { tag: ['@P0'] }, async () => {
    await loginPage.login(user.email.toUpperCase(), user.password);
    await loginPage.expectSuccessfulLogin(user.username);
  });


  test('User can login with email in mixed case', { tag: ['@P0'] }, async ({ page }) => {
    const mixedEmail = user.email.slice(0, 3).toUpperCase() + user.email.slice(3);
    await loginPage.login(mixedEmail, user.password);
    await loginPage.expectSuccessfulLogin(user.username);
  });

  test('User can login with username in different case', { tag: ['@P0'] }, async () => {
    await loginPage.login(user.username.toUpperCase(), user.password);
    await loginPage.expectSuccessfulLogin(user.username);
  });

  test('User cannot login with incorrect password', { tag: ['@P0'] }, async () => {
    await loginPage.login(user.username, 'wrongPassword');
    await loginPage.expectLoginError();
    await loginPage.expectOnLoginPage();
  });

  test('User cannot login with incorrect username', { tag: ['@P0'] }, async () => {
    await loginPage.login('wrongUser', user.password);
    await loginPage.expectLoginError();
    await loginPage.expectOnLoginPage();
  });

  test('User cannot login with both username and password incorrect', { tag: ['@P0'] }, async () => {
    await loginPage.login('wrongUser', 'wrongPassword');
    await loginPage.expectLoginError();
    await loginPage.expectOnLoginPage();
  });

});


test.describe('Login Page - High Priority Validation', () => {

  test('User cannot login with empty username', { tag: ['@P1'] }, async () => {
    await loginPage.fillPassword(user.password);
    await loginPage.submit();

    await loginPage.expectOnLoginPage();
    await loginPage.expectUsernameRequiredError();
  });

  test('User cannot login with empty password', { tag: ['@P1'] }, async () => {
    await loginPage.fillUsername(user.username);
    await loginPage.submit();

    await loginPage.expectOnLoginPage();
    await loginPage.expectPasswordRequiredError();
  });

  test('User cannot login with empty username and password', { tag: ['@P1'] }, async () => {
    await loginPage.submit();

    await loginPage.expectOnLoginPage();
    await loginPage.expectUsernameRequiredError();
    await loginPage.expectPasswordRequiredError();
  });
  test('User can login with email having leading/trailing spaces', { tag: ['@P1'] }, async () => {
    await loginPage.login(`  ${user.email}  `, user.password);
    await loginPage.expectSuccessfulLogin(user.username);
  });

  test('User can login with username having leading/trailing spaces', { tag: ['@P1'] }, async () => {
    await loginPage.login(`  ${user.username}  `, user.password);
    await loginPage.expectSuccessfulLogin(user.username);
  });

});


test.describe('Login Page - UX & Usability', () => {

  test('User can navigate to register page from login', { tag: ['@P2'] }, async () => {
    await loginPage.clickRegisterLink();
    await loginPage.expectOnRegisterPage();
  });

  test('User can navigate to forgot password page', { tag: ['@P2'] }, async () => {
    await loginPage.clickForgotPassword();
    await loginPage.expectOnPasswordResetPage();
  });

  test('User cannot access protected route without authentication', { tag: ['@P2'] }, async ({ page }) => {
    await loginPage.navigateTo(PROJECTS_ROUTE);
    await loginPage.expectOnLoginPage();
    await loginPage.expectLoginFormVisible();
  });

  test('User cannot login with very long input values', { tag: ['@P2'] }, async () => {
    const longString = 'a'.repeat(500);

    await loginPage.login(longString, longString);
    await loginPage.expectLoginError();
    await loginPage.expectOnLoginPage();
  });

  test('User cannot login with special characters', { tag: ['@P2'] }, async () => {
    await loginPage.login('@@@###', '!!!***');
    await loginPage.expectLoginError();
    await loginPage.expectOnLoginPage();
  });

  test('Password visibility toggle works correctly', { tag: ['@P2'] }, async () => {
    await loginPage.expectPasswordHidden();

    await loginPage.fillPassword(user.password);

    await loginPage.togglePasswordVisibility();
    await loginPage.expectPasswordVisible();

    await loginPage.togglePasswordVisibility();
    await loginPage.expectPasswordHidden();
  });

});