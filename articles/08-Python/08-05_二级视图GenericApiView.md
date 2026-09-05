# 二级视图GenericApiView

> 分类：Python / 第8章：DRF视图
> 原文：https://www.cuiliangblog.cn/detail/section/32878219
> 来源：崔亮的博客

---

## 一、GenericApiView
> 继承自`APIVIew`，增加了对于列表视图和详情视图可能用到的通用支持方法。通常使用时，可搭配一个或多个Mixin扩展类。
>

### 1. 支持定义的属性：
+ 列表视图与详情视图通用：
    - **queryset** 列表视图的查询集
    - **serializer_class** 视图使用的序列化器
+ 列表视图使用：
    - **pagination_class** 分页控制类
    - **filter_backends** 过滤控制后端
+ 详情页视图使用：
    - **lookup_field** 查询单一数据库对象时使用的条件字段，默认为'`pk`'
    - **lookup_url_kwarg** 查询单一数据时URL中的参数关键字名称，默认与**look_field**相同

### 2. 提供的方法(**列表视图与详情视图通用)**
+ **get_queryset(self)**  
返回视图使用的查询集，是列表视图与详情视图获取数据的基础，默认返回`queryset`属性，可以重写，例如：

```plain
def get_queryset(self):
    user = self.request.user
    return user.accounts.all()
```

+ **get_serializer_class(self)**  
返回序列化器类，默认返回`serializer_class`，可以重写，例如：

```plain
def get_serializer_class(self):
    if self.request.user.is_staff:
        return FullAccountSerializer
    return BasicAccountSerializer
```

+ get_serializer(self, _args, *_kwargs)  
返回序列化器对象，被其他视图或扩展类使用，如果我们在视图中想要获取序列化器对象，可以直接调用此方法。  
**注意，在提供序列化器对象的时候，REST framework会向对象的context属性补充三个数据：request、format、view，这三个数据对象可以在定义序列化器时使用。**
+ **get_object(self)** 返回详情视图所需的模型类数据对象，默认使用`lookup_field`参数来过滤queryset。 在试图中可以调用该方法获取详情信息的模型类对象。  
**若详情访问的模型类对象不存在，会返回404。**  
**该方法会默认使用APIView提供的check_object_permissions方法检查当前对象是否有权限被访问。**

```python
from rest_framework import status
from quickstart.models import BookInfo
from quickstart.serializers import BookInfoSerializer
from rest_framework.response import Response
from rest_framework import generics


class BookInfoView(generics.GenericAPIView):
    """
    列出所有的book信息，或创建一个新book。
    """
    # 通用的属性(查询集，序列化器)
    # 原来一个类只能对一个对象和序列化器进行操作，改写完成后根据需求，填写不同的对象和序列化器即可
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer

    def get(self, request):
        # books = self.queryset
        books = self.get_queryset()
        # serializer = self.serializer_class(books, many=True)
        # serializer = self.get_serializer_class()(books, many=True)
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookInfoDetailView(generics.GenericAPIView):
    """
    获取，更新或删除一个指定ID的book。
    """
    # 通用属性
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer
    # 默认传入id名称为pk，可以自定义其他名称
    # lookup_url_kwarg = "book_id"

    def get(self, request, pk):
        book = self.get_object()  # 根据book_id到queryset中取出指定对象,传入id名称必须为pk
        serializer = self.get_serializer(book)
        return Response(serializer.data)

    def put(self, request, pk):
        book = self.get_object()
        serializer = self.get_serializer(book, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        book = self.get_object()
        book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```


