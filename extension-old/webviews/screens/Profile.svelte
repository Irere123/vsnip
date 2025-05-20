<script lang="ts">
  import type { User } from "../shared/types";
  import LoadingSpinner from "../components/LoadingSpinner.svelte";

  export let currentUser: User | null;
  export let currentUserIsLoading: boolean;
  export let onEditProfile: () => void;
  export let onViewMessages: () => void;
  export let onLogout: () => void;
  export let onExplore: () => void;
</script>

{#if currentUserIsLoading}
  <LoadingSpinner />
{:else if currentUser}
  <div class="profile-container">
    <div class="top-container">
      <ExploreIcon on:click={onExplore} />
    </div>

    <div class="main-container">
      <img
        src={currentUser?.avatar}
        alt={currentUser?.username}
        width="150"
        height="150"
      />
      <div class="username">{currentUser?.username}</div>
      <div class="buttons">
        <button on:click={onEditProfile}>Edit profile</button>
        <button on:click={onViewMessages}>Messages</button>
        <button on:click={onLogout}>Logout</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .profile-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10px;
  }

  .main-container {
    display: flex;
    justify-content: center;
    flex-direction: column;
  }

  .top-container {
    width: 100%;
    display: flex;
    margin-bottom: 20px;
    justify-content: space-between;
  }

  img {
    border-radius: 100%;
    border: 2px solid green;
  }

  .buttons {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .username {
    display: flex;
    justify-content: center;
    text-align: center;
    font-size: 20px;
    font-weight: 500;
  }
</style>
