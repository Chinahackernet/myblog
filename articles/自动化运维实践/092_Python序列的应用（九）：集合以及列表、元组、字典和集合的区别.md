---
title: Python序列的应用（九）：集合以及列表、元组、字典和集合的区别
---

**前言：在Python编程语言中，序列是一类非常重要的数据结构，它们提供了一种有序地存储和访问数据的方式。在Python中，序列的应用非常广泛，它们是处理数据集合的基础工具。本系列文章旨在深入探讨Python中的序列类型，包括列表（List）、元组（Tuple）、字典（Dictionary）和集合（Set），并分析它们之间的区别和适用场景。**

**集合以及列表、元组、字典和集合的区别**

**在进入具体的应用案例之前，我们首先需要了解这些数据结构的基本概念和它们之间的差异。列表和元组提供了有序的数据集合，而字典和集合则提供了无序的数据集合。每种数据结构都有其独特的特性和用途：**

- **列表（List）**：一个可变的、有序的元素集合，可以包含重复的元素。
- **元组（Tuple）**：一个不可变的、有序的元素集合，通常用于保护数据不被改变。
- **字典（Dictionary）**：一个无序的键值对集合，键必须是唯一的，而值可以重复。
- **集合（Set）**：一个无序的、不包含重复元素的集合，适用于进行数学上的集合操作，如并集、交集和差集。

**在本系列的第七篇文章中，我们已经探讨了列表的应用。现在，我们将转向集合，这是一种非常有用的数据结构，特别是在需要快速成员检查、消除重复项和集合运算的场景中。集合在Python中通过`set`类型实现，它提供了丰富的方法来处理集合特有的操作。**

**在这篇文章中，我们将详细讨论集合的创建、操作以及与其他序列类型的交互。我们将通过实际的例子来展示集合的强大功能，并解释为什么在某些情况下选择集合而不是其他数据结构。通过对比列表、元组、字典和集合，我们将更清楚地理解它们各自的优势和局限性。**

**随着我们深入探讨集合的应用，你将发现Python序列类型的多样性和灵活性，以及它们在解决实际问题中的强大能力。让我们开始这次探索之旅，深入了解Python中的集合以及它们与其他序列类型的区别。**

### 一、集合

Python 中的集合同数学中的集合概念类似，也是用于保存不重复元素的。它有可变集合(set)和不可变集合(fozenset)两种。本节所要介绍的可变集合是无序可变序列，而不可变集合在本书中不做介绍。在形式上，集合的所有元素都放在一对`{}`中，两个相邻元素间使用`，`分隔。集合最好的应用就是去掉重复元素，因为集合中的每个元素都是唯一的。

Python中的集合（set）是一个无序的、不包含重复元素的数据结构。以下是关于集合的一些基本操作：

### 1、集合的创建

创建集合非常简单，可以使用大括号 `{}` 或者 `set()` 函数。如果使用大括号，需要注意空集合不能使用 `{}` 来创建，因为空花括号在Python中是一个空字典的表示。因此，创建空集合需要使用 `set()` 函数。

```
# 使用set()函数创建集合
my_set = set()

# 使用大括号创建集合
my_set = {1, 2, 3}

# 创建空集合
my_set = set()
```

### 实例训练27 -创建保存学生选课信息的集合

```
python ={'绮梦','冷伊一','香凝','梓轩'}          #保存选择Python语言的学生姓名
C={'冷伊一','零语','梓轩','圣博',}               #保存选择C语言的学生姓名
print('选择Python语言的学生有: ',python,'\n')    #输出选择Python语言的学生姓名
print('选择C语言的学生有: ',C)                   # 输出选择C语言的学生姓名
```

### 2、集合的添加和删除

- **添加元素**：使用 `add()` 方法向集合中添加元素。
- **删除元素**：使用 `remove()` 方法删除集合中的元素，如果元素不存在会抛出 `KeyError`。可以使用 `discard()` 方法，它在元素不存在时不会抛出错误。

```
# 添加元素
my_set = {1, 2, 3}
my_set.add(4)  # 现在 my_set 变为 {1, 2, 3, 4}

# 删除元素
my_set.remove(2)  # 移除元素 2，现在 my_set 变为 {1, 3, 4}

# 安全删除元素
my_set.discard(5)  # 元素 5 不存在，但不会抛出错误
```

