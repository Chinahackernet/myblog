Helm在Kubernetes中的作用相当于Linux下的Yum工具。它有以下功能：

1.  创建信的chart
2.  chart打包成tgz格式
3.  上次chart到chart仓库或者从仓库下载chart
4.  在kubernetes集群中安装或者卸载chart
5.  管理用helm安装的chart的发布周期

  

其重要概念有：

1.  chart：包含了创建Kubernetes的一个应用实例的必要信息
2.  config：包含了应用发布配置信息
3.  release：是一个 chart 及其配置的一个运行实例