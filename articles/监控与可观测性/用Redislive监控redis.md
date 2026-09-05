> 注意：RedisLive是使用Python2.x编写，建议使用2.7，本次环境为Centos 7.2，默认Python版本2.7。
> 
> 项目地址：[https://github.com/nkrode/RedisLive](https://github.com/nkrode/RedisLive)

  

RedisLive是由python编写的并且开源的图形化监控工具，非常轻量级，核心服务部分只包含一个web服务和一个基于redis自带的info命令以及monitor命令的监控服务，界面上只有一个基于BootStrap的web界面，非常简洁明了。除此之外，它还支持多实例监控，切换方便，而且配置起来也非常容易。监控信息支持redis存储和持久化存储(sqlite)两种方式。

  

（1）、安装pip工具

```shell
yum install epel-release -y
yum install python-pip -y
```

  

（2）、下载项目代码

```shell
# 创建一个工具目录
mkdir /homt/install
# 下载源代码，有两种下载方式
# 第一种
wget https://github.com/kumarnitin/RedisLive/zipball/master
# 然后解压
unzip master -d /opt
# 第二种
git clone https://github.com/kumarnitin/RedisLive.git
mv RedisLive /opt/
```

  

（3）、安装python依赖包

```shell
cd /opt/RedisLive
pip install -r requirements.txt
```

  

（4）、修改配置文件

```shell
cd /opt/RedisLive/src/
cp redis-live.conf.example redis-live.conf
```

  

vim redis-live.conf

```shell
{
    "RedisServers":        
    [ 	# 这里可以配置多个server
        {
              "server": "127.0.0.1",                #redis监听地址，此处为本机
              "port" : 6379,                        #redis端口号
              "password" : "redispassword"          #redis认证密码
        }        
    ],
    # 如果没有redis，可以换成sqlite
    "DataStoreType" : "redis",        

    "RedisStatsServer":    
    {
        "server" : "127.0.0.1",
        "port" : 6379,
        "password" : "redispassword"
    },
    
    "SqliteStatsStore" :
    {
        "path":  "db/redislive.sqlite"    #redis数据文件
    }
}
```

  

（5）启动服务

```shell
./redis-monitor.py --duration=30 &    //启动监控，duration是心跳时间 &放置在后台执行
./redis-live.py                       //启动web服务，默认监听8888端口，可以进行修改
```

[默认web监听在8888，可进行修改，启动redis-monitor.py脚本，并将duration参数设置为 30](https://s2.51cto.com/wyfs02/M00/9E/8A/wKioL1mTCt-DzVD8AABH5oeMObk065.png)

[秒。duration参数指定了监控脚本的运行持续时间，例如设置为 30 秒，即经过 30 秒后，监控脚本会自动退出，并在终端打印 shutting down… 的提示。](https://s2.51cto.com/wyfs02/M00/9E/8A/wKioL1mTCt-DzVD8AABH5oeMObk065.png)

所以我们可以采用定时任务：

```shell
*/5 * * * * cd /opt/RedisLive/src/; ./redis-monitor.py --duration 20 >/dev/null 2>&1
```

  

然后在浏览器上输入：http://IP:8888/index.html 即可查看

![image.png](assets/监控与可观测性/用Redislive监控redis/用Redislive监控redis-1.png)