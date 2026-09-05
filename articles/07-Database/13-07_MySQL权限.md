# MySQL权限

> 分类：Database / 第13章：MySQL用户权限管理
> 原文：https://www.cuiliangblog.cn/detail/section/31461157
> 来源：崔亮的博客

---

# 一、权限级别
全局            *.*            

数据库级     <dbname>.*    

表级            <dbname>.<tabname>

列级

存储过程    <dbname>.<procname>

# 二、权限分类
| **分类** | **权限** | **级别** | **说明** |
| --- | --- | --- | --- |
| 只读类 | **SELECT** | 全局、数据库级、表级 |   |
| 修改类 | **INSERT** | 全局、数据库级、表级 |   |
|   | **UPDATE** | 全局、数据库级、表级 |   |
|   | **DELETE** | 全局、数据库级、表级 |   |
|   | **CREATE** | 全局、数据库级、表级 |   |
|   | **ALTER** | 全局、数据库级、表级 |   |
|   | **DROP** | 全局、数据库级、表级 |   |
| 管理类 | **FILE** | 全局 | 允许用户指示 MySQL 服务器在服务器主机文件<br/>系统中读取和写入文件    |
|   | **PROCESS** | 全局 | 允许用户使用 SHOW PROCESSLIST 语句<br/>查看客户机正在执行的所有语句 |
|   | **SHUTDOWN** | 全局 | 允许用户使用shutdown语句 |
|   | **SUPER** | 全局 | 授予所有特权（但不能向其他用户授予特权） |


 


