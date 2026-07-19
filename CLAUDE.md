# wick · 操作手册

个人网页时间戳归档的**数据仓库**——快照账本 + 生成的公开索引页。设计说明见 [README.md](README.md)；这个文件是操作层（命令/不变量/陷阱），项目全貌/决策历史/跨仓库关系见家园记忆池 `project_wick.md`（唯一真源，勿在此重复）。

姊妹仓库：[`wick-extension`](https://github.com/robbery107allianz-cell/wick-extension)（同机 `~/Projects/wick-extension/`）——插件源码，改插件逻辑去那边。

## 不变量（改这个仓库前必读）

- **快照必须落在 `docs/snapshots/` 下,不能是仓库根目录 `snapshots/`**。GitHub Pages 配置的是只发布 `docs/` 这个子目录，放外面等于没公开——这个坑已经真实踩过一次（首页链接 404），插件、`generate-index.mjs`、三个 workflow 的路径都已经对齐到 `docs/snapshots/`，改动时不要把路径挪回仓库根。
- **三个 workflow 都必须显式声明 `permissions: contents: write`**，不能只靠仓库设置里的默认权限——新建仓库默认给 `GITHUB_TOKEN` 只读，踩过一次 403。
- **`GITHUB_TOKEN` 发起的 push 不会触发别的 `on: push` workflow**（GitHub 反循环机制）。所以 `ots-stamp.yml` / `ots-upgrade.yml` 自己在同一个 job 里跑 `node scripts/generate-index.mjs` 重新生成索引再一起提交，不能指望它们的提交会联动 `Build Pages`。
- **三个 workflow 提交前都要 `git pull --rebase origin main`**——高频并发触发时会互相 push 冲突（已实测撞过一次），rebase 让落后的一方自动重试而不是直接失败。

## 常用命令

```bash
node scripts/generate-index.mjs              # 本地重新生成 docs/index.html
gh run list --repo robbery107allianz-cell/wick --limit 10
gh workflow run "OTS Stamp" --repo robbery107allianz-cell/wick
gh workflow run "OTS Upgrade" --repo robbery107allianz-cell/wick
gh workflow run "Build Pages" --repo robbery107allianz-cell/wick
gh api repos/robbery107allianz-cell/wick/pages/builds/latest --jq '.status'   # Pages 构建状态
gh api repos/robbery107allianz-cell/wick/secret-scanning/alerts             # 密钥扫描告警（公众号内容自带的 wx AppID 会被误报，属正常噪音）
```

## 现状

- 数据仓库：https://github.com/robbery107allianz-cell/wick （public）
- 公开索引页：https://robbery107allianz-cell.github.io/wick/
