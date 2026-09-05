# backfill toofull(集群空间满)

> 分类：Ceph / 第8章：常见故障处理
> 原文：https://www.cuiliangblog.cn/detail/section/199159452
> 来源：崔亮的博客

---

# 问题现象
执行`ceph -s`时会出现如下内容的报错：

```bash
$ ceph -s
health HEALTH_WARN 2 pgs backfill_toofull; 2 pgs stuck unclean; recovery 20681/5338044 objects degraded (0.387%); 6 near full osd(s)
monmap e7: 3 mons at {server-61.0.lg.ustack.in=10.1.0.61:6789/0,server-62.0.lg.ustack.in=10.1.0.62:6789/0,server-63.0.lg.ustack.in=10.1.0.63:6789/0}, election epoch 2050, quorum 0,1,2 server-61.0.lg.ustack.in,server-62.0.lg.ustack.in,server-63.0.lg.ustack.in
osdmap e193002: 216 osds: 216 up, 216 in
pgmap v53275710: 12288 pgs, 2 pools, 23456 GB data, 1737 kobjects
      72246 GB used, 251 TB / 321 TB avail
      20681/5338044 objects degraded (0.387%)
      12286 active+clean
      2 active+remapped+backfill_toofull
      client io 35704 kB/s rd, 63861 kB/s wr, 9060 op/s
```

# 原因分析
Ceph有磁盘保护机制，当磁盘使用率超过 `osd_backfill_full_ratio = 0.85` 的设置，0.85这个是集群默认的配置。以osd.1为例，可以通过以下命令对这个值进行查询：

```bash
$ ceph daemon osd.1 config show | grep osd_backfill_full_ratio
  "osd_backfill_full_ratio": "0.85",
```

**场景一** 当前集群的OSD使用率比较高，有其中一个OSD对应的磁盘出现故障，这时集群会自动进行数据平衡，把数据平衡到其他的OSD，此时如果使用率达>到0.85，那么数据就不会backfill到对应的OSD

**场景二** 当前集群的OSD使用率比较高，此时增加了新的OSD，而仍有新的数据写入，此时集群在进行数据平衡时也是有可能部分OSD的使用率超过0.85

**场景三** 当前集群的OSD使用率比较高，没有磁盘故障和新加磁盘的操作，新的数据写入后，集群OSD的使用率超过0.85

# 处理过程
当集群出现backfill_toofull时有可能是数据平衡导致部分OSD的使用率临时比较高，建议通过 `ceph -s` 命令先观察一段时间，看看是否有PG还在进行backfill的操作。如果有这种状态，建议观察一段时间，看看是否能够恢复正常。如果过了一段时间之后集群状态静止，没有再进行backfill的操作，对应的状态可以参考故障描述中提供的状态信息，到了不调整 `osd_backfill_full_ratio` 就过不去的时候，可以参考以下方案先临时调高 `osd_backfill_full_ratio` 的值再对集群状态进行观察。不过在调整时，建议这个值不要一下调整的太高，建议一点点的往上调，同时调整的上限不要超过0.9，否则是有可能对集群造成不可预料的影响的。

找出PG对应的UP set和acting set，然后确认这些OSD的磁盘利用率是否已经超过 `osd_backfill_full_ratio` 的设置。

```bash
$ ceph pg dump|grep "active+remapped+backfill_toofull"
```

找到对应的OSD之后使用以下命令，调高一些

```bash
$ ceph tell osd.155 injectargs '--osd_backfill_full_ratio 0.87'
```

如果拿不准需要调高哪些OSD，也可以临时调高所有的OSD

```bash
$ ceph tell osd.* injectargs '--osd_backfill_full_ratio 0.87'
```

等到PG recovery完成之后，重新将其调整过来

```bash
$ ceph tell osd.* injectargs '--osd_backfill_full_ratio 0.85'
```

出现backfill_toofull意味着OSD的使用率比较高，建议如果此时集群整体的OSD使用率比较高的话，可以考虑对集群进行一下扩容。

# 结果验证
通过`ceph -s`或`ceph health detail`确认集群状态为HEALTH_OK


