---
title: Linux系统综合配置：yum源设置、逻辑卷制作与Ansible(自动化运维)环境搭建及ansible-vault加密配置
---

**前言：这里是生产环境红帽系统，如果是别的系统，本地源的配置方法不一样。**

### 一、主节点服务器Redhat8 配置使用阿里源：

```
备份：sudo /etc/yum.repos.d/CentOS-Base.repo /opt/yum/
下载新的CentOS-Base.repo 到 /etc/yum.repos.d/ （这里用的CentOS 8.0）
命令：sudo wget -O /etc/yum.repos.d/redhat.repo http://mirrors.aliyun.com/repo/Centos-8.repo
清除缓存,生成缓存：yum clean all
生存缓存：yum makecache
```

### 二、各节点服务器创建lvm逻辑卷组：

**1.初始化磁盘为物理卷（PV）**  
`命令：sudo pvcreate /dev/vdb`  
**2.创建卷组（VG）**  
`命令：sudo vgcreate db_vg /dev/vdb`  
**3.创建逻辑卷（LV）**  
`命令：sudo lvcreate -l 100%FREE -n db_lv db_vg`  
**4.格式化逻辑卷为 XFS**  
`命令：sudo mkfs.xfs /dev/db_vg/db_lv`  
**5.挂载逻辑卷到 /db**

```
命令：sudo mkdir -p /db
命令：sudo mount /dev/db_vg/db_lv /db
```

**6.配置自动挂载（可选）**  
`命令：blkid /dev/mapper/db_vg-db_lv`

```
节点1结果：UUID="fdc104f5-......01a7"
节点2结果：UUID="8ccff9a4-......44e8" 
节点3结果：UUID="835b5373-......c851"
```

`命令：sudo vim /etc/fstab`

```
节点1添加：UUID=fdc104f5-......01a7 /db xfs defaults 0 2
节点2添加：UUID=8ccff9a4-......44e8 /db xfs defaults 0 2
节点3添加：UUID=835b5373-......c851 /db xfs defaults 0 2
```

**注意以上结果根据自己当前服务器具体的信息来配置**

**7.每个节点重启sudo reboot验证挂载**  
`命令：df -h | grep /db`

### 三、安装ansible

```
命令：sudo dnf update
命令：sudo dnf install python3
查看版本：python3 -V
```

`命令：sudo dnf install python3-pip`  

`命令：pip3 install ansible --user`  

`命令：sudo systemctl status sshd`  

### 四、配置免密

```
主节点24上生成密钥
ssh-keygen -t rsa
一路回车执行
```

```
向主机分发公钥
ssh-copy-id -i ~/.ssh/id_rsa.pub root@节点1的ip
ssh-copy-id -i ~/.ssh/id_rsa.pub dfuser@节点2的ip
ssh-copy-id -i ~/.ssh/id_rsa.pub dfuser@节点3的ip
```

### 五、验证

在安装ansible环境服务器上输入命令：  
`ansible all -m ping`  
**如果有各节点的返回信息，那就说明环境部署成功**

### 六、配置ansible-vault 加密

生产环境中考虑到安全，需要配置vault加密

### 第一步：配置host文件

`vim /etc/ansible/hosts`

```
[项目名1]
项目1下所有ip
10.0.0.1
......

[项目名2]
项目2下所有ip
10.0.0.100
......
```

### 第二步：编辑secrets.yml，通过ansible-vault加密密码文件

### 1、创建secrets.yml

当使用以下命令创建一个加密的Ansible Vault文件时，Ansible会提示你输入一个密码。这个密码将用于加密和解密secrets.yml文件，确保文件中的敏感信息（如密码、密钥等）安全  
`ansible-vault create secrets.yml`

### 2、编辑 secrets.yml

`ansible-vault edit secrets.yml`  
**提示：**${passwd}是实际服务器密码，根据实际情况修改  
添加以下信息后保存

```
项目名1_password: '${passwd}'
项目名2_password: '${passwd}'
......
```

### 第三步：执行python脚本范例

ansible脚本：test.yml

```
---
- name: 项目1
  hosts: 项目1
  user: 普通用户
  # 引用配置文件
  vars_files:
    - "secrets.yml"
  # 设置变量
  vars:
    ansible_ssh_pass: "{{ lookup('vars', '项目1_password') }}"
    ansible_become_pass: "{{ lookup('vars', '项目1_password') }}"
  tasks:
    - name: just test
      become: yes
      become_user: root
      become_method: sudo
      shell: |
        echo "PermitRootLogin no" >> /etc/ssh/sshd_config
        systemctl restart sshd
- name: 项目2
  hosts: 项目2
  user: 普通用户
  vars_files:
    - "secrets.yml"
  vars:
    ansible_ssh_pass: "{{ lookup('vars', '项目2_password') }}"
    ansible_become_pass: "{{ lookup('vars', '项目2_password') }}"
  tasks:
    - name: just test
      become: yes
      become_user: root
      become_method: sudo
      shell: |
        echo "PermitRootLogin no" >> /etc/ssh/sshd_config
        systemctl restart sshd
- name: 更多项目
  hosts: 更多项目
  user: 普通用户
  vars_files:
    - "secrets.yml"
  vars:
    ansible_ssh_pass: "{{ lookup('vars', '更多项目password') }}"
    ansible_become_pass: "{{ lookup('vars', '更多项目_password') }}"
  tasks:
    - name: just test
      become: yes
      become_user: root
      become_method: sudo
      shell: |
        echo "PermitRootLogin no" >> /etc/ssh/sshd_config
        systemctl restart sshd
```

**执行脚本**  
`ansible-playbook -i /etc/ansible/hosts 3.yml --ask-vault-pass -v`  
-i 指定host文件 --ask-vault-pass 输入secrets.yml的密码，-v 输出执行结果

**最后即兴一首诗总结下：**

```
《Linux 之景》
Linux世界如画卷，技术之美映眼帘。
Yum源似清泉涌，逻辑卷展新景观。
Ansible境如春日，加密守护意绵绵。
科技风景无限好，探索之路永向前。
```
