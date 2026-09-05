## 1\. PromQL

  

Prometheus提供了一种称为PromQL（Prometheus Query Language）的功能查询语言，它使用户可以实时选择和汇总时间序列数据。表达式的结果可以显示为图形，可以在Prometheus的表达式浏览器中显示为表格数据，也可以由外部系统通过HTTP API使用。

  

### 1.1. 查询结果数据类型

  

PromQL的查询或者子查询返回的结果只有四种数据类型：

  

-   瞬时向量(Instant vector) ：一组时间序列，每个时间序列包含一个样本数据，所有样本时间戳相同。如 `node_memory_Active_bytes`

-   区间向量(Range vector) ：一组时间序列，每个时间序列包含多个样本数据。如 `node_memory_Active_bytes[5m]`

-   标量(Scalar)：一个浮点数。NaN(not a number)表示无效的数字，INF(Infinite)表示无穷大

-   字符串(String)：字符串，目前还未使用

  

### 1.2. 时间序列选择器

  

#### 1.2.1. 瞬时向量选择器

  

-   根据指标名称查询出最新的瞬时向量值 `node_cpu_seconds_total` ，返回值有16个，因为有两核心CPU，每个CPU有八个指标

-   通过 `metric_name{label_name <operator> label_name}` 进行筛选，如 `node_cpu_seconds_total{cpu="0",mode="idle"}`

  

操作符有以下几种：

  

```
= 	# 等于
!=	# 不等于
=~  # 等于，匹配正则
!~  # 不等于，匹配正则
```

  

#### 1.2.2. 区间向量选择器

  

-   区间向量选择器是通过 `[durations]` 指定时间区间的

-   瞬时向量返回的样本结果为一个数字，而区间向量选择器返回为一组结果，如 `node_load1[5m]` 返回为以下结果:

  

![](assets/监控与可观测性/02-3-PromQL/02-3-PromQL-1.png)  
Durations 单位如下:

  

```
ms - milliseconds
s - seconds
m - minutes
h - hours
d - days - assuming a day has always 24h
w - weeks - assuming a week has always 7d
y - years - assuming a year has always 365d
```

  

#### 1.2.3. 偏移量

  

-   偏移量是指定查询结果时间范围的偏移量，比如查询五分钟之前的数据，或者前五分钟到十分钟的数据

-   偏移量必须紧跟选择器后面，不能放到函数外面

  

```
node_load1 offset 3m  # 查询三分钟前负载
node_load1 [5m] offset 3m # 查询前八分钟到三分钟的负载
avg(node_cpu_seconds_total{mode="system"} offset 5m)  # 五分钟前CPU使用率
avg(node_cpu_seconds_total{mode="system"})  offset 5m # error
```

  

### 1.3. 操作符

  

```
# label筛选操作符
    = 	# 等于
    !=	# 不等于
    =~  # 等于，正则
    !~  # 不等于，正则
# 运算符
    + (加法)
    - (减法)
    * (乘法)
    / (除法)
    % (求余)
    ^ (幂运算)
# 查询结果过滤
    == (相等)
    != (不相等)
    > (大于)
    < (小于)
    >= (大于等于)
    <= (小于等于)
# 集合操作
	and  	vectorA and vectorB => A ∩ B
	or   	vectorA or  vectorB => A ∪ B
	unless	vectorA unless vectorB => A - B
```

  

### 1.4. 函数

  

#### 1.4.1. 聚合函数

  

```
sum 	# 求和
min 	# 最小值
max 	# 最大值
avg		# 平均值
group (all values in the resulting vector are 1)
stddev	# 标准差
stdvar	# 方差
count 	# 计数
count_values 	# 按value值分组计数
bottomk       # 取n个最小值
topk         	# 取n个最大值
quantile      # 计算分位数(0-1之间)
```

  

```
# 表达式
<aggr-op> [without|by (<label list>)] ([parameter,] <vector expression>) 
<aggr-op>([parameter,] <vector expression>) [without|by (<label list>)]
# 字段
without 	移除label列表
by 			  仅保留指定label
label list	(label1, label2) 或者 (label1, label2,)
parameter	count_values,quantile,topk,bottomk 需要参数
```

  

#### 1.4.2. 内置函数

  

```
rate(v range-vector)		    # 平均每秒的增量，用于counter类型。(v1 - vN)/(t1-tN)，注意是求头尾数据差的均值，体现是结果更加平滑
irate(v range-vector)		    # 平均每秒的增量，用于counter类型。(v1 - v2)/(t1-t2)，注意是求相邻数据差的均值，体现是结果更加抖动
increase(v range-vector)  	# 区间中增量，用于counter类型。v1 - vN 
delta(v range-vector)		    # 区间中差值，用于gauges类型。 v1 - vN
idelta(v range-vector)		  # 区间中差值，用于gauges类型。 v1 - v2
```

  

