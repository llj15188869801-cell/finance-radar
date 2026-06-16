# 财讯雷达交接清单

更新时间：2026-06-15

## 当前结论

项目已经可以在本机运行：前台、公开 API、后台基础权限、PostgreSQL、Redis 和 Worker 都已接通。公开页当前展示 5 条中文财经热点，不展示 SEC 低价值表格申报内容，也不再出现“待接入持牌行情供应商”的文案。

## 本机启动

```powershell
docker compose up -d
npm install
npm run db:generate
npm run db:push
npm run dev
```

另开一个终端启动 Worker：

```powershell
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/finance_radar'
$env:REDIS_URL='redis://localhost:6379'
npm run worker
```

打开：

- 前台：`http://localhost:3000`
- 公开热点 API：`http://localhost:3000/api/events?limit=20`

## 验收命令

```powershell
npm test
npm run typecheck
npm run build
npm run sources:check
npm run queue:check
npm run pipeline:run
```

本轮已验证：

- `npm test` 通过。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- `pipeline:run` 成功处理并入库 5 条热点。
- `queue:check` 可查看 15 分钟定时任务、下次运行时间、失败数和最近完成记录。
- 公开 API 返回 5 条热点，非 published 为 0。
- 后台 API 匿名访问返回 401。

## 内容与数据口径

- 行情只使用公开接口参考，可能延迟，请以交易所最终数据为准。
- 不接入、不采购持牌行情供应商。
- 所有财经解读均标注“仅供信息参考，不构成投资建议”。
- SEC 信源只保留高价值公告候选，低价值 filing 在源头过滤，历史低价值内容已撤回。
- 普通新闻仍使用轻量标题相似度聚类，后续可继续升级为实体级聚类。

## 当前关键文件

- `apps/web`：前台页面、后台页面、API。
- `apps/web/lib/live-data.ts`：公开热点读取和过滤。
- `apps/web/app/api/sync/route.ts`：镜像同步验签、防重放和写入。
- `packages/worker/src/market-pulse.ts`：公开行情热点生成。
- `packages/worker/src/pipeline.ts`：抓取、中文化、聚类和 AI 分析流水线。
- `packages/worker/src/sources.ts`：公开信源配置。
- `packages/worker/prisma/schema.prisma`：数据库结构。
- `docs/finance-radar-red-blue-review.md`：红军攻击与蓝军修复记录。

## 不要提交的本地产物

以下已在 `.gitignore` 中排除：

- `node_modules/`
- `.next/`
- `dist/`
- `coverage/`
- `.env`
- `*.log`
- `*.tsbuildinfo`
