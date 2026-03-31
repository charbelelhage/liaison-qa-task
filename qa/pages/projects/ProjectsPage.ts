import { Page, expect, Locator } from '@playwright/test';
import {
    PROJECT_EDIT_URL_REGEX,
    PROJECT_NEW_ROUTE,
    PROJECTS_ROUTE,
    PROJECTS_URL_REGEX,
} from '../../utils/constants/routes.constants';

/**
 * Page object for the Projects area: grid, create form, project details, and edit UI.
 *
 * Tip: the create form uses `input[name="projectTitle"]`; the edit screen uses `input#title`
 * (different pages). Description is a rich-text / contenteditable region — we fill it like a normal field.
 */
export class ProjectsPage {
    constructor(public readonly page: Page) { }

    // ——— Navigation ———

    /** Go straight to the projects grid (sidebar /projects link does the same in the live app). */
    async gotoList() {
        await this.page.goto(PROJECTS_ROUTE);
    }

    /** Clicks the main nav link that points at `/projects`. */
    async openListFromNav() {
        await this.navProjectsLink().click();
    }

    navProjectsLink = (): Locator => this.page.locator('a[href="/projects"]');

    // ——— List page ———

    projectsGrid = (): Locator => this.page.locator('ul.project-grid');

    projectGridItems = (): Locator => this.page.locator('li.project-grid-item');

    /** Narrows the grid to the card whose visible title matches (helps when many projects exist). */
    projectCardByTitle = (title: string): Locator =>
        this.projectGridItems().filter({ has: this.page.locator('.project-title', { hasText: title }) });

    /** Header action: opens `/projects/new`. */
    newProjectLink = (): Locator => this.page.locator('a[href="/projects/new"]');

    /** Card link — Vikunja sets an accessible name from the project title. */
    openProjectLink = (title: string): Locator => this.page.locator('.project-grid').locator(`a.project-button[aria-label="${title}"]`);

    favoriteButtonForProject = (title: string): Locator =>
        this.projectCardByTitle(title).locator('button.favorite');

    // ——— Create project page (/projects/new) ———

    createTitleInput = (): Locator => this.page.locator('input[name="projectTitle"]');

    /** Optional: parent project typeahead (not required for basic flows). */
    createParentSearchInput = (): Locator =>
        this.page.locator('.multiselect input[placeholder*="search" i]').first();

    createColorInput = (): Locator =>
        this.page.locator('.card-content input[type="color"]').first();

    createFooter = (): Locator => this.page.locator('footer.card-footer');

    createSubmitButton = (): Locator => this.page.getByRole('button', { name: 'Create' });

    createCancelButton = (): Locator => this.createFooter().getByRole('button', { name: /cancel/i });

    async gotoNewProject() {
        await this.page.goto(PROJECT_NEW_ROUTE);
    }

    async openNewProjectFromList() {
        await this.newProjectLink().click();
        await expect(this.page).toHaveURL(PROJECT_NEW_ROUTE);
    }

    async fillCreateTitle(title: string) {
        await this.createTitleInput().fill(title);
    }

    /** Native color input accepts hex like #ff0000. */
    async setCreateColor(hex: string) {
        await this.createColorInput().fill(hex);
    }

    async submitCreate() {
        await this.createSubmitButton().click();
    }

    /**
     * After a successful create, the app leaves `/projects/new` (often to `/projects/{id}/{view}`).
     * Use this so the next step does not race the redirect.
     */
    async waitForLeaveCreatePage() {
        await expect
            .poll(() => new URL(this.page.url()).pathname, {
                message: 'Create should redirect away from /projects/new after submit',
            })
            .not.toBe(PROJECT_NEW_ROUTE);
    }

    /** Convenience: open new form, type title, submit, wait until redirect finishes. */
    async createProjectQuick(title: string) {
        await this.gotoNewProject();
        await this.fillCreateTitle(title);
        await this.submitCreate();
        await this.waitForLeaveCreatePage();
    }

    // ——— Project details ———

    detailsHeadingTitle = (): Locator => this.page.locator('h1.project-title');

