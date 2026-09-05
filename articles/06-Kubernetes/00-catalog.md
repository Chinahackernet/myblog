# Kubernetes
来源：https://www.cuiliangblog.cn/catalog/1939058

## 第1章：基础知识
- [1. Kubernetes特性](articles/06-Kubernetes/01-01_Kubernetes特性.md)
- [2. 概念和术语](articles/06-Kubernetes/01-02_概念和术语.md)
- [3. 集群组件](articles/06-Kubernetes/01-03_集群组件.md)
- [4. 抽象对象](articles/06-Kubernetes/01-04_抽象对象.md)
- [5. 镜像文件下载](articles/06-Kubernetes/01-05_镜像文件下载.md)

## 第2章：kubeadm集群安装部署
- [1. 安装概述](articles/06-Kubernetes/02-01_安装概述.md)
- [2. 环境准备(RHEL)](articles/06-Kubernetes/02-02_环境准备-RHEL-.md)
- [3. 环境准备(Debian)](articles/06-Kubernetes/02-03_环境准备-Debian-.md)
- [4. 安装容器运行时(Docker)](articles/06-Kubernetes/02-04_安装容器运行时-Docker-.md)
- [5. 安装容器运行时(Containerd)](articles/06-Kubernetes/02-05_安装容器运行时-Containerd-.md)
- [6. Containerd进阶使用](articles/06-Kubernetes/02-06_Containerd进阶使用.md)
- [7. 安装Kubernets集群](articles/06-Kubernetes/02-07_安装Kubernets集群.md)

## 第3章：周边组件安装部署
- [1. 部署Harbor私有镜像仓库](articles/06-Kubernetes/03-01_部署Harbor私有镜像仓库.md)
- [2. 部署Helm包管理工具](articles/06-Kubernetes/03-02_部署Helm包管理工具.md)
- [3. 部署Ingress-nginx代理](articles/06-Kubernetes/03-03_部署Ingress-nginx代理.md)
- [4. 部署Traefik代理](articles/06-Kubernetes/03-04_部署Traefik代理.md)
- [5. 部署Kong Ingress 代理](articles/06-Kubernetes/03-05_部署Kong_Ingress_代理.md)
- [6. 部署Calico网络组件](articles/06-Kubernetes/03-06_部署Calico网络组件.md)
- [7. 部署NodeLocalDNS解析](articles/06-Kubernetes/03-07_部署NodeLocalDNS解析.md)
- [8. 部署LocalPathProvisioner本地存储](articles/06-Kubernetes/03-08_部署LocalPathProvisioner本地存储.md)
- [9. 部署NFS共享文件存储](articles/06-Kubernetes/03-09_部署NFS共享文件存储.md)
- [10. 部署MinIO对象存储](articles/06-Kubernetes/03-10_部署MinIO对象存储.md)
- [11. 部署Ceph分布式存储](articles/06-Kubernetes/03-11_部署Ceph分布式存储.md)
- [12. 部署Dashboard管理面板](articles/06-Kubernetes/03-12_部署Dashboard管理面板.md)
- [13. 部署Metrics监控组件](articles/06-Kubernetes/03-13_部署Metrics监控组件.md)
- [14. 部署Prometheus监控](articles/06-Kubernetes/03-14_部署Prometheus监控.md)
- [15. 部署Thanos监控](articles/06-Kubernetes/03-15_部署Thanos监控.md)
- [16. 部署VictoriaMetrics监控](articles/06-Kubernetes/03-16_部署VictoriaMetrics监控.md)
- [17. 部署ELK日志收集](articles/06-Kubernetes/03-17_部署ELK日志收集.md)
- [18. 部署Loki日志收集](articles/06-Kubernetes/03-18_部署Loki日志收集.md)
- [19. 部署MySQL数据库](articles/06-Kubernetes/03-19_部署MySQL数据库.md)
- [20. 部署PostgreSQL数据库](articles/06-Kubernetes/03-20_部署PostgreSQL数据库.md)
- [21. 部署Redis数据库](articles/06-Kubernetes/03-21_部署Redis数据库.md)
- [22. 部署Kafka消息队列](articles/06-Kubernetes/03-22_部署Kafka消息队列.md)
- [23. 部署Rabbit MQ消息队列](articles/06-Kubernetes/03-23_部署Rabbit_MQ消息队列.md)

