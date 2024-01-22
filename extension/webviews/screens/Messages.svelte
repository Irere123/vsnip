<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { query } from "../shared/query";
  import type {
    ConversationState,
    MessagesResponse,
    Message,
    WebsocketMessages,
  } from "../shared/types";
  import LoadingSpinner from "../ui/LoadingSpinner.svelte";
  import { getSocket } from "../shared/io";
  import { mutation } from "../shared/mutation";

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

  $: {
    let newMessagesGroups: Message[][] = [];

    messages.forEach((m) => {
      if (!newMessagesGroups[0]) {
        newMessagesGroups.push([m]);
        return;
      }

      const lastGroup = newMessagesGroups[newMessagesGroups.length - 1];
      const lastMessage = lastGroup[lastGroup.length - 1];

      if (
        lastMessage.createdAt - m.createdAt > 120000 ||
        m.senderId !== lastMessage.senderId
      ) {
        newMessagesGroups.push([m]);
        return;
      }

      newMessagesGroups[newMessagesGroups.length - 1].push(m);
    });

    messageGroups = newMessagesGroups;
  }

  function onWebsocketEvent(e: MessageEvent) {
    const paylaod: WebsocketMessages = JSON.parse(e.data);

    if (paylaod.type == "new-message" && paylaod.message.senderId == user.id) {
      messages = [paylaod.message, ...messages];
    }
  }

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
    try {
      const socket = getSocket();
      socket.addEventListener("message", onWebsocketEvent);
    } catch (err) {
      console.log(err);
    }
    try {
      await fetchMessages();
    } catch {}
    loading = false;
  });

  onDestroy(() => {
    const socket = getSocket();
    socket.send(JSON.stringify({ type: "message-open", userId: null }));
    socket.removeEventListener("message", onWebsocketEvent);
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
    {#each messageGroups as mg, i}
      <div>
        {#each mg as msg}
          <p>{msg.text}</p>
        {/each}
      </div>
    {/each}
    {#if hasMore}
      <div
        style="margin-bottom: 10px; display: flex; align-items: center; justify-content: center;"
      >
        <button
          disabled={isLoadingMore}
          on:click={async () => {
            isLoadingMore = true;
            try {
              await fetchMessages();
            } catch {}
            isLoadingMore = false;
          }}
        >
          Load more
        </button>
      </div>
      <form
        on:submit|preventDefault={async () => {
          if (!text) {
            return;
          }
          loadingMessageSent = true;
          try {
            const { message } = await mutation(`/message`, {
              recipientId: user.id,
              text,
              conversationId: user.conversationId,
            });
            messages = [message, ...messages];
            onMessage(message);
          } catch {}
          loadingMessageSent = false;
          text = "";
        }}
      >
        <input placeholder="Type a message" bind:value={text} />
      </form>
    {/if}
  </div>
{/if}
