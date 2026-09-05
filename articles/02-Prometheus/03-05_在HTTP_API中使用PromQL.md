# 在HTTP API中使用PromQL

> 分类：Prometheus / 第3章：PromQL
> 原文：https://www.cuiliangblog.cn/detail/section/23396549
> 来源：崔亮的博客

---

## <font style="color:rgb(48, 49, 51);">一、获取targets数据</font>
### <font style="color:rgb(48, 49, 51);">1. prometheus查看targets数据</font>
![](assets/02-Prometheus/e454c03cb94b4681c352.png)

+ <font style="color:rgb(48, 49, 51);">如图所示，现在的prometheus共有三个targets，一个为prometheus，还有两个为Windows</font>

### <font style="color:rgb(48, 49, 51);">2. 使用apifox模拟请求，获取数据</font>
+ <font style="color:rgb(48, 49, 51);">调用</font><font style="color:rgb(48, 49, 51);">http://<prometheus.address>/api/v1/targets</font><font style="color:rgb(48, 49, 51);">并解析</font>

![](assets/02-Prometheus/462f8fb1d2aea415138d.png)

## <font style="color:rgb(48, 49, 51);">二、获取当前时间指标值</font>
<font style="color:rgb(106, 115, 125);">适用于获取服务器的CPU核心数、操作系统内核版本、内存总容量等这些当前状态下的指标值</font>

### <font style="color:rgb(48, 49, 51);">1. prometheus dashboard查询</font>
+ <font style="color:rgb(48, 49, 51);">以查询Linux系统内核版本为例</font>

![](assets/02-Prometheus/73cc68f94e677064b9fb.png)

+ <font style="color:rgb(48, 49, 51);">如图所示，执行</font><font style="color:rgb(48, 49, 51);"> </font><font style="color:rgb(48, 49, 51);">node_uname_info{job="linux",instance="139.***.***.149:9100"}</font><font style="color:rgb(48, 49, 51);"> 查询语句即可。</font>

### <font style="color:rgb(48, 49, 51);">2. 使用apifox模拟请求，获取数据</font>
+ <font style="color:rgb(48, 49, 51);">调用</font><font style="color:rgb(48, 49, 51);">http://<prometheus.address>/api/v1/query?query=<expr></font><font style="color:rgb(48, 49, 51);">，其中expr为prometheus的查询语句。</font>

![](assets/02-Prometheus/641069670cd70086bec2.png)<font style="color:rgb(144, 147, 153);background-color:rgb(246, 248, 250);">  
</font>

## <font style="color:rgb(48, 49, 51);">三、获取时间范围内指标值</font>
<font style="color:rgb(106, 115, 125);">grafana的折线图数据，都是这种使用场景，例如在指定时间范围内的CPU使用率、内存使用率、系统负载等</font>

### <font style="color:rgb(48, 49, 51);">1. prometheus dashboard查询</font>
+ <font style="color:rgb(48, 49, 51);">以查询CPU使用率为例</font>

![](assets/02-Prometheus/24e5820e8d9bcf6ce42c.png)

### <font style="color:rgb(48, 49, 51);">2. 使用apifox模拟请求，获取数据</font>
+ <font style="color:rgb(48, 49, 51);">调用</font><font style="color:rgb(48, 49, 51);">http://<prometheus.address>/api/v1/query_range?query=<expr>&start=<startstamp>&end=<endstamp>&step=<step></font>
+ <font style="color:rgb(48, 49, 51);">expr为prometheus的查询语句</font>
+ <font style="color:rgb(48, 49, 51);">startstamp为范围查询开始时间戳</font>
+ <font style="color:rgb(48, 49, 51);">endstamp为范围查询结束时间戳</font>
+ <font style="color:rgb(48, 49, 51);">step为查询时间间隔（单位为秒）</font>

![](assets/02-Prometheus/7596209eb0b2e0867672.png)<font style="color:rgb(48, 49, 51);">  
</font>![](assets/02-Prometheus/d0970a4b25d7cc807036.png)<font style="color:rgb(144, 147, 153);background-color:rgb(246, 248, 250);"></font>

## <font style="color:rgb(48, 49, 51);">四、获取告警数据</font>
### <font style="color:rgb(48, 49, 51);">1. prometheus查询</font>
![](assets/02-Prometheus/a25f8d73c7ae96df98e4.png)

### <font style="color:rgb(48, 49, 51);">2. 使用apifox模拟请求，获取数据</font>
+ <font style="color:rgb(48, 49, 51);">调用</font><font style="color:rgb(48, 49, 51);">http://<prometheus.address>/api/v1/rules?type=alert</font><font style="color:rgb(48, 49, 51);">并解析</font>

![](assets/02-Prometheus/fcc3044bb2d1a1895278.png)


