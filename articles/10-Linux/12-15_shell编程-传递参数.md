# shell编程-传递参数

> 分类：Linux / 第12章：shell
> 原文：https://www.cuiliangblog.cn/detail/section/31508830
> 来源：崔亮的博客

---

# 一、Shell 传递参数
我们可以在执行 Shell 脚本时，向脚本传递参数，脚本内获取参数的格式为：**$n**。**n** 代表一个数字，1 为执行脚本的第一个参数，2 为执行脚本的第二个参数，以此类推……

# 二、实例
1. 以下实例我们向脚本传递三个参数，并分别输出，其中 **$0** 为执行的文件名：

#!/bin/bash

![](assets/10-Linux/80b7b187ad462804574e.png)

+ 为脚本设置可执行权限，并执行脚本，输出结果如下所示：

![](assets/10-Linux/3d20ce853aafc51d1ad0.png)

1. 另外，还有几个特殊字符用来处理参数：

| **参数处理** | **说明** |
| --- | --- |
| $# | 传递到脚本的参数个数 |
| $* | 以一个单字符串显示所有向脚本传递的参数。<br/>如"$*"用「"」括起来的情况、以"$1   $2 … $n"的形式输出所有参数。 |
| $$ | 脚本运行的当前进程ID号 |
| $! | 后台运行的最后一个进程的ID号 |
| $@ | 与$*相同，但是使用时加引号，并在引号中返回每个参数。<br/>如"$@"用「"」括起来的情况、以"$1"   "$2" … "$n" 的形式输出所有参数。 |
| $- | <font style="color:#333333;">显示Shell使用的当前选项，与</font>[set命令](http://www.runoob.com/linux/linux-comm-set.html)<font style="color:#333333;">功能相同。</font> |
| $? | 显示最后命令的退出状态。0表示没有错误，其他任何值表明有错误。 |


![](assets/10-Linux/e1f5f01b11cb95c2cf6b.png)

执行脚本，输出结果如下所示：

![](assets/10-Linux/e3ab07ff67085b750328.png)

1. $* 与 $@ 区别：
+ 相同点：都是引用所有参数。
+ 不同点：只有在双引号中体现出来。假设在脚本运行时写了三个参数      1、2、3，，则 " * " 等价于 "1 2 3"（传递了一个参数），而 "@"      等价于 "1" "2" "3"（传递了三个参数）。

![](assets/10-Linux/f3b8c0d0e85c780c1cea.png)

执行脚本，输出结果如下所示：

![](assets/10-Linux/25235df1f69fae866e56.png)

来自 <[http://www.runoob.com/linux/linux-shell-passing-arguments.html](http://www.runoob.com/linux/linux-shell-passing-arguments.html)>


