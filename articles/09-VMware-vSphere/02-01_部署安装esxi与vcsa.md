# 部署安装esxi与vcsa

> 分类：VMware Vsphere / 第2章：安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/31518218
> 来源：崔亮的博客

---

# 一、架构拓扑
+ ![](assets/09-VMware-vSphere/d1a264f7fce8a3ad0a0d.png)

# 二、esxi安装过程
    1. 下载ESXI6.5镜像和client客户端。
+ 将ISO写入到U盘或是刻录光盘然后启动安装。
    1. 开始安装，默认选择第一项，回车安装
+ ![](assets/09-VMware-vSphere/a4ccd5c371c6ed3e6e20.png)
    1. 欢迎界面，回车，安装程序正在检测服务器硬件信息，如果不满足系统安装条件会跳出错误提示。检测完成之后会出现下面界面
+ ![](assets/09-VMware-vSphere/7c699e90a8895152f5bf.png)
+ ![](assets/09-VMware-vSphere/c41128c97bfd5b9466a0.png)
    1. 安装在本地，这里列出了服务器硬盘信息，默认回车，出现下面界面
+ ![](assets/09-VMware-vSphere/9a40d807237ec0ea01ce.png)
    1. 设置登录密码，服务器root账户密码设置（注意：密码长度7位以上
+ ![](assets/09-VMware-vSphere/68b39213868e2e94c956.png)
+ ![](assets/09-VMware-vSphere/1e5b88fa0bc23ad3dc38.png)
    1. 开始安装，按F11
+ ![](assets/09-VMware-vSphere/365141d9bd20bab45662.png)
+ ![](assets/09-VMware-vSphere/dc75c8e21d6ce27167ac.png)
    1. 重启
+ ![](assets/09-VMware-vSphere/31b5c52de559a97ffc88.png)
+ ![](assets/09-VMware-vSphere/d2e8ee07d58db093bf55.png)
    1. 配置过程主要是配置网络，客户端可以登陆。以下是控制台主界面。
+ F2进入配置界面；F12关闭/重启系统，F2关闭确认键，F11重启确认键；Enter保存键，ESC取消键或退出键。
+ ![](assets/09-VMware-vSphere/dc26f44fc43069c7144a.png)
+ ![](assets/09-VMware-vSphere/1b9251e802d652b05699.png)
+ ![](assets/09-VMware-vSphere/2e46a30ff371b8babd5a.png)
    1. 浏览器登录web管理界面
+ ![](assets/09-VMware-vSphere/edac65f8d55019e8e184.png)
+ ![](assets/09-VMware-vSphere/2b7e212498210031309b.png)
+ ![](assets/09-VMware-vSphere/6ed2bf0bc5c84fccef8b.png)
+ ![](assets/09-VMware-vSphere/97490e1911e4a16fc2d1.png)

# 三、vcsa安装
    1. 挂载镜像文件（如果是在物理机中可以使用软碟通将镜像写入U盘或光盘）
+ ![](assets/09-VMware-vSphere/54144a1bf55907a938a6.png)
    1. 打开镜像文件， 选择“installer”打开安装程序
+ ![](assets/09-VMware-vSphere/93eff83e4eb63d4a247e.png)
    1. 查看安装前的简介
+ ![](assets/09-VMware-vSphere/6c98ca7f8cf01192f734.png)
    1. 选择需要进行的操作，由于我们本次安装是初次安装，所以选择“安装”
+ ![](assets/09-VMware-vSphere/2d86fce2e63645963c43.png)
    1. 接受许可，点击“下一步”
+ ![](assets/09-VMware-vSphere/e6a35031944e5b00d134.png)
    1. 如何整个集群不是很大的情况下，使用嵌入式“Platform       Services Controller”即可
+ ![](assets/09-VMware-vSphere/d6f37e50ecdb59764ed9.png)
    1. 输入ESXI主机的地址、端口号、用户名以及密码
+ ![](assets/09-VMware-vSphere/27ed133f43a5490ec8e7.png)
    1. 正在验证
+ ![](assets/09-VMware-vSphere/c2e4a360e473c42f5ca8.png)
    1. 提示警告，我们知道该证书是安全的，所以选择“是”
+ ![](assets/09-VMware-vSphere/bc26215ece9e944bd388.png)
    1. 输入虚拟机的密码（注：不是登录vCetner       Web界面的密码，是VCSA主机的密码）
+ ![](assets/09-VMware-vSphere/6a07834bd027a94f53c8.png)
    1. 选择部署大小，请参考图片中的“部署大小所需资源”进行参考
+ ![](assets/09-VMware-vSphere/a9b0a3478af4a6eafdd0.png)
    1. 输入VCSA主机所用的网络、主机名、IP地址等信息，输入完成后点击“下一步”
+ ![](assets/09-VMware-vSphere/b2f30c93165a60001d29.png)
    1. 选择安装到ESXI主机中的哪个存储上，勾选图中的“启用精简磁盘模式”会实时占用磁盘空间，随着数据的增大，空间会占用的越来越多，如果不勾选则占用前方建议的全部空间，选择完成后点击“下一步”
+ ![](assets/09-VMware-vSphere/85be5fb0633f7c3b1c5c.png)
    1. 确认安装信息，确认无误后点击“下一步”进行安装
+ ![](assets/09-VMware-vSphere/b4ad193fed1ef53b2568.png)
    1. 正在安装中，耐心等待一会儿
