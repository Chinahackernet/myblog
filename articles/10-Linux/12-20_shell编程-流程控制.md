# shell编程-流程控制

> 分类：Linux / 第12章：shell
> 原文：https://www.cuiliangblog.cn/detail/section/31508774
> 来源：崔亮的博客

---

# 一、if语句
1. if 语句语法格式：

<font style="color:#000088;">if</font><font style="color:black;"> 条件满足</font>

<font style="color:#000088;">then</font><font style="color:black;">  
</font><font style="color:black;">    command1   
</font><font style="color:black;">    command2  
</font><font style="color:black;">    </font><font style="color:#666600;">...</font><font style="color:black;">  
</font><font style="color:black;">    commandN   
</font><font style="color:#000088;">fi</font>

1. 写成一行（适用于终端命令提示符）：

<font style="color:#000088;">if </font><font style="color:#666600;">[</font><font style="color:black;"> $</font><font style="color:#666600;">(</font><font style="color:black;">ps </font><font style="color:#666600;">-</font><font style="color:black;">ef </font><font style="color:#666600;">|</font><font style="color:black;"> grep </font><font style="color:#666600;">-</font><font style="color:black;">c </font><font style="color:#008800;">"ssh"</font><font style="color:#666600;">) -</font><font style="color:black;">gt </font><font style="color:#006666;">1 </font><font style="color:#666600;">]; </font><font style="color:#000088;">then</font><font style="color:black;">echo </font><font style="color:#008800;">"true"</font><font style="color:#666600;">; </font><font style="color:#000088;">fi</font>

1. if else 语法格式：

<font style="color:#000088;">if</font><font style="color:black;"> condition  
</font><font style="color:#000088;">then</font><font style="color:black;">  
</font><font style="color:black;">    command1   
</font><font style="color:black;">    command2  
</font><font style="color:black;">    </font><font style="color:#666600;">...</font><font style="color:black;">  
</font><font style="color:black;">    commandN  
</font><font style="color:#000088;">else</font><font style="color:black;">  
</font><font style="color:black;">    command  
</font><font style="color:#000088;">fi</font>

1. if else-if else 语法格式：

<font style="color:#000088;">if</font><font style="color:black;"> condition1  
</font><font style="color:#000088;">then</font><font style="color:black;">  
</font><font style="color:black;">    command1  
</font><font style="color:#000088;">elif</font><font style="color:black;"> condition2   
</font><font style="color:#000088;">then</font><font style="color:black;">   
</font><font style="color:black;">    command2  
</font><font style="color:#000088;">else</font><font style="color:black;">  
</font><font style="color:black;">    commandN  
</font><font style="color:#000088;">fi</font>

+ 以下实例判断两个变量是否相等：

![](assets/10-Linux/0d4391eccf9259271bc7.png)

if else语句经常与test命令结合使用，如下所示：

![](assets/10-Linux/3d013c517ab4b2fb86c9.png)

# 二、for 循环
1. 用法1：

**for**** ****变量**** in ****值****1 ****值****2 ****值****3…**

**do**

**程序**

**done**

#!/bin/bash

#批量解压缩脚本

cd /lamp

ls *.tar.gz > ls.log

for i in $(cat ls.log)

do

tar -zxf $i &>/dev/null

done

rm -rf /lamp/ls.log

1. 用法2：

**for (( ****初始值****;****循环控制条件****;****变量变化**** ))**

**do**

**程序**

**done**

#!/bin/bash

#从1加到100

s=0

for (( i=1;i<=100;i=i+1 ))

do

s=$(( $s+$i ))

done

echo "The sum of 1+2+...+100 is : $s"

#!/bin/bash

#批量添加指定数量的用户

# Author: shenchao （E-mail: shenchao@lampbrother.net）

read -p "Please input user name: " -t 30 name

read -p "Please input the number of users: " -t 30 num

read -p "Please input the password of users: " -t 30 pass

if [ ! -z "$name" -a ! -z "$num" -a ! -z "$pass" ]

