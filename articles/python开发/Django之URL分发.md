我们知道在Django中有一个专门的urls.py文件用于配置URL规则，转发到后端的views.py，但是当我们有非常多的URL或者一个项目中有多个应用，这时候我们就希望把URL分开，避免URL太多造成项目混乱。

  

URL分发有两种方式：

1.  通过include方法
2.  通过url嵌套

  

# include方法

比如我们有一个应用blog，在其里面添加一个urls.py，所有访问blog应用的规则都到该应用本身的urls.py进行处理，这时候我们就可以在工程的urls.py中进行如下配置：

  

```python
from django.conf.urls import url, include
from blog import urls as blog_urls
# 将所有以blog开头的路由转发到blog.urls下执行
urlpatterns = [
    url(r'^blog/', include(blog_urls)),
]
```

  

# 元组嵌套

```python
urlpatterns = [
    url(r'^blog/', ([
    	url(r'^test01/', test01),
        url(r'^test02/', test02),
    	], None, None)),
]
```

这样就可以通过blog/test01以及blog/test02进行访问。

  

例子：

设计如下URL：

127.0.0.1:8000/Xadmin/app01/book/

127.0.0.1:8000/Xadmin/app01/book/add/

127.0.0.1:8000/Xadmin/app01/book/1/change/  
127.0.0.1:8000/Xadmin/app01/book/1/delete/

  

代码如下：

```python
from django.conf.urls import url
from django.contrib import admin
from django.shortcuts import HttpResponse

def list_view(request):
    return HttpResponse("list_view")

def delete_view(request, id):
    return HttpResponse("delete_view")

def add_view(request):
    return HttpResponse("add_view")

def change_view(request, id):
    return HttpResponse("change_view")

def get_operate_urls():
    """
    分发操作的urls
    :return:
    """
    operate_urls_list = []
    operate_urls_list.append(url(r'^$', list_view))
    operate_urls_list.append(url(r'^add/$', add_view))
    operate_urls_list.append(url(r'^(\d+)/change/$', change_view))
    operate_urls_list.append(url(r'^(\d+)/delete/$', delete_view))
    return operate_urls_list

def get_urls():
    urls_list = []
    # 循环分别取出注册的信息，拼接成url
    for model, admin_class_obj in admin.site._registry.items():
        app_name = model._meta.app_label
        model_name = model._meta.model_name
        urls_list.append(url(r'{0}/{1}/'.format(app_name, model_name), (get_operate_urls(), None, None)))
    return urls_list

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^Xadmin/', (get_urls(), None, None))
]

```

其中第一个get\_urls方法是用于获取app\_name/model\_name，他们分别通过model模型类中的\_meta.app\_label和\_meta.model\_name获取。

第二个get\_operate\_urls方法用于分发操作的urls。

  

题外：

当外面在admin.py中注册后，代码如下：

```python
from django.contrib import admin

# Register your models here.
from app01 import models
admin.site.register(models.UserInfo)
admin.site.register(models.Article)
admin.site.register(models.Article2Tag)
admin.site.register(models.ArticleDetail)
admin.site.register(models.ArticleUpDown)
admin.site.register(models.Blog)
admin.site.register(models.Category)
admin.site.register(models.Comment)
admin.site.register(models.Tag)
```

  

然后其信息就会以字典的形式保存在admin.site.\_registry中，其中键是ModelClass，值是admin\_class(ModelClass, self)。