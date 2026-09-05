# Form介绍

我们之前在HTML页面中利用form表单向后端提交数据时，都会写一些获取用户输入的标签并且用form标签把它们包起来。

  

与此同时我们在好多场景下都需要对用户的输入做校验，比如校验用户是否输入，输入的长度和格式等正不正确。如果用户输入的内容有错误就需要在页面上相应的位置显示对应的错误信息.。

Django form组件就实现了上面所述的功能。

  

总结一下，其实form组件的主要功能如下:

-   生成页面可用的HTML标签；
-   对用户提交的数据进行校验；
-   保留上次输入内容；

  

## 普通方式实现注册功能

### views.py

```dockerfile
def register(request):
    error_msg = ""
    if request.method == "POST":
        username = request.POST.get("name")
        pwd = request.POST.get("pwd")
        # 对注册信息做校验
        if len(username) < 6:
            # 用户长度小于6位
            error_msg = "用户名长度不能小于6位"
        else:
            # 将用户名和密码存到数据库
            return HttpResponse("注册成功")
    return render(request, "register.html", {"error_msg": error_msg})
```

  

### login.html

```dockerfile
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>注册页面</title>
</head>
<body>
<form action="/reg/" method="post">
    {% csrf_token %}
    <p>
        用户名:
        <input type="text" name="name">
    </p>
    <p>
        密码：
        <input type="password" name="pwd">
    </p>
    <p>
        <input type="submit" value="注册">
        <p style="color: red">{{ error_msg }}</p>
    </p>
</form>
</body>
</html>
```

  

## 用Form组件实现注册功能

### views.py

先定义一个RegForm类

```dockerfile
from django import forms

# 按照Django form组件的要求自己写一个类
class RegForm(forms.Form):
    name = forms.CharField(label="用户名")
    pwd = forms.CharField(label="密码")
```

  

再写一个视图函数

```dockerfile
def register2(request):
    form_obj = RegForm()
    if request.method == "POST":
        # 实例化form对象的时候，把post提交过来的数据直接传进去
        form_obj = RegForm(request.POST)
        # 调用form_obj校验数据的方法
        if form_obj.is_valid():
            return HttpResponse("注册成功")
    return render(request, "register2.html", {"form_obj": form_obj})
```

  

### login.html

```dockerfile
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>注册2</title>
</head>
<body>
    <form action="/reg2/" method="post" novalidate autocomplete="off">
        {% csrf_token %}
        <div>
            <label for="{{ form_obj.name.id_for_label }}">{{ form_obj.name.label }}</label>
            {{ form_obj.name }} {{ form_obj.name.errors.0 }}
        </div>
        <div>
            <label for="{{ form_obj.pwd.id_for_label }}">{{ form_obj.pwd.label }}</label>
            {{ form_obj.pwd }} {{ form_obj.pwd.errors.0 }}
        </div>
        <div>
            <input type="submit" class="btn btn-success" value="注册">
        </div>
    </form>
</body>
</html>
```

  

看网页效果发现 也验证了form的功能：

• 前端页面是form类的对象生成的                                      -->生成HTML标签功能

• 当用户名和密码输入为空或输错之后 页面都会提示            -->用户提交校验功能

• 当用户输错之后 再次输入 上次的内容还保留在input框       -->保留上次输入内容

  

# 常用字段和插件

## initial

初始值，input框里面的初始值。

```dockerfile
class LoginForm(forms.Form):
    username = forms.CharField(
        min_length=8,
        label="用户名",
        initial="张三"  # 设置默认值
    )
    pwd = forms.CharField(min_length=6, label="密码")
```

  

## error\_message

重写错误信息。

  

```dockerfile
class LoginForm(forms.Form):
    username = forms.CharField(
        min_length=8,
        label="用户名",
        initial="张三",
        error_messages={
            "required": "不能为空",
            "invalid": "格式错误",
            "min_length": "用户名最短8位"
        }
    )
    pwd = forms.CharField(min_length=6, label="密码")
```

  

## password

  