then

y=$(echo $num | sed 's/[0-9]//g')

if [ -z "$y" ]

then

for (( i=1;i<=$num;i=i+1 ))

do

/usr/sbin/useradd $name$i &>/dev/null

echo $pass | /usr/bin/passwd --stdin $name$i &>/dev/null

done

fi

fi

<font style="color:#000088;">for var in</font><font style="color:black;"> item1 item2 </font><font style="color:#666600;">...</font><font style="color:black;"> itemN  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    command1  
</font><font style="color:black;">    command2  
</font><font style="color:black;">    </font><font style="color:#666600;">...</font><font style="color:black;">  
</font><font style="color:black;">    commandN  
</font><font style="color:#000088;">done</font>

写成一行：

<font style="color:#000088;">for var in</font><font style="color:black;"> item1 item2 </font><font style="color:#666600;">...</font><font style="color:black;"> itemN</font><font style="color:#666600;">;</font><font style="color:#000088;">do</font><font style="color:black;"> command1</font><font style="color:#666600;">;</font><font style="color:black;">command2</font><font style="color:#666600;">… </font><font style="color:#000088;">done</font><font style="color:#666600;">;</font>

当变量值在列表里，for循环即执行一次所有命令，使用变量名获取列表中的当前取值。命令可为任何有效的shell命令和语句。in列表可以包含替换、字符串和文件名。

in列表是可选的，如果不用它，for循环使用命令行的位置参数。

例如，顺序输出当前列表中的数字：

<font style="color:#000088;">for</font><font style="color:black;"> loop </font><font style="color:#000088;">in</font><font style="color:#006666;">1 2 3 4 5</font><font style="color:black;">  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    echo </font><font style="color:#008800;">"The value is: $loop"</font><font style="color:black;">  
</font><font style="color:#000088;">done</font>

输出结果：

<font style="color:#660066;">The</font><font style="color:black;"> value </font><font style="color:#000088;">is</font><font style="color:#666600;">: </font><font style="color:#006666;">1</font><font style="color:black;">  
</font><font style="color:#660066;">The</font><font style="color:black;"> value </font><font style="color:#000088;">is</font><font style="color:#666600;">: </font><font style="color:#006666;">2</font><font style="color:black;">  
</font><font style="color:#660066;">The</font><font style="color:black;"> value </font><font style="color:#000088;">is</font><font style="color:#666600;">: </font><font style="color:#006666;">3</font><font style="color:black;">  
</font><font style="color:#660066;">The</font><font style="color:black;"> value </font><font style="color:#000088;">is</font><font style="color:#666600;">: </font><font style="color:#006666;">4</font><font style="color:black;">  
</font><font style="color:#660066;">The</font><font style="color:black;"> value </font><font style="color:#000088;">is</font><font style="color:#666600;">: </font><font style="color:#006666;">5</font>

顺序输出字符串中的字符：

<font style="color:#000088;">for</font><font style="color:black;"> str </font><font style="color:#000088;">in</font><font style="color:#008800;">'This is a string'</font><font style="color:black;">  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    echo $str  
</font><font style="color:#000088;">done</font>

输出结果：

<font style="color:#660066;">This </font><font style="color:#000088;">is</font><font style="color:black;"> a </font><font style="color:#000088;">string</font>

 

**while 语句**

while循环用于不断执行一系列命令，也用于从输入文件中读取数据；命令通常为测试条件。其格式为：

<font style="color:#000088;">while</font><font style="color:black;"> condition  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    command  
</font><font style="color:#000088;">done</font>

以下是一个基本的while循环，测试条件是：如果int小于等于5，那么条件返回真。int从0开始，每次循环处理时，int加1。运行上述脚本，返回数字1到5，然后终止。

