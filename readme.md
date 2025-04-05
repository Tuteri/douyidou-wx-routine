## 抖一抖去水印使用说明

去水印小程序前端，采用微信原生开发，支持20+平台无水印视频提取，支持m3u8转mp4视频，支持视频MD5修改，支持音频提取，支持队列请求，双token鉴权，持续更新 后端采用若依框架并二次开发支持jdk21+springboot3+mysql8开发，如需后端请联系我，后端提供jar包使用

QQ 2462774332

<img src="http://imgurl.diadi.cn/imgs/2025/03/a9e0576401f9045d.png" style="zoom:50%;" />

### 部署说明

基础库 >= 3.1.5

#### 1. 下载依赖

```
npm install
```

#### 2. 打开微信开发者工具

工具=>构建npm

#### 3.配置请求地址

配置文件 config/config.js

```
baseURL: "https://example.com/api", // 你的 API 地址 以/api结束
```

