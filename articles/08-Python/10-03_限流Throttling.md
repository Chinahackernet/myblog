# 限流Throttling

> 分类：Python / 第10章：DRF扩展
> 原文：https://www.cuiliangblog.cn/detail/section/33255736
> 来源：崔亮的博客

---

> 可以对接口访问的频次进行限制，以减轻服务器压力。
>

## 一、使用
1. 可以在配置文件中，使用`DEFAULT_THROTTLE_CLASSES` 和 `DEFAULT_THROTTLE_RATES`进行全局配置，

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',# 匿名用户
        'rest_framework.throttling.UserRateThrottle' # 认证用户
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day'
    }
}
```

2. `DEFAULT_THROTTLE_RATES` 可以使用 `second`, `minute`, `hour` 或`day`来指明周期。
3. 也可以在具体视图中通过throttle_classess属性来配置，如

```python
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
class ExampleView(APIView):
    throttle_classes = (UserRateThrottle,)
    ...
```

### 二、可选限流类
1. AnonRateThrottle

限制所有匿名未认证用户，使用IP区分用户。

使用`DEFAULT_THROTTLE_RATES['anon']` 来设置频次

2. UserRateThrottle

限制认证用户，使用User id 来区分。

使用`DEFAULT_THROTTLE_RATES['user']` 来设置频次

3. ScopedRateThrottle

限制用户对于每个视图的访问频次，使用ip或user id。

例如：

```python
class ContactListView(APIView):
    throttle_scope = 'contacts'
    ...
class ContactDetailView(APIView):
    throttle_scope = 'contacts'
    ...
class UploadView(APIView):
    throttle_scope = 'uploads'
    ...
```

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.ScopedRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'contacts': '1000/day',
        'uploads': '20/day'
    }
}
```

## 三、实例
```python
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import RetrieveAPIView
from rest_framework.throttling import UserRateThrottle
class BookDetailView(RetrieveAPIView):
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = (UserRateThrottle,)
```

## 四、自定义限流
> <font style="background-color:transparent;">目的: 可以定义可选限流, 用在不同的类视图中</font>
>

1. 全局定义

```python
REST_FRAMEWORK = {
    ...
    #4,可选限流
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'downloads': '3/minute',
        'uploads': '5/minute'
    }
}
```

2. 局部使用

```python
class TestView(APIView):
    throttle_scope = "uploads"
    def get(self,request):
        return Response("testing....")
```