```dockerfile
class LoginForm(forms.Form):
    ...
    pwd = forms.CharField(
        min_length=6,
        label="密码",
        widget=forms.widgets.PasswordInput(attrs={'class': 'c1'}, render_value=True)
    )
```

  

## radioselect

  

```dockerfile
class LoginForm(forms.Form):
    username = forms.CharField(
        min_length=8,
        label="用户名",
        initial="张三",
        error_messages={
            "required": "不能为空",
            "invalid": "格式错误",
            "min_length": "用户名最短8位"
        }
    )
    pwd = forms.CharField(min_length=6, label="密码")
    gender = forms.fields.ChoiceField(
        choices=((1, "男"), (2, "女"), (3, "保密")),
        label="性别",
        initial=3,
        widget=forms.widgets.RadioSelect()
    )
```

  

## 单选select

  

```dockerfile
class LoginForm(forms.Form):
    ...
    hobby = forms.fields.ChoiceField(
        choices=((1, "篮球"), (2, "足球"), (3, "双色球"), ),
        label="爱好",
        initial=3,
        widget=forms.widgets.Select()
    )
```

  

## 多选select

  

```dockerfile
class LoginForm(forms.Form):
    ...
    hobby = forms.fields.MultipleChoiceField(
        choices=((1, "篮球"), (2, "足球"), (3, "双色球"), ),
        label="爱好",
        initial=[1, 3],
        widget=forms.widgets.SelectMultiple()
    )
```

  

## 单选checkbox

  

```dockerfile
class LoginForm(forms.Form):
    ...
    keep = forms.fields.ChoiceField(
        label="是否记住密码",
        initial="checked",
        widget=forms.widgets.CheckboxInput()
    )
```

  

## 多选checkbox

  

```dockerfile
class LoginForm(forms.Form):
    ...
    hobby = forms.fields.MultipleChoiceField(
        choices=((1, "篮球"), (2, "足球"), (3, "双色球"),),
        label="爱好",
        initial=[1, 3],
        widget=forms.widgets.CheckboxSelectMultiple()
    )
```

  

## choice

在使用选择标签时，需要注意choices的选项可以配置从数据库中获取，但是由于是静态字段 获取的值无法实时更新，需要重写构造方法从而实现choice实时更新。

方式一：

  

```dockerfile
from django.forms import Form
from django.forms import widgets
from django.forms import fields

 
class MyForm(Form):
 
    user = fields.ChoiceField(
        # choices=((1, '上海'), (2, '北京'),),
        initial=2,
        widget=widgets.Select
    )
 
    def __init__(self, *args, **kwargs):
        super(MyForm,self).__init__(*args, **kwargs)
        # self.fields['user'].choices = ((1, '上海'), (2, '北京'),)
        # 或
        self.fields['user'].choices = models.Classes.objects.all().values_list('id','caption')
```

  

方式二：

  

```dockerfile
from django import forms
from django.forms import fields
from django.forms import models as form_model

 
class FInfo(forms.Form):
    authors = form_model.ModelMultipleChoiceField(queryset=models.NNewType.objects.all())  # 多选
    # authors = form_model.ModelChoiceField(queryset=models.NNewType.objects.all())  # 单选
```

  

# Form内置字段

## Field

```dockerfile
    required=True,               是否允许为空
    widget=None,                 HTML插件
    label=None,                  用于生成Label标签或显示内容
    initial=None,                初始值
    help_text='',                帮助信息(在标签旁边显示)
    error_messages=None,         错误信息 {'required': '不能为空', 'invalid': '格式错误'}
    validators=[],               自定义验证规则
    localize=False,              是否支持本地化
    disabled=False,              是否可以编辑
    label_suffix=None            Label内容后缀
```

  

## CharField(Field)

  

```dockerfile
    max_length=None,             最大长度
    min_length=None,             最小长度
    strip=True                   是否移除用户输入空白
```

  

## IntegerField(Field)

  

```dockerfile
    max_value=None,              最大值
    min_value=None,              最小值
```

  

## FloatField(IntegerField)

## DecimalField(IntegerField)

  

