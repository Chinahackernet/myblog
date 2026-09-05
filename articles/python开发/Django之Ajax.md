# Ajax简介

  

Ajax（Asynchronous Javascript And XML），翻译成中文就是异步的Javascript和XML，即使用Javascript语言与服务器进行交互，传输的数据为XML格式（实际上不只是XML格式数据）。Ajax不是新的编程语言，而是一种实现现有标准的新方法。

（1）、同步交互：客户端发送请求后，需要等待服务端响应结束后再发送第二个请求；

（2）、异步交互：客户端发送请求后，无需等待服务端响应结束便可继续发送第二个请求；

  

Ajax的最大优点是在不重载整个页面的情况下，可以与服务器进行交换数据并局部刷新页面。

Ajax不需要任何浏览器插件，但需要用于允许JavaScript在浏览器上运行。

  

Ajax常用模板：

```plain
var i1 = $("#i1").val();
var i2 = $("#i2").val();
$.ajax({
	url: "/ajax_add/",
  type: "GET",
  data: {"i1": i1, "i2": i2},
  success: function(data){
  	$("#i3").val(data);
  }
})
```

  

简单示例：在页面实现一个简单的加法运算，在不刷新整个页面的情况下，显示结果。如图：

![image.png](assets/python开发/Django之Ajax/Django之Ajax-1.png)

### Ajax GET请求

代码如下：

urls.py中的代码：

```plain
from django.conf.urls import url
from django.contrib import admin
from app01 import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^index/', views.index),
    url(r'^ajax_add/', views.ajax_add),
]
```

  

views.py中的代码：

```plain
from django.shortcuts import render, HttpResponse

# Create your views here.

def index(request):
    return render(request, "index.html")

def ajax_add(request):
    i1 = int(request.GET.get("i1"))
    i2 = int(request.GET.get("i2"))
    ret = i1 + i2
    return HttpResponse(ret)
```

  

index.html中的代码：

```plain
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ajax Html</title>
</head>
<body>
<input type="text" id="i1">+
<input type="text" id="i2">=
<input type="text" id="i3">
<input type="button" value="Ajax提交" id="b1">
<script src="/static/jquery-3.2.1.min.js"></script>
<script>
    $("#b1").on("click", function () {
        $.ajax({
            url: "/ajax_add/",
            type: "GET",
            data: {"i1": $("#i1").val(), "i2": $("#i2").val()},
            success: function (data) {
                $("#i3").val(data);
            }
        })
    })
</script>
</body>
</html>
```

  

### Ajax POST请求

主要解决跨站请求问题。

代码如下：

urls.py中代码：

```plain
from django.conf.urls import url
from django.contrib import admin
from app01 import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^index/', views.index),
    url(r'^ajax_add/', views.ajax_add),
]
```

  

views.py中代码：

```plain
from django.shortcuts import render, HttpResponse

# Create your views here.

def index(request):
    return render(request, "index.html")

def ajax_add(request):
    i1 = int(request.POST.get("i1"))
    i2 = int(request.POST.get("i2"))
    print(type(i1), type(i2))
    ret = i1 + i2
    return HttpResponse(ret)
```

  

index.html中代码如下

```plain
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ajax Html</title>
</head>
<body>
{% csrf_token %}
<input type="text" id="i1">+
<input type="text" id="i2">=
<input type="text" id="i3">
<input type="button" value="Ajax提交" id="b1">
<script src="/static/jquery-3.2.1.min.js"></script>
<script>
    $("#b1").on("click", function () {
        var csrf_token = $("[name = 'csrfmiddlewaretoken']").val();
        $.ajax({
            url: "/ajax_add/",
            type: "POST",
            data: {"i1": $("#i1").val(), "i2": $("#i2").val(), "csrfmiddlewaretoken": csrf_token},
            success: function (data) {
                $("#i3").val(data);
            }
        })
    })
</script>
</body>
</html>
```

这样实现的结果和GET一样。

  

### Ajax的优缺点

优点：

1、Ajax只用JS技术向服务端发送异步请求；

2、Ajax无需刷新整个页面；

3、因为服务器响应内容不再是整个页面，而是页面中的部分内容，所以响应速度快；

  

缺点：

1、请随零碎；

2、请求频繁，对服务端压力大；

  

### Ajax的应用场景

常见使用场景为用户注册页面，用于正确性查重校验。

  

### Ajax请求设置csrf\_token

方式1：通过获取隐藏的input标签中csrfmiddlewaretoken的值，和data一起发送给后端。

```plain
$.ajax({
  url: "/cookie_ajax/",
  type: "POST",
  data: {
    "username": "Q1mi",
    "password": 123456,
    "csrfmiddlewaretoken": $("[name = 'csrfmiddlewaretoken']").val()  // 使用jQuery取出csrfmiddlewaretoken的值，拼接到data中
  },
  success: function (data) {
    console.log(data);
  }
})
```

  

方式2：获取返回cookie中的字符串，放置在请求头中发送。

注意：需要引入jquery.cookie.js插件

```plain
$.ajax({
  url: "/cookie_ajax/",
  type: "POST",
  headers: {"X-CSRFToken": $.cookie('csrftoken')},  // 从Cookie取csrftoken，并设置到请求头中
  data: {"username": "Q1mi", "password": 123456},
  success: function (data) {
    console.log(data);
  }
})
```

  

方式3：自己写一个获取cookie的方法。

创建一个js文件，代码如下：

```plain
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken')

function csrfSafeMethod(method) {
  // these HTTP methods do not require CSRF protection
  return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
  beforeSend: function (xhr, settings) {
    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
      xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }
  }
});
```

注意：

如果使用从cookie中取csrftoken的方式，需要确保cookie存在csrftoken值。

如果你的视图渲染的HTML文件中没有包含 {% csrf\_token %}，Django可能不会设置CSRFtoken的cookie。

这个时候需要使用ensure\_csrf\_cookie()装饰器强制设置Cookie。

```plain
django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def login(request):
    pass
```

  

使用：

index,html代码

```plain
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ajax Html</title>
</head>
<body>
{% csrf_token %}
<input type="text" id="i1">+
<input type="text" id="i2">=
<input type="text" id="i3">
<input type="button" value="Ajax提交" id="b1">
<script src="/static/jquery-3.2.1.min.js"></script>
// 导入js即可
<script src="/static/getCookie.js"></script>
<script>
    $("#b1").on("click", function () {
        {#var csrf_token = $("[name = 'csrfmiddlewaretoken']").val();#}
        $.ajax({
            url: "/ajax_add/",
            type: "POST",
            data: {"i1": $("#i1").val(), "i2": $("#i2").val()},
            success: function (data) {
                $("#i3").val(data);
            }
        })
    })
</script>
</body>
</html>
```