    /** “Three dots” menu on the project header (accessible name in Vikunja: open project settings). */
    settingsMenuButton = () =>
        this.page.locator('header, .project-header')
            .getByRole('button', { name: /open project settings/i });

    dropdownEditLink = (): Locator => this.page.getByRole('link', { name: 'Edit' });

    async openProjectDetailsFromList(title: string) {
        await this.openProjectLink(title).click();
        await expect(this.page).toHaveURL(PROJECTS_URL_REGEX);
    }

    /** Opens settings → Edit; waits until the edit URL and title field are ready. */
    async openEditFromDetails() {
        await this.settingsMenuButton().click();
        await this.dropdownEditLink().click();
        await expect(this.page).toHaveURL(PROJECT_EDIT_URL_REGEX);
        await expect(this.editTitleInput()).toBeVisible();
    }

    // ——— Edit project (settings / overlay) ———

    /** Edit screen title field — not the same selector as the create form. */
    editTitleInput = (): Locator => this.page.locator('input#title');

    editParentSearchInput = (): Locator =>
        this.page.locator('.multiselect input[placeholder*="search" i]').first();

    /** TipTap editor: contenteditable inside #projectdescription. */
    editDescriptionEditor = (): Locator =>
        this.page.locator('#projectdescription [contenteditable="true"]');

    editIdentifierInput = (): Locator =>
        this.page.locator('input[placeholder*="identifier" i]');

    editColorInput = (): Locator =>
        this.page.locator('.color-picker-container input[type="color"], input[type="color"]').last();

    editFooter = (): Locator => this.page.locator('footer.card-footer');

    saveEditButton = (): Locator => this.editFooter().getByRole('button', { name: 'Save' });

    cancelEditButton = (): Locator => this.editFooter().getByRole('button', { name: 'Cancel' });

    deleteProjectButton = (): Locator => this.editFooter().getByRole('button', { name: 'Delete' });

    resetColorButton = (): Locator => this.page.getByRole('button', { name: /reset color/i });

    async fillEditTitle(title: string) {
        await this.editTitleInput().fill(title);
    }

    async fillEditDescription(text: string) {
        const editor = this.editDescriptionEditor();
        await editor.click();
        await editor.fill(text);
    }

    async fillEditIdentifier(value: string) {
        await this.editIdentifierInput().fill(value);
    }

    async saveEdit() {
        await this.saveEditButton().click();
    }

    async cancelEdit() {
        await this.cancelEditButton().click();
    }

    confirmDeleteButton = () =>
        this.page.getByRole('button', { name: /do it/i });
    /**
     * Clicks Delete in the edit footer.
     * If the app shows a native `window.confirm`, it is accepted here; if it uses an in-app modal only, adjust this method.
     */
    async deleteProjectFromEditUi() {
        this.page.once('dialog', (d) => d.accept());
        await this.deleteProjectButton().click();
        await this.confirmDeleteButton().click();
    }

    // ——— Assertions ———

    async expectOnProjectsList() {
        await expect(this.page, 'Should be on projects list').toHaveURL(PROJECTS_ROUTE);
        await expect(this.projectsGrid(), 'Project grid should be visible').toBeVisible();
    }

    async expectOnCreatePage() {
        await expect(this.page, 'Should be on create project page').toHaveURL(PROJECT_NEW_ROUTE);
        await expect(this.createTitleInput(), 'Title field should be visible').toBeVisible();
    }

    async expectNewProjectLinkVisible() {
        await expect(this.newProjectLink(), '"New project" should be visible in header').toBeVisible();
    }

    async expectProjectVisibleOnList(title: string) {
        await expect(
            this.projectCardByTitle(title),
            `Project card for "${title}" should appear in the grid`
        ).toBeVisible();
    }

    async expectDetailsTitle(title: string) {
        await expect(
            this.detailsHeadingTitle(),
            `Details heading should show project title "${title}"`
        ).toHaveText(title);
    }

    async expectCreateButtonDisabled() {
        await expect(this.createSubmitButton(), 'Create should be disabled without required fields').toBeDisabled();
    }

    async expectCreateButtonEnabled() {
        await expect(this.createSubmitButton(), 'Create should be enabled when form is valid').toBeEnabled();
    }
}
