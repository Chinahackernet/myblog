# Artifactory使用

> 分类：CI/CD / 第3章：Artifactory制品库
> 原文：https://www.cuiliangblog.cn/detail/section/172039867
> 来源：崔亮的博客

---

# 新建仓库
## 新建本地仓库
![](assets/04-CI-CD/69c2f38426e8d77e30ff.png)

## 选择仓库类型
![](assets/04-CI-CD/5318e8cc5c6f9505c2d7.png)

## 填写仓库信息
![](assets/04-CI-CD/a58201994aeb100cfb56.png)

## 查看仓库信息
![](assets/04-CI-CD/31ef651e746a775d5f39.png)

## 修改文件大小限制
<font style="color:rgb(77, 77, 77);">认是限制上传文件大小为100MB，我们把它改成0，即不限制大小</font>

![](assets/04-CI-CD/5b05712d419005705141.png)

# 上传制品到Artifactory
## 通过web页面上传
选择上传的仓库

![](assets/04-CI-CD/ada2f2237f7f32185cff.png)

选择文件

![](assets/04-CI-CD/a353be9899e1bf9c64d9.png)

查看文件信息

![](assets/04-CI-CD/c9fe11dda78385bb52de.png)

## 通过API上传
获取api上传命令

![](assets/04-CI-CD/dd9a43ca2eba31fba1d0.png)

上传文件测试

```bash
[root@client2 ~]# ls
anaconda-ks.cfg
[root@client2 ~]# curl -X PUT -u admin:cmVmdGtuOjAxOjE3NDg4NzUyNzE6d0k0c1VxTDdNZnFMNFBNelhiSUtkY2xtVUNY  -T  anaconda-ks.cfg  "http://192.168.10.76:8082/artifactory/demo/anaconda-ks.cfg"
{
  "repo" : "demo",
  "path" : "/anaconda-ks.cfg",
  "created" : "2024-06-02T10:25:46.892+08:00",
  "createdBy" : "admin",
  "downloadUri" : "http://192.168.10.76:8082/artifactory/demo/anaconda-ks.cfg",
  "mimeType" : "application/octet-stream",
  "size" : "1174",
  "checksums" : {
    "sha1" : "15bce48ca41a1e4841e5a1c76761a61970658627",
    "md5" : "f86bac0477b416f1cc582562c3495ede",
    "sha256" : "34819659c8e124ed029db6a40c80e9b864465f25cc77807de459907cbecec756"
  },
  "originalChecksums" : {
    "sha256" : "34819659c8e124ed029db6a40c80e9b864465f25cc77807de459907cbecec756"
  },
  "uri" : "http://192.168.10.76:8082/artifactory/demo/anaconda-ks.cfg"
  }
```

查看仓库文件信息

![](assets/04-CI-CD/604859c6091193fb2fea.png)


