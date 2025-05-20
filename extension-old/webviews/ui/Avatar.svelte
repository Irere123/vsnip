<script lang="ts">
export const size = 50;
export let src: string;
</script>

<img {src} alt="avatar" style={`width: ${size}px; height: ${size}px`} />

<style>
  img {
    border-radius: 100%;
  }
</style>
