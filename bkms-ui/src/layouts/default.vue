<template>
  <!-- 默认布局 -->
  <main class="h-full w-full overflow-auto bg-[#F5F7FA]">
    <MsHeader
      class="w-full sticky top-0 z-1"
      :title="$route.meta?.title"
    />
    <RouterView />
  </main>
</template>
