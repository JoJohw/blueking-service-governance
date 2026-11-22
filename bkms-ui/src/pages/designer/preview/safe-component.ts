/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 * Copyright (C) Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * 预览用的组件包装层。
 *
 * 它要解决的都是「随便哪个业务组件都可能踩到」的问题，和预览页本身的编排无关：
 * - 渲染报错就地兜住，避免一个组件挂掉整页白屏；
 * - v-model 的 update:Xxx 事件写回本地 props，交互能改状态而不是被父级锁死；
 * - 垫一层 100% 宽容器，让组件里的 w-full / h-full 有确定参照（monaco 编辑器等靠此撑满）；
 * - 整页布局壳再补一份确定高度参照，否则 height:100% 会沿 auto 链撑到视口高度。
 */
import { type Component, type PropType, defineComponent, h, onErrorCaptured, reactive, ref, watch } from 'vue';

import { Form } from 'bkui-vue';

export default defineComponent({
  props: {
    component: { type: Object as PropType<Component>, required: true },
    containerWidth: { type: Number, default: undefined },
    fillHeight: { type: Boolean, default: false },
    needsForm: { type: Boolean, default: false },
    props: { type: Object as PropType<Record<string, unknown>>, required: true },
    slots: { type: Object as PropType<Record<string, () => unknown>>, required: true },
  },
  setup(componentProps) {
    const error = ref('');
    onErrorCaptured(err => {
      error.value = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
      return false;
    });

    // 只增量写入、不对齐键集合：props 字段变少只会发生在换组件/换变体/开合弹层，
    // 这几种情况 index.vue 的 key 都会变、本组件重建，所以这里不必处理删除。
    // 不删旧键是为了保住「v-model 写回、但不在清单 props 里」的那些键（组件自己维护的状态）；
    // 同键的写回值仍会被下一次 props 更新覆盖，这是预期行为，不是这里要解决的问题。
    const localProps = reactive({ ...componentProps.props });
    watch(
      () => componentProps.props,
      value => Object.assign(localProps, value),
    );

    return () => {
      if (error.value) return h('pre', { class: 'render-error' }, error.value);
      const emits = (componentProps.component as { emits?: string[] }).emits ?? [];
      const updateHandlers = Object.fromEntries(
        emits
          .filter(name => name.startsWith('update:'))
          .map(name => {
            const key = name.slice('update:'.length);
            return [`onUpdate:${key}`, (value: unknown) => (localProps[key] = value)];
          }),
      );
      const componentVNode = h(componentProps.component, { ...localProps, ...updateHandlers }, componentProps.slots);
      let content = componentVNode;
      if (componentProps.needsForm) content = h(Form, null, { default: () => componentVNode });
      // 预览卡片 body 是 flex items-center，子节点会按内容宽度收缩；统一垫一层 100% 宽容器，
      // 让组件里的 w-full / h-full 有确定宽度参照（monaco 编辑器等靠此撑满）。
      const fillStyle = componentProps.fillHeight ? { height: '100%', minHeight: '0' } : {};
      content = h('div', { style: { width: '100%', ...fillStyle } }, [content]);
      if (componentProps.containerWidth) {
        content = h('div', { style: { width: `${componentProps.containerWidth}px` } }, [content]);
      }
      return content;
    };
  },
});
