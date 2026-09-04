# Linux 网络排障方法

## 分层思路

排障按“链路→二层→三层→传输层→应用层”逐层收敛。每一步都记录源、目的、协议、端口、时间和期望结果；不要在没有证据时同时修改路由、防火墙和应用配置。

## 1. 链路与地址

```bash
ip link; ethtool eth0; ip addr show; ip route get 198.51.100.20
bridge link; ip neigh show
```

检查网卡协商、MTU、VLAN、默认路由和邻居状态。跨 VLAN 不通时同时检查交换机 trunk、网关 ACL 和 rp_filter；双网卡主机要确认策略路由不会让回包走错出口。

## 2. DNS、TCP 与路径

```bash
resolvectl query api.example.com
dig +trace api.example.com
ss -tnp; nc -vz -w2 198.51.100.20 443
tracepath -n 198.51.100.20
```

DNS 问题区分解析失败、缓存过期、Split-horizon 和 DNSSEC；TCP 问题区分 SYN 无响应、RST、握手成功后超时和 TLS 协商失败。必要时在客户端、服务端和中间代理同时抓包，比较序列号和时间线。

## 3. 丢包与 MTU

用 `tcpdump -i any -nn host <ip>` 验证是否到达，检查接口错误、队列丢弃、conntrack 和防火墙计数。大包失败而小包成功通常指向 MTU/PMTUD 黑洞；先降低测试报文并修复路径，不要永久关闭 PMTUD。

## 回滚边界

每次修改保存原路由、nftables、NetworkManager 连接和 sysctl。远程变更必须保留第二条管理通道，测试通过后再持久化；无法确认回程路径时不要重启网络服务。

