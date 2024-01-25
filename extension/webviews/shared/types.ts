export type Page = "login" | "profile-form";

export type ProfileFormData = {
  username: string;
  email: string;
  avatar: string;
};

export type ConversationState = {
  page: "conversation";
  user?: {
    id: string;
    avatar: string;
    username: string;
    conversationId: string;
  };
};

export type State =
  | { page: "view-profile" }
  | { page: "login" }
  | { page: "loading" }
  | { page: "profile-form"; data: ProfileFormData }
  | { page: "explore" }
  | { page: "messages" }
  | ConversationState;

export type NavigateFn = (ns: State) => void;

export type User = {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
};

export interface Profile {
  id: string;
  username: string;
  email: number;
  bio: string;
  avatar: string;
}

export interface Message {
  id: string;
  senderId: string;
  recepientId: string;
  text: string;
  createdAt: number;
}

export interface MessagesResponse {
  hasMore: boolean;
  messages: Message[];
}

export type WebsocketMessages =
  | { type: "new-message"; message: Message }
  | { type: "unfriend"; userId: string };

export interface Conversation {
  conversationId: string;
  username: string;
  avatar: string;
  userId: string;
  read: boolean;
  message: {
    text: string;
    createdAt: string;
  } | null;
  createdAt: string;
}

export type ConversationsResponse = {
  conversations: Conversation[];
};

export type FeedResponse = {
  profiles: Profile[];
};
