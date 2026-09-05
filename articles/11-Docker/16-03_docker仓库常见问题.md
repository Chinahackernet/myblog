# docker仓库常见问题

> 分类：Docker / 第16章：总结
> 原文：https://www.cuiliangblog.cn/detail/section/29821484
> 来源：崔亮的博客

---

1. 仓库（Repository）、注册服务器（Registry）、注册索引（Index）有何关系？
+ 仓库是存放一组关联镜像的集合，比如同一个应用的不同版本的镜像。注册服务器是存放实际的镜像文件的地方。注册索引则负责维护用户的账号、权限、搜索、标签等的管理。因此，注册服务器利用注册索引来实现认证等管理。
2. 从非官方仓库（例如non-official-repo.com）下载镜像时候，有时候会提示“Error:Invalid       registry endpoint [https://non-official-repo.com/v1/……”，怎么办](https://non-official-repo.com/v1/……”，怎么办)？
+ Docker自1.3.0版本往后，加强了对镜像安全性的验证，需要添加私有仓库证书，或者手动添加对非官方仓库的信任。编辑Docker配置文件，在其中添加：DOCKER_OPTS="--insecure-registry       non-official-repo"之后，重启Docker服务即可。