<font style="color:#880000;">#!/bin/bash</font><font style="color:black;">  
</font><font style="color:#000088;">int</font><font style="color:#666600;">=</font><font style="color:#006666;">1</font><font style="color:black;">  
</font><font style="color:#000088;">while</font><font style="color:#666600;">((</font><font style="color:black;"> $int</font><font style="color:#666600;"><=</font><font style="color:#006666;">5 </font><font style="color:#666600;">))</font><font style="color:black;">  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    echo $int  
</font><font style="color:black;">    </font><font style="color:#000088;">let </font><font style="color:#008800;">"int++"</font><font style="color:black;">  
</font><font style="color:#000088;">done</font>

运行脚本，输出：

<font style="color:#006666;">1</font><font style="color:black;">  
</font><font style="color:#006666;">2</font><font style="color:black;">  
</font><font style="color:#006666;">3</font><font style="color:black;">  
</font><font style="color:#006666;">4</font><font style="color:black;">  
</font><font style="color:#006666;">5</font>

<font style="color:#333333;">使用中使用了 Bash let 命令，它用于执行一个或多个表达式，变量计算中不需要加上 $ 来表示变量，具体可查阅：</font>[Bash let 命令](http://www.runoob.com/linux/linux-comm-let.html)

。

while循环可用于读取键盘信息。下面的例子中，输入信息被设置为变量FILM，按<Ctrl-D>结束循环。

<font style="color:black;">echo </font><font style="color:#008800;">'按下 <CTRL-D> 退出'</font><font style="color:black;">  
</font><font style="color:black;">echo </font><font style="color:#666600;">-</font><font style="color:black;">n </font><font style="color:#008800;">'输入你最喜欢的网站名: '</font><font style="color:black;">  
</font><font style="color:#000088;">while</font><font style="color:black;"> read FILM  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    echo </font><font style="color:#008800;">"是的！$FILM 是一个好网站"</font><font style="color:black;">  
</font><font style="color:#000088;">done</font>

运行脚本，输出类似下面：

<font style="color:#666600;">按下 <</font><font style="color:black;">CTRL</font><font style="color:#666600;">-</font><font style="color:black;">D</font><font style="color:#666600;">> 退出</font><font style="color:black;">  
</font><font style="color:#666600;">输入你最喜欢的网站名:菜鸟教程</font><font style="color:black;">  
</font><font style="color:#666600;">是的！菜鸟教程 是一个好网站</font>

**无限循环**

无限循环语法格式：

<font style="color:#000088;">while </font><font style="color:#666600;">:</font><font style="color:black;">  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    command  
</font><font style="color:#000088;">done</font>

或者

<font style="color:#000088;">while true</font><font style="color:black;">  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    command  
</font><font style="color:#000088;">done</font>

或者

<font style="color:#000088;">for </font><font style="color:#666600;">(( ; ; ))</font>

 

**until 循环**

until 循环执行一系列命令直至条件为 true 时停止。

until 循环与 while 循环在处理方式上刚好相反。

一般 while 循环优于 until 循环，但在某些时候—也只是极少数情况下，until 循环更加有用。

until 语法格式:

<font style="color:#000088;">until</font><font style="color:black;"> condition  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    command  
</font><font style="color:#000088;">done</font>

condition 一般为条件表达式，如果返回值为 false，则继续执行循环体内的语句，否则跳出循环。

以下实例我们使用 until 命令来输出 0 ~ 9 的数字：

#!/bin/bash

<font style="color:black;">a</font><font style="color:#666600;">=</font><font style="color:#006666;">0</font>

<font style="color:#000088;">until </font><font style="color:#666600;">[ !</font><font style="color:black;"> $a </font><font style="color:#666600;">-</font><font style="color:black;">lt </font><font style="color:#006666;">10 </font><font style="color:#666600;">]</font><font style="color:black;">  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">   echo $a  
</font><font style="color:black;">   a</font><font style="color:#666600;">=</font><font style="color:#008800;">`expr $a + 1`</font><font style="color:black;">  
</font><font style="color:#000088;">done</font>

运行结果：

输出结果为：

<font style="color:#006666;">0</font><font style="color:black;">  
</font><font style="color:#006666;">1</font><font style="color:black;">  
</font><font style="color:#006666;">2</font><font style="color:black;">  
</font><font style="color:#006666;">3</font><font style="color:black;">  
</font><font style="color:#006666;">4</font><font style="color:black;">  
</font><font style="color:#006666;">5</font><font style="color:black;">  
</font><font style="color:#006666;">6</font><font style="color:black;">  
</font><font style="color:#006666;">7</font><font style="color:black;">  
</font><font style="color:#006666;">8</font><font style="color:black;">  
</font><font style="color:#006666;">9</font>

 

**case**

Shell case语句为多选择语句。可以用case语句匹配一个值与一个模式，如果匹配成功，执行相匹配的命令。case语句格式如下：

<font style="color:#000088;">case </font><font style="color:#666600;">值 </font><font style="color:#000088;">in</font><font style="color:black;">  
</font><font style="color:#666600;">模式</font><font style="color:#006666;">1</font><font style="color:#666600;">)</font><font style="color:black;">  
</font><font style="color:black;">    command1  
</font><font style="color:black;">    command2  
</font><font style="color:black;">    </font><font style="color:#666600;">...</font><font style="color:black;">  
</font><font style="color:black;">    commandN  
</font><font style="color:black;">    </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:#666600;">模式</font><font style="color:#006666;">2</font><font style="color:#666600;">）</font><font style="color:black;">  
</font><font style="color:black;">    command1  
</font><font style="color:black;">    command2  
</font><font style="color:black;">    </font><font style="color:#666600;">...</font><font style="color:black;">  
</font><font style="color:black;">    commandN  
</font><font style="color:black;">    </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:#000088;">esac</font>

