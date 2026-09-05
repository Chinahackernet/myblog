# 附加action动作

> 分类：Python / 第8章：DRF视图
> 原文：https://www.cuiliangblog.cn/detail/section/33222169
> 来源：崔亮的博客

---

## 一、action
1. 添加自定义动作需要使用`rest_framework.decorators.action`装饰器。
2. 以action装饰器装饰的方法名会作为action动作名，与list、retrieve等同。
3. action装饰器可以接收两个参数：
+ **methods**: 该action支持的请求方式，列表传递
+ **detail**: 表示是action中要处理的是否是视图资源的对象（即是否通过url路径获取主键）

True 表示使用通过URL获取的主键对应的数据对象

False 表示不使用URL获取主键

## 二、示例
+ view.py

```python
from rest_framework.response import Response
from quickstart.models import BookInfo
from quickstart.serializers import BookInfoSerializer
from rest_framework import viewsets
from rest_framework.decorators import action


class BookInfoModelViewSet(viewsets.ModelViewSet):
    """
    获取所有图书和单个图书信息的增删改查
    """
    # 标准动作的 viewset
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer

    # detail为False 表示不需要处理具体的对象
    @action(methods=['get'], detail=False)
    def latest(self, request):
        """
        返回最新图书信息
        """
        # 获取指定对象
        book = BookInfo.objects.latest('id')
        # 创建序列化器对象
        serializer = self.get_serializer(book)
        # 返回响应
        return Response(serializer.data)

    # detail为True 表示对pk对应的对象进行处理
    @action(methods=['put'], detail=True)
    def read(self, request, pk):
        """
        修改图书阅读量
        """
        # 获取指定pk的对象
        book = self.get_object()
        # 修改对象属性
        book.read = request.data.get('read')
        # 数据入库
        book.save()
        # 创建序列化器对象
        serializer = self.get_serializer(book)
        # 返回响应
        return Response(serializer.data)
```

+ urls.py

```python
from django.urls import path
from quickstart import views

urlpatterns = [
    path('books/', views.BookInfoModelViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('books/latest', views.BookInfoModelViewSet.as_view({'get': 'latest'})),
    path('books/<int:pk>',
         views.BookInfoModelViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),
    path('books/<int:pk>/read', views.BookInfoModelViewSet.as_view({'put': 'read'}))
]
```


