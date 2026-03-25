# GitHub 发布说明

当前环境已经把项目改成适合 `GitHub Pages` 的构建方式，并添加了自动部署工作流：

- 构建命令会使用相对路径资源，适合 Pages 站点
- 已添加工作流文件：`.github/workflows/deploy-pages.yml`

## 你需要做的事

1. 在 GitHub 上创建一个新仓库。
2. 把当前目录全部上传到仓库根目录。
3. 默认分支使用 `main`。
4. 打开仓库的 `Settings -> Pages`。
5. 在 `Build and deployment` 中选择 `GitHub Actions`。
6. 把代码推送到 `main` 分支后，等待 Actions 跑完。
7. 发布成功后，页面地址通常会是：
   - `https://你的用户名.github.io/仓库名/`

## 当前阻塞

这台机器现在没有可用的 `git` 或 `gh` 命令，所以我没法直接替你推送到 GitHub。

## 如果你想让我继续

只要你后面完成其中任一项，我就可以继续帮你收尾：

- 安装好 `git`
- 或者把仓库地址发给我并确保当前环境可用 `git`

到那一步后，我可以继续帮你检查发布配置、整理提交内容、确认 Pages 是否上线。
