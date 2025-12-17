<script setup lang="ts">
import ExtensionOption from '@/components/ExtensionOption.vue'
import pkg from '../../package.json'
</script>

<template>
  <div>
    <a href="https://github.com/gaao/browser-extension-checkin" target="_blank">
      <img src="@/assets/logo.png" class="logo crx" alt="crx logo">
    </a>
  </div>
  <!-- <h1>{{ pkg.name }}</h1> -->
  <h1>网页自动签到</h1>
  <span class="version">{{ pkg.name }}_v{{ pkg.version }}</span>
  <ExtensionOption  />
</template>

<style scoped>
.logo {
  height: 6em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
.logo.crx:hover {
  filter: drop-shadow(0 0 2em #f2bae4aa);
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
  color: #f87436;
  margin-bottom: 0.2em;
}
.version {
  /* font-size: 1.2em; */
  /* line-height: 1.1; */
  color: #d6571b;
  background: #f1f1f0;
  padding: 0.2em 0.6em;
  border-radius: 1em;
}
</style>
