# 输出到Redis

> 分类：ELK Stack / 第9章：Filebeat
> 原文：https://www.cuiliangblog.cn/detail/section/116208753
> 来源：崔亮的博客

---

新建Filebeat配置文件

```yaml
filebeat.inputs:
- type: log
    enabled: true
    paths:
    - /project/log/*.log
output.redis:
  hosts: ["XXX.XX.XX.XXX:6379"]
  key: log
  password: XXXXX
  db: 6
```

启动Filebeat

```yaml
filebeat -e -c filebeat.yml
```

redis查看数据

![](assets/01-ELK-Stack/abef046499e0f42bcf20.png)


