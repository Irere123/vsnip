<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import { query } from '../shared/query';
import type {
  ConversationState,
  MessagesResponse,
  Message,
  WebsocketMessages,
} from '../shared/types';
import { getSocket } from '../shared/io';

export let user: NonNullable<ConversationState['user']>;
export let myId: string;
export let onMessage: (m: Message) => void;
export let onUnmatch: (x: string) => void;
const loadingMessageSent = false;
let loading = true;
const isLoadingMore = false;
const unfriended = false;
let hasMore = false;
let messages: Message[] = [];
const text = '';
let messageGroups: Message[][] = [];

$: {
  const newMessagesGroups: Message[][] = [];

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
  const payload: WebsocketMessages = JSON.parse(e.data);

  if (payload.type === 'new-message' && payload.message.senderId === user.id) {
    messages = [payload.message, ...messages];
  }
}

async function fetchMessages() {
  const payload: MessagesResponse = await query(
    `/messages/${user.id}/${
      messages.length ? messages[messages.length - 1].createdAt : ''
    }`,
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
    socket.addEventListener('message', onWebsocketEvent);
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
  socket.send(JSON.stringify({ type: 'message-open', userId: null }));
  socket.removeEventListener('message', onWebsocketEvent);
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
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore missing-declaration -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <h2
    on:click={() => {
      vscode.postMessage({ type: "view-code-card", value: user });
    }}
    class="display_name"
  >
    {user.username}
  </h2>
  <div class="panel">
    <div class="msg_container">
      {#each messageGroups as mg, i}
        <MessageGroups
          {i}
          {mg}
          {myId}
          photoUrl={user.avatar}
          userInfo={{
            avatar: user.avatar,
            id: user.id,
            username: user.username,
          }}
        />
      {/each}
    </div>
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
    {/if}

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
  </div>
{/if}

<style>
  .panel {
    height: 100%;
    display: flex;
    overflow-y: auto;
    flex-direction: column;
  }

  .msg_container {
    padding: 0px var(--container-paddding);
    display: flex;
    flex-direction: column-reverse;
    flex: 1;
    min-height: 0px;
    overflow-y: auto;
  }
</style>
