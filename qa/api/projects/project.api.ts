import { expect, APIRequestContext, APIResponse } from '@playwright/test';
import { HTTP_STATUS, PROJECT_ERROR_CODES } from '../../utils/constants/projects.api.test.constants';
import { PROJECT_ENDPOINT } from '../../utils/constants/api.constants';

export class ProjectApi {
    constructor(private readonly api: APIRequestContext) {}

    private headers(token: string) {
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    async create(token: string, data: object): Promise<APIResponse> {
        return this.api.post(PROJECT_ENDPOINT, {
            headers: this.headers(token),
            data,
        });
    }

    /** POST /projects with no `Authorization` header (negative auth tests). */
    async createWithoutAuth(data: object): Promise<APIResponse> {
        return this.api.post(PROJECT_ENDPOINT, { data });
    }

    async update(token: string, id: number, data: object): Promise<APIResponse> {
        return this.api.post(`${PROJECT_ENDPOINT}/${id}`, {
            headers: this.headers(token),
            data,
        });
    }

    async updateWithoutAuth(id: number, data: object): Promise<APIResponse> {
        return this.api.post(`${PROJECT_ENDPOINT}/${id}`, { data });
    }

    async delete(token: string, id: number): Promise<APIResponse> {
        return this.api.delete(`${PROJECT_ENDPOINT}/${id}`, {
            headers: this.headers(token),
        });
    }

    async deleteWithoutAuth(id: number): Promise<APIResponse> {
        return this.api.delete(`${PROJECT_ENDPOINT}/${id}`, {});
    }

    async get(token: string, id: number): Promise<APIResponse> {
        return this.api.get(`${PROJECT_ENDPOINT}/${id}`, {
            headers: this.headers(token),
        });
    }

    async getWithoutAuth(id: number): Promise<APIResponse> {
        return this.api.get(`${PROJECT_ENDPOINT}/${id}`, {});
    }

    private async json(res: APIResponse) {
        return res.json();
    }

    // ===== ASSERTIONS =====

    async expectCreated(
        res: APIResponse,
        payload: { title: string; description?: string; hex_color?: string }
    ): Promise<number> {
        expect(res.status()).toBe(HTTP_STATUS.CREATED);

        const body = await this.json(res);
        expect(body.id).toBeTruthy();
        expect(body.title).toBe(payload.title);
        if (payload.description !== undefined && 'description' in body && body.description !== undefined) {
            expect(body.description).toBe(payload.description);
        }
        if (payload.hex_color && 'hex_color' in body && body.hex_color) {
            expect(String(body.hex_color).toLowerCase()).toContain(String(payload.hex_color).toLowerCase());
        }

        return body.id as number;
    }

    async expectUpdated(res: APIResponse, expected: { id: number; title: string }) {
        expect(res.status()).toBe(HTTP_STATUS.OK);

        const body = await this.json(res);
        expect(body.id).toBe(expected.id);
        expect(body.title).toBe(expected.title);
    }

    async expectFetched(res: APIResponse, expected: { id: number; title: string }) {
        expect(res.status()).toBe(HTTP_STATUS.OK);

        const body = await this.json(res);
        expect(body.id).toBe(expected.id);
        expect(body.title).toBe(expected.title);
    }

    async expectDeleted(res: APIResponse) {
        expect(res.status()).toBe(HTTP_STATUS.OK);

        const body = await this.json(res);
        expect(body.message).toMatch(/successfully deleted/i);
    }

    async expectInvalidData(res: APIResponse) {
        expect([HTTP_STATUS.PRECONDITION_FAILED, HTTP_STATUS.TOO_MANY_REQUESTS])
            .toContain(res.status());

        if (res.status() === HTTP_STATUS.PRECONDITION_FAILED) {
            const body = await this.json(res);
            expect(body.code).toBe(PROJECT_ERROR_CODES.INVALID_DATA);
            expect(body.invalid_fields).toBeTruthy();
        }
    }

    async expectUnauthorized(res: APIResponse) {
        expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

        const body = await this.json(res);
        expect(
            body?.message,
            '401 responses should explain auth failure (invalid/missing token)'
        ).toMatch(/invalid token|unauthorized|not authenticated|missing.*token|credentials/i);
    }

    async expectNotFoundOrRateLimitForMissingResource(res: APIResponse) {
        expect([HTTP_STATUS.NOT_FOUND, HTTP_STATUS.TOO_MANY_REQUESTS]).toContain(res.status());

        if (res.status() === HTTP_STATUS.NOT_FOUND) {
            const body = await this.json(res);
            expect(body.message).toMatch(/does not exist/i);
        }
    }
}