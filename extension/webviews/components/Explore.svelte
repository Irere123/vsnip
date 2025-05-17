<script lang="ts">
import type { Profile, FeedResponse } from '../shared/types';
import { query } from '../shared/query';
import { onMount } from 'svelte';

let loadingState: 'init' | 'ready' | 'more' = 'init';
let profiles: Profile[];

onMount(async () => {
  try {
    const payload: FeedResponse = await query('/feed');
    profiles = payload.profiles;
  } catch {}

  loadingState = 'ready';
});
</script>

<main>
  {#if loadingState === "init"}
    <LoadingSpinner />
  {:else}
    {#each profiles as p}
      <p>{p.username}</p>
      <img src={p.avatar} alt="" />
      <button>message</button>
    {/each}
  {/if}
</main>

<style>
  main {
    margin: 10px;
  }
</style>
