<!--This is just the general page for setting up the vue app-->
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <!--<RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/install">Install</RouterLink>-->
      </nav>
    </div>
  </header>

  <RouterView />
</template>
