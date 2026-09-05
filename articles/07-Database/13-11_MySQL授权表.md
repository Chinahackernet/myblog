# MySQL授权表

> 分类：Database / 第13章：MySQL用户权限管理
> 原文：https://www.cuiliangblog.cn/detail/section/31461141
> 来源：崔亮的博客

---

MySQL服务器启动以后会将下列授权表读取到内存中，作为权限控制的依据

对于全局级别权限的变更和用户密码的变更，需要用户退出会话连接重新登录后才能生效

| **权限级别表** | **级别** | **说明** |
| --- | --- | --- |
| mysql.user | 全局 | 针对服务器已知的每个用户包含一个记录   <br/>*.* |
| mysql.db | 数据库级 | 特定某个数据库 <dbname>.* |
| mysql.tables_priv | 表级 | 特定数据库的某个表<dbname>.<tabname> |
| mysql.columns_priv | 列级 | 特定数据库特定表的某些列 |
|   |   |   |



