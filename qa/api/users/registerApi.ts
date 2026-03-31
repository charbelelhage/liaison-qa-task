import { request } from '@playwright/test';
import { ENV } from '../../config/env';
import { REGISTER_API_PATH } from '../../utils/constants/api.constants';

/** Registers a user with `language: 'en'` for UI/API test seeding (throws on failure). */
export async function createUser(user: {
    username: string;
    email: string;
    password: string;
}): Promise<typeof user> {
    const context = await request.newContext({
        baseURL: ENV.API_URL,
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
    });

    try {
        const response = await context.post(REGISTER_API_PATH, {
            data: {
                username: user.username,
                email: user.email,
                password: user.password,
                language: 'en',
            },
        });

        if (!response.ok()) {
            throw new Error(await response.text());
        }
        return user;
    } finally {
        await context.dispose();
    }
}