## 第4章：kubectl命令
- [1. 命令格式](articles/06-Kubernetes/04-01_命令格式.md)
- [2. node操作常用命令](articles/06-Kubernetes/04-02_node操作常用命令.md)
- [3. pod常用命令](articles/06-Kubernetes/04-03_pod常用命令.md)
- [4. 控制器常用命令](articles/06-Kubernetes/04-04_控制器常用命令.md)
- [5. service常用命令](articles/06-Kubernetes/04-05_service常用命令.md)
- [6. 存储常用命令](articles/06-Kubernetes/04-06_存储常用命令.md)
- [7. 日常命令总结](articles/06-Kubernetes/04-07_日常命令总结.md)

## 第5章：资源对象
- [1. K8S中的资源对象](articles/06-Kubernetes/05-01_K8S中的资源对象.md)
- [2. yuml文件](articles/06-Kubernetes/05-02_yuml文件.md)
- [3. k8s yaml字段大全](articles/06-Kubernetes/05-03_k8s_yaml字段大全.md)
- [4. 管理Namespace资源](articles/06-Kubernetes/05-04_管理Namespace资源.md)
- [5. 标签与标签选择器](articles/06-Kubernetes/05-05_标签与标签选择器.md)
- [6. Pod资源对象](articles/06-Kubernetes/05-06_Pod资源对象.md)
- [7. Pod生命周期与探针](articles/06-Kubernetes/05-07_Pod生命周期与探针.md)
- [8. 资源需求与限制](articles/06-Kubernetes/05-08_资源需求与限制.md)
- [9. Pod服务质量（优先级）](articles/06-Kubernetes/05-09_Pod服务质量（优先级）.md)

## 第6章：资源控制器
- [1. Pod控制器](articles/06-Kubernetes/06-01_Pod控制器.md)
- [2. ReplicaSet控制器](articles/06-Kubernetes/06-02_ReplicaSet控制器.md)
- [3. Deployment控制器](articles/06-Kubernetes/06-03_Deployment控制器.md)
- [4. DaemonSet控制器](articles/06-Kubernetes/06-04_DaemonSet控制器.md)
- [5. Job控制器](articles/06-Kubernetes/06-05_Job控制器.md)
- [6. CronJob控制器](articles/06-Kubernetes/06-06_CronJob控制器.md)
- [7. StatefulSet控制器](articles/06-Kubernetes/06-07_StatefulSet控制器.md)
- [8. PDB中断预算](articles/06-Kubernetes/06-08_PDB中断预算.md)

## 第7章：Service和Ingress
- [1. Service资源介绍](articles/06-Kubernetes/07-01_Service资源介绍.md)
- [2. 服务发现](articles/06-Kubernetes/07-02_服务发现.md)
- [3. Service(ClusterIP)](articles/06-Kubernetes/07-03_Service-ClusterIP-.md)
- [4. Service(NodePort)](articles/06-Kubernetes/07-04_Service-NodePort-.md)
- [5. Service(LoadBalancer)](articles/06-Kubernetes/07-05_Service-LoadBalancer-.md)
- [6. Service(ExternalName)](articles/06-Kubernetes/07-06_Service-ExternalName-.md)
- [7. 自定义Endpoints](articles/06-Kubernetes/07-07_自定义Endpoints.md)
- [8. Headless Service](articles/06-Kubernetes/07-08_Headless_Service.md)
- [9. Ingress资源](articles/06-Kubernetes/07-09_Ingress资源.md)
- [10. nginx-Ingress案例](articles/06-Kubernetes/07-10_nginx-Ingress案例.md)

## 第8章：Traefik
- [1. 知识点梳理](articles/06-Kubernetes/08-01_知识点梳理.md)
- [2. 简介](articles/06-Kubernetes/08-02_简介.md)
- [3. 部署与配置](articles/06-Kubernetes/08-03_部署与配置.md)
- [4. 路由(IngressRoute)](articles/06-Kubernetes/08-04_路由-IngressRoute-.md)
- [5. 中间件(Middleware)](articles/06-Kubernetes/08-05_中间件-Middleware-.md)
- [6. 服务(TraefikService)](articles/06-Kubernetes/08-06_服务-TraefikService-.md)
- [7. 插件](articles/06-Kubernetes/08-07_插件.md)
- [8. traefik hub](articles/06-Kubernetes/08-08_traefik_hub.md)
- [9. 配置发现(Consul)](articles/06-Kubernetes/08-09_配置发现-Consul-.md)

