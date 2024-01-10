<script lang="ts">
  import type { User } from "../shared/types";

  export let currentUser: User | null;
</script>

<div>
  <img
    src={currentUser?.avatar}
    alt={currentUser?.username}
    width="150"
    height="150"
  />
  <p>{currentUser?.username}</p>
</div>