case工作方式如上所示。取值后面必须为单词in，每一模式必须以右括号结束。取值可以为变量或常数。匹配发现取值符合某一模式后，其间所有命令开始执行直至 ;;。

取值将检测匹配的每一个模式。一旦模式匹配，则执行完匹配模式相应命令后不再继续其他模式。如果无一匹配模式，使用星号 * 捕获该值，再执行后面的命令。

下面的脚本提示输入1到4，与每一种模式进行匹配：

<font style="color:black;">echo </font><font style="color:#008800;">'输入 1 到 4 之间的数字:'</font><font style="color:black;">  
</font><font style="color:black;">echo </font><font style="color:#008800;">'你输入的数字为:'</font><font style="color:black;">  
</font><font style="color:black;">read aNum  
</font><font style="color:#000088;">case</font><font style="color:black;"> $aNum </font><font style="color:#000088;">in</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#006666;">1</font><font style="color:#666600;">)</font><font style="color:black;"> echo </font><font style="color:#008800;">'你选择了 1'</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#006666;">2</font><font style="color:#666600;">)</font><font style="color:black;"> echo </font><font style="color:#008800;">'你选择了 2'</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#006666;">3</font><font style="color:#666600;">)</font><font style="color:black;"> echo </font><font style="color:#008800;">'你选择了 3'</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#006666;">4</font><font style="color:#666600;">)</font><font style="color:black;"> echo </font><font style="color:#008800;">'你选择了 4'</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#666600;">*)</font><font style="color:black;">  echo </font><font style="color:#008800;">'你没有输入 1 到 4 之间的数字'</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:#000088;">esac</font>

输入不同的内容，会有不同的结果，例如：

<font style="color:#666600;">输入 </font><font style="color:#006666;">1 </font><font style="color:#666600;">到 </font><font style="color:#006666;">4 </font><font style="color:#666600;">之间的数字:</font><font style="color:black;">  
</font><font style="color:#666600;">你输入的数字为:</font><font style="color:black;">  
</font><font style="color:#006666;">3</font><font style="color:black;">  
</font><font style="color:#666600;">你选择了 </font><font style="color:#006666;">3</font>

 

**跳出循环**

在循环过程中，有时候需要在未达到循环结束条件时强制跳出循环，Shell使用两个命令来实现该功能：break和continue。

**break命令**

break命令允许跳出所有循环（终止执行后面的所有循环）。

