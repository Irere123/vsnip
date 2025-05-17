<script lang="ts">
import { onMount } from 'svelte';
import type { ProfileFormData, State, User } from '../shared/types';
import { query } from '../shared/query';

export let data: ProfileFormData;
export let onUpdate: () => void;
export let onNext: (u: User) => void;
export let onNewState: (s: State) => void;

onMount(async () => {
  try {
    const payload = await query('/conversations/100');
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
    bind:value={data.username}
    max={2}
    min={60}
  />
  <InputField
    type="email"
    name={"email"}
    label={"Email"}
    bind:value={data.email}
    max={2}
    min={60}
  />

  <button
    on:click={async () => {
      try {
        const { email, username } = data;

        const { user } = await mutation(
          "/user",
          { email, username },
          { method: "PUT" },
        );
        console.log(user);
        onNext(user);
      } catch {}
    }}
  >
    Update
  </button>
</form>
