# fdisk分区-自动挂载与fstab文件修复

> 分类：Linux / 第7章：磁盘文件管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508173
> 来源：崔亮的博客

---

# 一、/etc/fstab文件
![](assets/10-Linux/deb37564f0fa15525ced.png)

| /dev/mapper/centos00-root   / | 分区设备文件名或UUID（硬盘通用唯一识别码） |
| --- | --- |
| / | 挂载点 |
| xfs | 文件系统名称 |
| deaults | 挂载参数 |
| 0 | 指定分区是否被dump备份，0代表不备份，1代表每天备份，2代表不定期备份 |
| 0 | 指定分区是否被fsck检测，0代表不检测，其他数字代表检测的优先级，那么当然1的优先级比2高 |


# 二、分区自动挂载
[root@localhost ~]# vi /etc/fstab

…省略部分输出…

/dev/sdb5 /disk5 ext4 defaults 1 2

# 三、/etc/fstab文件修复
[root@localhost ~]# mount -o remount,rw /

 


