<script lang="ts">
  export let width: number = 24;
  export let height: number = 24;
</script>

<button on:click>
  <svg
    {width}
    {height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11.24 1L11.83 1.24L13.94 6.17L13.71 6.76L10.42 8.17L9.82999 7.93L9.65999 7.52L6.1 9L5.51999 8.81L5.36 8.43L2.8 9.49L2.22 9.25L1.5 7.58L1.78 6.99L4.27999 5.93L4.09999 5.52L4.33999 4.94L7.9 3.41L7.72 3L7.99999 2.42L11.24 1ZM2.5 7.64L2.85 8.49L5.07 7.58L4.7 6.73L2.5 7.64ZM5.23999 5.52L6.35 7.97L9.35 6.69L8.23999 4.25L5.23999 5.52ZM8.78999 3L10.65 7.11L12.94 6.1L11.18 2L8.72 3H8.78999ZM8.50001 9.09998L11.52 14H10.35L8.47001 10.97V14.97H7.47001V9.81997L5.58001 14H4.48001L6.18001 10.1L8.50001 9.09998Z"
      fill="currentColor"
    />
  </svg>
</button>

<style>
  button {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    height: 30px;
    width: 50px;
  }
</style>
