<script lang="ts">
  import { onMount } from "svelte";
  import { query } from "../shared/query";
  import type { State, User } from "../shared/types";
  import Profile from "../screens/Profile.svelte";
  import LoadingSpinner from "../ui/LoadingSpinner.svelte";
  import EditProfile from "../screens/EditProfile.svelte";
  import Explore from "../screens/Explore.svelte";
  import Messages from "../screens/Messages.svelte";
  import Conversation from "../screens/Conversation.svelte";

  let gotTokens = false;
  let currentUserIsLoading: boolean = true;
  let currentUser: User | null = null;
  let lastState = vscode.getState();

  let state: State = { page: "loading" };

  async function fetchUser() {
    if (!accessToken || !refreshToken) {
      return;
    }
    try {
      const r = await query("/me");
      currentUser = r.user;
      return r.user;
    } catch {}
  }

  function redirectUser(u?: User | null) {
    if (u) {
      state = { page: "view-profile" };
    } else {
      state = { page: "login" };
    }
  }

  function userToInitialFormData(u: User) {
    return {
      username: u.username,
      avatar: u.avatar,
      email: u.email,
    };
  }

  function goToEditForm() {
    if (currentUser) {
      state = {
        page: "profile-form",
        data: userToInitialFormData(currentUser),
      };
    }
  }

  onMount(async () => {
    vscode.postMessage({ type: "send-tokens" });
  });

  $: {
    vscode.setState(state);
  }

  window.addEventListener("message", async (event) => {
    const message = event.data;

    switch (message.command) {
      case "init-tokens":
        accessToken = message.payload.accessToken;
        refreshToken = message.payload.refreshToken;
        gotTokens = true;
        try {
          const u = await fetchUser();
          if (state.page === "loading") {
            redirectUser(u);
          } else if (!u) {
            state = { page: "login" };
          }
        } catch {}
        currentUserIsLoading = false;
        break;
      case "login-complete":
        accessToken = message.payload.accessToken;
        refreshToken = message.payload.refreshToken;
        fetchUser().then((u) => {
          redirectUser(u);
        });
        break;
    }
  });
</script>

{#if state.page === "loading"}
  <LoadingSpinner />
{:else if state.page === "login"}
  <div style="margin-bottom: 40px;">
    By tapping login with Google, you agree to our terms and privacy
  </div>
  <button
    on:click={() => {
      vscode.postMessage({ type: "login" });
    }}>Login with Google to get started</button
  >
{:else if state.page === "view-profile"}
  <Profile
    {currentUser}
    {currentUserIsLoading}
    onEditProfile={() => {
      goToEditForm();
    }}
    onExplore={() => {
      state = { page: "explore" };
    }}
    onLogout={() => {
      state = { page: "login" };
      currentUser = null;
    }}
    onViewMessages={() => {
      state = { page: "conversation" };
    }}
  />
{:else if state.page === "profile-form"}
  <EditProfile
    onNewState={(s) => {
      state = s;
    }}
    bind:data={state.data}
    onUpdate={() => {}}
  />
{:else if state.page === "explore"}
  <Explore
    onNewState={(s) => {
      state = s;
    }}
  />
{:else if state.page === "conversation"}
  <Conversation
    bind:currentUser
    {currentUserIsLoading}
    bind:state
    onNewState={(s) => {
      state = s;
    }}
  />
{/if}

<style>
  p {
    color: yellow;
  }
</style>
