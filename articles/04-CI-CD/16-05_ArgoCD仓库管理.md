# ArgoCD仓库管理

> 分类：CI/CD / 第16章：ArgoCD与GitOps入门
> 原文：https://www.cuiliangblog.cn/detail/section/241614266
> 来源：崔亮的博客

---

# 仓库管理介绍
Argo CD 的 “Repo 仓库管理（Repository Management）” 是 GitOps 工作流的核心之一 —— 它决定了 Argo CD 从哪里拉取应用配置（YAML/Helm/Kustomize 等），以及如何认证访问这些仓库。  

## 仓库类型
| 类型 | 示例 | 用途 |
| --- | --- | --- |
| **Git** | `https://github.com/org/repo.git` | 最常见，存放 K8s YAML、Kustomize、Helm Chart |
| **Helm 仓库** | `https://charts.bitnami.com/bitnami` | 直接拉取 Helm Chart 部署 |
| **OCI 仓库** | `oci://ghcr.io/org/chart` | Helm v3 支持的 OCI chart 仓库 |
| **HTTP 仓库** | `https://example.com/charts/` | Helm 兼容但非标准仓库 |
| **GPG 签名仓库** | 支持 GPG 校验 commit | 用于增强安全性 |


# 仓库配置
## git仓库配置（最常用）
三种认证方式适用场景与区别配置可参考文档：[08-01_jenkins%E4%B8%8Egitlab%E8%BF%9E%E6%8E%A5.md](articles/04-CI-CD/08-01_jenkins与gitlab连接.md)，此处不再赘述。

## OCI仓库配置
上传 chart 到 harbor 仓库可参考文档：[../06_Kubernetes/15-06_helm%E4%B8%8A%E4%BC%A0%E5%88%B0harbor_chart.md](articles/06-Kubernetes/15-06_helm上传到harbor_chart.md)，此处不再赘述。

查看 helm 仓库地址

![](assets/04-CI-CD/21278160ee013d45403c.png)

创建机器人账户

![](assets/04-CI-CD/66a2fb640905a09bfe6b.png)

创建 repo

![](assets/04-CI-CD/88b997eff2802ac16d03.png)

查看仓库状态

![](assets/04-CI-CD/7d3874dcfdf7b4db5cc1.png)

## helm仓库配置
创建 helm 仓库

![](assets/04-CI-CD/0c0bf6fcabb4babd548b.png)

查看仓库状态

![](assets/04-CI-CD/d97b4b82e62dc74776af.png)

# Yaml 管理仓库
 ArgoCD 的 **GitOps 思路**就是通过 YAML 文件（Kubernetes CRD）来管理所有配置，包括仓库的创建。

## 查看已有仓库信息
```bash
# kubectl get secrets -n argocd | grep repo
repo-2111645630                    Opaque              4      13h
repo-3457470677                    Opaque              6      13h
repo-3513749900                    Opaque              6      118m
# kubectl get secrets -n argocd repo-3513749900 -o yaml
apiVersion: v1
data:
  name: ZGVtbw==
  password: CHANGE_ME
  project: ZGV2b3Bz
  type: Z2l0
  url: aHR0cDovL2dpdGxhYi5jdWlsaWFuZ2Jsb2cuY24vZGV2b3BzL2FyZ28tZGVtby5naXQ=
  username: cm9vdA==
kind: Secret
metadata:
  annotations:
    managed-by: argocd.argoproj.io
  creationTimestamp: "2025-10-23T02:47:04Z"
  labels:
    argocd.argoproj.io/secret-type: repository
  name: repo-3513749900
  namespace: argocd
  resourceVersion: "1905558"
  uid: fe2a00d2-395d-4ce3-9e41-dff844606ab8
type: Opaque
```

## 创建仓库
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: repo-demo  # 资源名称
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
  annotations:
    managed-by: argocd.argoproj.io
stringData:
  name: repo-demo
  password: "CHANGE_ME"
  project: devops
  type: git
  url: http://gitlab.cuilianglblog.cn/devops/argo-demo.git
  username: root
type: Opaque
```

# CLI 管理仓库
## 添加 Git 仓库
```bash
# 添加公共 Git 仓库（HTTPS）
argocd repo add https://github.com/username/repo.git

# 添加私有仓库 - 使用用户名/密码
argocd repo add https://github.com/username/repo.git \
  --username <username> \
  --password <password>

# 添加私有仓库 - 使用 SSH
argocd repo add git@github.com:username/repo.git \
  --ssh-private-key-path ~/.ssh/id_rsa

# 添加仓库并指定名称
argocd repo add https://github.com/username/repo.git \
  --name my-repo

# 添加 Git 仓库 - 使用 Personal Access Token (推荐)
argocd repo add https://github.com/username/repo.git \
  --username git \
  --password <github-token>

# GitLab 私有仓库
argocd repo add https://gitlab.com/username/repo.git \
  --username <username> \
  --password <gitlab-token>

# Gitee 仓库
argocd repo add https://gitee.com/username/repo.git \
  --username <username> \
  --password <token>

# 跳过 TLS 验证（自签名证书）
argocd repo add https://git.example.com/repo.git \
  --insecure-skip-server-verification \
  --username <username> \
  --password <password>
```

## 列出所有仓库
```bash
# 列出所有仓库
argocd repo list

# 使用 grpc-web
argocd repo list --grpc-web

# 输出为 JSON 格式
argocd repo list -o json

# 输出为 YAML 格式
argocd repo list -o yaml

# 显示更多信息
argocd repo list -o wide
```

## 查看仓库详情
```bash
# 查看特定仓库信息
argocd repo get <REPO_URL>

# 输出为 YAML
argocd repo get https://github.com/username/repo.git -o yaml
```

## 删除仓库
```bash
# 删除仓库
argocd repo rm <REPO_URL>
```




