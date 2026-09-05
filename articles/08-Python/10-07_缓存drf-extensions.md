# 缓存drf-extensions

> 分类：Python / 第10章：DRF扩展
> 原文：https://www.cuiliangblog.cn/detail/section/128168892
> 来源：崔亮的博客

---

# 安装
`pip install drf-extensions`

## 配置
在settings.py中指定缓存默认配置

```python
# DRF扩展
REST_FRAMEWORK_EXTENSIONS = {
    # 缓存时间
    'DEFAULT_CACHE_RESPONSE_TIMEOUT': 60 * 60,
    # 缓存存储
    'DEFAULT_USE_CACHE': 'default',
}
```

# 使用方法
## 直接添加装饰器
可以在使用rest_framework_extensions.cache.decorators中的cache_response装饰器来装饰返回数据的类视图的对象方法，如

```python
class CityView(views.APIView):
    @cache_response()
    def get(self, request, *args, **kwargs):
        ...
```

cache_response装饰器可以接收两个参数

```python
@cache_response(timeout=60*60, cache='default')
```

timeout：缓存时间  
cache：缓存使用的Django缓存后端（即CACHES配置中的键名称）  
如果在使用cache_response装饰器时未指明timeout或者cache参数，则会使用配置文件中的默认配置

cache_response装饰器既可以装饰在类视图中的get方法上，也可以装饰在REST framework扩展类提供的list或retrieve方法上。使用cache_response装饰器无需使用method_decorator进行转换。

## 自定义缓存规则
有时候一个 url 需要根据不同的参数进行缓存，例如

+ 不同的 URL 参数（`?kind=a` vs `?kind=b`）
+ 不同的用户身份
+ 不同的请求头等等

这就需要一个 **Key Constructor（键构造器）** 来定义缓存 key 的组成规则。

`DefaultKeyConstructor` 是一个基础的 key 生成类。  
它内部通过“多个 key bit”组合成最终的缓存 key，比如：

+ `request.path`
+ `query_params`
+ `headers`
+ `user id` 等等

使用示例：

```python
from rest_framework_extensions.key_constructor.constructors import DefaultKeyConstructor
from rest_framework_extensions.key_constructor.bits import QueryParamsKeyBit

class CustomKeyConstructor(DefaultKeyConstructor):
    """
    自定义缓存策略，根据params参数和path缓存
    """
    query_params = QueryParamsKeyBit() # 按Params参数缓存
    kwargs = KwargsKeyBit() # 按Path参数缓存
    
@cache_response(key_func=CustomKeyConstructor())
# 使用自定义缓存规则
def get(self, request):
    kind = request.query_params.get('kind')
```

## 使用drf-extensions提供的扩展类
drf-extensions扩展对于缓存提供了三个扩展类：

+ ListCacheResponseMixin

用于缓存返回列表数据的视图，与ListModelMixin扩展类配合使用，实际是为list方法添加了cache_response装饰器

+ RetrieveCacheResponseMixin

用于缓存返回单一数据的视图，与RetrieveModelMixin扩展类配合使用，实际是为retrieve方法添加了cache_response装饰器

+ CacheResponseMixin

为视图集同时补充List和Retrieve两种缓存，与ListModelMixin和RetrieveModelMixin一起配合使用。

三个扩展类都是在rest_framework_extensions.cache.mixins中。

示例：为省市区视图添加缓存  
因为省市区视图使用了视图集，并且视图集中有提供ListModelMixin和RetrieveModelMixin的扩展（由ReadOnlyModelViewSet提供），所以可以直接添加CacheResponseMixin扩展类。

```python
from rest_framework_extensions.cache.mixins import CacheResponseMixin
 
class AreasViewSet(CacheResponseMixin, ReadOnlyModelViewSet):
    """
    行政区划信息
    """
    pagination_class = None  # 区划信息不分页
 
    def get_queryset(self):
        """
        提供数据集
        """
        if self.action == 'list':
            return Area.objects.filter(parent=None)
        else:
            return Area.objects.all()
 
    def get_serializer_class(self):
        """
        提供序列化器
        """
        if self.action == 'list':
            return AreaSerializer
        else:
            return SubAreaSerializer
```


