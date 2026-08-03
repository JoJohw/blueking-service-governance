<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    v-bk-xss-html="markdownToHtml"
    class="markdown-body p-[16px]"
  ></div>
</template>
<script lang="ts" setup>
  import { computed } from 'vue';

  import hljs from 'highlight.js/lib/core';
  import bash from 'highlight.js/lib/languages/bash';
  import go from 'highlight.js/lib/languages/go';
  import plaintext from 'highlight.js/lib/languages/plaintext';
  import protobuf from 'highlight.js/lib/languages/protobuf';
  import shell from 'highlight.js/lib/languages/shell';
  import yaml from 'highlight.js/lib/languages/yaml';
  import { Marked } from 'marked';
  import { markedHighlight } from 'marked-highlight';

  import 'github-markdown-css'; // 整体 markdown 样式

  import 'highlight.js/styles/github.css'; // 代码块高亮样式

  const props = defineProps({
    value: { type: String, default: '' },
  });

  hljs.registerLanguage('yaml', yaml);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('go', go);
  hljs.registerLanguage('shell', shell);
  hljs.registerLanguage('protobuf', protobuf);
  hljs.registerLanguage('plaintext', plaintext);

  // markdown 转 html
  const marked = new Marked(
    markedHighlight({
      emptyLangClass: 'hljs',
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
    }),
  );

  const markdownToHtml = computed(() => marked.parse(props.value, { async: false }));
</script>
