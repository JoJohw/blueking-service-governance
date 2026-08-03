<template>
  <!-- 首页布局 -->
  <main
    class="h-full w-full overflow-auto bg-[#F5F7FA]"
    style="height: calc(100% - 50px)"
  >
    <RouterView />
    <Footer></Footer>
  </main>
</template>
<script setup lang="ts">
  import Footer from '~/pages/app/footer.vue';
</script>
