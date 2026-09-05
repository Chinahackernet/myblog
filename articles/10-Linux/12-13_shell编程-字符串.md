# shell编程-字符串

> 分类：Linux / 第12章：shell
> 原文：https://www.cuiliangblog.cn/detail/section/31508846
> 来源：崔亮的博客

---

# 一、Shell 字符串
1. 字符串是shell编程中最常用最有用的数据类型（除了数字和字符串，也没啥其它类型好用了），字符串可以用单引号，也可以用双引号，也可以不用引号。

# 二、单引号
+ <font style="color:black;">st</font><font style="color:black;">r</font><font style="color:#666600;">=</font><font style="color:#008800;">'this is a string'</font>
1. 单引号字符串的限制：
+ <font style="color:#333333;">单引号里的任何字符都会</font><font style="color:red;">原样输出</font><font style="color:#333333;">，单引号字符串中的</font><font style="color:red;">变量是无效的</font><font style="color:#333333;">；</font>
+ 单引号字串中不能出现单独一个的单引号（对单引号使用转义符后也不行），但可成对出现，作为字符串拼接使用。

# 三、双引号
<font style="color:black;">your_name</font><font style="color:#666600;">=</font><font style="color:#008800;">'runoob'</font><font style="color:black;">  
</font><font style="color:black;">str</font><font style="color:#666600;">=</font><font style="color:#008800;">"Hello, I know you are \"$your_name\"! \n"</font><font style="color:black;">  
</font><font style="color:black;">echo $str</font>

<font style="color:#660066;">Hello</font><font style="color:#666600;">,</font><font style="color:black;"> I know you are </font><font style="color:#008800;">"runoob"</font><font style="color:#666600;">! </font>

输出结果为：

1. 双引号的优点：
+ <font style="color:#333333;">双引号里</font><font style="color:red;">可以有变量</font>
+ <font style="color:#333333;">双引号里</font><font style="color:red;">可以出现转义字符</font>

# 四、拼接字符串
<font style="color:black;">your_name</font><font style="color:#666600;">=</font><font style="color:#008800;">"runoob"</font><font style="color:black;">  
</font><font style="color:#880000;"># 使用双引号拼接</font>

![](assets/10-Linux/d1071996d65351419932.png)

![](assets/10-Linux/244cdb0ee32ec56af186.png)

# 使用单引号拼接

![](assets/10-Linux/5c2989e944636f09bf25.png)

![](assets/10-Linux/e0203242c9886b07af66.png)

# 五、获取字符串长度
<font style="color:#000088;">string</font><font style="color:#666600;">=</font><font style="color:#008800;">"abcd"</font><font style="color:black;">  
</font><font style="color:black;">echo $</font><font style="color:#666600;">{#</font><font style="color:#000088;">string</font><font style="color:#666600;">} </font><font style="color:#880000;">#输出 4</font>

# 六、提取子字符串
从字符串第3 个字符开始截取 **4** 个字符：

从字符串第3个字符开始截取输出：

![](assets/10-Linux/78dbda35a35fe72f7624.png)

![](assets/10-Linux/64ee241eb013991c9d09.png)

# 七、查找子字符串
查找字符 **i** 或 **o** 的位置(哪个字母先出现就计算哪个)：

<font style="color:#000088;">string</font><font style="color:#666600;">=</font><font style="color:#008800;">"runoob is a great site"</font><font style="color:black;">  
</font><font style="color:black;">echo </font><font style="color:#008800;">`expr index "$string" io`</font><font style="color:black;">  </font><font style="color:#880000;"># 输出 4</font>

**注意：** 以上脚本中 **`** 是反引号，而不是单引号 **'**，不要看错了哦。

 

来自 <[http://www.runoob.com/linux/linux-shell-variable.html](http://www.runoob.com/linux/linux-shell-variable.html)> 


