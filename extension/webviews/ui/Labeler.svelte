<script lang="ts">
  export let name: string;
  export let label: string;
</script>

{#if label}
  <div><label for={name}>{label}</label></div>
{/if}
<slot />

<style>
  div {
    padding-bottom: 4px;
  }

  label {
    font-size: calc(var(--vscode-font-size) * 0.9);
  }
</style>
