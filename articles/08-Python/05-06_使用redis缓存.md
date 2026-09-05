# 使用redis缓存

> 分类：Python / 第5章：Django
> 原文：https://www.cuiliangblog.cn/detail/section/33365818
> 来源：崔亮的博客

---

> django-redis是一个使 Django 支持 Redis cache/session 后端的全功能组件.
>

# 安装
`pip install django-redis`

# 作为 cache backend 使用配置
1. 修改setting

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379',
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "PASSWORD": "CHANGE_ME",
        },
    },
}
```

# 作为 session backend 使用配置
Django 默认可以使用任何 cache backend 作为 session backend, 将 django-redis 作为 session 储存后端不用安装任何额外的 backend

```python
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
```

# cache使用
## 1. 设置cache
+ <font style="background-color:#FCFCFC;">timeout=0 立即过期</font>
+ <font style="background-color:#FCFCFC;">timeout=None 永不超时</font>



```python
#from django.core.cache import cache
cache.set("message","1111",timeout=3600)
```

## 2. 取出cache


```python
value = cache.get("message")
if value:
    走缓存
else:
  走数据库 
  并且设置缓存
# 查询过期时间
>>> from django.core.cache import cache
>>> cache.set("foo", "value", timeout=25)
>>> cache.ttl("foo")
25
>>> cache.ttl("not-existent")
0
```

## 3.删除缓存


```python
#删除某条缓存记录
cache.delete("a")
### 输入参数为该记录的 key 
#删除多条缓存记录
cache.delete(["a", "b", "c"])
#清除所有缓存记录
cache.clear()
```




