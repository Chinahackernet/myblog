# 认证Authentication

> 分类：Python / 第10章：DRF扩展
> 原文：https://www.cuiliangblog.cn/detail/section/33255046
> 来源：崔亮的博客

---

1. 可以在配置文件中配置全局默认的认证方案（常用）

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.BasicAuthentication',   # 基本认证
        'rest_framework.authentication.SessionAuthentication',  # session认证
        'rest_framework_jwt.authentication.JSONWebTokenAuthentication',  # POST请求的Token验证
    )
}
```

2. 也可以在每个视图中通过设置authentication_classess属性来设置

```python
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.views import APIView
class ExampleView(APIView):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    ...
```

3. 认证失败会有两种可能的返回值：
+ 401 Unauthorized 未认证
+ 403 Permission Denied 权限被禁止
4. 在apache的httpd.conf中加入一行配置，传递uwsgi的认证信息

```plain
WSGIPassAuthorization On
```




