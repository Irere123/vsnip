<script lang="ts">
  import Labeler from "./Labeler.svelte";

  export let name: string;
  export let label: string = "";
  export let value: string = "";
  export let min: number | undefined;
  export let max: number | undefined;
  export let type: string | undefined = "text";
  export let placeholder: string = "";
  export let required: boolean = false;

  export let textArea: boolean | undefined | null = false;
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
