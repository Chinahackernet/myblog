---
title: Python流程控制语句（六）：循环语句、循环控制语句、pass语句
---

**前言：在Python编程语言中，流程控制语句是构建程序逻辑的基础构件之一。它们决定了程序中语句的执行顺序，允许我们创建更加复杂和动态的代码结构。在众多流程控制语句中，循环语句和循环控制语句尤为重要，因为它们使我们能够重复执行一段代码，直到满足特定的条件，这对于处理迭代任务和批量操作至关重要。**

**此外，`pass`语句虽然看起来简单，但在Python编程中扮演着不可或缺的角色。它作为一个空操作，确保了代码的语法正确性，同时提供了一个占位符，使得程序员可以在代码结构中预留位置，以便未来添加功能或者在特定条件下避免语法错误。**

**在本章节中，我们将深入探讨Python中的循环语句（包括`for`循环和`while`循环），了解它们的基本用法和一些高级技巧。同时，我们也会讨论循环控制语句，如`break`和`continue`，它们允许我们在循环执行过程中进行更精细的控制。最后，我们将介绍`pass`语句，探讨它在不同场景下的应用。通过本章节的学习，你将能够更加灵活地运用这些流程控制语句，编写出更加高效和优雅的Python代码。**

### 一、循环语句

Python 中的循环语句主要有两种：`while` 循环和 `for` 循环。下面我会分别介绍这两种循环语句的用法和一些示例。

### 1. `while` 循环

### while 循环流程图：

`while` 循环会持续执行，直到指定的条件不再为真。

**基本语法：**

```
while 条件:
    # 循环体
```

**示例：**

```
count = 1
while count <= 5:
    print(count)
    count += 1
```

这个循环会打印数字 1 到 5。

### 实例训练10 -while循环破解题法

```
print("今有物不知其数，三三数之剩二，五五数之剩三、七七数之剩二，问几何？ \n")
none =True                                                               #作为循环条件的变量
number = 0                                                               #计数的变量
while none:
    number += 1                                                          #计数加1
    if number%3 == 2 and number%5 == 3 and number%7 == 2:                #判断是否符合条件
        print("答曰: 这个数是",number)                                    #输出符合条件的数
        none =False                                                      #将循环条件的变量赋值为否
```

### 2. `for` 循环

### for 循环流程图：

`for` 循环通常用于遍历序列（如列表、元组、字典、集合、字符串等）中的元素。

**基本语法：**

```
for 变量 in 序列:
    # 循环体
```

**示例：**

```
print("计算1+2+3+......+100的结果为: ")
result = 0                              #保存累加结果的变量
for i in range(101):
    result += i                         #实现累加功能
print(result)                           #在循环结束时输出结果
```

这个循环会依次打印列表 `range(101)` 中的每一个元素，range()函数。

### 实例训练11 -for循环破解题法

```
print("今有物不知其数，三三数之剩二，五五数之剩三、七七数之剩二，问几何？ \n")
for number in range(100):
    if number%3 == 2 and number%5 == 3 and number%7 == 2:    #判断是否符合条件
        print("答曰:这个数是",number)
```

### 3、遍历字符串

在Python中，字符串是可迭代的，这意味着你可以使用`for`循环来遍历字符串中的每个字符。下面是一个遍历字符串的例子：

```
python = "富在术数，不在劳身；利在势居，不在力耕也"
print(python)                                        #横向显示
for char in python:
    print(char)                                      #纵向显示
```

### 4、循环嵌套

循环嵌套指的是在一个循环内部再创建一个新的循环。这在处理多维数据结构时非常有用，比如列表的列表（二维数组）或者字符串的字符串（多行文本）。以下是一个使用嵌套循环的例子：

#### ① 遍历二维列表

```
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

for row in matrix:
    for element in row:
        print(element, end=' ')
    print()  # 用于在每一行后换行
```

这段代码会遍历一个二维列表（可以看作是一个矩阵），打印出：

```
1 2 3 
4 5 6 
7 8 9
```

#### ② 遍历多行字符串

```
poem = """
Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.
"""

for line in poem.split('\n'):
    for char in line:
        print(char, end='')
    print()  # 用于在每一行后换行
```

这段代码会遍历一个多行字符串，逐个打印出每个字符，每完成一行的打印后换行。