```dockerfile
    max_value=None,              最大值
    min_value=None,              最小值
    max_digits=None,             总长度
    decimal_places=None,         小数位长度
```

  

## BaseTemporalField(Field)

  

```dockerfile
    input_formats=None          时间格式化 
```

  

## DateField(BaseTemporalField)

格式：2019-09-01

## TimeField(BaseTemporalField)

格式：11:12

## DateTimeField(BaseTemporalField)

格式：2019-09-01 11:12

  

## DurationField(Field)

格式：%d %H:%M:%S.%f

  

## RegexField(CharField)

  

```dockerfile
    regex,                      自定制正则表达式
    max_length=None,            最大长度
    min_length=None,            最小长度
    error_message=None,         忽略，错误信息使用 error_messages={'invalid': '...'}
```

  

## EmailField(CharField)

  

## FileField(Field)

```dockerfile
    allow_empty_file=False     是否允许空文件
```

  

## ImageField(FileField)

  

```dockerfile
    注：需要PIL模块，pip3 install Pillow
    以上两个字典使用时，需要注意两点：
        - form表单中 enctype="multipart/form-data"
        - view函数中 obj = MyForm(request.POST, request.FILES)
```

  

## 其他

  

```dockerfile
URLField(Field)
    ...
 
 
BooleanField(Field)  
    ...
 
NullBooleanField(BooleanField)
    ...
 
ChoiceField(Field)
    ...
    choices=(),                选项，如：choices = ((0,'上海'),(1,'北京'),)
    required=True,             是否必填
    widget=None,               插件，默认select插件
    label=None,                Label内容
    initial=None,              初始值
    help_text='',              帮助提示
 
 
ModelChoiceField(ChoiceField)
    ...                        django.forms.models.ModelChoiceField
    queryset,                  # 查询数据库中的数据
    empty_label="---------",   # 默认空显示内容
    to_field_name=None,        # HTML中value的值对应的字段
    limit_choices_to=None      # ModelForm中对queryset二次筛选
     
ModelMultipleChoiceField(ModelChoiceField)
    ...                        django.forms.models.ModelMultipleChoiceField
 
 
     
TypedChoiceField(ChoiceField)
    coerce = lambda val: val   对选中的值进行一次转换
    empty_value= ''            空值的默认值
 
MultipleChoiceField(ChoiceField)
    ...
 
TypedMultipleChoiceField(MultipleChoiceField)
    coerce = lambda val: val   对选中的每一个值进行一次转换
    empty_value= ''            空值的默认值
 
ComboField(Field)
    fields=()                  使用多个验证，如下：即验证最大长度20，又验证邮箱格式
                               fields.ComboField(fields=[fields.CharField(max_length=20), fields.EmailField(),])
 
MultiValueField(Field)
    PS: 抽象类，子类中可以实现聚合多个字典去匹配一个值，要配合MultiWidget使用
 
SplitDateTimeField(MultiValueField)
    input_date_formats=None,   格式列表：['%Y--%m--%d', '%m%d/%Y', '%m/%d/%y']
    input_time_formats=None    格式列表：['%H:%M:%S', '%H:%M:%S.%f', '%H:%M']
 
FilePathField(ChoiceField)     文件选项，目录下文件显示在页面中
    path,                      文件夹路径
    match=None,                正则匹配
    recursive=False,           递归下面的文件夹
    allow_files=True,          允许文件
    allow_folders=False,       允许文件夹
    required=True,
    widget=None,
    label=None,
    initial=None,
    help_text=''
 
GenericIPAddressField
    protocol='both',           both,ipv4,ipv6支持的IP格式
    unpack_ipv4=False          解析ipv4地址，如果是::ffff:192.0.2.1时候，可解析为192.0.2.1， PS：protocol必须为both才能启用
 
SlugField(CharField)           数字，字母，下划线，减号（连字符）
    ...
 
UUIDField(CharField)           uuid类型
```

  

# 字段校验

## RegexValidator验证器

  

