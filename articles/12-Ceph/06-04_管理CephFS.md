# 管理CephFS

> 分类：Ceph / 第6章：Ceph文件系统
> 原文：https://www.cuiliangblog.cn/detail/section/197252558
> 来源：崔亮的博客

---

在 CephFS 中，可以通过管理目录的配额来限制客户端在文件系统中的存储使用量。CephFS 支持基于**大小**和**文件数**的配额。

# 配额管理
## 配额的使用场景
1. **多用户文件系统**：限制不同用户在文件系统中可以使用的存储空间和文件数。
2. **分布式存储资源管理**：防止某些目录或应用程序消耗过多的资源，影响其他用户。

## 启用目录配额
```bash
ceph fs set myfs max_bytes_per_dir_quota true
ceph fs set myfs max_files_per_dir_quota true
```

+ **客户端挂载方式**：支持通过内核挂载或 FUSE 挂载。

## 设置目录配额
使用以下命令对指定目录设置配额：

### 基于存储大小的配额
设置目录允许的最大存储空间（单位：字节）：

```plain
ceph fs quota set /mydir max_bytes 1073741824
```

以上命令将 `/mydir` 的存储限制为 1 GiB。

### 基于文件数的配额
设置目录允许的最大文件数：

```plain
ceph fs quota set /mydir max_files 1000
```

以上命令将 `/mydir` 的文件数限制为 1000 个。

## 查看配额
查看目录的配额使用情况：

```bash
ceph fs quota ls /mydir
max_files: 1000
max_bytes: 1073741824
bytes_used: 104857600
files_used: 100
```

## 删除配额
如果需要移除配额限制，可以使用以下命令：

```plain
ceph fs quota rm /mydir max_bytes
ceph fs quota rm /mydir max_files
```

## **配额监控**
通过以下命令查看全局的 CephFS 使用情况：

```plain
ceph df
```

查看文件系统的 IO 和元数据统计：

```plain
ceph fs status
```

# 删除 CephFS
## 查看现有的 CephFS
使用以下命令查看 Ceph 文件系统的信息：

```plain
ceph fs ls
```

## 检查文件系统的状态
进一步检查文件系统的详细状态：

```plain
ceph fs status myfs
```

这将显示文件系统的活跃状态、MDS 状态以及相关的池信息。

## 停止文件系统
在删除文件系统前，需要先停止文件系统。执行以下命令：

```plain
ceph fs fail myfs
```

这将停止文件系统并确保不会有新的 I/O 操作进入。

## 删除文件系统
```plain
ceph fs rm myfs --yes-i-really-mean-it
```

此操作会删除文件系统及其关联的元数据池和数据池。

## 验证删除
再次查看文件系统列表以确保删除成功：

```plain
ceph fs ls
```


