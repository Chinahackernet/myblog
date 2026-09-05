Django中内置了一种专门处理CSRF问题的中间件django.middleware.csrf.CsrfViewMiddleware；

  

这个中间件的工作流程：

1、在render返回页面的时候，在页面中塞了一个隐藏的input标签

用法：

    我们在页面上 form表单 里面 写上 {% csrf\_token %}

  

2、当你提交POST数据的时候，它帮你做校验，如果校验不通过就拒绝这次请求

  

例如：transfer.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Title</title>
{#    <link rel="stylesheet" href="bootstrap/css/bootstrap.min.css">#}
</head>
<body>

<h1>正常网站</h1>
<form action="/transfer/" method="post">
    {% csrf_token %}
    <p>
        转出：
        <input type="text" name="from">
    </p>
    <p>
        转入：
        <input type="text" name="to">
    </p>
    <p>
        金额：
        <input type="text" name="money">
    </p>
    <p>
        <input type="submit" value="提交">
    </p>

</form>

{#<script src="jquery-3.2.1.min.js"></script>#}
{#<script src="bootstrap/js/bootstrap.min.js"></script>#}
</body>
</html>
```

  

views.py

```html
from django.shortcuts import render, HttpResponse

# Create your views here.

def transfer(request):
    if request.method == "POST":
        from_ = request.POST.get("from")
        to_ = request.POST.get("to")
        money = request.POST.get("money")

        print("{} 转给 {} {}元".format(from_, to_, money))

        return HttpResponse("转账成功")

    return render(request, "transfer.html")
```