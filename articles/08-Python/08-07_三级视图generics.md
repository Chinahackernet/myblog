# 三级视图generics

> 分类：Python / 第8章：DRF视图
> 原文：https://www.cuiliangblog.cn/detail/section/32879741
> 来源：崔亮的博客

---

> 如果没有大量自定义的行为, 可以使用通用视图(三级视图)<font style="color:#333333;">来简化我们的views.py模块。</font>
>

## 一、常见的通用视图总结
| 类名称        |           父类       |         提供方法 |         作用 |
| --- | --- | --- | --- |
| CreateAPIView | GenericAPIView<br/>CreateModelMixin | post | 创建单个对象 |
| APIView | GenericAPIView<br/>ListModelMixin | get | 查询所有的数据 |
|  RetrieveAPIView | GenericAPIView<br/>RetrieveModelMixin | get  | 获取单个对象 |
| <font style="color:#404040;">DestroyAPIView</font> | <font style="color:#404040;">GenericAPIView</font><br/>DestroyModelMixin | delete | 删除单个对象 |
| UpdateAPIView | GenericAPIView<br/>UpdateModelMixin | put | 更新单个对象 |


## 二、使用示例
```python
from quickstart.models import BookInfo
from quickstart.serializers import BookInfoSerializer
from rest_framework import generics


class BookInfoView(generics.ListCreateAPIView):
    """
    列出所有的book信息，或创建一个新book。
    """
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer


class BookInfoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    获取，更新或删除一个指定ID的book。
    """
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer
    
# urls.py
path('searchKeyHistory/<int:pk>/', views.SearchKeyHistoryAPIView.as_view()),
```




