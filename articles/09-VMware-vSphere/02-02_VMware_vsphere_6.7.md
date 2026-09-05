# VMware vsphere 6.7

> 分类：VMware Vsphere / 第2章：安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/31516628
> 来源：崔亮的博客

---

VMware vsphere 6.7 虚拟化平台搭建及配置

<font style="color:#000000;"></font>

 

目录

[VMware vsphere 6.7 虚拟化平台搭建及配置](#_Toc11341451)

[目录](#_Toc11341452)

[一、       环境规划与准备](#_Toc11341453)

[1.    环境规划](#_Toc11341454)

[2.    软件包准备](#_Toc11341455)

[二、       安装EXSI 6.7](#_Toc11341456)

[1.    创建虚拟机](#_Toc11341457)

[2.    开启虚拟机，安装ESXI](#_Toc11341458)

[3.    配置服务器IP地址](#_Toc11341459)

[4.    浏览器登录ESXI，进行相关设置](#_Toc11341460)

[三、       安装VCSA 6.7](#_Toc11341461)

[1.    下载文件并运行安装向导](#_Toc11341462)

[2.    部署设备](#_Toc11341463)

[3.    设置设备](#_Toc11341464)

[4.    浏览器登录VCSA，进行相关设置](#_Toc11341465)

[5.    添加root用户管理员权限](#_Toc11341466)

[6.    创建虚拟主机](#_Toc11341467)

 

 

<font style="color:#000000;"></font>

 

# 一、环境规划与准备
## 1.   环境规划
| 角色 | CPU | 内存 | 磁盘 | IP |
| --- | --- | --- | --- | --- |
| EXSI-1 | 4 | 4 | 10 | 192.168.1.202 |
| EXSI-2 | 4 | 4 | 10 | 192.168.1.201 |
| VCSA | 8 | 10 | 40 | 192.168.1.200 |


## 2.   <font style="color:white;">软件包准备</font>
1)      EXSI与VCSA下载

[https://my.vmware.com/cn/web/vmware/info/slug/datacenter_cloud_infrastructure/vmware_vsphere/6_7](https://my.vmware.com/cn/web/vmware/info/slug/datacenter_cloud_infrastructure/vmware_vsphere/6_7)

![](assets/09-VMware-vSphere/3421ab67476ae5447daf.png)

# 二、安装EXSI 6.7
## 1.    创建虚拟机
![](assets/09-VMware-vSphere/3e63cb47e7bbb328c838.png)

## 2.   开启虚拟机，安装ESXI
1)       开启电源

![](assets/09-VMware-vSphere/d4f2adf2129221ca348d.png)

2)       选择ESXI启动项

![](assets/09-VMware-vSphere/85ea89050b1303bf3f9b.png)

3)       等待完成加载

![](assets/09-VMware-vSphere/4db5c1e88e7508182c08.png)

4)       系统欢迎界面，按回车继续

![](assets/09-VMware-vSphere/c1295845c9621dafad40.png)

5)       在该安装许可协议界面，按下F11以继续

![](assets/09-VMware-vSphere/9b6a95492a08b4b18fc7.png)

6)       系统会自动检查可用存储设备，之后在该界面选择安装的磁盘位置，回车以继续

![](assets/09-VMware-vSphere/91977669101917249bbe.png)

7)       选择US default(美式)键盘

![](assets/09-VMware-vSphere/f0ec77bab359299bfeb6.png)

8)       继续，输入root密码;注意密码最少为7位。（CHANGE_ME）

![](assets/09-VMware-vSphere/08dd78b65d1b75e4d24e.png)

9)       配置完所有信息后来到该界面，按下F11以开始安装

![](assets/09-VMware-vSphere/714be20abe4696644540.png)

10)    安装完成后，在该界面回车以重启

![](assets/09-VMware-vSphere/baa4c607fffd77950fa6.png)

<font style="color:#2F2F2F;">11)  </font><font style="color:black;">重启完成后进入主界面</font>

![](assets/09-VMware-vSphere/fb76b35522fadebb9777.png)

## 3.   配置服务器IP地址
1)      按下F2键弹出登陆界面

![](assets/09-VMware-vSphere/fb76b35522fadebb9777.png)

2)      在弹出的登陆界面输入root账号、密码，回车登陆

 

![](assets/09-VMware-vSphere/8ad7f0c3c140ccb54b4f.png)

3)      选择 "Configure Management Network"

![](assets/09-VMware-vSphere/c1faec9800afd68df50b.png)

<font style="color:#2F2F2F;">l  </font>**<font style="color:#2F2F2F;">选项作用：</font>**<font style="color:#2F2F2F;">Configure Password </font><font style="color:#2F2F2F;">配置</font><font style="color:#2F2F2F;">root</font><font style="color:#2F2F2F;">密码</font><font style="color:#2F2F2F;">Configure Management Network </font><font style="color:#2F2F2F;">配置网络</font><font style="color:#2F2F2F;">Restart Management Network   </font><font style="color:#2F2F2F;">重启网络</font><font style="color:#2F2F2F;">Test Management Network </font><font style="color:#2F2F2F;">使用</font><font style="color:#2F2F2F;">ping</font><font style="color:#2F2F2F;">测试网络</font><font style="color:#2F2F2F;">Network Restore Options   </font><font style="color:#2F2F2F;">还原配置</font><font style="color:#2F2F2F;">Troubleshooting Options  </font><font style="color:#2F2F2F;">故障排查选项</font><font style="color:#2F2F2F;">View System Logs </font><font style="color:#2F2F2F;">查看系统日志</font><font style="color:#2F2F2F;">Reset System Conf iguration ESXi </font><font style="color:#2F2F2F;">出厂设置</font>

![](assets/09-VMware-vSphere/9126addfef44a0fd3e4c.png)

4)      修改IP地址

![](assets/09-VMware-vSphere/0dea904170a1b5c29541.png)

![](assets/09-VMware-vSphere/270b3c2e20f1c0ed8e8a.png)

![](assets/09-VMware-vSphere/d74e90bde875cc23b0a7.png)

5)   配置完成

## 4.   浏览器登录ESXI，进行相关设置
1)   登录ESXI管理界面

