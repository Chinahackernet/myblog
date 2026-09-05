# 日志服务-journalctl

> 分类：Linux / 第8章：系统管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508212
> 来源：崔亮的博客

---

# journalctl是什么
查询系统日志的工具

# journalctl -xe是什么意思
-xe是排查问题时最常用的参数：

-e  从结尾开始看

-x  相关目录(如:问题相关的网址)

+ journalctl  -xe # -x 是目录(catalog)的意思，在报错的信息下会，附加解决问题的网址     -e  pager-end 从末尾开始看

# 结尾看日志，开头看日志
+ 默认从开头，加-r表示倒序
+ journalctl  -r # -r reverse 从尾部看(推荐)
+ journalctl  # 从开头看(一般用不到，因为都是看最新的日志)

# 滚屏输出日志
+ journalctl  -f -n 20;  # 
1. 时间段的日志
+ journalctl  --since "2020-01-01 20:00:00" --until "2020-02-01  20:15:00"

# 某用户的日志
+ id  root;
+ journalctl  _UID=0 -n 5

# 某个服务的日志
+ journalctl -u httpd.service    # -u  service unit


