# 权限Permissions

> 分类：Python / 第10章：DRF扩展
> 原文：https://www.cuiliangblog.cn/detail/section/33255465
> 来源：崔亮的博客

---

权限控制可以限制用户对于视图的访问和对于具体数据对象的访问。

+ 在执行视图的dispatch()方法前，会先进行视图访问权限的判断
+ 在通过get_object()获取具体对象时，会进行对象访问权限的判断

## 一、使用
可以在配置文件中设置默认的权限管理类，如

```python
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    )
}
```

如果未指明，则采用如下默认配置

```python
'DEFAULT_PERMISSION_CLASSES': (
   'rest_framework.permissions.AllowAny',
)
```

也可以在具体的视图中通过permission_classes属性来设置，如

```python
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
class ExampleView(APIView):
    permission_classes = (IsAuthenticated,)
    ...
```

## 二、提供的权限
+ AllowAny 允许所有用户（默认）
+ IsAuthenticated 仅通过认证的用户
+ IsAdminUser 仅管理员用户
+ IsAuthenticatedOrReadOnly 认证的用户可以完全操作，否则只能get读取

## 三、举例
```python
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import RetrieveAPIView
class BookDetailView(RetrieveAPIView):
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    @action(methods=['put'], detail=True, permission_classes=[IsAdminOrIsSelf])
    def set_password(self, request, pk=None):
        ...
```

### 四、自定义权限
+ 编写自定义权限验证类(public/utils.py)

```python
class IsAdminUserOrReadOnly(BasePermission):
    """
    自定义权限管理(管理员全部权限，其他用户只能get读取)
    """

    def has_permission(self, request, view):
        # 匿名用户只允许get
        if request.method == 'GET':
            return True
        # 管理员允许所有
        elif request.user.username == 'admin':
            return True
        else:
            return False
```

+ 视图使用自定义权限

```python
from public.utils import IsAdminUserOrReadOnly
class CarouselModelViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    """
    轮播图增删改查
    """
    permission_classes = (IsAdminUserOrReadOnly,)
    queryset = Carousel.objects.filter(is_show=True)
    serializer_class = CarouselSerializer
```

+ 全局使用自定义权限

```python
REST_FRAMEWORK = {
    ...
    'DEFAULT_PERMISSION_CLASSES': (
        'four.utils.permissions.IsAdminUserOrReadOnly',
    )
    ... 
} 
```


