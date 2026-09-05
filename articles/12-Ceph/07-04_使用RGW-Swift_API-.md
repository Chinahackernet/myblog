# 使用RGW(Swift API)

> 分类：Ceph / 第7章：Ceph对象存储
> 原文：https://www.cuiliangblog.cn/detail/section/197445051
> 来源：崔亮的博客

---

# 什么是 Swift API
Swift API 是一个基于 OpenStack Swift 对象存储系统的 RESTful API，用于管理和操作对象存储资源。它主要被设计为一种高可用、高扩展的存储解决方案，允许用户通过 HTTP 协议来存储、检索和管理对象数据。Swift API 提供了一个简洁的接口，支持多种编程语言和工具。

Ceph 的 RADOS Gateway（RGW）实现了 Swift API 的兼容性，使得用户可以使用 Swift 客户端或工具与 Ceph 对象存储交互。

# 配置 Swift API  
## 启用 Swift API  
查看 rgw 实例信息，其中 default 就是 instance 名称。

```bash
root@ceph-1:~# ceph config dump | grep rgw
client.rgw.default.ceph-1.rsdmtv        basic     rgw_frontends                          beast ssl_port=9443 ssl_certificate=config://rgw/cert/rgw.default                          * 
client.rgw.default.ceph-2.hyhuzv        basic     rgw_frontends                          beast ssl_port=9443 ssl_certificate=config://rgw/cert/rgw.default                          * 
client.rgw.default.ceph-3.wnnkpd        basic     rgw_frontends                          beast ssl_port=9443 ssl_certificate=config://rgw/cert/rgw.default                          * 
```

编辑 RGW 配置

```bash
root@ceph-1:~# ceph config set client.rgw.default rgw_swift_account_in_url true
```

验证是否启用

```bash
root@ceph-1:~# ceph config get client.rgw.default rgw_swift_account_in_url
true
```

重启 RGW 使配置生效

```bash
root@ceph-1:~# ceph orch restart rgw.default
Scheduled to restart rgw.default.ceph-1.rsdmtv on host 'ceph-1'
Scheduled to restart rgw.default.ceph-2.hyhuzv on host 'ceph-2'
Scheduled to restart rgw.default.ceph-3.wnnkpd on host 'ceph-3'
```

## 创建 RGW 用户
使用 `radosgw-admin` 创建 RGW 用户，牢记 AK 和 SK

```json
root@ceph-1:~# radosgw-admin user create --uid=swift_user --display-name="Swift API User" --email=swift_user@example.com
{
  "user_id": "swift_user",
  "display_name": "Swift API User",
  "email": "swift_user@example.com",
  "suspended": 0,
  "max_buckets": 1000,
  "subusers": [],
  "keys": [
    {
      "user": "swift_user",
      "access_key": "8UH3MSTU3ZDD86G1KZ80",
      "secret_key": "4kdC1GMwOpbvZsztFvLXazXV4PEXKyhZP36UUWye"
    }
  ],
  "swift_keys": [],
  "caps": [],
  "op_mask": "read, write, delete",
  "default_placement": "",
  "default_storage_class": "",
  "placement_tags": [],
  "bucket_quota": {
    "enabled": false,
    "check_on_raw": false,
    "max_size": -1,
    "max_size_kb": 0,
    "max_objects": -1
  },
  "user_quota": {
    "enabled": false,
    "check_on_raw": false,
    "max_size": -1,
    "max_size_kb": 0,
    "max_objects": -1
  },
  "temp_url_keys": [],
  "type": "rgw",
  "mfa_ids": []
}
```

## 创建 Swift 子用户
为用户创建 Swift 子用户并分配访问权限

```json
root@ceph-1:~# radosgw-admin subuser create --uid=swift_user --subuser=swift_user:swift --access=full
{
  "user_id": "swift_user",
  "display_name": "Swift API User",
  "email": "swift_user@example.com",
  "suspended": 0,
  "max_buckets": 1000,
  "subusers": [
    {
      "id": "swift_user:swift",
      "permissions": "full-control"
    }
  ],
  "keys": [
    {
      "user": "swift_user",
      "access_key": "8UH3MSTU3ZDD86G1KZ80",
      "secret_key": "4kdC1GMwOpbvZsztFvLXazXV4PEXKyhZP36UUWye"
    }
  ],
  "swift_keys": [
    {
      "user": "swift_user:swift",
      "secret_key": "INRF1ZVKzm001vuOb6NhL4lqycixTYGPPq43owZs"
    }
  ],
  "caps": [],
  "op_mask": "read, write, delete",
  "default_placement": "",
  "default_storage_class": "",
  "placement_tags": [],
  "bucket_quota": {
    "enabled": false,
    "check_on_raw": false,
    "max_size": -1,
    "max_size_kb": 0,
    "max_objects": -1
  },
  "user_quota": {
    "enabled": false,
    "check_on_raw": false,
    "max_size": -1,
    "max_size_kb": 0,
    "max_objects": -1
  },
  "temp_url_keys": [],
  "type": "rgw",
  "mfa_ids": []
}
```

