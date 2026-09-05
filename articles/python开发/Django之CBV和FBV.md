# CBV

CBV：class base view，也就是类视图。如下形式：

  

```shell
from django.views import View

class AddClass(View):
		
    # get请求
    def get(self, request):
        return render(request, "add_class.html")

	# post请求
    def post(self, request):
        class_name = request.POST.get("class_name")
        models.Classes.objects.create(name=class_name)
        return redirect("/class_list/")
```

注意：

使用CBV时，urls.py中也做对应的修改：

```shell
# urls.py中
url(r'^add_class/$', views.AddClass.as_view()),
```

  

## CBV加装饰器

```shell
# 装饰器
def check_login(func):
    @wraps(func)
    def inner(request, *args, **kwargs):
        # 获取cookie
        get_cookie = request.get_signed_cookie("is_login", salt="login", default=None)
        next_url = request.path_info
        if get_cookie == "123":
            return func(request, *args, **kwargs)
        else:
            return redirect("/login/?next={}".format(next_url))
    return inner
class LoginView(View):

    def get(self, request):
        """
        处理GET请求
        """
        return render(request, 'login.html')

    def post(self, request):
        """
        处理POST请求 
        """
        user = request.POST.get('user')
        pwd = request.POST.get('pwd')
        if user == 'alex' and pwd == "alex1234":
            next_url = request.GET.get("next")
            # 生成随机字符串
            # 写浏览器cookie -> session_id: 随机字符串
            # 写到服务端session：
            # {
            #     "随机字符串": {'user':'alex'}
            # }
            request.session['user'] = user
            if next_url:
                return redirect(next_url)
            else:
                return redirect('/index/')
        return render(request, 'login.html')
```

  

要在CBV视图中使用我们上面的check\_login装饰器，有以下三种方式：

**1\. 加在CBV视图的get或post方法上**

```shell
from django.utils.decorators import method_decorator

class HomeView(View):

    def dispatch(self, request, *args, **kwargs):
        return super(HomeView, self).dispatch(request, *args, **kwargs)

    def get(self, request):
        return render(request, "home.html")
    
    @method_decorator(check_login)
    def post(self, request):
        print("Home View POST method...")
        return redirect("/index/")
```

  

**2\. 加在dispatch方法上**

```shell
from django.utils.decorators import method_decorator

class HomeView(View):

    @method_decorator(check_login)
    def dispatch(self, request, *args, **kwargs):
        return super(HomeView, self).dispatch(request, *args, **kwargs)

    def get(self, request):
        return render(request, "home.html")

    def post(self, request):
        print("Home View POST method...")
        return redirect("/index/")
```

因为CBV中首先执行的就是dispatch方法，所以这么写相当于给get和post方法都加上了登录校验。

  
**3\. 直接加在视图类上，但method\_decorator必须传 name 关键字参数**

```shell
# 如果get方法和post方法都需要登录校验的话就写两个装饰器。
from django.utils.decorators import method_decorator

@method_decorator(check_login, name="get")
@method_decorator(check_login, name="post")
class HomeView(View):

    def dispatch(self, request, *args, **kwargs):
        return super(HomeView, self).dispatch(request, *args, **kwargs)

    def get(self, request):
        return render(request, "home.html")

    def post(self, request):
        print("Home View POST method...")
        return redirect("/index/")
```

  

## CSRF在CBV上使用

CSRF Token相关装饰器在CBV只能加到dispatch方法上，或者加在视图类上然后name参数指定为dispatch方法。

备注：

-   csrf\_protect，为当前函数强制设置防跨站请求伪造功能，即便settings中没有设置全局中间件。
-   csrf\_exempt，取消当前函数防跨站请求伪造功能，即便settings中设置了全局中间件。

  

```shell
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.utils.decorators import method_decorator

class HomeView(View):

    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super(HomeView, self).dispatch(request, *args, **kwargs)

    def get(self, request):
        return render(request, "home.html")

    def post(self, request):
        print("Home View POST method...")
        return redirect("/index/")
```

  

或者

  

```shell
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class HomeView(View):
   
    def dispatch(self, request, *args, **kwargs):
        return super(HomeView, self).dispatch(request, *args, **kwargs)

    def get(self, request):
        return render(request, "home.html")

    def post(self, request):
        print("Home View POST method...")
        return redirect("/index/")

```

  

# FBV

FBV：Function Base View，基于函数的视图

例如：

```shell
from django.shortcuts import render, HttpResponse, redirect
from orm import models
from utils.mypage import Page
from functools import wraps
from django.views import View
from django.utils.decorators import method_decorator

# Create your views here.

# 装饰器
def check_login_status(func):
    @wraps(func)
    def inner(request, *args, **kwargs):
        # 获取cookie
        get_cookie = request.session.get("is_login")
        next_url = request.path_info
        if get_cookie == "123":
            return func(request, *args, **kwargs)
        else:
            return redirect("/app02/login/?next={}".format(next_url))
    return inner

def login(request):
    """用户登录"""
    if request.method == "POST":
        user = request.POST.get("username")
        pwd = request.POST.get("password")
        # 获取跳转url
        next_url = request.GET.get("next")
        check_username = models.Userinfo.objects.filter(username=user)
        if check_username:
            if pwd == check_username[0].password:
                if next_url:
                    ret = redirect("{}".format(next_url))
                else:
                    ret = redirect("/app02/home/")
                # 设置session
                request.session["is_login"] = "123"
                return ret
    return render(request, "app02/login.html")

@check_login_status
def home(request):
    return render(request, "app02/home.html")
```