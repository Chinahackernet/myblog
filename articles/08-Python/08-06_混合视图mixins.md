# 混合视图mixins

> 分类：Python / 第8章：DRF视图
> 原文：https://www.cuiliangblog.cn/detail/section/32876603
> 来源：崔亮的博客

---

## 一、简介
1. 使用基于类视图的最大优势之一是它可以轻松地创建可复用的行为。
2. 我们使用的创建/获取/更新/删除操作和我们创建的任何基于模型的API视图非常相似。这些常见的行为是在REST框架的mixin类中实现的。
3. mixins提供的类

|  类名称  |  提供方法 |  功能 |
| --- | --- | --- |
| ListModelMixin | list | 查询所有数据 |
| CreateModelMixin | create | 创建单个对象 |
| RetrieveModelMixin | retrieve | 获取单个对象 |
| UpdateModelMixin | update | 更新单个对象 |
| DestroyModelMixin | destroy | 删除单个对象 |


## 二、示例
```python
from quickstart.models import BookInfo
from quickstart.serializers import BookInfoSerializer
from rest_framework import generics
from rest_framework import mixins


class BookInfoView(mixins.ListModelMixin, mixins.CreateModelMixin, generics.GenericAPIView):
    """
    列出所有的book信息，或创建一个新book。
    """
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer

    def get(self, request):
        return self.list(request)

    def post(self, request):
        return self.create(request)


class BookInfoDetailView(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin,
                         generics.GenericAPIView):
    """
    获取，更新或删除一个指定ID的book。
    """
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer

    def get(self, request, pk):
        return self.retrieve(request)

    def put(self, request, pk):
        return self.update(request)

    def delete(self, request, pk):
        return self.destroy(request)
```


