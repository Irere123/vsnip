<script lang="ts">
  import type { Profile, FeedResponse, State } from "../shared/types";
  import LoadingSpinner from "../ui/LoadingSpinner.svelte";
  import Backbar from "../ui/Backbar.svelte";
  import { query } from "../shared/query";
  import { mutation } from "../shared/mutation";
  import { onMount } from "svelte";

  let loadingState: "init" | "ready" | "more" = "init";
  let profiles: Profile[];
  export let onNewState: (s: State) => void;

  onMount(async () => {
    try {
      const payload: FeedResponse = await query("/feed");
      profiles = payload.profiles;

      console.log("profiles", profiles);
    } catch {}

    loadingState = "ready";
  });
</script>

<main>
  {#if loadingState === "init"}
    <LoadingSpinner />
  {:else}
    <div class="header">
      <h2>Explore</h2>
      <Backbar onBack={() => onNewState({ page: "view-profile" })} />
    </div>
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
          <button
            on:click={async () => {
              await mutation("/conversation", { userId: p.id });
              onNewState({ page: "conversation" });
            }}>message</button
          >
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

  .header {
    display: flex;
    justify-content: space-between;
  }

  .user_card {
    display: flex;
    gap: 10px;
  }
</style>
