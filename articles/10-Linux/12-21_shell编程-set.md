# shell编程-set

> 分类：Linux / 第12章：shell
> 原文：https://www.cuiliangblog.cn/detail/section/31508633
> 来源：崔亮的博客

---

bash内置的set命令，可以改变我们脚本的执行行为，让我对脚本的把握和调试更有力，下面说几种常用的set指令，相信你都会喜欢的：

 

•set -e: bash脚本遇到错误立即退出

•set -n: 检查脚本语法但不执行

•set -u: 遇到未设置的变量立即退出

•set -o pipefail: 控制在管道符执行过程中有错误立即退出

•set -x: 分步调试命令

在写脚本时，我们可以直接在脚本开头简写为如下格式:

 

#!/bin/bash

set -euxo pipefail

检查bash脚本的语法时，可以这样写:

 

bash -n main.sh