```dockerfile
from django.forms import Form
from django.forms import widgets
from django.forms import fields
from django.core.validators import RegexValidator
 
class MyForm(Form):
    user = fields.CharField(
        validators=[RegexValidator(r'^[0-9]+$', '请输入数字'), RegexValidator(r'^159[0-9]+$', '数字必须以159开头')],
    )
```

  

## 自定义验证函数

  

```dockerfile
import re
from django.forms import Form
from django.forms import widgets
from django.forms import fields
from django.core.exceptions import ValidationError
 
 
# 自定义验证规则
def mobile_validate(value):
    mobile_re = re.compile(r'^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$')
    if not mobile_re.match(value):
        raise ValidationError('手机号码格式错误')
 
 
class PublishForm(Form):
 
 
    title = fields.CharField(max_length=20,
                            min_length=5,
                            error_messages={'required': '标题不能为空',
                                            'min_length': '标题最少为5个字符',
                                            'max_length': '标题最多为20个字符'},
                            widget=widgets.TextInput(attrs={'class': "form-control",
                                                          'placeholder': '标题5-20个字符'}))
 
 
    # 使用自定义验证规则
    phone = fields.CharField(validators=[mobile_validate, ],
                            error_messages={'required': '手机不能为空'},
                            widget=widgets.TextInput(attrs={'class': "form-control",
                                                          'placeholder': u'手机号码'}))
 
    email = fields.EmailField(required=False,
                            error_messages={'required': u'邮箱不能为空','invalid': u'邮箱格式错误'},
                            widget=widgets.TextInput(attrs={'class': "form-control", 'placeholder': u'邮箱'}))
```

  

# HOOK方法

除了上面两种方式，我们还可以在Form类中定义钩子函数，来实现自定义的验证功能。

## 局部钩子

我们在Fom类中定义 clean\_字段名() 方法，就能够实现对特定字段进行校验。

举个例子：

  

```dockerfile
class LoginForm(forms.Form):
    username = forms.CharField(
        min_length=8,
        label="用户名",
        initial="张三",
        error_messages={
            "required": "不能为空",
            "invalid": "格式错误",
            "min_length": "用户名最短8位"
        },
        widget=forms.widgets.TextInput(attrs={"class": "form-control"})
    )
    ...
    # 定义局部钩子，用来校验username字段
    def clean_username(self):
        value = self.cleaned_data.get("username")
        if "666" in value:
            raise ValidationError("光喊666是不行的")
        else:
            return value
```

  

## 全局钩子

我们在Fom类中定义 clean() 方法，就能够实现对字段进行全局校验

```dockerfile
class LoginForm(forms.Form):
    ...
    password = forms.CharField(
        min_length=6,
        label="密码",
        widget=forms.widgets.PasswordInput(attrs={'class': 'form-control'}, render_value=True)
    )
    re_password = forms.CharField(
        min_length=6,
        label="确认密码",
        widget=forms.widgets.PasswordInput(attrs={'class': 'form-control'}, render_value=True)
    )
    ...
    # 定义全局的钩子，用来校验密码和确认密码字段是否相同
    def clean(self):
        password_value = self.cleaned_data.get('password')
        re_password_value = self.cleaned_data.get('re_password')
        if password_value == re_password_value:
            return self.cleaned_data
        else:
            self.add_error('re_password', '两次密码不一致')
            raise ValidationError('两次密码不一致')
```

  

# 样式

## 批量添加样式

可通过重写form类的init方法来实现。

  

```dockerfile
class LoginForm(forms.Form):
    username = forms.CharField(
        min_length=8,
        label="用户名",
        initial="张三",
        error_messages={
            "required": "不能为空",
            "invalid": "格式错误",
            "min_length": "用户名最短8位"
        }

    def __init__(self, *args, **kwargs):
        super(LoginForm, self).__init__(*args, **kwargs)
        for field in iter(self.fields):
            self.fields[field].widget.attrs.update({
                'class': 'form-control'
            })
```

  

## 应用Bootstrap样式

### login.html

