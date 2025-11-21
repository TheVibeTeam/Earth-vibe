const REGEX_EMAIL = /^\S+@\S+\.\S+$/
const REGEX_USERNAME = /^[a-zA-Z0-9_]{3,20}$/

export function login({ username, email, password }: any): string | null {
    if (!username) return 'USERNAME_REQUIRED';
    if (!email) return 'EMAIL_REQUIRED';
    if (!password) return 'PASSWORD_MISSING';
    if (email && !REGEX_EMAIL.test(email)) return 'EMAIL_INVALID';
    if (username && !REGEX_USERNAME.test(username)) return 'USERNAME_INVALID';
    if (password.length < 6) return 'PASSWORD_WEAK';
    return null;
}
export function register({ email, username, realName, password }: any): string | null {
    if (!email) return 'EMAIL_MISSING';
    if (!username) return 'USERNAME_MISSING';
    if (!realName) return 'REALNAME_MISSING';
    if (!password) return 'PASSWORD_MISSING';
    if (!REGEX_EMAIL.test(email)) return 'EMAIL_INVALID';
    if (!REGEX_USERNAME.test(username)) return 'USERNAME_INVALID';
    if (realName.length < 2) return 'REALNAME_INVALID';
    if (password.length < 6) return 'PASSWORD_WEAK';
    return null;
}
