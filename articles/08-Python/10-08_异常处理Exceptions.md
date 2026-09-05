# 异常处理Exceptions

> 分类：Python / 第10章：DRF扩展
> 原文：https://www.cuiliangblog.cn/detail/section/33259169
> 来源：崔亮的博客

---

1. 定义自定义处理方法(booktest/my_exception.py)

```python
from rest_framework.views import exception_handler
from rest_framework.response import Response
from django.db import DatabaseError
def custom_exception_handler(exc, context):
    #1,调用系统方法,处理了APIException的异常,或者其子类异常
    response = exception_handler(exc, context)
    #2,判断response是否有值
    if response is not None:
        response.data['status_code'] = response.status_code
    else:
        if isinstance(exc, DatabaseError):
            response = Response("数据库大出血")
        else:
            response = Response("其他异常!")
    return response
```

2. 全局配置(settings.py)

```python
REST_FRAMEWORK = {
    ...
    'EXCEPTION_HANDLER': 'booktest.my_exception.custom_exception_handler'
}
```

3. 测试(views.py)

```python
class TestView(APIView):
    # throttle_scope = "uploads"
    def get(self,request):
        # raise DatabaseError("DatabaseError!!!")
        raise Exception("报错了!!!")
        # raise APIException("APIException!!!")
        # raise ValidationError("ValidationError!!!")
        return Response("testing....")
```

<font style="color:#C88FD0;"></font>




