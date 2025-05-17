<script lang="ts">
export const disabled = false;
export const type: 'button' | 'reset' | 'submit' = 'button';
export const className = '';
</script>

<button class={className} {type} {disabled} on:click>
  <slot />
</button>

<style>
  button {
    width: unset;
  }
</style>
