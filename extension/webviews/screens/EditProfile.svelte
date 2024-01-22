<script lang="ts">
  import { onMount } from "svelte";
  import type { ProfileFormData, State } from "../shared/types";
  import Backbar from "../ui/Backbar.svelte";
  import { query } from "../shared/query";
  import InputField from "../ui/InputField.svelte";

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
  <InputField
    name={"username"}
    label={"Username"}
    value={data.username}
    max={2}
    min={60}
  />
  <InputField
    type="email"
    name={"email"}
    label={"Email"}
    value={data.email}
    max={2}
    min={60}
  />
</form>
