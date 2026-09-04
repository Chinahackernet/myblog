# 服务器日常巡检清单

> 记录一次基础的服务器健康检查流程。

## 1. 系统资源

查看 CPU、内存和负载情况：

```bash
uptime
free -h
df -h

重点关注：
- CPU 使用率是否长期过高
- 内存是否不足
- 磁盘空间是否接近满载
- 系统负载是否异常增长

2. 服务状态
确认关键服务是否正常运行：
systemctl status nginx
systemctl status docker
根据自己的服务器情况，替换为实际使用的服务名称。

3. 日志检查
查看近期错误日志：
journalctl -p err -b

4. 巡检结论
记录本次发现的问题、处理过程和后续计划。


3. 打开根目录的 `menu.md`，在最上面添加：

```markdown
- **运维笔记**
  - [服务器日常巡检清单](articles/server-inspection.md)

  articles/server-inspection.md
menu.md