```
resets(v range-vector)		  # 统计counter重置次数，用于counter类型
sort(v instant-vector)      # 升序排列
sort_desc(v instant-vector) # 降序
timestamp(v instant-vector) # 返回向量的时间戳 %s ，单位 s。
abs(v instant-vector) 		  # 取绝对值
ceil(v instant-vector)		  # 向上取整
floor(v instant-vector)		  # 向下取整
changes(v range-vector)     # 区间向量中变化的次数
round(v instant-vector, to_nearest=1 scalar) # ✖指定倍数(可以是分数to_nearest)后，四舍五入到整数
```

  

```
# 拼接多个src的value到 dst_label标签，连接符为 separator。dst_label和src_label以及连接符需要引号
label_join(v instant-vector, dst_label string, separator string, src_label_1 string, src_label_2 string, ...)

# 标签的正则替换，与 metric_label_config类似
label_replace(v instant-vector, dst_label string, replacement string, src_label string, regex string)
```
---

## 2\. 查询案例

  

配置prometheus-72，greafana-79 两个 node\_exporter , 并且运行以下脚本提高 CPU 负载，推荐在grafana中查询。查询前，需要对 exporter 暴露的指标类型和含义清楚。参考：[https://www.yuque.com/duduniao/ty44wz/pkgsgv#VJCTb](https://www.yuque.com/duduniao/ty44wz/pkgsgv#VJCTb)

  

```bash
#!/bin/bash
# Author: 渡渡鸟
while :
do
    num=$[RANDOM%30+1]
    cpu_count=$[RANDOM%2+1]
    sleep_second=$[RANDOM%15+1]
    stress -c $cpu_count --timeout ${num}s >/dev/null 2>&1 
    sleep $sleep_second
done
```

  

```yaml
# prometheus.yml 
global:
  scrape_interval:     60s
  external_labels:
    monitor: 'codelab-monitor'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  - job_name: 'node'
    static_configs:
      - targets:
          - "10.4.7.72:9100"
          - "10.4.7.79:9100"
    relabel_configs:
      - source_labels: [__address__]
        regex: (.+):[0-9]+
        target_label: host
```

  

### 2.1. node\_exporter

  

```
1.	系统运行时间
		(time()-node_boot_time_seconds)/(60*60)

2.  24h内系统重启过的机器
    avg(resets(node_cpu_seconds_total{mode="idle"}[24h])) by (host) > 0
```

  

```
# CPU 信息
1. 	查询指定机器的负载值
		node_load1{host="10.4.7.72"}
2.	查询机器的CPU核心数
		count(node_cpu_seconds_total{mode="idle"}) by (host)
3. 	查询CPU平均使用率，单位 % 
		100 - avg(irate(node_cpu_seconds_total{mode="idle"}[2m])) by (host) * 100
4.  各个时间段内平均CPU使用率最高的主机
    topk(1, 100 - avg(irate(node_cpu_seconds_total{mode="idle"}[2m])) by (host) * 100)
```

  

```
# 内存信息
1.	系统总内存大小
		node_memory_MemTotal_bytes
    
2.	系统buffer/cache占用内存
		node_memory_Buffers_bytes + node_memory_Cached_bytes

3.	系统内存使用率(grafana中不需要×100，直接选择百分比0-1区间即可)
		(1-(node_memory_MemAvailable_bytes/node_memory_MemTotal_bytes)) * 100
```

  

```
# 文件系统信息
1.	当前各个分区可用空间占比(legend {{ host }}-{{ device }}-{{ mountpoint }} )
		node_filesystem_avail_bytes {fstype=~"ext.*|xfs",mountpoint !~".*pod.*"}
2.	当前各个分区空间剩余比例
		node_filesystem_avail_bytes {fstype=~"ext.*|xfs",mountpoint !~".*pod.*"} / node_filesystem_size_bytes{fstype=~"ext.*|xfs",mountpoint !~".*pod.*"}
3.	当前各个分区inode剩余比例
		node_filesystem_files_free{fstype=~"ext.*|xfs",mountpoint !~".*pod.*"}/node_filesystem_files{fstype=~"ext.*|xfs",mountpoint !~".*pod.*"}
```

  

```
# 文件IO
1.	当前每秒读写速率,可以使用 >0 的条件排除sr0设备
		irate(node_disk_written_bytes_total[2m])
    irate(node_disk_read_bytes_total[2m])
2.	当前每秒读写操作数
		irate(node_disk_reads_completed_total[2m])
    irate(node_disk_writes_completed_total[2m])
3.	当前每秒钟IO上耗时
		irate(node_disk_io_time_seconds_total[2m])
```

  

```
# 网络
1.	当前网络速率，单位是 Byte/s
		irate(node_network_receive_bytes_total{device="ens32"}[2m])  # 下载
    irate(node_network_transmit_bytes_total{device="ens32"}[2m]) # 上传
    
2. 	Establish连接数
		node_netstat_Tcp_CurrEstab
    
3.  timewait连接数
		node_sockstat_TCP_tw
```
---