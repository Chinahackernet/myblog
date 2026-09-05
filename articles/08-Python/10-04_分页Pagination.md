# 分页Pagination

> 分类：Python / 第10章：DRF扩展
> 原文：https://www.cuiliangblog.cn/detail/section/33257041
> 来源：崔亮的博客

---

> REST framework提供了分页的支持。
>

## 全局使用
1. 在配置文件中设置全局的分页方式，如：

```python
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS':  'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100  # 每页数目
}
```

+ **注意：如果在视图内关闭分页功能，只需在视图内设置**

```plain
pagination_class = None
```

## 局部使用
+ 前端访问形式

```plain
GET  http://api.example.org/books/?page=2&size=5
```

1. 通过自定义Pagination类，来为视图添加不同分页行为。在视图中通过`pagination_clas`属性来指明(api/utils.py)

```python
# 自定义分页器
class MyPageNumber(PageNumberPagination):
    page_size = 10  # 每页默认显示多少条
    page_size_query_param = 'size'  # URL中每页显示条数的参数
    page_query_param = 'page'  # URL中页码的参数
    max_page_size = None  # 最大页码数限制
```

2. 视图中使用自定义分页器

```python
class CmdbModelViewSet(viewsets.ModelViewSet):
    """
    资产信息的增删改查
    """
    queryset = Cmdb.objects.filter(is_delete=0).all()
    serializer_class = CmdbSerializer
    pagination_class = MyPageNumber
```

## LimitOffsetPagination（前X条和偏移量）
+ 前端访问网址形式：

```plain
GET http://api.example.org/books/?limit=100&offset=400
```

可以在子类中定义的属性：

+ default_limit 默认限制，默认值与`PAGE_SIZE`设置一直
+ limit_query_param limit参数名，默认'limit'
+ offset_query_param offset参数名，默认'offset'
+ max_limit 最大limit限制，默认None

```python
from rest_framework.pagination import LimitOffsetPagination
class BookListView(ListAPIView):
    queryset = BookInfo.objects.all().order_by('id')
    serializer_class = BookInfoSerializer
    pagination_class = LimitOffsetPagination
# 127.0.0.1:8000/books/?offset=3&limit=2
```

## APIView实现分页
```python
class StatusAPIView(APIView):
    """
    装置状态
    """

    @staticmethod
    def get(request):
        result = []
        alias = request.query_params.get('alias')
        page = request.query_params.get('page')
        size = request.query_params.get('size')
        
        # 列表对象按指定size分页
        paginator = Paginator(result, size)
        return Response({'count': paginator.count, 'results': paginator.page(page).object_list},
                        status=status.HTTP_200_OK)
```


