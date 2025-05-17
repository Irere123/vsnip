<script lang="ts">
export let name: string;
export const label = '';
export const value = '';
export let min: number | undefined;
export let max: number | undefined;
export const type: string | undefined = 'text';
export const placeholder = '';
export const required = false;

export const textArea: boolean | undefined | null = false;
</script>

<Labeler {name} {label}>
  {#if textArea}
    <textarea {name} {required} {placeholder} bind:value></textarea>
  {:else}
    <input
      {type}
      {min}
      {max}
      {required}
      {placeholder}
      {value}
      id={name}
      on:input={(e) => {
        // @ts-ignore
        value = type.match(/^(number|range)$/)
          ? +e.target.value
          : e.target.value;
      }}
    />
  {/if}
</Labeler>
