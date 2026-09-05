## CentOS7

红帽企业版 Linux 仓库网站 [https://www.elrepo.org，主要提供各种硬件驱动（显卡、网卡、声卡等）和内核升级相关资源；兼容](https://www.elrepo.org%EF%BC%8C%E4%B8%BB%E8%A6%81%E6%8F%90%E4%BE%9B%E5%90%84%E7%A7%8D%E7%A1%AC%E4%BB%B6%E9%A9%B1%E5%8A%A8%EF%BC%88%E6%98%BE%E5%8D%A1%E3%80%81%E7%BD%91%E5%8D%A1%E3%80%81%E5%A3%B0%E5%8D%A1%E7%AD%89%EF%BC%89%E5%92%8C%E5%86%85%E6%A0%B8%E5%8D%87%E7%BA%A7%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90%EF%BC%9B%E5%85%BC%E5%AE%B9/) CentOS7 内核升级。如下按照网站提示载入elrepo公钥及最新elrepo版本，然后按步骤升级内核（以安装长期支持版本 kernel-lt 为例）

```yaml
# 载入公钥
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
# 安装ELRepo
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-3.el7.elrepo.noarch.rpm
# 载入elrepo-kernel元数据
yum --disablerepo=\* --enablerepo=elrepo-kernel repolist
# 查看可用的rpm包
yum --disablerepo=\* --enablerepo=elrepo-kernel list kernel*
# 安装长期支持版本的kernel
yum --disablerepo=\* --enablerepo=elrepo-kernel install -y kernel-lt.x86_64
# 删除旧版本工具包
yum remove kernel-tools-libs.x86_64 kernel-tools.x86_64 -y
# 安装新版本工具包
yum --disablerepo=\* --enablerepo=elrepo-kernel install -y kernel-lt-tools.x86_64
#查看默认启动顺序
awk -F\' '$1=="menuentry " {print $2}' /etc/grub2.cfg  
CentOS Linux (4.4.183-1.el7.elrepo.x86_64) 7 (Core)  
CentOS Linux (3.10.0-327.10.1.el7.x86_64) 7 (Core)  
CentOS Linux (0-rescue-c52097a1078c403da03b8eddeac5080b) 7 (Core)
#默认启动的顺序是从0开始，新内核是从头插入（目前位置在0，而4.4.4的是在1），所以需要选择0。
grub2-set-default 0  
#重启并检查
reboot
```

## [](https://github.com/baidjay/kubeasz/blob/master/docs/guide/kernel_upgrade.md#ubuntu1604)Ubuntu16.04

```yaml
打开 http://kernel.ubuntu.com/~kernel-ppa/mainline/ 并选择列表中选择你需要的版本（以4.16.3为例）。
接下来，根据你的系统架构下载 如下.deb 文件：
Build for amd64 succeeded (see BUILD.LOG.amd64):
  linux-headers-4.16.3-041603_4.16.3-041603.201804190730_all.deb
  linux-headers-4.16.3-041603-generic_4.16.3-041603.201804190730_amd64.deb
  linux-image-4.16.3-041603-generic_4.16.3-041603.201804190730_amd64.deb
#安装后重启即可
$ sudo dpkg -i *.deb
```