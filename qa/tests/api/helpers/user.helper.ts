import { User } from '../../../utils/types';
import { createUser } from '../../../api/users/registerApi';
import { BACKEND_ERROR_SUBSTRINGS } from '../../../utils/constants/auth.api.test.constants';
import { APIRequestContext } from '@playwright/test';
import { LoginApiUser } from '../../../api/users/LoginApiUser';

export async function ensureUserExists(user: User) {
    try {
        await createUser(user);
    } catch (error: any) {
        const message = error?.message || '';

        if (
            message.includes(BACKEND_ERROR_SUBSTRINGS.DUPLICATE_USER_CODE) ||
            message.includes(BACKEND_ERROR_SUBSTRINGS.RATE_LIMIT)
        ) {
            // Expected cases → ignore
            console.warn('User already exists, continuing...');
            return;
        }

        throw error; // real unexpected error
    }
}

/** Login via the same path/payload contract as `LoginApiUser` / auth API tests. */
export async function getAuthToken(api: APIRequestContext, user: User): Promise<string> {
    const loginUser = new LoginApiUser(api);
    const response = await loginUser.login({
        username: user.username,
        password: user.password,
    });
    await loginUser.expectLoginSuccessTokenOnly(response);
    const body = await response.json();
    if (!body.token) {
        throw new Error('Login response did not include a token');
    }
    return body.token;
}