## 创建 Swift 密钥
为 Swift 子用户生成密钥：

```json
root@ceph-1:~# radosgw-admin key create --subuser=swift_user:swift --key-type=swift --gen-secret
{
  "user_id": "swift_user",
  "display_name": "Swift API User",
  "email": "swift_user@example.com",
  "suspended": 0,
  "max_buckets": 1000,
  "subusers": [
    {
      "id": "swift_user:swift",
      "permissions": "full-control"
    }
  ],
  "keys": [
    {
      "user": "swift_user",
      "access_key": "8UH3MSTU3ZDD86G1KZ80",
      "secret_key": "4kdC1GMwOpbvZsztFvLXazXV4PEXKyhZP36UUWye"
    }
  ],
  "swift_keys": [
    {
      "user": "swift_user:swift",
      "secret_key": "QHIXCUuujP3CkFLlo12DCHK4A2pbnxW1aTffDPsf"
    }
  ],
  "caps": [],
  "op_mask": "read, write, delete",
  "default_placement": "",
  "default_storage_class": "",
  "placement_tags": [],
  "bucket_quota": {
    "enabled": false,
    "check_on_raw": false,
    "max_size": -1,
    "max_size_kb": 0,
    "max_objects": -1
  },
  "user_quota": {
    "enabled": false,
    "check_on_raw": false,
    "max_size": -1,
    "max_size_kb": 0,
    "max_objects": -1
  },
  "temp_url_keys": [],
  "type": "rgw",
  "mfa_ids": []
}
```

也可以通过以下命令查询密钥信息

```bash
root@ceph-1:~# radosgw-admin user info --uid=swift_user
```

# CURL 方式使用
## 获取 token
获取认证信息，其中用户名为：swift_user:swift，key 为swift_keys 下的secret_key

```bash
curl -v -H "X-Auth-User: swift_user:swift" -H "X-Auth-Key: QHIXCUuujP3CkFLlo12DCHK4A2pbnxW1aTffDPsf" https://ceph-rgw.local.com/auth/v1.0
```

示例返回如下，其中 204 表示验证成功，牢记X-Auth-Token 用于后续操作。

```bash
< HTTP/1.1 204 No Content
< X-Storage-Url: https://ceph-rgw.local.com:9443/swift/v1/AUTH_swift_user
< X-Storage-Token: AUTH_rgwtk1000000073776966745f757365723a7377696674c45c0e4f631987c7fb986367230d370a29ad7067ec9e04c261e4d24b5642c61e703b60d3
< X-Auth-Token: AUTH_rgwtk1000000073776966745f757365723a7377696674c45c0e4f631987c7fb986367230d370a29ad7067ec9e04c261e4d24b5642c61e703b60d3
< X-Trans-Id: tx00000ebef7466bbcbdd45-006762477b-2f6f1-default
< X-Openstack-Request-Id: tx00000ebef7466bbcbdd45-006762477b-2f6f1-default
< Content-Type: application/json; charset=utf-8
< Date: Wed, 18 Dec 2024 03:54:35 GMT
< Connection: Keep-Alive
< 
* Connection #0 to host ceph-rgw.local.com left intact
```

## 创建存储桶（容器）
```bash
ceph-client:~# curl -k -X PUT -H "X-Auth-Token: AUTH_rgwtk1000000073776966745f757365723a7377696674c45c0e4f631987c7fb986367230d370a29ad7067ec9e04c261e4d24b5642c61e703b60d3" \
https://ceph-rgw.local.com/swift/v1/AUTH_swift_user/my-bucket
```

