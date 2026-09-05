# Metricbeat 仪表盘

> 分类：ELK Stack / 第10章：Metricbeat
> 原文：https://www.cuiliangblog.cn/detail/section/31227070
> 来源：崔亮的博客

---

1. 修改metricbeat配置

```yaml
setup.kibana:
	host:  "192.168.10.50:5601"
```

2. 停止metricbeat服务

systemctl stop metricbeat

3. 安装仪表盘到Kibana

metricbeat setup --dashboards

![](assets/01-ELK-Stack/dd73fd21f5f3b02b69c8.png)

4. 配置kibana仪表盘

![](assets/01-ELK-Stack/71f654bd03cd5376707e.png)

4. 查看仪表盘信息

    ![](assets/01-ELK-Stack/1d9160c03c3dda8b274d.png) 


