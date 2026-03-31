import { PROJECT_DEFAULTS } from './constants/projects.api.test.constants';

export const project_data = {
    valid: {
        generateProject: () => ({
            title: `${PROJECT_DEFAULTS.TITLE_PREFIX}${Date.now()}`,
            description: PROJECT_DEFAULTS.DESCRIPTION,
            hex_color: PROJECT_DEFAULTS.HEX_COLOR,
        }),
    },

    invalid: {
        emptyTitle: () => ({
            title: '',
            description: PROJECT_DEFAULTS.DESCRIPTION,
            hex_color: PROJECT_DEFAULTS.HEX_COLOR,
        }),
    },
};