import { APIRequestContext, test } from '@playwright/test';
import { createApiContext } from '../../../api/users/apiClient';
import { ProjectApi } from '../../../api/projects/project.api';
import { user_data } from '../../../utils/test.data';
import { project_data } from '../../../utils/project.data';
import { User } from '../../../utils/types';
import { INVALID_PROJECT_API_TOKEN } from '../../../utils/constants/projects.api.test.constants';
import { ensureUserExists, getAuthToken } from '../helpers/user.helper';

let user: User;
let api: APIRequestContext;
let projectApi: ProjectApi;
let token: string;

test.beforeAll(async () => {
    user = user_data.valid.generateUser();
    await ensureUserExists(user);
});

test.beforeEach(async () => {
    api = await createApiContext();
    projectApi = new ProjectApi(api);
    token = await getAuthToken(api, user);
});

test.afterEach(async () => {
    await api.dispose();
});

test.describe('Projects API - Create & read', () => {
    test('User can create project', { tag: ['@P0'] }, async () => {
        const project = project_data.valid.generateProject();
        const response = await projectApi.create(token, project);
        await projectApi.expectCreated(response, project);
    });

    test('User can get project by id', { tag: ['@P0'] }, async () => {
        const project = project_data.valid.generateProject();
        const createRes = await projectApi.create(token, project);
        const id = await projectApi.expectCreated(createRes, project);

        const getRes = await projectApi.get(token, id);
        await projectApi.expectFetched(getRes, { id, title: project.title });
    });

    test('Getting non-existing project returns 404', { tag: ['@P1'] }, async () => {
        const response = await projectApi.get(token, 999999);
        await projectApi.expectNotFoundOrRateLimitForMissingResource(response);
    });
});

test.describe('Projects API - Update & delete', () => {
    test('User can update project', { tag: ['@P0'] }, async () => {
        const project = project_data.valid.generateProject();
        const createRes = await projectApi.create(token, project);
        const id = await projectApi.expectCreated(createRes, project);

        const updatedTitle = `${project.title}_updated`;
        const updatePayload = {
            ...project,
            title: updatedTitle,
            identifier: 'identifier_test',
            parent_project_id: 0,
            hex_color: '',
        };

        const updateRes = await projectApi.update(token, id, updatePayload);
        await projectApi.expectUpdated(updateRes, { id, title: updatedTitle });

        const getRes = await projectApi.get(token, id);
        await projectApi.expectFetched(getRes, { id, title: updatedTitle });
    });

    test('User can delete project', { tag: ['@P0'] }, async () => {
        const project = project_data.valid.generateProject();
        const createRes = await projectApi.create(token, project);
        const id = await projectApi.expectCreated(createRes, project);

        const deleteRes = await projectApi.delete(token, id);
        await projectApi.expectDeleted(deleteRes);

        const getRes = await projectApi.get(token, id);
        await projectApi.expectNotFoundOrRateLimitForMissingResource(getRes);
    });

    test('Deleting non-existing project returns 404', { tag: ['@P1'] }, async () => {
        const response = await projectApi.delete(token, 999999);
        await projectApi.expectNotFoundOrRateLimitForMissingResource(response);
    });

    test('User cannot update non-existing project', { tag: ['@P1'] }, async () => {
        const project = project_data.valid.generateProject();
        const response = await projectApi.update(token, 999999, project);
        await projectApi.expectNotFoundOrRateLimitForMissingResource(response);
    });
});

test.describe('Projects API - Validation', () => {
    test('User cannot create project with empty title', { tag: ['@P1'] }, async () => {
        const project = project_data.invalid.emptyTitle();
        const response = await projectApi.create(token, project);
        await projectApi.expectInvalidData(response);
    });

    test('User cannot update project with invalid payload', { tag: ['@P1'] }, async () => {
        const project = project_data.valid.generateProject();
        const createRes = await projectApi.create(token, project);
        const id = await projectApi.expectCreated(createRes, project);

        const response = await projectApi.update(token, id, { title: '' });
        await projectApi.expectInvalidData(response);
    });
});

test.describe('Projects API - Authentication', () => {
    test('User cannot create project without Authorization header', { tag: ['@P1'] }, async () => {
        const response = await projectApi.createWithoutAuth(project_data.valid.generateProject());
        await projectApi.expectUnauthorized(response);
    });

    test('User cannot create project with invalid token', { tag: ['@P1'] }, async () => {
        const response = await projectApi.create(INVALID_PROJECT_API_TOKEN, project_data.valid.generateProject());
        await projectApi.expectUnauthorized(response);
    });

    test('User cannot get project without Authorization header', { tag: ['@P1'] }, async () => {
        const project = project_data.valid.generateProject();
        const createRes = await projectApi.create(token, project);
        const id = await projectApi.expectCreated(createRes, project);

        const response = await projectApi.getWithoutAuth(id);
        await projectApi.expectUnauthorized(response);
    });

    test('User cannot update project without Authorization header', { tag: ['@P1'] }, async () => {
        const project = project_data.valid.generateProject();
        const createRes = await projectApi.create(token, project);
        const id = await projectApi.expectCreated(createRes, project);

        const response = await projectApi.updateWithoutAuth(id, { ...project, title: `${project.title}_x` });
        await projectApi.expectUnauthorized(response);
    });

    test('User cannot delete project without Authorization header', { tag: ['@P1'] }, async () => {
        const project = project_data.valid.generateProject();
        const createRes = await projectApi.create(token, project);
        const id = await projectApi.expectCreated(createRes, project);

        const response = await projectApi.deleteWithoutAuth(id);
        await projectApi.expectUnauthorized(response);
    });
});