如果需要从集合中移除一个元素，并且这个元素之后不再使用，可以使用 `pop()` 方法，它会随机移除一个元素并返回。

```
# 随机移除一个元素
element = my_set.pop()  # 返回并移除一个元素
```

### 实例训练28 -学生更改选学课程

```
python = set(['绮梦','冷伊一','香凝','梓轩' ])         #保存选择Python语言的学生姓名
python.add('零语')                                    #添加一个元素
C = set(['冷伊一','零语','梓轩','圣博'])               #保存选择C语言的学生姓名
C.remove('零语')                                      #删除指定元素
print('选择Python语言的学生有: ',python,'\n')          #输出选择Python语言的学生姓名
print('选择C语言的学生有: ',C)                         # 输出选择C语言的学生姓名
```

### 3、集合的交集、并集和差集运算

- **交集**：使用 `intersection()` 方法或者 `&` 运算符。
- **并集**：使用 `union()` 方法或者 `|` 运算符。
- **差集**：使用 `difference()` 方法或者 `-` 运算符。

```
# 交集
set_a = {1, 2, 3}
set_b = {2, 3, 4}
intersection = set_a.intersection(set_b)  # 或者 set_a & set_b
# intersection 现在是 {2, 3}

# 并集
union = set_a.union(set_b)  # 或者 set_a | set_b
# union 现在是 {1, 2, 3, 4}

# 差集
difference = set_a.difference(set_b)  # 或者 set_a - set_b
# difference 现在是 {1}
```

集合的对称差集（symmetric difference）操作会找出两个集合中不共有的元素。换句话说，它会包含那些只在其中一个集合中出现的元素。集合对称差集运算，使用 `symmetric_difference()` 方法或者 `^` 运算符，它返回两个集合中不重复的元素。

```
# 对称差集
symmetric_diff = set_a.symmetric_difference(set_b)  # 或者 set_a ^ set_b
# symmetric_diff 现在是 {1, 4}
```

### 实例训练29 -对选课集合进行交集、并集和差集运算

```
python = set(['绮梦','冷伊一','香凝','梓轩' ])         #保存选择Python语言的学生姓名
C = set(['冷伊一','零语','梓轩','圣博'])               #保存选择C语言的学生姓名
print('选择Python语言的学生有: ',python,'\n')          #输出选择Python语言的学生姓名
print('选择C语言的学生有: ',C)                         #输出选择C语言的学生姓名
print('交集运算: ',python & C)                        #输出既选择了python语言又选择了C语言的学生
print('并集运算: ',python | C)                        #输出参与选课的全部学生姓名
print('并集运算: ',python - C)                        #输出只选择了python语言但没有选择C语言的学生
```

以上就是Python集合的基本操作。集合是一个强大的数据结构，适用于需要快速成员检查、消除重复项和集合运算的场景。

### 二、列表、元组、字典和集合的区别

列表、元组、字典和集合的区别表：

| 数据结构 | 是否可变 | 是否重复 | 是否有序 | 定义符号 |
| --- | --- | --- | --- | --- |
| 列表（List） | 可变 | 允许 | 有序 | `[]` 或 `list()` |
| 元组（Tuple） | 不可变 | 不允许 | 有序 | `()` 或 `tuple()` |
| 字典（Dictionary） | 可变 | 键不允许，值允许 | 键无序（Python 3.7+版本中保持插入顺序） | `{}` 或 `dict()` |
| 集合（Set） | 可变 | 不允许 | 无序 | `{}` 或 `set()` |

这个表格简洁地总结了列表、元组、字典和集合的基本特性。

### 实例训练30 -输出“王者荣耀”的游戏角色，根据属性

```
# 王者荣耀的游戏角色列表
heroes = [
    "亚瑟",
    "鲁班七号",
    "妲己",
    "孙悟空",
    "貂蝉",
    "赵云",
    "后羿",
    "孙尚香",
    "诸葛亮",
    "露娜",
    # ...更多英雄
]

# 输出王者荣耀的游戏角色
for hero in heroes:
    print(hero)
```

### 实例训练31 -模拟火车订票系统