## 第9章：存储
- [1. 配置集合ConfigMap](articles/06-Kubernetes/09-01_配置集合ConfigMap.md)
- [2. 敏感信息Secret](articles/06-Kubernetes/09-02_敏感信息Secret.md)
- [3. 临时存储emptyDir](articles/06-Kubernetes/09-03_临时存储emptyDir.md)
- [4. 节点存储hostPath](articles/06-Kubernetes/09-04_节点存储hostPath.md)
- [5. 持久存储卷pv/pvc](articles/06-Kubernetes/09-05_持久存储卷pv_pvc.md)
- [6. downwardAPI元数据](articles/06-Kubernetes/09-06_downwardAPI元数据.md)
- [7. 本地持久化存储local pv](articles/06-Kubernetes/09-07_本地持久化存储local_pv.md)

## 第10章：网络
- [1. 网络概述](articles/06-Kubernetes/10-01_网络概述.md)
- [2. 网络类型](articles/06-Kubernetes/10-02_网络类型.md)
- [3. flannel网络插件](articles/06-Kubernetes/10-03_flannel网络插件.md)
- [4. 网络策略](articles/06-Kubernetes/10-04_网络策略.md)
- [5. 网络与策略实例](articles/06-Kubernetes/10-05_网络与策略实例.md)

## 第11章：安全
- [1. 安全上下文](articles/06-Kubernetes/11-01_安全上下文.md)
- [2. 访问控制](articles/06-Kubernetes/11-02_访问控制.md)
- [3. 认证](articles/06-Kubernetes/11-03_认证.md)
- [4. 鉴权](articles/06-Kubernetes/11-04_鉴权.md)
- [5. 准入控制](articles/06-Kubernetes/11-05_准入控制.md)
- [6. 示例](articles/06-Kubernetes/11-06_示例.md)

## 第12章：pod调度
- [1. 调度器概述](articles/06-Kubernetes/12-01_调度器概述.md)
- [2. label标签调度](articles/06-Kubernetes/12-02_label标签调度.md)
- [3. node亲和调度](articles/06-Kubernetes/12-03_node亲和调度.md)
- [4. pod亲和调度](articles/06-Kubernetes/12-04_pod亲和调度.md)
- [5. 污点和容忍度](articles/06-Kubernetes/12-05_污点和容忍度.md)
- [6. 固定节点调度](articles/06-Kubernetes/12-06_固定节点调度.md)

## 第13章：系统扩展
- [1. 自定义资源类型（CRD）](articles/06-Kubernetes/13-01_自定义资源类型（CRD）.md)
- [2. 自定义控制器](articles/06-Kubernetes/13-02_自定义控制器.md)

## 第14章：资源指标与HPA
- [1. 监控组件安装与使用](articles/06-Kubernetes/14-01_监控组件安装与使用.md)
- [2. 自动弹性缩放(HPA)](articles/06-Kubernetes/14-02_自动弹性缩放-HPA-.md)
- [3. HPA操作实践(内置指标)](articles/06-Kubernetes/14-03_HPA操作实践-内置指标-.md)
- [4. HPA操作实践(自定义指标)](articles/06-Kubernetes/14-04_HPA操作实践-自定义指标-.md)
- [5. 基于KEDA实现HPA](articles/06-Kubernetes/14-05_基于KEDA实现HPA.md)

## 第15章：helm
- [1. helm基础与部署](articles/06-Kubernetes/15-01_helm基础与部署.md)
- [2. helm常用命令](articles/06-Kubernetes/15-02_helm常用命令.md)
- [3. Helm Charts](articles/06-Kubernetes/15-03_Helm_Charts.md)
- [4. 自定义Charts](articles/06-Kubernetes/15-04_自定义Charts.md)
- [5. helm导出yaml文件](articles/06-Kubernetes/15-05_helm导出yaml文件.md)
- [6. helm上传到harbor chart](articles/06-Kubernetes/15-06_helm上传到harbor_chart.md)

