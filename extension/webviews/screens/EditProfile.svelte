<script lang="ts">
  import { onMount } from "svelte";
  import type { ProfileFormData, State } from "../shared/types";
  import Backbar from "../ui/Backbar.svelte";
  import { query } from "../shared/query";

  export let data: ProfileFormData;
  export let onUpdate: () => void;
  export let onNewState: (s: State) => void;

  onMount(async () => {
    try {
      const payload = await query("/conversations/100");
      console.log(payload);
    } catch {}
  });
</script>

<Backbar
  onBack={() => {
    onNewState({ page: "view-profile" });
  }}
/>
<form on:submit={() => false}>
  <input type="text" value={data.username} name="username" />
</form>