![](assets/09-VMware-vSphere/a907d64537f90eaebc93.png)

![](assets/09-VMware-vSphere/4c569ccf58533c987364.png)

<font style="color:#2F2F2F;">2)      </font><font style="color:black;">激活</font><font style="color:black;">ESXI</font><font style="color:black;">，主机</font><font style="color:black;">-></font><font style="color:black;">管理</font><font style="color:black;">-></font><font style="color:black;">许可</font>

![](assets/09-VMware-vSphere/57c0b3cd4579d415c178.png)

<font style="color:#2F2F2F;">l  </font><font style="color:#2F2F2F;">许可账号：</font><font style="color:#2F2F2F;">HV4WC-01087-1ZJ48-031XP-9A843</font>

![](assets/09-VMware-vSphere/758f6983c0bb20f1812b.png)

# 三、安装VCSA 6.7
## 1.   下载文件并运行安装向导
1)      下载VMware-VCSA文件，用虚拟光驱挂载或者解压运行，选择“安装”

![](assets/09-VMware-vSphere/b7bc6f8b526cf82ff72e.png)

2)      进入安装程序向导

![](assets/09-VMware-vSphere/568cc406455f4e91a44e.png)

## 2.   部署设备
1)      点击安装，接着点击下一步进行部署设备

![](assets/09-VMware-vSphere/11bbc2a6a167dc5aa21f.png)

2)      勾选“我接受许可协议条款”。

![](assets/09-VMware-vSphere/e9c1b8b6a664bab68d16.png)

3)      选择“嵌入式PSC”

![](assets/09-VMware-vSphere/f1b9a9016911c89379f0.png)

4)      指定VCSA 6.7部署到ESXi主机或VC。

![](assets/09-VMware-vSphere/f512f077f1b0f55a2660.png)

5)      提示证书警告，选择“是”。

