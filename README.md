# Wick

个人网页时间戳归档：手动逐次索引，不追求完整。每一次按下按钮，就是一根 K 线——买了就是买了，后续要不要跟进是下一次独立的动作。

## 设计

- **点状索引，不做监控**：捕获永远由人在浏览器里手动触发，系统里没有任何自动/定时抓取目标网站的动作。这直接绕开了公众号一类反爬生态的检测——每次捕获在目标网站眼里就是一次普通的人类阅读，不是爬虫。
- **来得及就索引，来不及就算了**：内容在你索引之前就 404，是自然发生的事，系统不为此做任何兜底。
- **产权自己的，表现形式彻底公开**：快照文件和索引账本存在你自己的 GitHub 仓库（公开仓库），任何人可以 clone、fork、独立验证。
- **时间戳公证**：每份快照的 SHA-256 通过 [OpenTimestamps](https://opentimestamps.org/) 锚定到比特币区块链——免费、去中心化、任何人可独立验证，不依赖 Wick 本身继续存在。
- **零后端服务**：没有服务器要维护。浏览器插件直接调 GitHub Contents API 提交，GitHub Actions 负责公证和生成公开索引页（GitHub Pages）。

## 组件

| 目录 | 作用 |
|---|---|
| `extension/` | Manifest V3 浏览器插件，一键捕获当前页面 |
| `.github/workflows/ots-stamp.yml` | 新快照 push 后，对没有 `.ots` 的文件跑 `ots stamp` |
| `.github/workflows/ots-upgrade.yml` | 每 6 小时跑一次 `ots upgrade`，把待确认证明补全成完整证明 |
| `.github/workflows/build-pages.yml` | 重新生成 `docs/index.html`；GitHub Pages 从 `main` 分支 `/docs` 目录发布 |
| `scripts/generate-index.mjs` | 零依赖索引页生成器 |
| `snapshots/` | 快照账本：`<host>/<timestamp>-<slug>.html` + 同名 `.json` 元数据 + `.html.ots` 证明 |

一条索引记录 = 一个 commit，git log 本身就是账本，没有另建数据库。

## 为什么不用 sitesmith

sitesmith（`~/Cases/sitesmith/`）是一整套"公司官网"生成器——营销页、博客、RAG 客服、多语言，配置模型围着"品牌/服务/联系方式"设计。Wick 只需要把一批带时间戳的记录渲染成一个列表页，用 sitesmith 相当于为了展示几十行数据去配置一整个租户网站，方向不对。改用 `scripts/generate-index.mjs`，一个不到 100 行的零依赖生成器，直接对应需求。

## 手动设置步骤（账号相关，代码没有替你做）

1. 创建 GitHub 仓库（建议 public，跟"彻底公开"的设计前提一致）：
   ```bash
   cd ~/Projects/wick
   gh repo create <owner>/wick --public --source=. --push
   ```
2. 仓库 Settings → Pages：Source 选 `Deploy from a branch`，分支 `main`，目录 `/docs`。
3. 创建 Fine-grained PAT（GitHub Settings → Developer settings → Fine-grained tokens）：
   - Repository access：只勾选这一个仓库
   - Permissions：Contents → Read and write，其余都不给
4. `chrome://extensions` 开发者模式 → Load unpacked → 选 `extension/` 目录
5. 点插件图标 → 右键/长按选"选项" → 填 owner / repo / PAT
6. 打开任意网页 → 点插件图标 → "索引这一刻"

## 已知限制（v0.1，如实说）

- 图片/样式内联是简化实现（同源 CSS 内联、≤2MB 图片转 base64），不是 SingleFile 那种工业级完整度——跨域样式表、懒加载或 canvas 绘制的图片可能捕获不全。够用，不是完美复刻。
- 三个 workflow 都会往 `main` push，理论上高频并发时可能互相冲突；个人使用频率下基本撞不上，真撞上了再处理，不提前加锁。
- PAT 明文存在浏览器扩展的 `chrome.storage.local` 里。这是个人单人工具，token 权限已锁死到单仓库的 Contents 读写，泄露的最坏情况是有人往这一个归档仓库塞垃圾 commit，`git revert` 即可，没有上加密/relay 服务的必要。
