# pg inconsistent(PG副本不一致)

> 分类：Ceph / 第8章：常见故障处理
> 原文：https://www.cuiliangblog.cn/detail/section/199159602
> 来源：崔亮的博客

---

# 问题现象
执行`ceph health detail`有如下输出信息：

```plain
$ ceph health detail
HEALTH_ERR 37 scrub errors; Possible data damage: 1 pg inconsistent
OSD_SCRUB_ERRORS 37 scrub errors
PG_DAMAGED Possible data damage: 1 pg inconsistent
pg 1.dbc is active+clean+inconsistent, acting [55,71,25]
```

1、尝试使用 `ceph pg repaire {pgid}` 进行修复，未完成；

2、尝试找到有问题的OSD，删除对应的object，从其他节点OSD上拷贝对应的object到问题节点，未完成；

3、经过分析查看，pg对应的三幅本数据均存在不一致的状况。

# 原因分析
`ceph pg repair {pgid}` 命令，是Ceph本身自带的修复工具，当多副本数据存在不一致时，是无法通过这个命令来完成修复的。

# 处理过程
需要确认object对应存储文件的角色,以下操作对象为云硬盘快照,确认数据性重要性所执行的操作

1. 查找有问题的object

```plain
rados list-inconsistent-obj {pgid} --format=json-pretty
```

2. 查看问题object在ceph里对应的卷

```plain
for i in 'rbd ls -p volumes';do echo $i; rbd info volumes/$i | grep rbd_data.xxxxx;done
```

3. 确认卷是否存在快照

```plain
rbd snap ls volumes/VOLUMEID
```

4. 查看有没有从快照创建云硬盘

```plain
rbd chiledren volumes/VOLUMEID@CLONEID
```

5. 删除云硬盘和对应的快照以及基于快照创建的云硬盘
6. 刷洗pg数据平衡

```plain
ceph pg deep-scrub {pgid}
ceph pg repair {pgid}
```

# 结果验证
使用`ceph -s`和`ceph health detail`观察集群的状态变为HEALTH_OK。


