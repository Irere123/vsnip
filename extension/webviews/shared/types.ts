export type Page = "login" | "profile-form";

export type ProfileFormData = {
  username: string;
  email: string;
  avatar: string;
};

export type State =
  | { page: "view-profile" }
  | { page: "login" }
  | { page: "loading" }
  | { page: "profile-form"; data: ProfileFormData };

export type NavigateFn = (ns: State) => void;

export type User = {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
};
