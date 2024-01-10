export type Page = "login" | "profile-form";

export type State =
  | { page: "view-profile" }
  | { page: "login" }
  | { page: "loading" };

export type NavigateFn = (ns: State) => void;

export type User = {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
};
