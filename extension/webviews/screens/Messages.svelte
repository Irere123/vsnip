<script lang="ts">
  import { onMount } from "svelte";
  import { query } from "../shared/query";
  import type {
    ConversationState,
    MessagesResponse,
    Message,
  } from "../shared/types";
  import LoadingSpinner from "../ui/LoadingSpinner.svelte";

  export let user: NonNullable<ConversationState["user"]>;
  export let myId: string;
  export let onMessage: (m: Message) => void;
  export let onUnmatch: (x: string) => void;
  let loadingMessageSent = false;
  let loading = true;
  let isLoadingMore = false;
  let unfriended = false;
  let hasMore = false;
  let messages: Message[] = [];
  let text = "";
  let messageGroups: Message[][] = [];

  async function fetchMessages() {
    const payload: MessagesResponse = await query(
      `/messages/${user.id}/${
        messages.length ? messages[messages.length - 1].createdAt : ""
      }`
    );
    messages = [
      ...messages,
      ...payload.messages.sort((a, b) => {
        if (a.createdAt > b.createdAt) {
          return -1;
        }
        if (a.createdAt < b.createdAt) {
          return 1;
        }
        return 0;
      }),
    ];
    hasMore = payload.hasMore;
  }

  onMount(async () => {
    await fetchMessages();

    loading = false;
  });
</script>

{#if unfriended}
  <div class="panel">
    <div class="msg-container">
      <div>They unmatched you</div>
    </div>
  </div>
{:else if loading}
  <LoadingSpinner />
{:else}
  <h2
    on:click={() => {
      vscode.postMessage({ type: "view-code-card", value: user });
    }}
    class="display-name"
  >
    {user.username}
  </h2>
  <div>
    <p>Hello world</p>
  </div>
{/if}
