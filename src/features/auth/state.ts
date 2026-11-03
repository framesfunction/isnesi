export type SignInState = {
  status: "idle" | "error";
  message?: string;
};

export const initialSignInState: SignInState = { status: "idle" };