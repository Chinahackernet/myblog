# 缓存框架的核心目标

1.  较少的代码

-   缓存应该尽可能快
-   围绕缓存后端的所有代码框架应该保持在绝对最小值，特别是对于获取操作

2.  一致性

-   提供跨越不同缓存后端的一致性接口

3.  可扩展性

-   基于开发人员需求，缓存API应该可以定制化扩展

  

# 内置缓存

Django中内置的缓存有以下几种：

-   基于Memcached缓存
-   使用数据库进行缓存
-   使用文件系统进行缓存
-   使用本地内存进行缓存
-   提供缓存扩展接口

  

# 缓存配置

  

# 一、数据库缓存

## 1、创建缓存表

```yaml
python manager.py createcachetable my_cache
```

  

## 2、注册缓存

```yaml
CACHES = {
  'default': {
    'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
    'LOCATION': 'my_cache',
    'TIMEOUT': '60',
    'OPTIONS': {
      'MAX_ENTRIES': '300',
    },
    'KEY_PREFIX': 'joker',
    'VERSION': '1',
  }
}
```

  

## 3、使用

### 3.1、使用装饰器

Django帮我们封装了一个装饰器cache\_page来让某一个视图使用缓存，如下：

```yaml
from django.views.decorators.cache import cache_page
@cache_page(30)
def test_cache(request):
    data_list = ['元旦放假了 %s' % x for x in range(10)]
    time.sleep(5)
    data = {
        "status": "ok",
        "data": data_list,
    }
    return render(request, "test_cache.html", locals())
```

  

第一次请求所花的时间大概是7s

![image.png](assets/python开发/Django中的缓存/Django中的缓存-1.png)

  

第二次请求时间大概是400ms

![image.png](assets/python开发/Django中的缓存/Django中的缓存-2.png)

  

通过这两次请求可以看到使用缓存的效果是很明显的。

因为我们是使用的数据库作为缓存，我们就可以在数据库中看到其相应的key，如下：

![image.png](assets/python开发/Django中的缓存/Django中的缓存-3.png)

  

### 3.2、手动缓存

上面是装饰器自动帮我们缓存数据，我们还可以手动缓存，常用的两个方法是set()和get()，如下：

```yaml
def test_cache(request):
    res = cache.get("test_cache")
    if res:
        return HttpResponse(res)
    data_list = ['元旦放假了 %s' % x for x in range(10)]
    time.sleep(5)
    data = {
        "status": "ok",
        "data": data_list,
    }

    response = render(request, "test_cache.html", context=data)
    cache.set("test_cache", response, timeout=60)
    return response
```

  

# 二、redis缓存

Django除了可以直接使用内置的缓存外还可以使用第三方缓存插件，比如redis，如果要使用redis，只需要如下配置：

（1）、安装django-redis插件

```yaml
pip install django-redis
pip install django-redis-cache
```

  

（2）、在settings.py中配置如下：

```yaml
CACHES = {
    'default': {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}
```

  

其他的代码都可以不用改，就可以直接使用了。

  

# 三、混合使用

除了使用上面一种，还可以混合使用，如下：

settings.py中：

```yaml
CACHES = {
    'default': {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "my_cache",
        "TIMEOUT": 60,
    },
    'redis': {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}
```

  

如果直接使用装饰器的话，就可以直接指定用哪个缓存，如下：

```yaml
@cache_page(30, cache="default")
def test_cache(request):
    data_list = ['元旦放假了 %s' % x for x in range(10)]
    time.sleep(5)
    data = {
        "status": "ok",
        "data": data_list,
    }
    response = render(request, "test_cache.html", context=data)
    return response
```

  

如果是手动缓存，可以如下配置：

```yaml
def test_cache(request):
    cache = caches["default"]
    res = cache.get("test_cache")
    if res:
        return HttpResponse(res)
    data_list = ['元旦放假了 %s' % x for x in range(10)]
    time.sleep(5)
    data = {
        "status": "ok",
        "data": data_list,
    }

    response = render(request, "test_cache.html", context=data)
    cache.set("test_cache", response, timeout=60)
    return response
```

  

# 四、总结

在Django中可以使用很多种缓存，这里就简单介绍这两种，更多的可以去官方网站或者[w3c](https://www.w3cschool.cn/django/7vdh9ozt.html)去查看，下面来总结一些如果在流程种加入缓存，那么在一个时间周期内，流程是怎么走的呢？见下图：

![image.png](assets/python开发/Django中的缓存/Django中的缓存-4.png)、如果是第一次访问，整个流程就是1-2-3-4-5-6-7-8-9：

其中3-7解释如下：

-   请求进来首先查缓存
-   然后将未找到缓存告诉views
-   views收到没有缓存则再通过model到数据库种查看
-   model将查到的数据返回给views
-   views将数据加入到缓存中为后续请求使用

  

那么第二次请求，只要是在缓存有效期内，流程就为1-2-3-4-8-9