export function generateRandomChars(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';

  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }

  return result;
}

export const user_data = {
  valid: {
    generateUser: () => {

      return {
        username: `user_${Date.now()}`,
        email: `user_${Date.now()}@test.com`,
        password: 'Test1234',
      };
    },

    minLengthUsernameAndPassword: () => ({
      username: generateRandomChars(3),
      email: `user_${Date.now()}@test.com`,
      password: generateRandomChars(8),
    }),

    maxLengthUsernameAndPassword: () => ({
      username: generateRandomChars(250),
      email: `user_${Date.now()}@test.com`,
      password: generateRandomChars(60),
    }),
    usernameWithLeadingSpaces: () => ({
      username: `  user_${Date.now()}`,
      email: `user_${Date.now()}@test.com`,
      password: 'Test1234',
    }),
    emailWithLeadingSpaces: () => ({
      username: `user_${Date.now()}`,
      email: `  user_${Date.now()}@test.com`,
      password: 'Test1234',
    }),
  },

  invalid: {
    emptyStringsData: () => ({
      username: "",
      email: "",
      password: "",
    }),

    whitespaceOnlyValues: () => ({
      username: "       ",
      email: "       ",
      password: "         ",
    }),
    nullValues: () => ({
      username: null,
      email: null,
      password: null,
    }),
    wrongDataTypes: () => ({
      username: 123,
      email: true,
      password: [],
    }),

    longData: () => ({
      username: 'a'.repeat(251),
      email: '@'.repeat(242) + `@test.com`,
      password: '@'.repeat(251),
    }),

    shortUsernameAndPassword: () => ({
      username: 'te',
      email: `user_${Date.now()}@test.com`,
      password: '@!',
    }),

    emailFormat: () => ({
      username: `user_${Date.now()}`,
      email: `user_${Date.now()}`,
      password: 'test1234',
    }),

    usernameAndPasswordSpecialCharacters: () => ({
      username: '!@#$%^&*()_+=[]{}|;:,.<>?',
      email: `user_${Date.now()}@test.com`,
      password: '!@#$%^&*()_+=[]{}|;:,.<>?',
    }),
  },

  security: {
    maliciousXSSPayload: () => {
      const timestamp = Date.now();

      return {
        username: `<script>alert(${timestamp})</script>`,
        email: `xss_${timestamp}@test.com`,
        password: 'test1234',
      };
    },
  },
};