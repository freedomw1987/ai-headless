# extensions/

**用途**：Extension 目錄。每個 Extension 一個子目錄。

## 預設 Extension（按 Sprint 順序）

```
extensions/
└── blog/                # Sprint 1（首個範例）
    ├── index.ts         # Extension 入口（defineExtension）
    ├── manifest.json    # Extension 描述（OpenSpec 風格）
    ├── prisma/
    │   └── extension.prisma
    ├── hooks/
    │   ├── before-create.ts
    │   └── after-create.ts
    ├── actions/
    │   └── publish-post.ts
    ├── computed/
    │   └── reading-time.ts
    ├── workflows/
    │   └── post-state-machine.ts
    ├── tests/
    └── README.md        # Extension 使用說明
```

## Extension 規範

詳見 [docs/specs/extension-spec.md](../docs/specs/extension-spec.md)
