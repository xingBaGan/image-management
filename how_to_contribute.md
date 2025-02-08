# How to develop

node version: 20.15.0
nrm use taobao

clone submodule

```bash
git submodule update --init --recursive
```

```bash
git submodule update --remote
```

```bash
cd comfyui_client
npm install
npm run build
```

## Install dependencies

at the root directory
```bash
npm install
```

## Run

at the root directory
```bash
npm run electron:dev
```

## Build

at the root directory
```bash
npm run electron:build
```

