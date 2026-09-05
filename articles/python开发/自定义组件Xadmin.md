步骤如下：

1.  启动时自动发现
2.  注册
3.  设计url

  

**启动：**

1、创建Django项目，创建两个app（app01和Xadmin），其中Xadmin作为一个组件；

2、在app01的应用中创建新的Xadmin.py文件

3、在settings.py中添加应用

```python
INSTALLED_APPS = [
    ...
    'Xadmin.apps.XadminConfig',
    'app01.apps.App01Config',
]
```

4、配置Xadmin应用中的apps.py文件

```python
from django.apps import AppConfig
from django.utils.module_loading import autodiscover_modules

class XadminConfig(AppConfig):
    name = 'Xadmin'

    def ready(self):
        autodiscover_modules('Xadmin')
```

  

**注册：**

5、在Xadmin项目中新增一个package dir，在里面新增一个Xadmin.py文件，如下：

![image.png](assets/python开发/自定义组件Xadmin/自定义组件Xadmin-1.png)

6、在Xadmin.py中新增一个类，类的内容如下：

```python
class ModelXadmin(object):
    def __init__(self, model, site):
        self.model = model
        self.site = site

class XadminSite(object):
    def __init__(self):
        self._registry = {}

    def registry(self, model, admin_class=None, **options):
        if not admin_class:
            admin_class = ModelXadmin
        self._registry[model] = admin_class(model, self)

        
# 单例模式
site = XadminSite()
```

7、在app01应用中的Xadmin.py文件中注册我们的Model

```python
from Xadmin.service import Xadmin
from app01 import models

Xadmin.site.registry(models.UserInfo)
Xadmin.site.register(models.Article)
Xadmin.site.register(models.Article2Tag)
Xadmin.site.register(models.ArticleDetail)
Xadmin.site.register(models.ArticleUpDown)
Xadmin.site.register(models.Blog)
Xadmin.site.register(models.Category)
Xadmin.site.register(models.Comment)
Xadmin.site.register(models.Tag)
```

  

  

设计URL：

8、在主工程的urls.py文件中配置如下：

```python
from django.conf.urls import url
from django.contrib import admin
from Xadmin.service import Xadmin

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^Xadmin/', Xadmin.site.urls),
]
```

9、在Xadmin组件中的Xadmin.py文件中的代码如下：

```python
from django.conf.urls import url
from django.shortcuts import HttpResponse

class ModelXadmin(object):
    def __init__(self, model, site):
        self.model = model
        self.site = site

class XadminSite(object):
    def __init__(self):
        self._registry = {}

    def register(self, model, admin_class=None, **options):
        if not admin_class:
            admin_class = ModelXadmin
        self._registry[model] = admin_class(model, self)

    def list_view(self, request):
        return HttpResponse("list_view")

    def delete_view(self,request, id):
        return HttpResponse("delete_view")

    def add_view(self,request):
        return HttpResponse("add_view")

    def change_view(self,request, id):
        return HttpResponse("change_view")

    def get_operate_urls(self):
        """
            分发操作的urls
            :return:
        """
        operate_urls_list = [url(r'^$', self.list_view), url(r'^add/$', self.add_view),
                             url(r'^(\d+)/change/$', self.change_view), url(r'^(\d+)/delete/$', self.delete_view)]
        return operate_urls_list

    @property
    def urls2(self):
        return self.get_operate_urls(), None, None

    def get_urls(self):
        urlpatterns = []
        for model, admin_class_obj in self._registry.items():
            app_name = model._meta.app_label
            model_name = model._meta.model_name
            urlpatterns.append(url(r'^{0}/{1}/'.format(app_name, model_name), self.urls2))
        return urlpatterns

    @property
    def urls(self):
        return self.get_urls(), None, None

# 单例模式
site = XadminSite()
```

然后启动服务便可通过类似如下URL进行访问：

127.0.0.1:8000/Xadmin/app01/book/

127.0.0.1:8000/Xadmin/app01/book/add/

127.0.0.1:8000/Xadmin/app01/book/1/change/  
127.0.0.1:8000/Xadmin/app01/book/1/delete/