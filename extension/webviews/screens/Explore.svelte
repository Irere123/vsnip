<script lang="ts">
  import type { Profile, FeedResponse } from "../shared/types";
  import LoadingSpinner from "../ui/LoadingSpinner.svelte";
  import { query } from "../shared/query";
  import { onMount } from "svelte";

  let loadingState: "init" | "ready" | "more" = "init";
  let profiles: Profile[];

  onMount(async () => {
    try {
      const payload: FeedResponse = await query("/feed");
      profiles = payload.profiles;
    } catch {}

    loadingState = "ready";
  });
</script>

<main>
  {#if loadingState === "init"}
    <LoadingSpinner />
  {:else}
    <h2>Explore</h2>
    {#each profiles as p}
      <div class="user_card">
        <img
          src={p.avatar}
          alt={`${p.username}'s profile'`}
          width="50"
          height="50"
        />
        <div>
          <p>{p.username}</p>
          <button>message</button>
        </div>
      </div>
    {/each}
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: 10px;
  }

  .user_card {
    display: flex;
    gap: 10px;
  }
</style>
