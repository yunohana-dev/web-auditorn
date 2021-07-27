うぇぶおじたん
===
[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

定義済みの各サービスに対して、lighthouseでの監査を行うスクリプト。  
サマリの生成と監査結果のjsonを出力する。  
jsonは[lighthouse-viewer][viewer]を通して閲覧可能。

[viewer]: https://googlechrome.github.io/lighthouse/viewer/

<!-- toc -->
- [使い方](#使い方)
- [構成](#構成)

<!-- tocstop -->

使い方
---
`requires Node 10 or above.`
<!-- usage -->
```bash
npm install
npm run-script build
./bin/run.cmd run

npm link # 雑にCLI コマンド化する
```
<!-- usagestop -->

### コマンド
<!-- commands -->
* [`auditorn help [COMMAND]`](#auditorn-help-command)
* [`auditorn run [FILENAME]`](#auditorn-run-file)

#### `auditorn help [COMMAND]`
ヘルプを表示する
```
USAGE
  $ auditorn help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src\commands\help.ts)_

#### `auditorn run [FILENAME]`
サービスへの監査を実行する。
```
USAGE
  $ auditorn run [FILENAME]

ARGUMENTS
  FILENAME  監査対象のサービスが定義されたjsonファイル名

OPTIONS
  -c, --count=count                [default: 1] 試行回数
  -d, --device=desktop|mobile      [default: desktop] デバイス種別
  -h, --help                       helpを表示する
  -l, --headless                   ヘッドレスモードで実行する
  -o, --output                     lighthosueのレポートを出力する
  -t, --throttling=no|lte|3g-fast  [default: no] throttlingを行う
```

_See code: [src\commands\run.ts](https://github.com/wordpress/auditorn/blob/v0.0.1/src\commands\run.ts)_
<!-- commandsstop -->

構成
---
サービスの定義は `/json` 配下で管理している。  
jsonの書式は以下を参照。
```json
{
    "name" : "サービス名",
    "origin" : "サービスのOrigin",
    "cdn-whitelist-cookie": "cdnが透過するCookie名",
    "resources" : [
        {
            "name" : "ページ名",
            "path" : "リソースパス"
        }
    ]
}
```