```dockerfile
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Form Test</title>
    <link rel="stylesheet" href="/static/bootstrap/css/bootstrap.min.css">
</head>
<body>
<div class="container">
    <div class="row">
        <div class="col-md-6 col-md-offset-3">
            <form action="/form_test/" method="post" novalidate>
                {% csrf_token %}
                <div class="form-group {% if form_obj.username.errors.0 %} has-error {% endif %}">
                    {{ form_obj.username.label }}
                    {{ form_obj.username }}
                    <span class="help-block">{{ form_obj.username.errors.0 }}</span>
                </div>
                <div class="form-group {% if form_obj.username.errors.0 %} has-error {% endif %}">
                    {{ form_obj.pwd.label }}
                    {{ form_obj.pwd }}
                    <span class="help-block">{{ form_obj.pwd.errors.0 }}</span>
                </div>
                <div class="form-group {% if form_obj.username.errors.0 %} has-error {% endif %}">
                    {{ form_obj.re_pwd.label }}
                    {{ form_obj.re_pwd }}
                    <span class="help-block">{{ form_obj.re_pwd.errors.0 }}</span>
                </div>
                <div class="form-group {% if form_obj.email.errors.0 %} has-error {% endif %}">
                    {{ form_obj.email.label }}
                    {{ form_obj.email }}
                    <span class="help-block">{{ form_obj.email.errors.0 }}</span>
                </div>
                <div class="form-group {% if form_obj.mobile.errors.0 %} has-error {% endif %}">
                    {{ form_obj.mobile.label }}
                    {{ form_obj.mobile }}
                    <span class="help-block">{{ form_obj.mobile.errors.0 }}</span>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-default">注册</button>
                </div>
            </form>
        </div>
    </div>
</div>

</body>
</html>
```

  

### views.py

  

```dockerfile
from django.shortcuts import render, HttpResponse, redirect
from app01 import models

# Create your views here.

def index(request):
    return render(request, "index.html")

def ajax_add(request):
    print(request.POST)
    i1 = int(request.POST.get("i1"))
    i2 = int(request.POST.get("i2"))
    print(type(i1), type(i2))
    ret = i1 + i2
    print(ret)
    return HttpResponse(ret)

def user_registration(request):
    return render(request, "user.html")

def user_check(request):
    data = request.POST.get("text_data")
    if not data:
        flag = '用户名不能为空'
    else:
        select_res = models.User.objects.filter(username=data)
        if not select_res:
            flag = '检验通过'
        else:
            flag = '用户名存在'
    return HttpResponse(flag)

def user_add(request):
    username = request.POST.get("username")
    passwd = request.POST.get("password")
    models.User.objects.last().add(username=username)
    return redirect("/user_registration/")

def person(request):
    ret = models.User.objects.all()
    return render(request, "sweetalert.html", {"persons": ret})

def delete(request):
    del_id = request.POST.get("id")
    models.User.objects.filter(id=del_id).delete()
    return HttpResponse("删除成功！")

# Django版Form表单
from django import forms
from django.forms import widgets
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError

class TestForm(forms.Form):
    username = forms.CharField(
        max_length=24,
        label="用户名",
        error_messages={
            "required": "用户名不能为空",
            "invalid": "用户名格式错误",
            "max_length": "用户名最长24位",
        },
        widget=widgets.TextInput(attrs={"class": "form-control"})
    )
    pwd = forms.CharField(
        min_length=6,
        label="密码",
        widget=widgets.PasswordInput(attrs={"class": "form-control"}, render_value=True),
        error_messages={
            "min_length": "密码不得少于6位",
            "required": "该字段不能为空",
        }
    )
    re_pwd = forms.CharField(
        min_length=6,
        label="确认密码",
        widget=widgets.PasswordInput(attrs={"class": "form-control"}, render_value=True),
        error_messages={
            "min_length": "密码不得少于6位",
            "required": "该字段不能为空",
        }
    )
    email = forms.EmailField(
        max_length=32,
        label="邮箱",
        widget=widgets.EmailInput(attrs={"class": "form-control"}),
        error_messages={
            "max_length": "密码不得少于6位",
            "required": "该字段不能为空",
        }
    )
    mobile = forms.CharField(
        max_length=11,
        min_length=11,
        label="手机号码",
        validators=[
            RegexValidator(r'^[0-9]{11}$', '请输入数字'),
            RegexValidator(r'^1[^012][0-9]{9}$', '手机号码不正确'),
        ],
        widget=widgets.TextInput(attrs={"class": "form-control"}),
        error_messages={
            "min_length": "密码不得少于11位",
            "max_length": "密码不得多于11位",
            "required": "该字段不能为空",
        }
    )

    # 检查注册用户名
    def clean_username(self):
        value = self.cleaned_data.get("username")
        name_check = models.User.objects.filter(username=value)
        if name_check:
            raise ValidationError("改用户名已注册")
        ban_list = ["金瓶梅"]
        for ban in ban_list:
            if ban in value:
                raise ValidationError("改用户名不可用于注册")
        return value

    # 检查密码两次密码输入是否相同
    def clean(self):
        pwd = self.cleaned_data.get("pwd")
        re_pwd = self.cleaned_data.get("re_pwd")
        if re_pwd != pwd:
            self.add_error("re_pwd", ValidationError("两次密码输入不一致"))
            raise ValidationError("两次密码输入不一致")
        return self.cleaned_data

def form_test(request):
    form_obj = TestForm()

    if request.method == 'POST':
        form_obj = TestForm(request.POST)
        print(form_obj.errors)
        if form_obj.is_valid():
            print(form_obj.cleaned_data)
            del form_obj.cleaned_data["re_pwd"]
            models.User.objects.create(**form_obj.cleaned_data)
            return HttpResponse('注册成功')
    return render(request, "from_test.html", {"form_obj": form_obj})

```

  