![](assets/09-VMware-vSphere/703808fc8add24c0fe95.png)

6)      设置VCSA管理密码

![](assets/09-VMware-vSphere/eb58cd7a6acfb67d5b9f.png)

7)      选择部署大小。

![](assets/09-VMware-vSphere/b6eb9f246df34a112374.png)

8)      选择VCSA 6.7虚拟机存储。

![](assets/09-VMware-vSphere/032f36429c78efe1eda3.png)

9)      第12步，配置VCSA 6.7虚拟机网络。

![](assets/09-VMware-vSphere/bc3eca7301dae5ffcb40.png)

10)    确认第1阶段参数。

![](assets/09-VMware-vSphere/91230b3f9fdc5ed7074f.png)

11)    开始第一阶段部署。

![](assets/09-VMware-vSphere/7f9cf1661ddb6cdc7e30.png)

12)    完成第一阶段部署，开始第二阶段部署。

![](assets/09-VMware-vSphere/b73f63124b709bb93c3e.png)

## 3.   设置设备
1)      开始第二阶段配置。

![](assets/09-VMware-vSphere/0e6811728e76c47d2555.png)

2)      配置NTP服务器。

![](assets/09-VMware-vSphere/afb9d8826aa05dabf81e.png)

3)      配置SSO参数。

![](assets/09-VMware-vSphere/fb3b6812a46a959ff595.png)

4)      确认是否加入CEIP。

![](assets/09-VMware-vSphere/6e862f3864408ea8c3ba.png)

5)      确认参数。

![](assets/09-VMware-vSphere/815e559f3e2148a4cd47.png)

6)      确定开始第二阶段部署。

![](assets/09-VMware-vSphere/1363f690ed42041e495e.png)

7)      开始配置。

![](assets/09-VMware-vSphere/db60706b5929c671ce14.png)

8)      服务启动。

![](assets/09-VMware-vSphere/53a1cd2436ee1e8e23ba.png)

9)      查看VCSA 6.7虚拟机控制台。

![](assets/09-VMware-vSphere/67f931ab43839c78ae01.png)

## 4.   浏览器登录VCSA，进行相关设置
1)      VCSA登录。

![](assets/09-VMware-vSphere/14623cf65583cf5e6fcc.png)

2)      HTML5主界面。

![](assets/09-VMware-vSphere/adaeace770e867d1b9a6.png)

3)      添加主机

## 5.   添加root用户管理员权限
1)      登陆用vcenter，打到系统管理并打开

![](assets/09-VMware-vSphere/3a1643211553dae0095d.png)

2)      点击Single Sign On 下的“用户和组”，在右边可以看到用户了

![](assets/09-VMware-vSphere/9b5d622efd61b2a89d12.png)

3)      其中用户分本地和域的用户

![](assets/09-VMware-vSphere/d0c0c3f4964d3f6e9f27.png)

4)      选择部署vcsa时域，然后开始添加用户

![](assets/09-VMware-vSphere/5d7d7c996c05cf4e1bca.png)

5)      设置用户名、密码等信息，确认完成用户添加。用户添加完成后需要授权才能使用。

![](assets/09-VMware-vSphere/403e2a4e6d91d1e8b5e4.png)

6)      点击“全局权限”中的“+”开始添加授权

![](assets/09-VMware-vSphere/bd243f507d6dc7127696.png)

7)      选择要授权的用户，及要添加的权限

![](assets/09-VMware-vSphere/7f87a762b04445360f2e.png)

<font style="color:#333333;">8)      </font>用新建帐户登陆

![](assets/09-VMware-vSphere/a4e5c1822a6199e3e64a.png)

 

## 6.   创建虚拟主机
<font style="color:#333333;">1)      </font>点击虚拟机，创建虚拟机

![](assets/09-VMware-vSphere/3572812a30d6dab531eb.png)

<font style="color:#333333;">2)      </font>选择虚拟机类型

![](assets/09-VMware-vSphere/2fed4f363be6c1f0ea56.png)

3)   这里选Linux，版本选centos6(64位)![](assets/09-VMware-vSphere/a2078c2abbe13e5585dc.png)