```
class TrainInfo:
    def __init__(self, train_number, destination, departure_time, arrival_time, seats_total, seats_available):
        self.train_number = train_number  # 车次
        self.destination = destination  # 目的地
        self.departure_time = departure_time  # 发车时间
        self.arrival_time = arrival_time  # 到达时间
        self.seats_total = seats_total  # 座位总数
        self.seats_available = seats_available  # 可用座位数

    def display_info(self):
        print(f"车次: {self.train_number}")
        print(f"目的地: {self.destination}")
        print(f"发车时间: {self.departure_time}")
        print(f"到达时间: {self.arrival_time}")
        print(f"座位总数: {self.seats_total}")
        print(f"当前可用座位数: {self.seats_available}")
        print('-' * 40)

class TicketBookingSystem:
    def __init__(self):
        self.trains_info = {
            "T123": TrainInfo("T123", "北京", "08:00", "12:00", 100, 90),
            "T456": TrainInfo("T456", "上海", "09:00", "13:00", 120, 110),
            # 添加更多车次信息
        }

    def show_train_info(self, train_number):
        if train_number in self.trains_info:
            self.trains_info[train_number].display_info()
        else:
            print("没有找到该车次的信息。")

# 创建订票系统实例
booking_system = TicketBookingSystem()

# 用户输入车次
user_input = input("请输入车次：")
booking_system.show_train_info(user_input)
```

### 实例训练32 -电视剧的收视率排行榜

```
class TVShow:
    def __init__(self, name, rating):
        self.name = name  # 电视剧名称
        self.rating = rating  # 收视率

    def __str__(self):
        return f"{self.name}: {self.rating}%"

class TVRatingsChart:
    def __init__(self):
        self.shows = []  # 存储电视剧的列表

    def add_show(self, show):
        # 添加电视剧到列表，并保持列表按收视率降序排序
        self.shows.append(show)
        self.shows.sort(key=lambda x: x.rating, reverse=True)

    def remove_show(self, show_name):
        # 移除指定的电视剧
        self.shows = [show for show in self.shows if show.name != show_name]

    def display_chart(self):
        # 显示收视率排行榜
        print("电视剧收视率排行榜：")
        for show in self.shows:
            print(show)
        print('-' * 40)

# 创建收视率排行榜实例
ratings_chart = TVRatingsChart()

# 添加一些电视剧和收视率
ratings_chart.add_show(TVShow("权力的游戏", 8.9))
ratings_chart.add_show(TVShow("老友记", 8.8))
ratings_chart.add_show(TVShow("绝命毒师", 9.5))
ratings_chart.add_show(TVShow("生活大爆炸", 8.2))

# 显示排行榜
ratings_chart.display_chart()

# 移除一个电视剧
ratings_chart.remove_show("生活大爆炸")

# 再次显示排行榜
print("移除《生活大爆炸》后的排行榜：")
ratings_chart.display_chart()
```

### 实例训练33 -统计需要取快递人员的名单

```
class ExpressDelivery:
    def __init__(self):
        self.recipients = []  # 存储需要取快递的人员名单

    def add_recipient(self, name):
        # 添加需要取快递的人员
        if name not in self.recipients:
            self.recipients.append(name)
            print(f"{name} 已添加到取快递名单。")
        else:
            print(f"{name} 已经在名单中。")

    def remove_recipient(self, name):
        # 从名单中移除人员
        if name in self.recipients:
            self.recipients.remove(name)
            print(f"{name} 已从取快递名单中移除。")
        else:
            print(f"{name} 不在名单中。")

    def list_recipients(self):
        # 显示所有需要取快递的人员名单
        if self.recipients:
            print("需要取快递的人员名单：")
            for i, name in enumerate(self.recipients, 1):
                print(f"{i}. {name}")
        else:
            print("目前没有需要取快递的人员。")

# 创建快递派送系统实例
delivery_system = ExpressDelivery()

# 添加需要取快递的人员
delivery_system.add_recipient("张三")
delivery_system.add_recipient("李四")
delivery_system.add_recipient("王五")

# 显示需要取快递的人员名单
delivery_system.list_recipients()

# 尝试重复添加人员
delivery_system.add_recipient("张三")

# 移除一个人员
delivery_system.remove_recipient("李四")

# 再次显示需要取快递的人员名单
delivery_system.list_recipients()
```
