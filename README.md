# 财讯雷达

面向普通投资者的多信源财经热点站。项目当前提供一个可以直接运行的完整产品骨架：公开站、日报、详情页、搜索、只读管理台、公开 API、15 分钟 Worker、数据模型、AI/行情/信源适配器与境内镜像签名同步。

> 所有内容仅供信息参考，不构成投资建议。行情来自公开数据接口，可能存在延迟，请以交易所最终数据为准。

## 本地启动

要求 Node.js 20.9+。

```powershell
npm install
npm run dev
```

打开 `http://localhost:3000`。没有数据库、Redis 或外部密钥时，网站使用内置演示数据完整运行。

启动生产依赖与 Worker：

```powershell
Copy-Item .env.example .env
docker compose up -d
npm run db:generate
npm run worker
```

检查所有已接入官方信源的真实连通性和最近内容：

```powershell
npm run sources:check
```

手动执行一次完整抓取、聚类、分析和入库：

```powershell
npm run db:push
npm run pipeline:run
```

## 工作区

- `apps/web`：Next.js 公开站、管理台和 API。
- `packages/domain`：共享类型、适配器接口、发布规则。
- `packages/worker`：BullMQ 任务、数据处理、Prisma 模型和镜像同步。

## 生产接入清单

1. 已接入美联储 RSS、欧洲央行 RSS 与 SEC EDGAR Atom；继续为其他监管机构、交易所和公司 IR 编写遵守其条款的 `SourceAdapter`。
2. 配置 PostgreSQL、Redis、OpenAI-compatible 服务与管理员认证。
3. 定期检查公开行情接口的稳定性与使用条款，接口失效时切换到其他免费公开来源。
4. 海外主站配置 `MIRROR_SYNC_URL` 与 `SYNC_SECRET`；境内镜像只开放签名同步写入。
5. 境内部署前完成备案与合规审查。

## 验证

```powershell
npm test
npm run typecheck
npm run build
```

测试覆盖公开内容过滤、信源去重、单信源失败兜底、自动发布阈值和同步签名。
