# LLM Post-Training Code Lens

面向大模型后训练与注意力机制面试的手撕代码地图。网页用 VitePress 构建，代码透镜把每个算法拆成可复述的结构段，并支持局部重点视图与完整代码视图。

## 本地运行

~~~bash
npm ci
npm run dev
~~~

生产构建：

~~~bash
npm run build
npm run preview
~~~

## 云端环境

- GitHub Actions 自动构建并发布到 GitHub Pages。
- vercel.json 保留了 Vercel 一键导入配置。
- 内容入口位于 docs/index.md，算法数据位于 docs/data/algorithms.js，交互组件位于 docs/components/CodeLens.vue。

## 内容原则

每个算法按“输入与形状 → 核心计算 → 稳定性控制 → 更新循环”组织。最小代码用于讲清楚数据流，完整工程实现会在后续章节单独维护。

## License

MIT