下面的例子中，脚本进入死循环直至用户输入数字大于5。要跳出这个循环，返回到shell提示符下，需要使用break命令。

<font style="color:#880000;">#!/bin/bash</font><font style="color:black;">  
</font><font style="color:#000088;">while </font><font style="color:#666600;">:</font><font style="color:black;">  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    echo </font><font style="color:#666600;">-</font><font style="color:black;">n </font><font style="color:#008800;">"输入 1 到 5 之间的数字:"</font><font style="color:black;">  
</font><font style="color:black;">    read aNum  
</font><font style="color:black;">    </font><font style="color:#000088;">case</font><font style="color:black;">$aNum </font><font style="color:#000088;">in</font><font style="color:black;">  
</font><font style="color:black;">        </font><font style="color:#006666;">1</font><font style="color:#666600;">|</font><font style="color:#006666;">2</font><font style="color:#666600;">|</font><font style="color:#006666;">3</font><font style="color:#666600;">|</font><font style="color:#006666;">4</font><font style="color:#666600;">|</font><font style="color:#006666;">5</font><font style="color:#666600;">)</font><font style="color:black;"> echo </font><font style="color:#008800;">"你输入的数字为 $aNum!"</font><font style="color:black;">  
</font><font style="color:black;">        </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:black;">        </font><font style="color:#666600;">*)</font><font style="color:black;"> echo</font><font style="color:#008800;">"你输入的数字不是 1 到 5 之间的! 游戏结束"</font><font style="color:black;">  
</font><font style="color:black;">            </font><font style="color:#000088;">break</font><font style="color:black;">  
</font><font style="color:black;">        </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#000088;">esac</font><font style="color:black;">  
</font><font style="color:#000088;">done</font>

执行以上代码，输出结果为：

<font style="color:#666600;">输入 </font><font style="color:#006666;">1 </font><font style="color:#666600;">到 </font><font style="color:#006666;">5 </font><font style="color:#666600;">之间的数字:</font><font style="color:#006666;">3</font><font style="color:black;">  
</font><font style="color:#666600;">你输入的数字为 </font><font style="color:#006666;">3</font><font style="color:#666600;">!</font><font style="color:black;">  
</font><font style="color:#666600;">输入 </font><font style="color:#006666;">1 </font><font style="color:#666600;">到 </font><font style="color:#006666;">5 </font><font style="color:#666600;">之间的数字:</font><font style="color:#006666;">7</font><font style="color:black;">  
</font><font style="color:#666600;">你输入的数字不是 </font><font style="color:#006666;">1 </font><font style="color:#666600;">到 </font><font style="color:#006666;">5 </font><font style="color:#666600;">之间的! 游戏结束</font>

**continue**

continue命令与break命令类似，只有一点差别，它不会跳出所有循环，仅仅跳出当前循环。

对上面的例子进行修改：

<font style="color:#880000;">#!/bin/bash</font><font style="color:black;">  
</font><font style="color:#000088;">while </font><font style="color:#666600;">:</font><font style="color:black;">  
</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    echo </font><font style="color:#666600;">-</font><font style="color:black;">n </font><font style="color:#008800;">"输入 1 到 5 之间的数字: "</font><font style="color:black;">  
</font><font style="color:black;">    read aNum  
</font><font style="color:black;">    </font><font style="color:#000088;">case</font><font style="color:black;">$aNum </font><font style="color:#000088;">in</font><font style="color:black;">  
</font><font style="color:black;">        </font><font style="color:#006666;">1</font><font style="color:#666600;">|</font><font style="color:#006666;">2</font><font style="color:#666600;">|</font><font style="color:#006666;">3</font><font style="color:#666600;">|</font><font style="color:#006666;">4</font><font style="color:#666600;">|</font><font style="color:#006666;">5</font><font style="color:#666600;">)</font><font style="color:black;"> echo </font><font style="color:#008800;">"你输入的数字为 $aNum!"</font><font style="color:black;">  
</font><font style="color:black;">        </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:black;">        </font><font style="color:#666600;">*)</font><font style="color:black;"> echo</font><font style="color:#008800;">"你输入的数字不是 1 到 5 之间的!"</font><font style="color:black;">  
</font><font style="color:black;">            </font><font style="color:#000088;">continue</font><font style="color:black;">  
</font><font style="color:black;">            echo </font><font style="color:#008800;">"游戏结束"</font><font style="color:black;">  
</font><font style="color:black;">        </font><font style="color:#666600;">;;</font><font style="color:black;">  
</font><font style="color:black;">    </font><font style="color:#000088;">esac</font><font style="color:black;">  
</font><font style="color:#000088;">done</font>

