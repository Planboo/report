import { login as directusLogin, logout as directusLogout } from "./directus";

export async function signInWithPassword(email: string, password: string) {
  await directusLogin(email, password);
}

export async function signOut() {
  await directusLogout();
}
