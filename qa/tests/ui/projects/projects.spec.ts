/**
 * UI tests for Projects (list, create, details, edit, delete).
 *
 * Setup: one shared user is registered once; each test logs in fresh so you always
 * start from a known authenticated state (same idea as login/register UI specs).
 *
 * Project titles come from `project_data.valid.generateProject()` so UI and API tests
 * share the same shape and naming convention (`project_` + timestamp).
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/auth/LoginPage';
import { ProjectsPage } from '../../../pages/projects/ProjectsPage';
import { user_data } from '../../../utils/test.data';
import { project_data } from '../../../utils/project.data';
import { User } from '../../../utils/types';
import { ensureUserExists } from '../../api/helpers/user.helper';
import { PROJECT_NEW_ROUTE, PROJECTS_ROUTE } from '../../../utils/constants/routes.constants';

let user: User;
let loginPage: LoginPage;
let projectsPage: ProjectsPage;

// Register the user via API once (fast + reliable); duplicates are ignored by ensureUserExists.
test.beforeAll(async () => {
    user = user_data.valid.generateUser();
    await ensureUserExists(user);
});

// Every test gets a clean browser context but the same credentials: open login, sign in, land on home.
test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    projectsPage = new ProjectsPage(page);
    await loginPage.goto();
    await loginPage.login(user.username, user.password);
    await loginPage.expectSuccessfulLogin(user.username);
});

test.describe('Projects - List & navigation', () => {
    test('User can open Projects from navigation and see the grid', { tag: ['@P0'] }, async () => {
        await projectsPage.openListFromNav();
        await projectsPage.expectOnProjectsList();
        await projectsPage.expectNewProjectLinkVisible();
    });

    test('"New project" navigates to create page', { tag: ['@P0'] }, async () => {
        await projectsPage.gotoList();
        await projectsPage.openNewProjectFromList();
        await projectsPage.expectOnCreatePage();
    });
});

test.describe('Projects - Create', () => {
    test('Create is disabled until title is filled, then user can create a project', { tag: ['@P0'] }, async () => {
        await projectsPage.gotoNewProject();
        await projectsPage.expectCreateButtonDisabled();

        const { title } = project_data.valid.generateProject();
        await projectsPage.fillCreateTitle(title);
        await projectsPage.expectCreateButtonEnabled();

        await projectsPage.submitCreate();
        await expect
            .poll(
                async () => {
                    const url = projectsPage.page.url();
                    return url.includes(PROJECTS_ROUTE) && !url.endsWith(PROJECT_NEW_ROUTE);
                },
                { message: 'Should leave /projects/new after successful create' }
            )
            .toBeTruthy();

        await projectsPage.gotoList();
        await projectsPage.expectProjectVisibleOnList(title);
    });

    test('Cancel on create returns to projects list', { tag: ['@P1'] }, async () => {
        await projectsPage.openListFromNav();
        await projectsPage.gotoNewProject();
        await projectsPage.createCancelButton().click();
        await projectsPage.expectOnProjectsList();
    });
});

test.describe('Projects - View details', () => {
    test('User can open a project from the grid and see the title', { tag: ['@P0'] }, async () => {
        const { title } = project_data.valid.generateProject();
        await projectsPage.createProjectQuick(title);
        await projectsPage.gotoList();
        await projectsPage.openProjectDetailsFromList(title);
        await projectsPage.expectDetailsTitle(title);
    });
});

test.describe('Projects - Edit', () => {
    test('User can edit project title and see it on details', { tag: ['@P0'] }, async () => {
        const { title } = project_data.valid.generateProject();
        const updated = `${title}_updated`;

        await projectsPage.createProjectQuick(title);
        await projectsPage.gotoList();
        await projectsPage.openProjectDetailsFromList(title);

        await projectsPage.openEditFromDetails();
        await projectsPage.fillEditTitle(updated);
        await projectsPage.fillEditDescription('Updated via UI automation');
        await projectsPage.saveEdit();

        await projectsPage.expectDetailsTitle(updated);
    });

    test('User can cancel edit without saving title change', { tag: ['@P1'] }, async () => {
        const { title } = project_data.valid.generateProject();
        await projectsPage.createProjectQuick(title);
        await projectsPage.gotoList();
        await projectsPage.openProjectDetailsFromList(title);

        await projectsPage.openEditFromDetails();
        await projectsPage.fillEditTitle(`${title}_should_not_save`);
        await projectsPage.cancelEdit();

        await projectsPage.expectDetailsTitle(title);
    });
});

test.describe('Projects - Delete', () => {
    test('User can delete project from edit UI and return to list', { tag: ['@P0'] }, async () => {
        const { title } = project_data.valid.generateProject();
        await projectsPage.createProjectQuick(title);
        await projectsPage.gotoList();
        await projectsPage.expectProjectVisibleOnList(title);

        await projectsPage.openProjectDetailsFromList(title);
        await projectsPage.openEditFromDetails();
        await projectsPage.deleteProjectFromEditUi();

        await projectsPage.gotoList();
        await expect(
            projectsPage.projectCardByTitle(title),
            'Deleted project should not appear on the list'
        ).toHaveCount(0);
    });
});
