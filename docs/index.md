---
title: 大模型后训练手撕代码地图
description: GQA、MHA、PPO、DPO、GRPO 的结构背诵与局部代码透镜
---

<div class="home-intro">

<span class="eyebrow">LLM POST-TRAINING · CODE LENS</span>

# 把算法背成一条张量流

先抓住每个实现的结构，再补公式、shape 和工程细节。这个页面把注意力机制与后训练算法统一成同一种阅读方式：分段、聚焦、展开、复述。

</div>

<CodeLens />

## 使用方法

1. 先从左侧选算法，默念一句话背诵。
2. 按 [A] [B] 结构段定位代码职责。
3. 悬停查看完整实现，点击标题固定完整代码。
4. 每次复述都回答三个问题：输入是什么、更新什么、哪个量控制稳定性。

## 内容路线

| 层次 | 先掌握 | 关键张量 |
| --- | --- | --- |
| 注意力 | MHA → GQA | Q/K/V、head、KV cache |
| 监督后训练 | SFT（即将加入） | shift_logits、ignore_index |
| 在线对齐 | PPO → GRPO | advantage、ratio、clip、KL |
| 离线偏好 | DPO | chosen/rejected、log-ratio、margin |

> 当前仓库先提供交互骨架与五个核心最小实现；下一步再补齐 SFT、采样、DAPO、KTO 与评测清单。

<style>
.home-intro {
  margin: 30px 0 24px;
  max-width: 920px;
}
.home-intro .eyebrow {
  color: #536fae;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .16em;
}
.home-intro h1 {
  margin: 10px 0 12px;
  max-width: 820px;
  font-size: clamp(34px, 6vw, 62px);
  line-height: 1.08;
  letter-spacing: -.04em;
}
.home-intro p {
  color: var(--vp-c-text-2);
  font-size: 17px;
  line-height: 1.75;
}
</style>