## 列出存储桶（容器）
```bash
ceph-client:~# curl -k -X GET -H "X-Auth-Token: AUTH_rgwtk1000000073776966745f757365723a7377696674c45c0e4f631987c7fb986367230d370a29ad7067ec9e04c261e4d24b5642c61e703b60d3" \
https://ceph-rgw.local.com/swift/v1/AUTH_swift_user
my-bucket
```

在 Ceph RGW 的 Swift API 中，可以通过 `curl` 直接进行文件的上传、查看以及下载操作。以下是具体操作步骤和示例。

## 上传文件
将本地文件/var/log/syslog 上传到my-bucket：

```bash
ceph-client:~# curl -k -X PUT -H "X-Auth-Token: AUTH_rgwtk1000000073776966745f757365723a7377696674c45c0e4f631987c7fb986367230d370a29ad7067ec9e04c261e4d24b5642c61e703b60d3" \
--data-binary @/var/log/syslog \
https://ceph-rgw.local.com/swift/v1/AUTH_swift_user/my-bucket/syslog
```

## 列出 Bucket 中的文件
```bash
ceph-client:~# curl -k -H "X-Auth-Token: AUTH_rgwtk1000000073776966745f757365723a7377696674c45c0e4f631987c7fb986367230d370a29ad7067ec9e04c261e4d24b5642c61e703b60d3" \
https://ceph-rgw.local.com/swift/v1/AUTH_swift_user/my-bucket
syslog
```

## 下载文件
将 bucket 中的syslog 文件下载到本地/tmp/syslog ：

```bash
ceph-client:~# curl -k -H "X-Auth-Token: AUTH_rgwtk1000000073776966745f757365723a7377696674c45c0e4f631987c7fb986367230d370a29ad7067ec9e04c261e4d24b5642c61e703b60d3" \
https://ceph-rgw.local.com/swift/v1/AUTH_swift_user/my-bucket/syslog \
-o /tmp/syslog
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  354k  100  354k    0     0  28.8M      0 --:--:-- --:--:-- --:--:-- 28.8M
root@ceph-client:~# ls -lh /tmp/syslog 
-rw-r--r-- 1 root root 355K Dec 18 12:08 /tmp/syslog
```

# Swift CLI 方式使用
## 安装 Swift CLI
```bash
root@ceph-client:~# apt install python3-swiftclient -y 
root@ceph-client:~# swift --version
python-swiftclient 3.9.0
```

## 创建容器存储桶（容器）
```bash
root@ceph-client:~# swift -A https://ceph-rgw.local.com/auth/v1.0 \
      -U swift_user:swift \
      -K QHIXCUuujP3CkFLlo12DCHK4A2pbnxW1aTffDPsf \
      --insecure post my-container
```

## 列出存储桶（容器）
```bash
root@ceph-client:~# swift -A https://ceph-rgw.local.com/auth/v1.0 \
      -U swift_user:swift \
      -K QHIXCUuujP3CkFLlo12DCHK4A2pbnxW1aTffDPsf \
      --insecure list
my-bucket
my-container
```

## 上传文件
```bash
root@ceph-client:~# echo "hello ceph" > testfile.txt
root@ceph-client:~# swift -A https://ceph-rgw.local.com/auth/v1.0 \
      -U swift_user:swift \
      -K QHIXCUuujP3CkFLlo12DCHK4A2pbnxW1aTffDPsf \
      --insecure upload my-container testfile.txt
testfile.txt
```

## 列出文件
```bash
root@ceph-client:~# swift -A https://ceph-rgw.local.com/auth/v1.0 \
      -U swift_user:swift \
      -K QHIXCUuujP3CkFLlo12DCHK4A2pbnxW1aTffDPsf \
      --insecure list my-container
testfile.txt
```

## 下载文件
```bash
root@ceph-client:~# swift -A https://ceph-rgw.local.com/auth/v1.0 \
       -U swift_user:swift \
       -K QHIXCUuujP3CkFLlo12DCHK4A2pbnxW1aTffDPsf \
       --insecure download my-container testfile.txt --output /tmp/testfile.txt
testfile.txt [auth 0.004s, headers 0.009s, total 0.009s, 0.003 MB/s]
root@ceph-client:~# cat /tmp/testfile.txt 
hello ceph
```

## 删除文件
```bash
root@ceph-client:~# swift -A https://ceph-rgw.local.com/auth/v1.0 \
       -U swift_user:swift \
       -K QHIXCUuujP3CkFLlo12DCHK4A2pbnxW1aTffDPsf \
       --insecure delete my-container testfile.txt
testfile.txt
```


