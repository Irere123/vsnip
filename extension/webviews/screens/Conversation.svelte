<script lang="ts">
  import { query } from "../shared/query";
  import type {
    Conversation,
    ConversationState,
    ConversationsResponse,
    Message,
    State,
    User,
    WebsocketMessages,
  } from "../shared/types";
  import Backbar from "../ui/Backbar.svelte";
  import Button from "../ui/Button.svelte";
  import LoadingSpinner from "../ui/LoadingSpinner.svelte";
  import Messages from "./Messages.svelte";
  import DoOnMount from "../components/DoOnMount.svelte";
  import { onDestroy, onMount } from "svelte";
  import ConversationCard from "../ui/ConversationCard.svelte";
  import { getSocket } from "../shared/io";

  export let currentUserIsLoading: boolean;
  export let currentUser: User | null;
  export let state: ConversationState;
  export let onNewState: (s: State) => void;
  let cursor = 0;
  let loading = true;
  let conversations: Conversation[] = [];

  $: isInConversations = conversations.some(
    (c) => state.user && c.userId === state.user.id
  );

  function compareConversations(a: Conversation, b: Conversation) {
    const v1 = a.message?.createdAt || a.createdAt;
    const v2 = b.message?.createdAt || b.createdAt;
    if (v1 > v2) {
      return -1;
    }
    if (v1 < v2) {
      return 1;
    }
    return 0;
  }

  function onMessage(newMessage: Message) {
    conversations = conversations
      .map<any>((c) =>
        c.userId == newMessage.senderId || c.userId == newMessage.recipientId
          ? {
              ...c,
              message: {
                text: newMessage.text,
                createdAt: newMessage.createdAt,
              },
            }
          : c
      )
      .sort(compareConversations);
  }

  async function fetchMatches() {
    loading = true;
    try {
      const r: ConversationsResponse = await query("/conversations/" + cursor);
      conversations = r.conversations.sort(compareConversations);
    } catch {}

    loading = false;
  }

  function onWebSocketEvent(e: MessageEvent) {
    const payload: WebsocketMessages = e.data;

    if (payload.type === "new-message") {
      onMessage(payload.message);
    }
  }

  onMount(async () => {
    await fetchMatches();
    getSocket().addEventListener("message", onWebSocketEvent);
  });

  onDestroy(() => {
    getSocket().removeEventListener("message", onWebSocketEvent);
  });
</script>

<main>
  <Backbar
    onBack={() => {
      if (state.page === "conversation" && state.user) {
        onNewState({ page: "conversation" });
      } else {
        onNewState({ page: "view-profile" });
      }
    }}
  >
    {#if state.user && isInConversations}
      <div style="display: flex;">
        <div style="margin-right: 10px;">
          <Button
            on:click={() => {
              if (state.user) {
                vscode.postMessage({
                  type: "report",
                  value: { userId: state.user.id, unmatchOrReject: "unmatch" },
                });
              }
            }}>Remove</Button
          >
        </div>
      </div>
    {/if}
  </Backbar>
</main>

{#if state.user && currentUser && isInConversations}
  <Messages
    onUnmatch={() => {}}
    {onMessage}
    myId={currentUser.id}
    user={state.user}
  />
{:else if loading || currentUserIsLoading}
  <LoadingSpinner />
{:else if state.user && !currentUser}
  <DoOnMount
    fn={() => {
      onNewState({ page: "login" });
    }}
  />
{:else}
  <div class="container">
    {#if conversations.length === 0}
      <div>No conversations</div>
    {/if}
    {#each conversations as conv, i}
      <ConversationCard
        conversation={conv}
        on:click={() => {
          state.user = {
            id: conv.userId,
            avatar: conv.avatar,
            username: conv.username,
            conversationId: conv.conversationId,
          };
        }}
      />
    {/each}
  </div>
{/if}

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>
