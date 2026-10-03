<script setup>
import { computed, ref } from 'vue'
import { algorithms } from '../data/algorithms.js'

const selectedId = ref('ppo')
const selectedSegment = ref('overview')
const hovered = ref(false)
const pinned = ref(false)

const current = computed(() => algorithms.find((item) => item.id === selectedId.value))
const isExpanded = computed(() => pinned.value || hovered.value)
const activeSegment = computed(() => {
  if (selectedSegment.value === 'overview') return null
  return current.value.segments.find((segment) => segment.id === selectedSegment.value)
})

function selectAlgorithm(id) {
  selectedId.value = id
  selectedSegment.value = 'overview'
  pinned.value = false
  hovered.value = false
}

function togglePinned() {
  pinned.value = !pinned.value
  hovered.value = false
}

function selectSegment(segment) {
  selectedSegment.value = segment.id
  pinned.value = true
}

function lineInRange(number, range) {
  return number >= range[0] && number <= range[1]
}

const visibleRows = computed(() => {
  const item = current.value
  if (!item) return []
  if (isExpanded.value) {
    return item.code.map((text, index) => ({ number: index + 1, text, gap: false }))
  }

  const ranges = activeSegment.value
    ? [activeSegment.value.range]
    : item.focus.map((line) => [Math.max(1, line - 1), Math.min(item.lineCount, line + 1)])

  const merged = []
  for (const range of ranges) {
    const previous = merged[merged.length - 1]
    if (previous && range[0] <= previous[1] + 1) {
      previous[1] = Math.max(previous[1], range[1])
    } else {
      merged.push([...range])
    }
  }

  const rows = []
  let previousEnd = 0
  for (const [start, end] of merged) {
    if (previousEnd && start > previousEnd + 1) rows.push({ gap: true, number: previousEnd })
    for (let number = start; number <= end; number += 1) {
      rows.push({ number, text: item.code[number - 1], gap: false })
    }
    previousEnd = end
  }
  return rows
})

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function highlightPython(line) {
  let html = escapeHtml(line)
  html = html.replace(/(#.*)$/g, '<span class="py-comment">$1</span>')
  html = html.replace(/\b(def|return|with|no_grad|in|for|if|else)\b/g, '<span class="py-keyword">$1</span>')
  html = html.replace(/\b(torch|softmax|categorical|sample_group|verifier|group_normalize)\b/g, '<span class="py-call">$1</span>')
  html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="py-number">$1</span>')
  return html
}
</script>

<template>
  <section class="lens-shell">
    <div class="lens-layout">
      <aside class="lens-sidebar" aria-label="算法目录">
        <div class="sidebar-kicker">POST-TRAINING MAP</div>
        <h2>手撕代码地图</h2>
        <p>先背结构，再补张量细节。每个模块都按能在白板上复述的顺序组织。</p>
        <div class="algorithm-list">
          <button
            v-for="item in algorithms"
            :key="item.id"
            class="algorithm-item"
            :class="{ active: selectedId === item.id }"
            type="button"
            @click="selectAlgorithm(item.id)"
          >
            <span class="algorithm-label">{{ item.label }}</span>
            <span class="algorithm-name">{{ item.name }}</span>
            <span class="algorithm-group">{{ item.group }}</span>
          </button>
        </div>
      </aside>

      <div class="lens-main">
        <div class="lens-summary">
          <div>
            <span class="lens-kicker">{{ current.group }} · {{ current.label }} CODE LENS</span>
            <h1>{{ current.name }}</h1>
            <p>{{ current.summary }}</p>
          </div>
          <div class="memory-card">
            <span>一句话背诵</span>
            <strong>{{ current.memory }}</strong>
            <code>{{ current.formula }}</code>
          </div>
        </div>

        <section
          class="code-card"
          :class="{ expanded: isExpanded }"
          @mouseenter="hovered = true"
          @mouseleave="hovered = false"
        >
          <button class="code-header" type="button" @click="togglePinned">
            <div>
              <span class="code-kicker">{{ current.label }} IMPLEMENTATION OVERVIEW</span>
              <strong>{{ selectedSegment === 'overview' ? '完整实现结构总览' : '局部结构：' + activeSegment.label }}</strong>
            </div>
            <span class="code-toggle">{{ pinned ? '收起完整代码' : isExpanded ? '固定完整代码' : '展开完整代码' }}</span>
          </button>

          <div class="segment-row" :aria-label="current.label + ' 代码结构'">
            <button
              class="segment-pill"
              :class="{ active: selectedSegment === 'overview' }"
              type="button"
              @click="selectedSegment = 'overview'"
            >
              完整结构
            </button>
            <button
              v-for="segment in current.segments"
              :key="segment.id"
              class="segment-pill"
              :class="{ active: selectedSegment === segment.id }"
              type="button"
              @click="selectSegment(segment)"
            >
              [{{ segment.id }}] {{ segment.label }}
            </button>
          </div>

          <div class="code-status">
            <span>{{ isExpanded ? '完整代码视图' : '局部重点视图' }}</span>
            <span>{{ selectedSegment === 'overview' ? '悬停展开，点击固定' : '点击结构标签切换重点' }}</span>
          </div>

          <pre class="code-window"><code><template v-for="row in visibleRows" :key="row.gap ? 'gap-' + row.number : row.number"><span v-if="row.gap" class="code-gap">        ⋮</span><span v-else class="code-line" :class="{ focus: current.focus.includes(row.number) || (activeSegment && lineInRange(row.number, activeSegment.range)) }"><span class="line-number">{{ String(row.number).padStart(2, ' ') }}</span><span class="line-text" v-html="highlightPython(row.text)"></span></span></template></code></pre>
        </section>

        <div class="study-grid">
          <article>
            <span class="study-label">面试复述顺序</span>
            <p>{{ current.memory }}</p>
          </article>
          <article>
            <span class="study-label">阅读提示</span>
            <p>先定位数据形状与更新对象，再解释每一行为什么存在。公式只服务于代码中的张量流。</p>
          </article>
          <article>
            <span class="study-label">当前状态</span>
            <p>{{ current.lineCount }} 行最小实现 · {{ current.segments.length }} 个结构段 · 可继续扩展训练循环</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lens-shell {
  margin: 0 auto;
  padding: 20px 0 40px;
}

.lens-layout {
  display: grid;
  grid-template-columns: 238px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.lens-sidebar,
.code-card,
.memory-card,
.study-grid article {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  box-shadow: 0 16px 36px rgba(31, 52, 88, 0.07);
}

.lens-sidebar {
  position: sticky;
  top: 90px;
  border-radius: 14px;
  padding: 20px 14px;
}

.sidebar-kicker,
.lens-kicker,
.code-kicker,
.study-label {
  color: #536fae;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.lens-sidebar h2 {
  margin: 9px 0 8px;
  font-size: 21px;
}

.lens-sidebar p {
  margin: 0 0 18px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.65;
}

.algorithm-list {
  display: grid;
  gap: 8px;
}

.algorithm-item {
  display: grid;
  gap: 3px;
  width: 100%;
  padding: 11px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--vp-c-text-1);
  text-align: left;
  cursor: pointer;
}

.algorithm-item:hover,
.algorithm-item.active {
  border-color: #aebfe7;
  background: #f1f5ff;
}

.dark .algorithm-item:hover,
.dark .algorithm-item.active {
  background: #202d48;
}

.algorithm-label {
  color: #3456ad;
  font-size: 15px;
  font-weight: 800;
}

.algorithm-name {
  font-size: 12px;
  font-weight: 650;
}

.algorithm-group {
  color: var(--vp-c-text-2);
  font-size: 11px;
}

.lens-main {
  min-width: 0;
}

.lens-summary {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin: 2px 0 18px;
}

.lens-summary h1 {
  margin: 7px 0 10px;
  color: var(--vp-c-text-1);
  font-size: clamp(28px, 4vw, 43px);
  letter-spacing: -0.03em;
}

.lens-summary p {
  max-width: 640px;
  margin: 0;
  color: var(--vp-c-text-2);
  line-height: 1.7;
}

.memory-card {
  min-width: 260px;
  max-width: 340px;
  border-radius: 12px;
  padding: 15px 17px;
}

.memory-card span {
  color: #536fae;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.memory-card strong {
  display: block;
  margin: 8px 0 13px;
  color: var(--vp-c-text-1);
  font-size: 14px;
  line-height: 1.55;
}

.memory-card code {
  display: block;
  overflow-wrap: anywhere;
  color: #3456ad;
  font-size: 12px;
}

.code-card {
  overflow: hidden;
  border-radius: 14px;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  padding: 18px 20px;
  border: 0;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.code-header strong {
  display: block;
  margin-top: 7px;
  font-size: 18px;
}

.code-toggle {
  flex: 0 0 auto;
  color: #3f5eb1;
  font-size: 13px;
  font-weight: 750;
}

.segment-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.segment-pill {
  border: 1px solid #aebfe7;
  border-radius: 999px;
  padding: 7px 11px;
  background: transparent;
  color: #3c5bb2;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.segment-pill:hover,
.segment-pill.active {
  background: #edf2ff;
}

.dark .segment-pill:hover,
.dark .segment-pill.active {
  background: #202d48;
}

.code-status {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 20px;
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.code-window {
  max-height: 360px;
  margin: 0;
  overflow: auto;
  padding: 15px 0 18px;
  background: #f7f8fb;
  color: #243149;
  font-size: 13px;
  line-height: 1.8;
  tab-size: 4;
}

.dark .code-window {
  background: #111a2a;
  color: #e5ebf7;
}

.code-line,
.code-gap {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr);
  min-width: max-content;
  padding: 0 20px 0 0;
}

.code-line.focus {
  background: rgba(92, 126, 210, 0.13);
}

.line-number {
  padding-right: 12px;
  color: #9aa6ba;
  text-align: right;
  user-select: none;
}

.line-text {
  white-space: pre;
}

.code-gap {
  display: block;
  padding: 0 20px 3px 50px;
  color: #93a0b4;
}

:deep(.py-keyword) { color: #7b4bc0; font-weight: 700; }
:deep(.py-call) { color: #2a6aaf; }
:deep(.py-number) { color: #b76720; }
:deep(.py-comment) { color: #78907a; }

.study-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.study-grid article {
  border-radius: 11px;
  padding: 15px 16px;
}

.study-grid p {
  margin: 8px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.65;
}

@media (max-width: 900px) {
  .lens-layout {
    grid-template-columns: 1fr;
  }

  .lens-sidebar {
    position: static;
  }

  .algorithm-list {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .algorithm-item {
    min-height: 82px;
  }

  .lens-summary {
    display: grid;
  }

  .memory-card {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .algorithm-list,
  .study-grid {
    grid-template-columns: 1fr 1fr;
  }

  .code-header,
  .code-status {
    align-items: flex-start;
    flex-direction: column;
  }

  .segment-row {
    padding: 12px;
  }
}
</style>

