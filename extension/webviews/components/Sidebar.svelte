<script lang="ts">
  import { onMount } from "svelte";
  import { query } from "../shared/query";
  import type { State, User } from "../shared/types";
  import ViewProfile from "../screens/ViewProfile.svelte";

  let gotTokens = false;
  let currentUserIsLoading: boolean = true;
  let currentUser: User | null = null;
  let lastState = tsvscode.getState();

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

  onMount(async () => {
    tsvscode.postMessage({ type: "send-tokens" });
  });

  $: {
    tsvscode.setState(state);
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

<main>
  {#if state.page === "loading"}
    <p>loading...</p>
  {:else if state.page === "login"}
    <div style="margin-bottom: 40px;">
      By tapping login with Google, you agree to our terms and privacy
    </div>
    <button
      on:click={() => {
        tsvscode.postMessage({ type: "login" });
      }}>Login with Google to get started</button
    >
  {:else if state.page === "view-profile"}
    <ViewProfile {currentUser} />
  {/if}
</main>

<style>
  p {
    color: yellow;
  }
</style>
