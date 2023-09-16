## Bili-Open-Plain-Server

一个适配[哔哩哔哩直播开放平台](https://open-live.bilibili.com/document/bdb1a8e5-a675-5bfe-41a9-7a7163f75dbf)的无状态服务器

### 配置

`.env`

```env
BILI_APP_ID=<创建应用后获取 APP ID>
BILI_ACCESS_KEY=<申请账号时获取>
BILI_ACCESS_SECRET=<申请账号时获取>

BILI_PORT=8331
```

### 接口

#### `/auth` 验证签名并启动游戏

提审应用时，可以获得签名所需的验证参数

本机测试时可以传入 `Insecure=1`，不会验证 Bilibili 签名 （不安全）

### `/stop` 终止对应游戏

前端调用时，可以通过 `onbeforeunload` 事件发送 `keepalive` 为 `true` 的 fetch 请求，确保此接口被调用

### `/keepalive` 心跳包

如果 60 秒没有收到这个请求，Bilibili 会自动关闭这个游戏，需要启动新的游戏，建议每 20 秒由客户端调用一次
