# 常用dockerfile

> 分类：Docker / 第5章：dockerfile
> 原文：https://www.cuiliangblog.cn/detail/section/26458116
> 来源：崔亮的博客

---

# 一、测试使用dockerfile
## 1. centos系统初始化
```dockerfile
FROM centos:latest
RUN rm -rf /etc/yum.repos.d/* && curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-8.repo && yum clean all && yum -y install epel-release vim wget lrzsz gcc gcc-c++ net-tools chrony passwd && yum -y update
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo 'Asia/Shanghai' >/etc/timezone
RUN	echo "set nu" >> ~/.vimrc && echo "set ts=4" >> ~/.vimrc && cat ~/.vimrc
RUN echo 'alias ls="ls --color"' >> ~/.bashrc
```

## 2.使用sleep便于调试
```dockerfile
RUN echo -e "#! /bin/bash\nwhile true\ndo\nsleep 1\ndone" > /sleep.sh
CMD ["sh","/sleep.sh"]
```

## 2.开启sshd服务
```dockerfile
RUN yum install openssh-server passwd -y
RUN /usr/bin/echo "CHANGE_ME" | /usr/bin/passwd --stdin root
RUN /usr/bin/sed -i 's/.session.required.pam_loginuid.so./session optional pam_loginuid.so/g' /etc/pam.d/sshd && /bin/sed -i 's/UsePAM yes/UsePAM no/g' /etc/ssh/sshd_config && /bin/sed -i "s/#UsePrivilegeSeparation.*/UsePrivilegeSeparation no/g" /etc/ssh/sshd_config
RUN ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key && ssh-keygen -t rsa -f /etc/ssh/ssh_host_ecdsa_key && ssh-keygen -t rsa -f /etc/ssh/ssh_host_ed25519_key
EXPOSE 22
RUN echo -e "#! /bin/bash\n/usr/sbin/sshd -D" > /run.sh
CMD ["/usr/sbin/sshd","-D"]
```

## 3.yum安装python38
```dockerfile
RUN yum install python38 python38-devel mysql-devel sudo -y
RUN mkdir /root/.pip/
RUN echo -e "[global]\nindex-url = https://pypi.tuna.tsinghua.edu.cn/simple\n[install]\ntrusted-host=mirrors.aliyun.com" > /root/.pip/pip.conf
```

## 4.源码安装python39
```dockerfile
RUN yum install -y wget gcc make mysql-devel
WORKDIR /tmp
RUN wget  https://www.python.org/ftp/python/3.9.0/Python-3.9.0.tgz
RUN tar -zxf Python-3.9.0.tgz
RUN /tmp/Python-3.9.0/configure --prefix=/usr/local/python3.9.0 --enable-optimizations --with-ssl
RUN make && make install
RUN echo "export PATH=$PATH:/usr/local/python3.9.0/bin" >> /etc/profile
RUN source  /etc/profile
RUN mkdir /root/.pip/
RUN echo -e "[global]\nindex-url = https://pypi.tuna.tsinghua.edu.cn/simple\n[install]\ntrusted-host=mirrors.aliyun.com" > /root/.pip/pip.conf
```




