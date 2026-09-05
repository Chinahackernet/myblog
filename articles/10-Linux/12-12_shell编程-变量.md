# shell编程-变量

> 分类：Linux / 第12章：shell
> 原文：https://www.cuiliangblog.cn/detail/section/31508850
> 来源：崔亮的博客

---

# 一、变量定义：
1. 定义变量时，变量名不加美元符号（$，PHP语言中变量需要），如：

<font style="color:black;">your_name</font><font style="color:#666600;">=</font><font style="color:#008800;">"runoob.com"</font>

1. **变量名和等号之间不能有空格**
2.  变量名的命名须遵循如下规则：
+ 命名只能使用英文字母，数字和下划线，首个字符不能以数字开头。
+ 中间不能有空格，可以使用下划线（_）。
+ 不能使用标点符号。
+ 不能使用bash里的关键字（可用help命令查看保留关键字）。

有效的 Shell 变量名示例如下：

RUNOOB  
LD_LIBRARY_PATH  
_var  
var2

无效的变量命名：

<font style="color:#666600;">?</font><font style="color:#000088;">var</font><font style="color:#666600;">=</font><font style="color:#006666;">123</font><font style="color:black;">  
</font><font style="color:black;">user</font><font style="color:#666600;">*</font><font style="color:black;">name</font><font style="color:#666600;">=</font><font style="color:black;">runoob</font>

除了显式地直接赋值，还可以用语句给变量赋值，如：

<font style="color:#000088;">for</font><font style="color:black;"> file </font><font style="color:#000088;">in</font><font style="color:#008800;">`ls /etc`</font><font style="color:black;">  
</font><font style="color:#666600;">或</font><font style="color:black;">  
</font><font style="color:#000088;">for</font><font style="color:black;"> file </font><font style="color:#000088;">in</font><font style="color:black;"> $</font><font style="color:#666600;">(</font><font style="color:black;">ls </font><font style="color:#666600;">/</font><font style="color:black;">etc</font><font style="color:#666600;">)</font>

以上语句将 /etc 下目录的文件名循环出来。

# 二、使用变量
1. <font style="color:#333333;">使用一个定义过的变量，只要在变量名前面</font>**加美元符号即可**<font style="color:#333333;">，如：</font>
+ <font style="color:black;">yo</font><font style="color:black;">ur_name</font><font style="color:#666600;">=</font><font style="color:#008800;">"qinjx"</font>
+ echo      $your_name
+ <font style="color:black;">echo      $</font><font style="color:#666600;">{</font><font style="color:black;">your_name</font><font style="color:#666600;">}</font>
2. 变量名外面的花括号是可选的，加不加都行，加花括号是为了帮助解释器识别变量的边界，比如下面这种情况：

<font style="color:#000088;">for</font><font style="color:black;"> skill </font><font style="color:#000088;">in</font><font style="color:#660066;">Ada Coffe Action Java</font><font style="color:#666600;">; </font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    echo </font><font style="color:#008800;">"I am good at ${skill}Script"</font><font style="color:black;">  
</font><font style="color:#000088;">done</font>

+ 如果不给skill变量加花括号，写成echo      "I am good at      $skillScript"，解释器就会把$skillScript当成一个变量（其值为空），代码执行结果就不是我们期望的样子了。
1. 将一个已有变量的值，重新赋值时，任然使用原变量的值

![](assets/10-Linux/b502b4b6874cb1befdb8.png)

# 三、只读变量
1. 使用 readonly      命令可以将变量定义为只读变量，只读变量的值不能被改变。

下面的例子尝试更改只读变量，结果报错：

<font style="color:#880000;">#!/bin/bash</font><font style="color:black;">  
</font><font style="color:black;">myUrl</font><font style="color:#666600;">=</font><font style="color:#008800;">"http://www.google.com"</font><font style="color:black;">  
</font><font style="color:#000088;">readonly</font><font style="color:black;"> myUrl  
</font><font style="color:black;">myUrl</font><font style="color:#666600;">=</font><font style="color:#008800;">"http://www.runoob.com"</font>

运行脚本，结果如下：

<font style="color:#008800;">/bin/</font><font style="color:black;">sh</font><font style="color:#666600;">:</font><font style="color:black;"> NAME</font><font style="color:#666600;">: </font><font style="color:#660066;">This</font><font style="color:black;"> variable </font><font style="color:#000088;">is</font><font style="color:black;">read only</font><font style="color:#666600;">.</font>

# 四、删除变量
使用 unset 命令可以删除变量。语法：

unset variable_name

变量被删除后不能再次使用。unset 命令不能删除只读变量。

**实例**

<font style="color:#880000;">#!/bin/sh</font><font style="color:black;">  
</font><font style="color:black;">myUrl</font><font style="color:#666600;">=</font><font style="color:#008800;">"http://www.runoob.com"</font><font style="color:black;">  
</font><font style="color:black;">unset myUrl  
</font><font style="color:black;">echo $myUrl</font>

以上实例执行将没有任何输出。

# 五、变量类型
+ 运行shell时，会同时存在三种变量：
1. **局部变量** 局部变量在脚本或命令中定义，仅在当前shell实例中有效，其他shell启动的程序不能访问局部变量。
2. **环境变量** 所有的程序，包括shell启动的程序，都能访问环境变量，有些程序需要环境变量来保证其正常运行。必要的时候shell脚本也可以定义环境变量。
3. **she****ll变量** shell变量是由shell程序设置的特殊变量。shell变量中有一部分是环境变量，有一部分是局部变量，这些变量保证了shell的正常运行

 

来自 <[http://www.runoob.com/linux/linux-shell-variable.html](http://www.runoob.com/linux/linux-shell-variable.html)>


