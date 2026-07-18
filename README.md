# Wick

个人网页时间戳归档：手动逐次索引，不追求完整。每一次按下按钮，就是一根 K 线——买了就是买了，后续要不要跟进是下一次独立的动作。

**这是数据仓库，固定 public**——快照账本 + 生成的公开索引页都在这里。捕获用的浏览器插件源码在姊妹仓库 [`wick-extension`](../wick-extension)（同一台机器的 `~/Projects/wick-extension/`），代码仓库的可见性和这个仓库的公开状态无关，各管各的。

## 设计

- **点状索引，不做监控**：捕获永远由人在浏览器里手动触发，系统里没有任何自动/定时抓取目标网站的动作。这直接绕开了公众号一类反爬生态的检测——每次捕获在目标网站眼里就是一次普通的人类阅读，不是爬虫。
- **来得及就索引，来不及就算了**：内容在你索引之前就 404，是自然发生的事，系统不为此做任何兜底。
- **产权自己的，表现形式彻底公开**：快照文件和索引账本存在你自己的 GitHub 仓库（公开仓库），任何人可以 clone、fork、独立验证。
- **时间戳公证**：每份快照的 SHA-256 通过 [OpenTimestamps](https://opentimestamps.org/) 锚定到比特币区块链——免费、去中心化、任何人可独立验证，不依赖 Wick 本身继续存在。
- **零后端服务**：没有服务器要维护。浏览器插件直接调 GitHub Contents API 提交，GitHub Actions 负责公证和生成公开索引页（GitHub Pages）。

## 组件

| 目录 | 作用 |
|---|---|
| `.github/workflows/ots-stamp.yml` | 新快照 push 后，对没有 `.ots` 的文件跑 `ots stamp` |
| `.github/workflows/ots-upgrade.yml` | 每 6 小时跑一次 `ots upgrade`，把待确认证明补全成完整证明 |
| `.github/workflows/build-pages.yml` | 重新生成 `docs/index.html`；GitHub Pages 从 `main` 分支 `/docs` 目录发布 |
| `scripts/generate-index.mjs` | 零依赖索引页生成器 |
| `snapshots/` | 快照账本：`<host>/<timestamp>-<slug>.html` + 同名 `.json` 元数据 + `.html.ots` 证明 |

一条索引记录 = 一个 commit，git log 本身就是账本，没有另建数据库。

## 为什么不用 sitesmith

sitesmith（`~/Cases/sitesmith/`）是一整套"公司官网"生成器——营销页、博客、RAG 客服、多语言，配置模型围着"品牌/服务/联系方式"设计。Wick 只需要把一批带时间戳的记录渲染成一个列表页，用 sitesmith 相当于为了展示几十行数据去配置一整个租户网站，方向不对。改用 `scripts/generate-index.mjs`，一个不到 100 行的零依赖生成器，直接对应需求。

## 现状

- 仓库：https://github.com/robbery107allianz-cell/wick （public）
- 公开索引页：https://robbery107allianz-cell.github.io/wick/ （Pages 已开，首次构建可能要等几分钟）

## 还差你手动做一步

创建 Fine-grained PAT（GitHub Settings → Developer settings → Fine-grained tokens）：
- Repository access：只勾选 `wick` 这一个仓库
- Permissions：Contents → Read and write，其余都不给

装浏览器插件、填 PAT/owner/repo 的步骤在姊妹仓库 [`wick-extension`](https://github.com/robbery107allianz-cell/wick-extension) 的 README 里——插件配置里的 `repo` 填 `wick`（这里），不是 `wick-extension`。

## 已知限制（v0.1，如实说）

三个 workflow 都会往 `main` push，理论上高频并发时可能互相冲突；个人使用频率下基本撞不上，真撞上了再处理，不提前加锁。

捕获质量、PAT 存储方式等插件侧的限制，见 [`wick-extension`](../wick-extension) 的 README。