### 实例训练12 -打印九九乘法表

```
for i in range(1, 10):                             # 外层循环，表示乘法表的第一个因子
    for j in range(1, i + 1):                      # 内层循环，表示乘法表的第二个因子
        print(f"{j} * {i} = {i * j}", end="\t")    # 打印乘法表达式，end="\t" 表示用制表符分隔
    print()                                        # 每完成一行乘法表后换行
```

循环嵌套可以用于更复杂的数据结构和更复杂的逻辑，比如遍历三维数组或者更高维度的数据结构。每次嵌套循环都会增加代码的复杂性，因此在设计算法时需要仔细考虑是否必要，以及如何清晰地表达逻辑。

### 二、循环控制语句

Python 还提供了两个控制循环流程的语句：`break` 和 `continue`。

### break 流程图：

### continue 流程图：

- `break`：立即退出循环，不再执行循环体中的后续代码。
- `continue`：跳过当前循环的剩余部分，直接开始下一次循环迭代。

**break示例：**

```
for i in range(1, 6):
    if i == 3:
        break  # 当 i 等于 3 时，退出循环
    print(i)
```

这个循环会在打印数字 1 和 2 后退出，因为 `i` 等于 3 时触发了 `break` 语句。

### 实例训练13 -for循环改进版破解题法

```
print("今有物不知其数，三三数之剩二，五五数之剩三、七七数之剩二，问几何？ \n")
for number in range(100):
    if  number%3 == 2 and number%5 == 3 and number%7 == 2:     #判断是否符合条件
        print("答曰: 这个数是",number)
        break
```

**continue示例：**

```
for i in range(1, 6):
    if i % 2 == 0:
        continue  # 跳过偶数，不打印
    print(i)
```

这个循环会打印 1 到 5 中的所有奇数，因为遇到偶数时 `continue` 语句会跳过打印操作。

### 实例训练14 -逢七拍腿游戏

```
total = 99                                        #记录拍腿次数的变量
for number in range(1,100):                       #创建一个1到100（不包括100）的循环
    if number %7 ==0:                             #判断是否为7的倍数
        continue                                  #继续下一次循环
    else:
        string = str(number)                      #将数值转换为字符串
        if string.endswith('7'):                  #判断是否以数字7结尾
            continue
        total -=1                                 #可拍腿次数-1
print("从1到99共拍腿",total,"次。")                #显示拍腿次数
```

以上就是 Python 中循环语句的基本介绍和用法。希望这能帮助你理解如何在 Python 中使用循环。

### 三、pass语句

在Python中，`pass`是一个空操作语句，它什么也不做。`pass`语句的作用是作为一个占位符，用来满足语法结构上的要求，但不会执行任何操作。在某些情况下，你可能需要一个语句来填充代码块，但又不想执行任何代码，这时候就可以使用`pass`。

以下是一些`pass`语句的使用场景：

### 1. 作为类或函数的占位符

```
class MyEmptyClass:
    pass

def my_empty_function():
    pass
```

在上面的例子中，`MyEmptyClass`类和`my_empty_function`函数目前不执行任何操作，`pass`语句作为占位符，表示未来可能会添加代码。

### 2. 在条件语句中

```
if some_condition:
    pass  # 条件成立时不执行任何操作
```

### 3. 在循环中

```
while some_condition:
    pass  # 循环继续，但不执行任何操作
```

### 4. 在异常处理中

```
try:
    something()
except SomeException:
    pass  # 捕获异常，但不执行任何操作
```

在上面的例子中，即使`SomeException`异常被抛出，`pass`语句也会使得程序不执行任何异常处理代码。

### 5. 在`for`或`while`循环中，当只需要迭代不需要执行操作时

```
for item in iterable:
    pass  # 只是遍历，不执行任何操作
```

`pass`语句在Python中是必需的，因为在没有`pass`的情况下，上述代码会导致语法错误。例如，一个空的`if`语句块或者空的类定义都是不允许的，除非里面有`pass`语句。

### 示例，显示1-10之间的偶数

```
for i in range(1,10):
    if i%2 == 0:                     #判断是否为偶数
        print(i,end = '')
    else:                            #不是偶数
        pass                         #占位符，不做任何事情
```

