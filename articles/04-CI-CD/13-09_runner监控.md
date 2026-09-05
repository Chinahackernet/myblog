# runner监控

> 分类：CI/CD / 第13章：Gitlab Runner
> 原文：https://www.cuiliangblog.cn/detail/section/178535441
> 来源：崔亮的博客

---

参考文档：[https://docs.gitlab.com/runner/monitoring/](https://docs.gitlab.com/runner/monitoring/)

# Runner配置
## 启用metrics指标
Runner默认是没有开启内置的HTTP服务，可以通过两种方式配置指标HTTP服务器：

+ 在`config.toml`文件中配置全局选项 `listen_address`。
+ 在Runner启动的时候添加`--listen-address`命令选项。

修改gitlab-runner-cmd.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gitlab-runner-register
  namespace: cicd
data:
  register.sh: |
    # !/bin/bash
    gitlab-runner register --non-interactive --url $GROUP_RUNNER_URL --token $GROUP_RUNNER_TOKEN --executor $GROUP_RUNNER_EXECUTOR --template-config /tmp/config-template.toml
    # 使用配置模板注册不支持全局选项，接下来修改全局参数
    sed -i "s/concurrent = 1/concurrent = 10/g" /etc/gitlab-runner/config.toml
    sed -i '1i\listen_address = ":9252"' /etc/gitlab-runner/config.toml
    # 重启gitlab-runner
    gitlab-runner restart
```

创建service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: gitlab-runner
  namespace: cicd
  labels:
    app: gitlab-runner
spec:
  selector:
    app: gitlab-runner
  ports:
    - port: 9252
      targetPort: 9252 
      name: gitlab-runner-exporter
```

查看验证

```bash
[root@tiaoban gitlab-runner]# kubectl exec -it -n cicd gitlab-runner-ff485f488-lk8dq -- bash
root@gitlab-runner-ff485f488-lk8dq:~# cat /etc/gitlab-runner/config.toml
listen_address = ":9252"
```

然后修改deployment和svc暴露metrics端口。

## 访问metrics验证
```bash
[root@rockylinux /]# curl gitlab-runner.cicd.svc:9252/metrics
curl gitlab-runner.cicd.svc:9252/metrics
# HELP gitlab_runner_api_request_duration_seconds Latency histogram of API requests made by GitLab Runner
# TYPE gitlab_runner_api_request_duration_seconds histogram
gitlab_runner_api_request_duration_seconds_bucket{endpoint="request_job",runner="wvWFjWEsk",system_id="r_vP1BQ57i49VP",le="0.1"} 76
gitlab_runner_api_request_duration_seconds_bucket{endpoint="request_job",runner="wvWFjWEsk",system_id="r_vP1BQ57i49VP",le="0.25"} 77
gitlab_runner_api_request_duration_seconds_bucket{endpoint="request_job",runner="wvWFjWEsk",system_id="r_vP1BQ57i49VP",le="0.5"} 77
gitlab_runner_api_request_duration_seconds_bucket{endpoint="request_job",runner="wvWFjWEsk",system_id="r_vP1BQ57i49VP",le="1"} 77
```

# Prometheus配置
## 创建<font style="color:rgb(48, 49, 51);">ServiceMonitor</font>资源
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: gitlab-runner-exporter # ServiceMonitor名称
  namespace: monitoring # ServiceMonitor所在名称空间
spec:
  jobLabel: gitlab-runner # job名称
  endpoints: # prometheus所采集Metrics地址配置，endpoints为一个数组，可以创建多个，但是每个endpoints包含三个字段interval、path、port
  - port: gitlab-runner-exporter # prometheus采集数据的端口，这里为port的name，主要是通过spec.selector中选择对应的svc，在选中的svc中匹配该端口
    interval: 30s # prometheus采集数据的周期，单位为秒
    scheme: http # 协议
    path: /metrics # prometheus采集数据的路径
  selector: # svc标签选择器
    matchLabels:
      app: gitlab-runner
  namespaceSelector: # namespace选择
    matchNames:
    - cicd
```

## 验证targets
![](assets/04-CI-CD/2127f6bd206f49e79798.png)




