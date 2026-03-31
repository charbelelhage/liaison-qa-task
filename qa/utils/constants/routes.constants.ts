/**
 * Frontend paths used in UI tests (paired with Playwright `baseURL` from `.env`).
 * Auth routes are fixed strings; project detail/edit use regexes because IDs change per run.
 */
export const LOGIN_ROUTE = '/login';
export const REGISTER_ROUTE = '/register';
export const PASSWORD_RESET_ROUTE = '/get-password-reset';
export const HOME_ROUTE = '/';
export const PROJECTS_ROUTE = '/projects';
/** Create project form */
export const PROJECT_NEW_ROUTE = '/projects/new';

/** Details: `/projects/{projectId}/{viewId}` */
export const PROJECTS_URL_REGEX = /\/projects\/\d+\/\d+/;

/** Edit screen (may be shown as overlay while URL updates) */
export const PROJECT_EDIT_URL_REGEX = /\/projects\/\d+\/settings\/edit/;