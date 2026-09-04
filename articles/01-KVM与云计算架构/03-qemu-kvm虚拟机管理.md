# qemu-kvm 与虚拟机生命周期管理

## 1. 创建实例

```bash
virt-install \
  --name <VM_NAME> \
  --memory 4096 --vcpus 2 \
  --disk path=/var/lib/libvirt/images/<VM_NAME>.qcow2,size=40,format=qcow2 \
  --network network=default,model=virtio \
  --cdrom /var/lib/libvirt/boot/<ISO_FILE>
```

生产创建前明确实例命名、IP、系统盘、数据盘、备份和监控标签。不要把业务数据放在临时安装介质或默认目录中而不做容量规划。

## 2. 生命周期

```bash
virsh list --all
virsh start <VM_NAME>
virsh shutdown <VM_NAME>
virsh reboot <VM_NAME>
virsh destroy <VM_NAME>   # 强制断电，慎用
virsh autostart <VM_NAME>
```

`destroy` 等价于强制断电，可能造成文件系统或数据库损坏，只在正常关机无效且已评估影响时使用。

## 3. 配置与控制台

```bash
virsh dumpxml <VM_NAME> > <VM_NAME>.xml
virsh dominfo <VM_NAME>
virsh console <VM_NAME>
```

修改 XML 前先导出备份；修改后使用 `virsh define` 重新加载并重启验证。控制台登录需要客户机启用串口服务。

## 4. 验证

验证虚拟机状态、客户机 IP、SSH、磁盘容量、时间同步和监控心跳。云平台环境还需核对安全组、配额和计费标签。
