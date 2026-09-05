# vscode同步文件到服务器

> 分类：Python / 第4章：pycharm
> 原文：https://www.cuiliangblog.cn/detail/section/127771253
> 来源：崔亮的博客

---

# 安装插件
![](assets/08-Python/8e03b980c7a2b0d3ef02.png)

# 配置同步
打开命令面板，搜索配置项

![](assets/08-Python/82c8bc283893335f55ee.png)

修改sftp配置文件

```json
{
    "name": "XXX服务器",
    "host": "XXXXXX",
    "protocol": "sftp",
    "port": XXX,
    "username": "root",
    "password": "XXX",
    "privateKeyPath": "C:/Users/cuiliang/.ssh/id_rsa", // 密码和密钥二选一
    "remotePath": "/root/rsync",
    "uploadOnSave": true,
    "useTempFile": false,
    "openSsh": false,
    "ignore": [
        ".vscode",
        ".git",
        ".DS_Store"
    ],
    "watcher": {
        "files": "**/*",
        "autoUpload": true,
        "autoDelete": true
    }
}

```

打开命令面板，连接服务器

![](assets/08-Python/4da8decd9ea2cc1281d1.png)


