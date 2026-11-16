import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

interface DragOptions {
  /** 被拖动元素的 ref，用于测量尺寸做边界约束 */
  target: Ref<HTMLElement | null>;
  /** 是否忽略 button 上的按下（避免与按钮点击冲突）；拖动目标本身是 button 时传 false */
  ignoreButtons?: boolean;
  /** 距视口边缘的最小留白 */
  margin?: number;
  /** 松手时靠近边缘多少像素内自动吸附，传 0 关闭吸附 */
  snap?: number;
}

/** 指针拖动：边界约束 + 松手磁吸，返回位置 ref 与需绑到可拖动元素上的事件处理器 */
export function useDrag({
  target,
  ignoreButtons = true,
  margin = 12,
  snap = 32,
}: DragOptions) {
  const pos = ref({ x: 0, y: 0 });
  const dragging = ref(false);
  const moved = ref(false);
  let origin = { x: 0, y: 0 };
  let start = { x: 0, y: 0 };
  let pending: null | { x: number; y: number } = null;
  let frame = 0;

  function limits(): { maxX: number; maxY: number; minX: number; minY: number } {
    const el = target.value;
    const maxX = Math.max(margin, window.innerWidth - (el?.offsetWidth ?? 0) - margin);
    const maxY = Math.max(margin, window.innerHeight - (el?.offsetHeight ?? 0) - margin);
    return { minX: margin, minY: margin, maxX, maxY };
  }

  function clamp(next: { x: number; y: number }): { x: number; y: number } {
    const { minX, minY, maxX, maxY } = limits();
    return {
      x: Math.min(Math.max(next.x, minX), maxX),
      y: Math.min(Math.max(next.y, minY), maxY),
    };
  }

  function flush(): void {
    frame = 0;
    if (!pending) return;
    const next = clamp(pending);
    pending = null;
    if (Math.abs(next.x - start.x) + Math.abs(next.y - start.y) > 3) moved.value = true;
    pos.value = next;
  }

  function onPointerDown(event: PointerEvent): void {
    if (ignoreButtons && (event.target as HTMLElement).closest('button')) return;
    dragging.value = true;
    moved.value = false;
    start = { ...pos.value };
    origin = { x: event.clientX - pos.value.x, y: event.clientY - pos.value.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent): void {
    if (!dragging.value) return;
    pending = { x: event.clientX - origin.x, y: event.clientY - origin.y };
    if (!frame) frame = requestAnimationFrame(flush);
  }

  function snapToEdge(): void {
    if (!snap) return;
    const { minX, minY, maxX, maxY } = limits();
    const near = (value: number, low: number, high: number): number => {
      if (value - low < snap) return low;
      if (high - value < snap) return high;
      return value;
    };
    pos.value = {
      x: near(pos.value.x, minX, maxX),
      y: near(pos.value.y, minY, maxY),
    };
  }

  function onPointerUp(): void {
    if (!dragging.value) return;
    dragging.value = false;
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    flush();
    snapToEdge();
  }

  function onResize(): void {
    pos.value = clamp(pos.value);
  }

  onMounted(() => window.addEventListener('resize', onResize));
  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('resize', onResize);
  });

  return { pos, dragging, moved, onPointerDown, onPointerMove, onPointerUp };
}
