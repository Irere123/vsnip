<script lang="ts">
  import type { ProfileFormData, State } from "../shared/types";
  import Backbar from "../ui/Backbar.svelte";

  export let data: ProfileFormData;
  export let onUpdate: () => void;
  export let onNewState: (s: State) => void;
</script>

<Backbar
  onBack={() => {
    onNewState({ page: "view-profile" });
  }}
/>
<form on:submit={() => false}>
  <input type="text" value={data.username} name="username" />
</form>
