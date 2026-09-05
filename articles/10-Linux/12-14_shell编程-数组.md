# shell编程-数组

> 分类：Linux / 第12章：shell
> 原文：https://www.cuiliangblog.cn/detail/section/31508837
> 来源：崔亮的博客

---

# 一、Shell 数组
bash支持一维数组（不支持多维数组），并且没有限定数组的大小。

类似与 C 语言，数组元素的下标由 0 开始编号。获取数组中的元素要利用下标，下标可以是整数或算术表达式，其值应大于或等于 0。

# 二、定义数组
1. <font style="color:#333333;">在</font><font style="color:#333333;"> S</font><font style="color:#333333;">hell 中，用括号来表示数组，数组元素用</font><font style="color:red;">"空格"</font><font style="color:#333333;">符号分割开。定义数组的一般形式为：</font>

<font style="color:#666600;">数组名=(值</font><font style="color:#006666;">1 </font><font style="color:#666600;">值</font><font style="color:#006666;">2 </font><font style="color:#666600;">... 值</font><font style="color:black;">n</font><font style="color:#666600;">)</font>

例如：

<font style="color:black;">array_name</font><font style="color:#666600;">=(</font><font style="color:black;">value0 value1 value2 value3</font><font style="color:#666600;">)</font>

或者

<font style="color:black;">array_name</font><font style="color:#666600;">=(</font><font style="color:black;">  
</font><font style="color:black;">value0  
</font><font style="color:black;">value1  
</font><font style="color:black;">value2  
</font><font style="color:black;">value3  
</font><font style="color:#666600;">)</font>

1. 还可以单独定义数组的各个分量：

<font style="color:black;">array_name</font><font style="color:#666600;">[</font><font style="color:#006666;">0</font><font style="color:#666600;">]=</font><font style="color:black;">value0  
</font><font style="color:black;">array_name</font><font style="color:#666600;">[</font><font style="color:#006666;">1</font><font style="color:#666600;">]=</font><font style="color:black;">value1  
</font><font style="color:black;">array_name</font><font style="color:#666600;">[</font><font style="color:black;">n</font><font style="color:#666600;">]=</font><font style="color:black;">valuen</font>

可以不使用连续的下标，而且下标的范围没有限制。

# 三、读取数组
1. 读取数组元素值的一般格式是：

<font style="color:black;">$</font><font style="color:#666600;">{数组名[下标]}</font>

例如：

<font style="color:black;">valuen</font><font style="color:#666600;">=</font><font style="color:black;">$</font><font style="color:#666600;">{</font><font style="color:black;">array_name</font><font style="color:#666600;">[</font><font style="color:black;">n</font><font style="color:#666600;">]}</font>

1. 使用 **@** 符号可以获取数组中的所有元素，例如：

<font style="color:black;">echo $</font><font style="color:#666600;">{</font><font style="color:black;">array_name</font><font style="color:#666600;">[@]}</font>

# 四、获取数组的长度
获取数组长度的方法与获取字符串长度的方法相同，例如：

<font style="color:#880000;"># 取得数组元素的个数</font><font style="color:black;">  
</font><font style="color:black;">length</font><font style="color:#666600;">=</font><font style="color:black;">$</font><font style="color:#666600;">{#</font><font style="color:black;">array_name</font><font style="color:#666600;">[@]}</font><font style="color:black;">  
</font><font style="color:#880000;"># 或者</font><font style="color:black;">  
</font><font style="color:black;">length</font><font style="color:#666600;">=</font><font style="color:black;">$</font><font style="color:#666600;">{#</font><font style="color:black;">array_name</font><font style="color:#666600;">[*]}</font><font style="color:black;">  
</font><font style="color:#880000;"># 取得数组单个元素的长度</font><font style="color:black;">  
</font><font style="color:black;">lengthn</font><font style="color:#666600;">=</font><font style="color:black;">$</font><font style="color:#666600;">{#</font><font style="color:black;">array_name</font><font style="color:#666600;">[</font><font style="color:black;">n</font><font style="color:#666600;">]}</font>

 

来自 <[http://www.runoob.com/linux/linux-shell-variable.html](http://www.runoob.com/linux/linux-shell-variable.html)>


