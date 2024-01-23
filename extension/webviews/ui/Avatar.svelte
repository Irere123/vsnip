<script lang="ts">
  export let size: number = 50;
  export let src: string;
</script>

<img {src} alt="avatar" style={`width: ${size}px; height: ${size}px`} />

<style>
  img {
    border-radius: 100%;
  }
</style>
