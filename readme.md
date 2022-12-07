# 机器人 （分为后端，前端）
## 后端 git地址:  https://gitlab.com/tuofaninfo/pair-bot
```text
api实现简要说明
    策略管理api
    apiUrl: /bot/config/create      创建机器人策略
    apiUrl: /bot/config/update      更新机器人策略
    apiUrl: /bot/config/list        策略列表
    apiUrl: /bot/config/deleteBotConfig      删除策略
    
    机器人启停api
    apiUrl: /bot/manager/start       启动某个机器人(通过子进程 forever 启动策略机器人)  
    apiUrl: /bot/manager/stop        停止某个机器人(通过子进程 forever 停止策略机器人)  

```
# 前端 git地址： https://gitlab.com/tuofaninfo/pair-bot-front
```text
功能：
1 策略维护（新增，修改）
2 启停机器人
```

# 启动和使用方法：
```text
1 启动后端 node server.js
2 访问url地址 http://localhost:3000/index.html  线上地址待确认
3 通过页面新增或修改机器人配置
4 通过【启动】【停止】来操作具体的机器人
```