总的来说，`pass`是一个在Python中用来保持语法正确的工具，它不会对程序的执行产生任何影响。

### 本期结语：下面我展示几个实战题供大家练练手，不过答案里用到的某些语法可能会超过现在的内容，后续的教程会一一讲解。

### 实例训练15 -模拟支付宝蚂蚁森林的能量产生的过程

支付宝的蚂蚁森林通过日常走步、生活缴费、线下支付、网络购票、共享单车等环保行为积攒能量种树，以下根据这个机制模拟出能量产生过程。

```
import random

# 定义一个类来模拟蚂蚁森林的能量产生
class AntForest:
    def __init__(self):
        self.energy = 0  # 初始化能量为0

    # 模拟不同行为产生的能量
    def generate_energy(self, action):
        if action == '生活缴费':
            self.energy += random.randint(50, 100)  # 生活缴费产生50-100g能量
        elif action == '行走捐':
            self.energy += random.randint(100, 200)  # 行走捐产生100-200g能量
        elif action == '共享单车':
            self.energy += random.randint(50, 150)  # 共享单车产生50-150g能量
        elif action == '线下支付':
            self.energy += random.randint(30, 60)  # 线下支付产生30-60g能量
        elif action == '网络购票':
            self.energy += random.randint(50, 100)  # 网络购票产生50-100g能量
        else:
            print("未知的行为，无法产生能量")

    # 显示当前总能量
    def show_energy(self):
        print(f"当前总能量为：{self.energy}g")

# 创建AntForest实例
forest = AntForest()

# 模拟用户输入不同的行为来产生能量
while True:
    action = input("请输入能量来源(生活缴费、行走捐、共享单车、线下支付、网络购票)或输入0退出程序: \n")
    if action == '0':
        break
    forest.generate_energy(action)
    forest.show_energy()
```

### 实例训练16 -猜数字游戏

游戏规则说明：

1. 程序自动生成一个1到10之间的随机数。
2. 玩家有无限次机会猜测这个数字，直到猜中为止。
3. 每次玩家输入猜测后，程序会提示玩家猜的数字是太高了还是太低了。
4. 当玩家猜中数字时，游戏结束，并显示玩家猜测的次数。
5. 如果玩家输入-1则表示直接退出游戏。

```
import random

def guess_number_game():
    # 随机生成一个1到10之间的数字
    target_number = random.randint(1, 10)
    attempts = 0

    while True:
        try:
            guess = int(input("请输入你猜的数字（1-10）或输入-1退出游戏："))
            if guess == -1:
                print("你选择了退出游戏。")
                break
            attempts += 1
            
            if guess < target_number:
                print("太低了，再试试看。")
            elif guess > target_number:
                print("太高了，再试试看。")
            else:
                print(f"恭喜你！你猜对了数字是 {target_number}。")
                print(f"你总共猜了 {attempts} 次。")
                break
        except ValueError:
            print("请输入一个有效的整数。")

# 开始游戏
guess_number_game()
```

### 实例训练17 -模拟10086查询功能

游戏规则说明：

1. **模拟10086客服查询系统**：用户可以通过输入不同的查询代码来获取相应的信息。
2. **查询代码**：系统提供几个查询代码，每个代码对应不同的查询服务。
3. **输入查询**：用户输入查询代码后，系统将显示相应的信息。
4. **退出系统**：用户可以通过输入特定的代码来退出查询系统。

```
def simulate_10086():
    print("欢迎来到模拟10086查询系统！")
    print("请输入以下代码以查询相关信息：")
    print("1 - 查询余额")
    print("2 - 查询套餐详情")
    print("3 - 查询积分")
    print("0 - 退出系统\n")
    
    while True:
        user_input = input("请输入查询代码：")
        
        if user_input == "1":
            print("您的账户余额为：100元。")
        elif user_input == "2":
            print("您的套餐详情如下：...")
            print("- 通话时长：500分钟")
            print("- 流量：20GB")
            print("- 短信：500条")
        elif user_input == "3":
            print("您的积分为：500分。")
        elif user_input == "0":
            print("感谢您的使用，再见！")
            break
        else:
            print("无效的查询代码，请重新输入。")

# 开始模拟
simulate_10086()
```

