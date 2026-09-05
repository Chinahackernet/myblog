# Alertmanager高可用

> 分类：Prometheus / 第7章：集群与高可用
> 原文：https://www.cuiliangblog.cn/detail/section/23468253
> 来源：崔亮的博客

---

# 一、Gossip
1. Alertmanager引入了Gossip机制。Gossip机制为多个Alertmanager之间提供了信息传递的机制。确保及时在多个Alertmanager分别接收到相同告警信息的情况下，也只有一个告警通知被发送给Receiver。

![](assets/02-Prometheus/0356def604314bfacd88.png)

 