+ ![](assets/09-VMware-vSphere/28adc9ab700b65f8d284.png)
    1. 部署完成后是用来浏览器访问“[https://vcsa02.best.com:5480/](https://vcsa02.best.com:5480/)进行第二阶段的配置
+ ![](assets/09-VMware-vSphere/3b9d84562fc8a7a8ce9d.png)
    1. 查看完简介后点击“下一步”
+ ![](assets/09-VMware-vSphere/2d1c06aef4b28712b569.png)
    1. 进行SSO配置，输入Single       Sign-On的域名，管理员密码以及站点名称，输入完成后点击“下一步”
+ ![](assets/09-VMware-vSphere/48dbe276e72105ea1e67.png)
    1. 设置时间同步以及是否启用SSH访问
+ ![](assets/09-VMware-vSphere/dfec3656388e6f2128d4.png)
    1. 确认主机信息，确认无误后点击“完成”
+ ![](assets/09-VMware-vSphere/c3174ea216e05c404e02.png)
+ ![](assets/09-VMware-vSphere/e9526fabd0d4c19edbe8.png)
    1. 提示警告，如已确认填写信息无误，点击“确定”即可
+ ![](assets/09-VMware-vSphere/1005a6ab6b5eaa76fbf4.png)
    1. 稍等片刻
+ ![](assets/09-VMware-vSphere/45c34f35493b071fe2cf.png)
    1. 使用浏览器访问“[https://vcsa02.best.com/vsphere-client/](https://vcsa02.best.com/vsphere-client/)”登录到我们刚刚搭建完成的Linux版本的vCenter       Server，会提示连接不安全，但是我们确认服务器是安全的，所以点击“高级”进行跳过（SSL证书的问题后面会有专文进行介绍以及配置，文档完成后会链接到此处）
+ ![](assets/09-VMware-vSphere/c12800b6df94bb8ff1a1.png)
    1. 用于vCenter       Web需要用到Flush插件，所以点击途中标注的地方，启用插件（仅限谷歌、火狐等浏览器，部分浏览器需要下载并安装Flush插件）
+ ![](assets/09-VMware-vSphere/3d2a945c3c3eae52c14a.png)
    1. 谷歌浏览器点击“启用”即可
+ ![](assets/09-VMware-vSphere/da614340afe5faa962ca.png)
    1. 输入Single       Singn-On的用户名密码即可登录到vCenter Server
+ ![](assets/09-VMware-vSphere/682f0a32cc91b4321f09.png)
    1. 登录成功
+ ![](assets/09-VMware-vSphere/a7ac03c889856af33671.png)

# 四、添加主机以及存储
    1. 开始创建数据中心
+ ![](assets/09-VMware-vSphere/f195d4c46a910c3465a4.png)
    1. 创建数据中心
+ ![](assets/09-VMware-vSphere/60d0a68bc33392c12b6f.png)
    1. 在这里先创建群集
+ ![](assets/09-VMware-vSphere/a71267702d46330fc017.png)
    1. 在弹出的页面输入群集名并根据需要开启相关特性
+ ![](assets/09-VMware-vSphere/a60c45ec46667a871356.png)
    1. 添加主机
+ ![](assets/09-VMware-vSphere/80461f8118c3789d962a.png)
    1. 添加主机名或IP地址
+ ![](assets/09-VMware-vSphere/0edf2b4c8c553102fe6c.png)
    1. 输入该ESXi的用户名和密码
+ ![](assets/09-VMware-vSphere/ebb938d0ddfe494be9e0.png)
    1. 弹出安全警示确认后点击“是”并继续
+ ![](assets/09-VMware-vSphere/bac1595ae1ceef8ed103.png)
    1. 在这里会显示主机摘要，由于是在VMware       Workstation中进行，所以供应商和型号都显示的是VMware
+ ![](assets/09-VMware-vSphere/46ddb0845dc6841d94b9.png)
    1. 分配许可证
+ ![](assets/09-VMware-vSphere/25292eed0303bb25040a.png)
    1. 在这里选择默认就行
+ ![](assets/09-VMware-vSphere/92c4a69a0aea3879f7a3.png)
    1. 确认配置后点击完成即可添加
+ ![](assets/09-VMware-vSphere/6f6289bc54b016496794.png)
    1. 该ESXi主机摘要显示如下
+ ![](assets/09-VMware-vSphere/141a4d448b9d26a5a439.png)
    1. 在VCSA上给另一台ESXi添加存储，进入该主机的配置页，添加软件iSCSI适配器
+ ![](assets/09-VMware-vSphere/44dac5a8b92bc4b0b699.png)
    1. 弹出警示窗口，确认后点击“确定”即可
+ ![](assets/09-VMware-vSphere/f7e3078a28a00eb8d4f3.png)
    1. 添加后显示如下
+ ![](assets/09-VMware-vSphere/dcc775f3d889440baf46.png)
    1. 添加iSCSI target
+ ![](assets/09-VMware-vSphere/45eb7ae303a644697417.png)
    1. 在弹出的窗口中写入iSCSI存储服务器IP
+ ![](assets/09-VMware-vSphere/6fc6903ba868c4e9bcb1.png)
    1. 查看存储设备是否已连接成功
+ ![](assets/09-VMware-vSphere/870a898e06046c1592c4.png)

# 五、虚拟化相关理论
    1. 虚拟化本质特点
    - 分区：每个虚拟机相互独立，互不影响
    - 隔离：各个虚拟机计算、存储、网络资源隔离，互不影响
    - 封装：每个虚拟机封装成vmfs独立的文件
    - 解耦：将硬件解耦，提高兼容性
+ ![](assets/09-VMware-vSphere/0cd9d65495f59f8e470b.png)
    2. vcenter server管理平台
+ ![](assets/09-VMware-vSphere/b0334b3b46d80132c918.png)
    2. vcenter       client
+ ![](assets/09-VMware-vSphere/21b3bf216a57c4eef307.png)


