# 排序OrderingFilter

> 分类：Python / 第10章：DRF扩展
> 原文：https://www.cuiliangblog.cn/detail/section/33258996
> 来源：崔亮的博客

---

> 对于列表数据，REST framework提供了**OrderingFilter**过滤器来帮助我们快速指明数据按照指定字段进行排序。
>

# 使用方法：
在类视图中设置filter_backends，使用`rest_framework.filters.OrderingFilter`过滤器，REST framework会在请求的查询字符串参数中检查是否包含了ordering参数，如果包含了ordering参数，则按照ordering参数指明的排序字段对数据集进行排序。

前端可以传递的ordering参数的可选字段值需要在ordering_fields中指明。

示例：

```python
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
class BookListView(ListAPIView):
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ('bpub_date',)
    ordering_fields = ['bpub_date', 'bread']
# 127.0.0.1:8000/books/?ordering=-bread,bpub_date
```




