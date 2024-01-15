<script lang="ts">
  export let disabled = false;
  export let type: "button" | "reset" | "submit" = "button";
  export let className = "";
</script>

<button class={className} {type} {disabled} on:click>
  <slot />
</button>

<style>
  button {
    width: unset;
  }
</style>