# AJAX提交Form表单

  

1、需要使用FormData生成一个formData对象；

2、在ajax上定义两个变量：

           processData: false,

           contentType: false,

```python
<script>
    // 头像预览功能
    // 当用户上传新的头像，将新的头像预览在页面
    // 给头像标签绑定一个change事件
    $("#id_avatar").change(function () {
        // 1、创建一个FileReader对象
        let fileReader = new FileReader();
        // 2、取出input框中的文件
        let input_file = this.files[0];
        // 3、读取文件的内容
        fileReader.readAsDataURL(input_file);
        fileReader.onload = function(){
            // 4、等文件加载完后替换原有默认头像
            $("#avatar-img").attr("src", fileReader.result);
        }
    });

    // 给提交按钮绑定事件，通过ajax提交
    $("#reg-button").click( function () {
        // 1、取用户数据
        let username = $("#id_username").val();
        let password = $("#id_password").val();
        let re_password = $("#id_re_password").val();
        let email = $("#id_email").val();
        let avatar = $("#id_avatar")[0].files[0];
        let csrfmiddlewaretoken = $("[name='csrfmiddlewaretoken']").val();

        // 2、声明一个FormData对象,将数据信息封装进去
        let formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);
        formData.append("re_password", re_password);
        formData.append("email", email);
        formData.append("avatar", avatar);
        formData.append("csrfmiddlewaretoken", csrfmiddlewaretoken);

        // 2、绑定一个ajax事件
        $.ajax({
            url: "/register/",
            type: "POST",
            processData: false,
            contentType: false,
            data: formData,
            success: function (data) {
                if (data.status){
                    // 有错误就展示错误
                    // 通过循环，得到错误数据
                    $.each(data.msg, function (k,v) {
                        // 1、找到错误信息的标签，更改标签内容
                        // 2、给有错误的地方加has-error类
                        $("#id_"+k).next("span").text(v[0]).parent().parent().addClass("has-error");
                    })
                }else {
                    // 没有错误就跳转到指定页面
                    location.href = data.msg
                }
            }
        })
    })
```

  

# Form表单上传文件

views.py

```python
def file(request):
    if request.method == "POST":
        file_obj = request.FILES.get("file")
        print(file_obj)
        with open(file_obj.name, 'wb') as f:
            for line in file_obj.chunks():
                f.write(line)
        return HttpResponse("上传成功")
    return render(request, "file.html")
```