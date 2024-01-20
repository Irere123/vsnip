<script lang="ts">
  import type { Conversation } from "../shared/types";

  export let conversation: Conversation;
</script>

<div class="conversation_card" on:click>
  <img src={conversation.avatar} alt="" width="30" height="30" />
  <div>
    <p class="username">{conversation.username}</p>
    <p>{conversation.message ?? `say hi to ${conversation.username}`}</p>
  </div>
</div>

<style>
  .conversation_card {
    display: flex;
    gap: 20px;
  }

  .username {
    font-weight: bold;
  }
</style>
