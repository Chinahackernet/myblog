# Redis

> 分类：Docker / 第17章：常见服务部署
> 原文：https://www.cuiliangblog.cn/detail/section/103918780
> 来源：崔亮的博客

---

# 拉取镜像
```dockerfile
[root@aliyun docker]# docker pull redis
```

# 运行容器
```bash
[root@aliyun docker]# docker run --name redis -p 6379:6379 -d --restart=always redis --requirepass CHANGE_ME
```

# 访问验证
```bash
[root@aliyun docker]# docker exec -it redis redis-cli
127.0.0.1:6379> auth CHANGE_ME
OK
```


