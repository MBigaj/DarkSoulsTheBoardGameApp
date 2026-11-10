import { createArchiveMemory } from './filters';

/** Session storage, when the browser allows it; reading `sessionStorage` itself can throw. */
function sessionStore(): Pick<Storage, 'getItem' | 'setItem'> | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

/** Each type tab's filters for this session, so switching tabs restores them. */
export const archiveMemory = createArchiveMemory(sessionStore());
