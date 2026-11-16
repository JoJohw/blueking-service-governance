<template>
  <section
    :id="id"
    class="section"
    :class="{ 'is-focus': focus }"
  >
    <header class="section-header">
      <div class="section-heading">
        <h2 class="section-title">
          {{ title }} <span class="section-count">{{ count }}</span>
        </h2>
        <p
          v-if="note"
          class="section-note"
        >
          {{ note }}
        </p>
      </div>
      <div
        v-if="$slots.tools"
        class="section-tools"
      >
        <slot name="tools" />
      </div>
    </header>
    <div class="section-content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
  defineProps<{ id: string; title: string; count: number; note?: string; focus?: boolean }>();
</script>

<style scoped>
  .section {
    box-sizing: border-box;
    padding: 14px 20px 22px;
    margin: 0 -20px;
    scroll-margin-top: 12px;
    border-radius: 6px;
    transition: background 0.2s ease;
  }

  .section:not(.is-focus):hover {
    background: var(--pal-bg-hover);
  }

  .section-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .section.is-focus .section-header {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 12px 0;
    margin-top: -14px;
    background: var(--pal-bg-card);
  }

  .section-heading {
    min-width: 0;
  }

  .section-title {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: var(--pal-text-title);
  }

  .section-count {
    display: inline-block;
    padding: 1px 9px;
    margin-left: 8px;
    font-size: 13px;
    font-weight: 600;
    vertical-align: 2px;
    color: var(--pal-brand);
    background: var(--pal-bg-brand-soft);
    border-radius: 10px;
  }

  .section-note {
    margin: 6px 0 0;
    color: var(--pal-text-body);
  }

  .section-tools {
    flex: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .section.is-focus .section-tools,
  .section:not(.is-focus):hover .section-tools {
    opacity: 1;
  }

  .section-content {
    min-width: 0;
  }
</style>
