# system-module

> 分类：ELK Stack / 第9章：Filebeat
> 原文：https://www.cuiliangblog.cn/detail/section/31224109
> 来源：崔亮的博客

---

# 一、查看内置module
在Filebeat中，有大量的Module，可以简化我们的配置，直接就可以使用，如下：

`# filebeat modules list` 

![](assets/01-ELK-Stack/cc673a163bc36ff31012.png)

# 二、启用系统默认module
1. 启用system的module

`# filebeat modules enable system` 

2. 查看module信息

![](assets/01-ELK-Stack/3836ab208aa2c05afab3.png)

# 三、配置module文件
1. 编辑/etc/filebeat/modules.d/system.yml配置文件
+ 改文件默认定义了系统日志路径，不用再配置

![](assets/01-ELK-Stack/71ccdd55c9198ed6cbf5.png)

2. 编辑filebeat.yml文件

```yaml
filebeat.inputs:
#- type: log 
#  enabled: true
#  paths:
#    - /var/log/*.log
setup.ilm.enabled: false
setup.template.name: "filebeat"
setup.template.pattern: "filebeat-*"
setup.template.overwrite: false
setup.template.settings:
 index.number_of_shards: 2
 index.number_of_replicas: 2
output.elasticsearch:
  # Array of hosts to connect to.
  hosts: ["192.168.10.17:9200","192.168.10.18:9200","192.168.10.19:9200"]
  index: "filebeat-%{+yyyy.MM.dd}"
filebeat.config.modules:
  path: ${path.config}/modules.d/*.yml
 reload.enabled: false
```

# 四、测试验证
![](assets/01-ELK-Stack/94a0d588be1f1c6ec320.png)

 


