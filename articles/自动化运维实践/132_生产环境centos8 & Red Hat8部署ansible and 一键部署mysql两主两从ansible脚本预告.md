---
title: "生产环境centos8 & Red Hat8部署ansible and 一键部署mysql两主两从ansible脚本预告"
---

### 一、各节点服务器创建lvm逻辑卷组

1.初始化磁盘为物理卷（PV）  
命令：`sudo pvcreate /dev/vdb`  
2.创建卷组（VG）  
命令：`sudo vgcreate db_vg /dev/vdb`  
3.创建逻辑卷（LV）  
命令：`sudo lvcreate -l 100%FREE -n db_lv db_vg`  
4.格式化逻辑卷为 XFS  
命令：`sudo mkfs.xfs /dev/db_vg/db_lv`  
5.挂载逻辑卷到 /db  
命令：`sudo mkdir -p /db`  
命令：`sudo mount /dev/db_vg/db_lv /db`

### 二、配置自动挂载（可选）

命令：`blkid /dev/mapper/db_vg-db_lv`

```
节点1结果：UUID="fdc104f5-e442-4cd6-be1d-......"
节点2结果：UUID="8ccff9a4-01a3-480b-8aa4-......" 
节点3结果：UUID="835b5373-398b-4928-b5de-......"
```

命令：`sudo vim /etc/fstab`

```
节点1添加：UUID=fdc104f5-e442-4cd6-be1d-...... /db xfs defaults 0 2
节点2添加：UUID=8ccff9a4-01a3-480b-8aa4-...... /db xfs defaults 0 2
节点3添加：UUID=835b5373-398b-4928-b5de-...... /db xfs defaults 0 2
```

重启`sudo reboot`验证挂载

### 三、Redhat8 配置使用阿里源

备份：`sudo /etc/yum.repos.d/CentOS-Base.repo /opt/yum/`  
下载新的CentOS-Base.repo 到 /etc/yum.repos.d/ （这里用的CentOS 8.0）  
命令：`sudo wget -O /etc/yum.repos.d/redhat.repo http://mirrors.aliyun.com/repo/Centos-8.repo`  
清除缓存,生成缓存：`yum clean all`  
生存缓存：`yum makecache`  

### 四、安装ansible

命令：`sudo dnf update`  
命令：`sudo dnf install python3`

查看版本：`python3 -V`  

命令：`sudo dnf install python3-pip`  

命令：`pip3 install ansible --user`  

命令：`sudo systemctl status sshd`

### 五、配置免密

主节点1上生成密钥  
`ssh-keygen -t rsa`  
一路回车执行  

向主机分发公钥

```
ssh-copy-id -i ~/.ssh/id_rsa.pub root@节点1
ssh-copy-id -i ~/.ssh/id_rsa.pub root@节点2
ssh-copy-id -i ~/.ssh/id_rsa.pub root@节点3
```

**验证：**  
命令：`ansible all -m ping`  
命令：`ssh 节点1 & 2 & 3`

**下面这张图是一键部署mysql一主两从架构的ansible脚本，另外还有两主两从脚本，下次有机会了再一起细致展示**  