运行代码发现，当输入大于5的数字时，该例中的循环不会结束，语句 **echo "游戏结束"** 永远不会被执行。

 

**esac**

case的语法和C family语言差别很大，它需要一个esac（就是case反过来）作为结束标记，每个case分支用右圆括号，用两个分号表示break。

shell 中的 for 循环不仅可以用文章所述的方法。

对于习惯其他语言 for 循环的朋友来说可能有点别扭。

<font style="color:#000088;">for</font><font style="color:#666600;">((</font><font style="color:black;">assignment</font><font style="color:#666600;">;</font><font style="color:black;">condition</font><font style="color:#666600;">:</font><font style="color:#000088;">next</font><font style="color:#666600;">));</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    command_1</font><font style="color:#666600;">;</font><font style="color:black;">  
</font><font style="color:black;">    command_2</font><font style="color:#666600;">;</font><font style="color:black;">  
</font><font style="color:black;">    commond_</font><font style="color:#666600;">..;</font><font style="color:black;">  
</font><font style="color:#000088;">done</font><font style="color:#666600;">;</font>

如上所示，这里的 for 循环与 C 中的相似，但并不完全相同。

通常情况下 shell 变量调用需要加 $,但是 for 的 (()) 中不需要,下面来看一个例子：

<font style="color:#880000;">#!/bin/bash</font><font style="color:black;">  
</font><font style="color:#000088;">for</font><font style="color:#666600;">((</font><font style="color:black;">i</font><font style="color:#666600;">=</font><font style="color:#006666;">1</font><font style="color:#666600;">;</font><font style="color:black;">i</font><font style="color:#666600;"><=</font><font style="color:#006666;">5</font><font style="color:#666600;">;</font><font style="color:black;">i</font><font style="color:#666600;">++));</font><font style="color:#000088;">do</font><font style="color:black;">  
</font><font style="color:black;">    echo </font><font style="color:#008800;">"这是第 $i 次调用"</font><font style="color:#666600;">;</font><font style="color:black;">  
</font><font style="color:#000088;">done</font><font style="color:#666600;">;</font>

执行结果：

<font style="color:#666600;">这是第</font><font style="color:#006666;">1</font><font style="color:#666600;">次调用</font><font style="color:black;">  
</font><font style="color:#666600;">这是第</font><font style="color:#006666;">2</font><font style="color:#666600;">次调用</font><font style="color:black;">  
</font><font style="color:#666600;">这是第</font><font style="color:#006666;">3</font><font style="color:#666600;">次调用</font><font style="color:black;">  
</font><font style="color:#666600;">这是第</font><font style="color:#006666;">4</font><font style="color:#666600;">次调用</font><font style="color:black;">  
</font><font style="color:#666600;">这是第</font><font style="color:#006666;">5</font><font style="color:#666600;">次调用</font>

与 C 中相似，赋值和下一步执行可以放到代码之前循环语句之中执行，这里要注意一点：如果要在循环体中进行 for 中的 next 操作，记得变量要加 $，不然程序会变成死循环。

 

来自 <[http://www.runoob.com/linux/linux-shell-process-control.html](http://www.runoob.com/linux/linux-shell-process-control.html)>

 

 

 

来自 <[http://www.runoob.com/linux/linux-shell-process-control.html](http://www.runoob.com/linux/linux-shell-process-control.html)> 


