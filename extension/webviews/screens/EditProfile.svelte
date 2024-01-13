<script lang="ts">
  export let data: import("../shared/types").ProfileFormData;
  export let onUpdate: () => void;
</script>

<form on:submit={() => false}>
  <input type="text" value={data.username} name="username" />
</form>
