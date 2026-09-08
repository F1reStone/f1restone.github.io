# CI 检查与 Cloudflare 部署

工作流：`.github/workflows/deploy.yml`，显示名称为 **CI and deploy**。

## 触发与执行顺序

- 推送到 `main` / `as260`，或向这两个分支发起 PR：自动检查。
- GitHub Actions 页的 **Run workflow**：手动检查所选分支，不部署。
- 只有 `main` 的 push 且前面全部步骤成功，才部署到现有 Cloudflare Worker。

Summary 显示四个独立 job：

- **Check**：lint 和 Astro/TypeScript 检查。
- **Test**：单元测试，与 Check 并行。
- **Build**：等待 Check 和 Test 成功，构建正式站点，再运行正式站点和隔离双语浏览器测试。
- **Deploy to Cloudflare**：等待 Build 成功，仅在 main 的 push 上下载并部署通过验证的正式产物。

各 job 复用 `.github/actions/setup-project/action.yml` 安装 Node、pnpm 和冻结依赖。浏览器测试需要真实构建产物，因此保留在 Build 内；不会为了阶段名称而在 Test 中重复构建。

`test:run` 不进入监听模式；单元测试失败会在构建前结束流程。浏览器测试读取真实构建文件，覆盖 SEO、链接、搜索、移动导航、主题、无 JS 内容和缺失翻译提示等。双语测试另建到 `test-results/i18n-dist`，移除临时文章并恢复语言配置；部署始终使用之前通过检查的正式 `dist`。

Build 最长 20 分钟，其余 job 最长 10 分钟。PR/非生产重复检查会取消旧运行；main 的 push 串行执行，不中断正在进行的部署。工作流只申请 `contents: read`，Cloudflare 凭据只传入部署步骤。没有 `pull_request_target` 或自动部署 PR 的行为。

Build 在两套浏览器测试全部成功后上传 `production-site-<commit SHA>`，保留 7 天。`dist` 打包为 tar，保留 `.well-known` 等隐藏路径；Deploy 从同一次 workflow 下载该产物，不重新构建，也不会发布双语测试夹具。

## 版本与维护

- `package.json` 的 `packageManager` 是 pnpm 版本的唯一声明，目前为 `pnpm@11.25.0`；已移除工作流中的 pnpm 9。
- `.nvmrc` 指定 Node 24 LTS，setup-node 读取它；`engines.node` 仍表示最低兼容要求。
- pnpm 11 使用官方后继 Action `pnpm/setup`，并缓存锁文件对应的依赖仓库。安装显式使用 `--frozen-lockfile`。
- Action 固定完整提交 SHA，并注明版本。2026-09-08 核对：checkout 7.0.1、setup-node 7.0.0、pnpm/setup 2.1.0、upload-artifact 7.0.1。
- 拆分部署时新增 download-artifact 8.0.1，并固定其 release 对应 SHA。
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

PR 的检查结果会显示在页面上；是否强制合并前通过，还取决于仓库现有的分支保护/Ruleset。本次没有修改远程设置。若配置了旧的 `build-and-deploy` 必需检查，应改为 `Check`、`Test` 和 `Build`；不要要求 PR 通过仅 main push 才运行的 Deploy。

## 上游参考与构建警告

参考 [上游 workflow](https://github.com/hansmartensdev/Astro-Rocket/blob/f39a32a31b95fe919ae4c73c58b199b9736f72c8/.github/workflows/deploy.yml) 的质量门禁与构建产物检查。FireStone 保留自己的依赖版本、secrets 和静态 Cloudflare Workers 部署；不引入 Vercel/Netlify 构建矩阵或上游的 Docker 预览/导出验证。

`src/icons/README.md` 保留 astro-icon 默认扫描目录，让新 checkout 能完成本地集合扫描和类型生成。页面 fallback 的 glob 在构建前排除自身和 404，避免无效动态导入；其他页面仍自动参与路由覆盖检查，不依赖 Header/Footer 导航。

## 本次验证记录

2026-09-08（拆分 job）：actionlint 1.7.12、格式检查、相关 lint、类型检查、102 项单元测试、正式构建通过。正式浏览器检查 21 项通过、2 项按未配置功能跳过；隔离双语构建及 23 项浏览器检查通过，两个指定构建警告均消失。正式产物经 tar 打包/解包后逐文件哈希一致，恢复产物的 Wrangler `deploy --dry-run` 通过。未执行远端部署；跨 job 的 artifact 上传/下载仍需下一次 GitHub Actions 运行确认。

2026-09-08：actionlint 1.7.12、冻结依赖安装、格式检查、lint、类型检查、99 项单元测试和构建通过。使用 `CI=true` 与配套 Chromium headless shell，现有工作区配置的浏览器检查 6 项通过、2 项按未配置功能跳过；隔离双语测试 8 项全部通过。修正了测试按 Escape 早于弹窗获得焦点的时序问题，并新增焦点和关闭状态断言。

Wrangler `deploy --dry-run` 通过，没有上传或部署。本地测试环境为 Windows / Node 24.16.0；GitHub Ubuntu runner、缓存和 artifact 的实际远程执行仍需在推送后确认。任务结束时清理了临时内容和测试服务器，保留了用户本轮开始前已开启的 i18n 配置。
