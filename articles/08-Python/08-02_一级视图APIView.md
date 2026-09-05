# 一级视图APIView

> 分类：Python / 第8章：DRF视图
> 原文：https://www.cuiliangblog.cn/detail/section/32874615
> 来源：崔亮的博客

---

## 一、APIView
1. `APIView`是REST framework提供的所有视图的基类，继承自Django的`View`父类。
2. `APIView`与`View`的不同之处在于：
+ 传入到视图方法中的是REST framework的`Request`对象，而不是Django的`HttpRequeset`对象；
+ 视图方法可以返回REST framework的`Response`对象，视图会为响应数据设置（render）符合前端要求的格式；
+ 任何`APIException`异常都会被捕获到，并且处理成合适的响应信息；
+ 在进行dispatch()分发前，会对请求进行身份认证、权限检查、流量控制。
3. 支持定义的属性：
+ **authentication_classes** 列表或元祖，身份认证类
+ **permissoin_classes** 列表或元祖，权限检查类
+ **throttle_classes** 列表或元祖，流量控制类
4. 在`APIView`中仍以常规的类视图定义方法来实现get() 、post() 或者其他请求方式的方法。

## 二、使用APIView
+ <font style="color:#333333;">修改view.py文件，将根视图重写为基于类的视图。</font>

> BookInfoDetailView中每个函数都需要获取指定id的对象，抽离成类方法
>

```python
from django.http import Http404
from rest_framework import status
from rest_framework.views import APIView

from quickstart.models import BookInfo
from quickstart.serializers import BookInfoSerializer
from rest_framework.response import Response


class BookInfoView(APIView):
    """
    列出所有的book信息，或创建一个新book。
    """

    def get(self, request):
        books = BookInfo.objects.all()
        serializer = BookInfoSerializer(books, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BookInfoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookInfoDetailView(APIView):
    """
    获取，更新或删除一个指定ID的book。
    """

    def get_object(self, book_id):
        try:
            return BookInfo.objects.get(pk=book_id)
        except BookInfo.DoesNotExist:
            raise Http404

    def get(self, request, book_id):
        book = self.get_object(book_id)
        serializer = BookInfoSerializer(book)
        return Response(serializer.data)

    def put(self, request, book_id):
        book = self.get_object(book_id)
        serializer = BookInfoSerializer(book, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, book_id):
        book = self.get_object(book_id)
        book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```

2. 修改路由

```python
from django.urls import path
from quickstart import views

urlpatterns = [
    path('books/', views.BookInfoView.as_view()),
    path('books/<int:book_id>', views.BookInfoDetailView.as_view())
]
```