4)   先暂时选个存储，等下编辑替换为我们刚才上传的vmdk文件：![](assets/09-VMware-vSphere/ad0ad9849e38d45b8bd7.png)

![](assets/09-VMware-vSphere/34b513a2c50f698ddc6e.png)

![](assets/09-VMware-vSphere/0ed2ddd8ef70cebfe1cc.png)

5)   点完成，刷新一下就能看到刚建好的虚拟机了：

# 四、开启DRS与HA
## 1.   新建集群，添加主机
1)      要想实现DRS和HA功能，先新建群集，再把Esxi主机添加到集群中

![](assets/09-VMware-vSphere/33e71de1ceb51ad6e37f.png)

2)      给集群命名，并把DRS和vSphere HA功能打开，单击”确定“按钮

![](assets/09-VMware-vSphere/47f0fcdc3b6e829fd8a6.png)

3)      右击新建好的群集，单击”添加主机”

![](assets/09-VMware-vSphere/15a354e719f5c6e7798d.png)

4)      选中现有的所有主机，单击”下一页“按钮直到完成即可

![](assets/09-VMware-vSphere/1a083b7e87f7b0337ce6.png)

5)      成功把三台Esxi主机添加到群集

![](assets/09-VMware-vSphere/7c3251ee3c384144dff0.png)

## 2.   配置DRS
1)      对群集的DRS功能编辑设置

![](assets/09-VMware-vSphere/629b378ceb9beac43058.png)

2)      在“自动化”页面中，选择“全自动”

![](assets/09-VMware-vSphere/561c027e48edfbd527c6.png)

3)      在”其他选项”页面上，勾选“虚拟机分布”，单击“确定”按钮

![](assets/09-VMware-vSphere/6c6fe4fb9a65e887d5b1.png)

4)      对HA功能进行编辑设置

![](assets/09-VMware-vSphere/a3c5157b58742c8ee116.png)

5)      在“故障和响应”页面进行相对应的设置，单击”确定“按钮

![](assets/09-VMware-vSphere/4e64d3f2beeb2fb9aa7b.png)

## 3.   配置HA
1)      对Proactive HA进行编辑设置

![](assets/09-VMware-vSphere/2e1f8d7ff646cb260729.png)

2)      开启Proactive HA功能，自动化级别选择”自动“，单击”确定”

![](assets/09-VMware-vSphere/73e31a6b98e8877cc79d.png)

3)      验证HA功能，需要把虚拟机的存储迁移到共享存储服务器上。右击虚拟机VCSA,单击”迁移

![](assets/09-VMware-vSphere/81e63c272406787dc2a4.png)

4)      在”选择迁移类型”页面上，选择“仅更改存储”，单击”NEXT“按钮<font style="color:#3D464D;">  
</font>![](assets/09-VMware-vSphere/5418b6f897793a1b4fe5.png)

5)      在“即将完成”页面中，单击“FINISH”按钮

![](assets/09-VMware-vSphere/5418b6f897793a1b4fe5.png)

6)      验证HA功能，先查看原Win7是运行在哪个Esxi主机上

![](assets/09-VMware-vSphere/ac3405b1669aceb19ee1.png)

6)      <font style="color:#3D464D;">右击</font><font style="color:#3D464D;">”192.168.10.20“</font><font style="color:#3D464D;">主机，依次</font><font style="color:#3D464D;">”</font><font style="color:#3D464D;">维护模式</font><font style="color:#3D464D;">”-->”</font><font style="color:#3D464D;">进入维护模式</font><font style="color:#3D464D;">”</font>

![](assets/09-VMware-vSphere/7e8798e9ba987ed2820d.png)

7)      在”进入维护模式”页面上，单击”确定”按钮进入维护模式

![](assets/09-VMware-vSphere/4b52fd1073d11d1a1a87.png)

8)      <font style="color:#3D464D;">自动进入迁移</font>

![](assets/09-VMware-vSphere/b85fa16b13a7e4e66ad4.png)

 