## 第16章：k8s高可用部署
- [1. kubeadm高可用部署](articles/06-Kubernetes/16-01_kubeadm高可用部署.md)
- [2. 离线二进制部署k8s](articles/06-Kubernetes/16-02_离线二进制部署k8s.md)
- [3. 其他高可用部署方式](articles/06-Kubernetes/16-03_其他高可用部署方式.md)

## 第17章：日常维护
- [1. 修改节点pod个数上限](articles/06-Kubernetes/17-01_修改节点pod个数上限.md)
- [2. 修改数据目录](articles/06-Kubernetes/17-02_修改数据目录.md)
- [3. 集群证书过期续期](articles/06-Kubernetes/17-03_集群证书过期续期.md)
- [4. 更改证书有效期](articles/06-Kubernetes/17-04_更改证书有效期.md)
- [5. 节点维护](articles/06-Kubernetes/17-05_节点维护.md)
- [6. k8s版本升级](articles/06-Kubernetes/17-06_k8s版本升级.md)
- [7. 添加work节点](articles/06-Kubernetes/17-07_添加work节点.md)
- [8. master节点启用pod调度](articles/06-Kubernetes/17-08_master节点启用pod调度.md)
- [9. 集群以外节点控制k8s集群](articles/06-Kubernetes/17-09_集群以外节点控制k8s集群.md)
- [10. 集群节点重新加入](articles/06-Kubernetes/17-10_集群节点重新加入.md)
- [11. 日常错误排查](articles/06-Kubernetes/17-11_日常错误排查.md)
- [12. ETCD节点故障修复](articles/06-Kubernetes/17-12_ETCD节点故障修复.md)
- [13. 集群hosts记录](articles/06-Kubernetes/17-13_集群hosts记录.md)
- [14. ns处于Terminating状态删除](articles/06-Kubernetes/17-14_ns处于Terminating状态删除.md)
- [15. Velero集群备份还原与迁移](articles/06-Kubernetes/17-15_Velero集群备份还原与迁移.md)
- [16. kustomize多环境管理](articles/06-Kubernetes/17-16_kustomize多环境管理.md)
- [17. kubectl多集群管理](articles/06-Kubernetes/17-17_kubectl多集群管理.md)
- [18. apiserver 证书添加 certSANs IP](articles/06-Kubernetes/17-18_apiserver_证书添加_certSANs_IP.md)

## 第18章：OpenTelemetry可观测性
- [1. 可观测性与链路追踪介绍](articles/06-Kubernetes/18-01_可观测性与链路追踪介绍.md)
- [2. OpenTelemetry部署](articles/06-Kubernetes/18-02_OpenTelemetry部署.md)
- [3. 应用埋点(Instrumentation)](articles/06-Kubernetes/18-03_应用埋点-Instrumentation-.md)
- [4. 数据收集(Collector)](articles/06-Kubernetes/18-04_数据收集-Collector-.md)
- [5. 链路追踪数据收集与导出](articles/06-Kubernetes/18-05_链路追踪数据收集与导出.md)
- [6. 指标数据收集与导出](articles/06-Kubernetes/18-06_指标数据收集与导出.md)
- [7. 日志数据收集与导出](articles/06-Kubernetes/18-07_日志数据收集与导出.md)
- [8. Grafana全家桶方案](articles/06-Kubernetes/18-08_Grafana全家桶方案.md)
- [9. Elastic EDOT全家桶方案](articles/06-Kubernetes/18-09_Elastic_EDOT全家桶方案.md)

## 第19章：CKA考题
- [1. 准备工作](articles/06-Kubernetes/19-01_准备工作.md)
- [2. 故障排除](articles/06-Kubernetes/19-02_故障排除.md)
- [3. 工作负载和调度](articles/06-Kubernetes/19-03_工作负载和调度.md)
- [4. 服务和网络](articles/06-Kubernetes/19-04_服务和网络.md)
- [5. 存储](articles/06-Kubernetes/19-05_存储.md)
- [6. 集群架构、安装和配置](articles/06-Kubernetes/19-06_集群架构、安装和配置.md)
