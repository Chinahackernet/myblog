# 流程控制-while循环和until循环

> 分类：Linux / 第12章：shell
> 原文：https://www.cuiliangblog.cn/detail/section/31508854
> 来源：崔亮的博客

---

# 一、while循环
1.  while循环是不定循环，也称作条件循环。只要条件判断式成立，循环就会一直继

续，直到条件判断式不成立，循环才会停止。这就和for的固定循环不太一样了。

while [ 条件判断式 ]

**do**

**程序**

**done**

#!/bin/bash

#从1加到100

# Author: shenchao （E-mail: shenchao@lampbrother.net）

i=1

s=0

while [ $i -le 100 ]

#如果变量i的值小于等于100，则执行循环

do

s=$(( $s+$i ))

i=$(( $i+1 ))

done

echo "The sum is: $s"

# 二、until循环
1. until循环，和while循环相反，until循环时

只要条件判断式不成立则进行循环，并执

行循环程序。一旦循环条件成立，则终止

循环。

until [ 条件判断式 ]

do

程序

done

#!/bin/bash

#从1加到100

# Author: shenchao （E-mail: shenchao@lampbrother.net）

i=1

s=0

until [ $i -gt 100 ]

#循环直到变量i的值大于100，就停止循环

do

s=$(( $s+$i ))

i=$(( $i+1 ))

done

echo "The sum is: $s"

 


