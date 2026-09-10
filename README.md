# job-hunting

An Electron application with Vue and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

### 构建python exe

需要安装 python，之后 使用 pip 安装 pyinstaller

```bash
pip install pyinstaller
```

最好安装在全局，或虚拟环境配置在项目根目录
构建 exe

```bash
pnpm buildpy

# 或者
pyinstaller --onefile --name job_crawl --distpath resources --workpath py_build_temp py/job_crawl.py
```

