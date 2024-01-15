<script lang="ts">
  import Button from "./Button.svelte";

  export let onBack: () => void;
</script>

<div>
  <Button on:click={onBack}>&lt; Back</Button>
  <slot />
</div>

<style>
  div {
    margin-top: 4px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
  }
</style>
