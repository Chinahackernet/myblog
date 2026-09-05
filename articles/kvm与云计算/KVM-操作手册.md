# KVM安装

## 一、网卡桥接

#### 1、在原网卡上注释掉IP配置，添加一下内容

```plain
BRIDGE=br0
```

#### 2、配置桥接网卡地址

vim ifcfg-br0

```plain
DEVICE="br0"
NM_CONTROLLED="yes"
ONBOOT="yes"
TYPE="Bridge"
BOOTPROTO=none
IPADDR="10.0.0.121"
NETMASK="255.255.255.0"
GATEWAY="10.0.0.2"
DNS1="223.5.5.5"
```

## 二、安装KVM

#### 1、查看CPU是否支持虚拟化

```plain
cat /proc/cpuinfo | grep --color vmx
```

#### 2、安装KVM，设置开机自启

```plain
yum install qemu-kvm libvirt libguestfs-tools virt-install virt-manager libvirt-python -y
systemctl start libvirtd
systemctl enable libvirtd
# 查看
systemctl is-enabled libvirtd
lsmod | grep kvm
```

#### 3、安装VNCserver，便于远程控制

##### （1）、安装

```plain
yum -y install tigervnc tigervnc-server tigervnc-server-module
```

##### （2）、配置VNC服务

```plain
cp /lib/systemd/system/vncserver@.service /lib/systemd/system/vncserver@:1.service> /lib/systemd/system/vncserver@:1.service

vim /lib/systemd/system/vncserver@:1.service
[Unit]
Description=Remote desktop service (VNC)  
After=syslog.target network.target  
[Service]  
Type=forking  
ExecStartPre=/bin/sh -c '/usr/bin/vncserver -kill %i > /dev/null 2>&1 || :'  
ExecStart=/usr/sbin/runuser -l root -c "/usr/bin/vncserver %i"  
PIDFile=/root/.vnc/%H%i.pid  
ExecStop=/bin/sh -c '/usr/bin/vncserver -kill %i > /dev/null 2>&1 || :'  
[Install]  
WantedBy=multi-user.target
```

##### (3)、设置VNC密码

```plain
vncpasswd    P@ssW0rd
```

##### (4)、重载配置，启动服务

```plain
systemctl daemon-reload
systemctl start vncserver@:1.service && systemctl enable vncserver@:1.service

# 查看
systemctl is-enabled vncserver@:1.service

# 如果启动报错            rm -rf /tmp/.X11-unix/*            然后再启动
```

## 三、在KVM上安装系统

### 1、安装windows

```plain
virt-install --name=win2008  --ram 512 --vcpus=1 --disk path=/var/lib/libvirt/images/win2008.img,size=30 --accelerate --cdrom /var/lib/libvirt/images/zh-\ Hans_windows_server_2008_datacenter_enterprise_standard_x86_dvd_x14-26742.iso --vnc --vncport=5917 --vnclisten=0.0.0.0 --network bridge=br0,model=virtio --noautoconsole

# 说明：
name:虚拟机名
ram：内存大小
vcpus：cpu核心数
disk path:虚拟机安装路径
cdrom：光盘镜像
vnc:指定vnc
vncport:指定vnc端口
vnclisten:监听地址
bridge:桥接模式
```

 windows下用tightVNC viewer  远程连接10.0.0.121:5917  进行图形化安装

### 2、安装Linux

```plain
virt-install --name=centos7-1  --ram 1024 --vcpus=1 --disk path=/data/centos7-1.img,size=15 --accelerate --cdrom /data/CentOS-7-x86_64-DVD-1708\(1\).iso --vnc --vncport=5917 --vnclisten=0.0.0.0 --network bridge=br0,model=virtio --noautoconsole
```

## 四、虚拟机扩容

#### （1）、直接扩容

```plain
virsh shutdown test01.qcow2        //先关机
qemu-img info test01.qcow2
qemu-img resize test01.qcow2 +200G
```

#### （2）、在线扩容

```plain
# 查看现有磁盘
virsh domblklist centos7-1
# 创建一块qcow2虚拟磁盘
qemu-img create -f qcow2 /data/centos7-1.img 1G
# 在线添加这台qcow2虚拟磁盘
virsh attach-disk centos7-1 /data/centos7-1.img vdb --cache=none --subdriver=qcow2
```

## 五、配置更改

#### （1）、更改内存

```plain
# 1. 查看虚拟机当前内存
[root@sh-kvm-1 ~]# virsh dominfo kvm-1 | grep memory
Max memory:     4194304 KiB
Used memory:    4194304 KiB

# 2、动态设置内存为512MB，内存减少
virsh setmem kvm-1 524288
# 注意单位必须是KB

# 3、查看内存变化
# virsh dominfo kvm-1 | grep memory
Max memory: 14194304 KiB
Used memory: 524288 kiB

# 4、内存增加
virsh shutdown kvm-1
virsh edit kvm-1  # 直接更改memory
virsh create /etc/libvirt/demu/kvm-1/xml
# 之后操作1,2,3步骤增加内存
```

#### （2）、更改CPU

```plain
virsh shutdown kvm-1
virsh edit kvm-1
#  <vcpu>2</vcpu>  # 4 > 2
virsh create /etc/libvirt/demu/kvm-1/xml
```

## 六、KVM基本操作

#### （1）、查看虚拟机

```plain
# 查看运行的虚拟机
virsh list
# 查看所有虚拟机
virsh list --all
```

#### （2）、启动虚拟机

```plain
# 启动虚拟机
virsh start kvm-1
# 设置开机自启动
virsh autostart kvm-1
# 取消开机自启动
virsh autostart --disable kvm-1
```

#### （3）、连接虚拟机

```plain
# 连接
virsh console kvm-1
# 推出
ctrl+]
```

#### （4）、关闭虚拟机

```plain
virsh shutdown kvm-1
```

#### （5）、删除虚拟机

```plain
# 第一步，停掉虚拟机
virsh shutdown kvm-1
# 第二步
virsh destroy kvm-1
# 第三步
virsh undefine kvm-1
# 第四步
rm /dev/vg_shkvm1/kvm-1  # 不建议删除硬盘
```

#### （6）、快照管理

```plain
virsh snapshot-create 虚拟机            //创建快照
virsh snapshot-list --domain  虚拟机                //快照信息
virsh snapshot-revert 虚拟机 快照名        //恢复快照
virsh snapshot-delete --domain newframe --snapshotname 1520411749    删除快照
```