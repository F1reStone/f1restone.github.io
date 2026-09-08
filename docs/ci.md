# CI 检查与 Cloudflare 部署

工作流：`.github/workflows/deploy.yml`，显示名称为 **CI and deploy**。

## 触发与执行顺序

- 推送到 `main` / `as260`，或向这两个分支发起 PR：自动检查。
- GitHub Actions 页的 **Run workflow**：手动检查所选分支，不部署。
- 只有 `main` 的 push 且前面全部步骤成功，才部署到现有 Cloudflare Worker。

流程为：冻结锁文件安装 → `pnpm validate`（lint → check → test:run → build）→ 安装 Chromium → 正式站点浏览器测试 → 隔离双语测试 → 符合条件时部署。

`test:run` 不进入监听模式；单元测试失败会在构建前结束流程。浏览器测试读取真实构建文件，覆盖 SEO、链接、搜索、移动导航、主题、无 JS 内容和缺失翻译提示等。双语测试另建到 `test-results/i18n-dist`，移除临时文章并恢复语言配置；部署始终使用之前通过检查的正式 `dist`。

一个任务最长 20 分钟。PR/非生产重复检查会取消旧运行；main 的 push 串行执行，不中断正在进行的部署。工作流只申请 `contents: read`，Cloudflare 凭据只传入部署步骤。没有 `pull_request_target` 或自动部署 PR 的行为。

## 版本与维护

- `package.json` 的 `packageManager` 是 pnpm 版本的唯一声明，目前为 `pnpm@11.25.0`；已移除工作流中的 pnpm 9。
- `.nvmrc` 指定 Node 24 LTS，setup-node 读取它；`engines.node` 仍表示最低兼容要求。
- pnpm 11 使用官方后继 Action `pnpm/setup`，并缓存锁文件对应的依赖仓库。安装显式使用 `--frozen-lockfile`。
- Action 固定完整提交 SHA，并注明版本。2026-09-08 核对：checkout 7.0.1、setup-node 7.0.0、pnpm/setup 2.1.0、upload-artifact 7.0.1。
- 原 Wrangler Action 4.0.0 已是当前版本，但它的默认策略会额外安装最新 Wrangler。现在直接 `pnpm exec wrangler deploy`，使用本项目锁文件已固定并安装的 Wrangler，不再另行解析部署工具版本，也不再修改 pnpm 全局配置。

参考：[pnpm/setup 迁移说明](https://github.com/pnpm/setup)、[Wrangler Action 4.0.0 默认版本策略](https://github.com/cloudflare/wrangler-action/releases/tag/v4.0.0)。更新 Action 时核对官方 release 与标签对应的提交；更新 pnpm 时修改 `packageManager` 并验证冻结安装。

## 查看失败与本地复现

在 GitHub 仓库的 **Actions → CI and deploy** 打开运行记录，查看第一个失败步骤。浏览器失败时，下载 `browser-failures-*` artifact（保留 7 天），通过 `pnpm exec playwright show-trace <trace.zip>` 打开追踪。正式和双语结果分目录保存，不互相清理。安装或编译失败时没有浏览器追踪，直接查看该步骤日志。

本地完整检查：

```text
pnpm install --frozen-lockfile
pnpm validate
pnpm test:e2e
pnpm test:i18n
```

本地浏览器默认 Edge；CI 使用 Playwright 配套的 Chromium headless shell，安装时使用 `--only-shell` 避免额外下载完整浏览器，且禁止遗留的 `test.only`。在 PowerShell 中复现 CI 浏览器环境：

```powershell
$env:CI = 'true'
pnpm exec playwright install --only-shell chromium
pnpm test:e2e
pnpm test:i18n
Remove-Item Env:CI
```

PR 的检查结果会显示在页面上；是否强制合并前通过，还取决于仓库现有的分支保护/Ruleset。本次没有修改远程设置。若要强制保护 main，可将 `build-and-deploy` 设为必需检查。

## 本次验证记录

2026-09-08：actionlint 1.7.12、冻结依赖安装、格式检查、lint、类型检查、99 项单元测试和构建通过。使用 `CI=true` 与配套 Chromium headless shell，现有工作区配置的浏览器检查 6 项通过、2 项按未配置功能跳过；隔离双语测试 8 项全部通过。修正了测试按 Escape 早于弹窗获得焦点的时序问题，并新增焦点和关闭状态断言。

Wrangler `deploy --dry-run` 通过，没有上传或部署。本地测试环境为 Windows / Node 24.16.0；GitHub Ubuntu runner、缓存和 artifact 的实际远程执行仍需在推送后确认。任务结束时清理了临时内容和测试服务器，保留了用户本轮开始前已开启的 i18n 配置。
