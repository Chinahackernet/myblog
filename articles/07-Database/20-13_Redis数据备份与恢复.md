# Redis数据备份与恢复

> 分类：Database / 第20章：Redis
> 原文：https://www.cuiliangblog.cn/detail/section/31467466
> 来源：崔亮的博客

---

# 一、数据备份（SAVE）
+ Redis SAVE 命令用于创建当前数据库的备份。
1. 语法

redis Save 命令基本语法如下：

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;"> SAVE </font>

1. 实例

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;"> SAVE   
</font><font style="color:black;">OK</font>

+ 该命令将在 redis      安装目录中创建dump.rdb文件。

# 二、数据备份（BGSAVE）
1. 创建 redis      备份文件也可以使用命令 BGSAVE，该命令在后台执行。
2. 实例

127.0.0.1:6379> BGSAVE

Background saving started

# 三、恢复数据
1. 如果需要恢复数据，只需将备份文件 (dump.rdb) 移动到      redis 安装目录并启动服务即可。获取 redis 目录可以使用 <font style="color:#333333;">CONFIG</font> 命令，如下所示：

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;"> CONFIG GET dir  
</font><font style="color:#006666;">1</font><font style="color:#666600;">) </font><font style="color:#008800;">"dir"</font><font style="color:black;">  
</font><font style="color:#006666;">2</font><font style="color:#666600;">) </font><font style="color:#008800;">"/usr/local/redis/bin"</font>

+ 以上命令 CONFIG      GET dir 输出的 redis 安装目录为 /usr/local/redis/bin。


