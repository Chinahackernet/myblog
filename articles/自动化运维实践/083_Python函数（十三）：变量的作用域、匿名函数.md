---
title: Python函数（十三）：变量的作用域、匿名函数
---

**前言：在Python中，变量的作用域 是一个至关重要的概念，它关系到变量在程序中的可访问性。理解局部变量（Local Variable）和全局变量（Global Variable）的区别，以及它们如何在不同函数和代码块中被识别和使用，对于编写清晰、可维护的代码至关重要。局部变量限制在定义它们的函数或代码块内，而全局变量则可以在整个程序中被访问和修改。**

**在Python中，当你尝试访问一个变量时，解释器会按照LEGB的顺序进行查找。如果在局部作用域找到了变量，就不会再继续查找。如果在局部作用域没有找到，就会在闭包作用域查找，以此类推。如果在所有这些作用域中都没有找到变量，就会引发`NameError`异常。**

**另一方面，匿名函数，尤其是通过`lambda`关键字创建的，提供了一种编写简短、无名称函数的方法。这些函数在需要快速定义一个小功能时非常有用，尤其是在使用高阶函数（如`map()`, `filter()`, `sorted()`等）时。匿名函数的使用可以减少代码的冗余，提高代码的可读性和效率。**

**在本章中，我们将详细解释变量作用域的规则，包括LEGB规则（Local, Enclosing, Global, Built-in）如何影响变量的访问。同时，我们也会探讨`lambda`表达式的语法和使用场景，以及如何在实际编程中利用它们来简化代码。通过丰富的示例和实践，你将学会如何在Python中有效地使用这些工具，从而提升你的编程能力。**

**让我们一起开始这段旅程，深入Python的变量作用域和匿名函数的世界，探索它们如何让你的代码更加强大和灵活。**

在 Python 中，变量的作用域可以分为局部变量和全局变量，以下是对它们的详细讲解（一到五）：

### 一、局部变量

### 1. 定义和作用域：

- 局部变量是在函数内部定义的变量，其作用域局限于该函数内部。这意味着它们只能在声明它们的函数中使用。
- 当函数执行完毕后，局部变量将被销毁，其占用的内存空间会被释放。

```
def calculate_area():
    # 这里的 length 和 width 是局部变量
    length = 5
    width = 3
    area = length * width
    print(f"The area of the rectangle is {area}")

calculate_area()
# 尝试在函数外访问局部变量会导致错误
# print(length)  # NameError: name 'length' is not defined
```

在这个例子中，`length` 和 `width` 是在 `calculate_area` 函数中定义的局部变量，只能在 `calculate_area` 函数内部被访问和操作。当调用 `calculate_area` 函数时，这些局部变量被创建，函数执行结束后，它们就会被销毁。

### 2. 参数作为局部变量：

- 函数的参数也属于局部变量，它们的作用域同样只在函数内部。

```
def greet(name):  # name 是一个局部变量
    print(f"Hello, {name}!")

greet("Bob")
# 尝试在函数外访问参数会导致错误
# print(name)  # NameError: name 'name' is not defined
```

这里的 `name` 作为 `greet` 函数的参数，是一个局部变量，只能在 `greet` 函数内部使用。

### 3. 闭包中的局部变量：

- 在闭包中，内部函数可以访问外部函数的局部变量，即使外部函数已经执行完毕。

```
def outer():
    message = "Hello, World!"
    def inner():
        print(message)  # 访问外部函数的局部变量
    return inner

closure = outer()
closure()  # 输出 "Hello, World!"
```

在这个例子中，`inner` 函数可以访问 `outer` 函数的局部变量 `message`，形成了一个闭包。即使 `outer` 函数已经执行完毕，`inner` 函数依然可以访问 `message` 变量。

### 二、全局变量

### 1. 定义和作用域：

- 全局变量是在函数外部定义的变量，它们在整个程序中都可以被访问（前提是在其定义之后）。

```
PI = 3.14159  # 这是一个全局变量

def calculate_circumference(radius):
    # 可以在函数内访问全局变量
    circumference = 2 * PI * radius
    print(f"The circumference of the circle is {circumference}")

calculate_circumference(5)  # 输出 "The circumference of the circle is 31.4159"
print(PI)  # 输出 3.14159
```

`PI` 是一个全局变量，可以在 `calculate_circumference` 函数内和函数外访问。

### 2. 修改全局变量：

- 要在函数内部修改全局变量，需要使用 `global` 关键字，否则 Python 会将其视为创建一个新的局部变量。

```
counter = 0  # 全局变量

def increment_counter():
    global counter  # 声明要修改的是全局变量
    counter += 1  # 修改全局变量
    print(f"The counter is now {counter}")

print(counter)  # 输出 0
increment_counter()  # 输出 "The counter is now 1"
increment_counter()  # 输出 "The counter is now 2"
print(counter)  # 输出 2
```

如果没有 `global counter` 这一语句，`counter += 1` 会创建一个新的局部变量 `counter` 而不是修改全局变量。

### 3. 使用 `globals()` 函数：

- `globals()` 函数返回一个包含全局变量的字典，可以用来操作全局变量，不过不推荐使用，因为它会使代码难以理解和维护。

```
def decrement_counter():
    globals()["counter"] -= 1  # 通过 globals() 函数修改全局变量

print(counter)  # 输出 2
decrement_counter()
print(counter)  # 输出 1
```

### 三、局部变量和全局变量的区别与选择

### 1. 区别：

- **作用域**：
  - 局部变量的作用域仅限于定义它的函数内部，而全局变量可以在整个程序中访问（在其定义之后）。
- **生命周期**：
  - 局部变量在函数调用时创建，函数结束时销毁；全局变量在程序开始时创建，程序结束时销毁。
- **性能**：
  - 局部变量的访问通常比全局变量快，因为 Python 解释器先在局部命名空间查找，然后才在全局命名空间查找。

### 2. 选择使用：

- 一般情况下，应尽量使用局部变量，因为它们可以提高代码的可维护性和可理解性，避免变量名冲突。
- 当需要在多个函数之间共享数据时，使用全局变量可能更方便，但要注意潜在的副作用，如意外修改和难以追踪的状态变化。

### 四、`nonlocal` 关键字（针对嵌套函数）

- 当有嵌套函数时，内部函数可以使用 `nonlocal` 关键字修改外部函数的局部变量，但不能修改全局变量。

```
def outer():
    number = 10
    def inner():
        nonlocal number  # 声明要修改的是外部函数的局部变量
        number += 1  # 修改外部函数的局部变量
        print(f"The number is now {number}")
    inner()  # 调用内部函数
    print(f"After inner function, the number is {number}")  # 外部函数的局部变量被修改

outer()  # 输出 "The number is now 11" 和 "After inner function, the number is 11"
```

在这个例子中，`inner` 函数使用 `nonlocal` 关键字修改了 `outer` 函数的局部变量 `number`。

### 五、同时含全局变量和局部变量的实例

以下是一个同时使用全局变量和局部变量的实例，我们将创建一个简单的银行账户管理程序。

```
# 全局变量：存储银行账户的初始余额
account_balance = 1000  

def deposit(amount):
    # 先声明要使用的是全局变量
    global account_balance
    # 局部变量：存储本次存款操作后的余额
    new_balance = account_balance + amount  
    print(f"Deposited {amount}. New balance: {new_balance}")
    # 修改全局变量以更新账户余额
    account_balance = new_balance  

def withdraw(amount):
    # 先声明要使用的是全局变量
    global account_balance
    # 局部变量：存储本次取款操作后的余额
    if amount <= account_balance:
        new_balance = account_balance - amount
        print(f"Withdrew {amount}. New balance: {new_balance}")
        # 修改全局变量以更新账户余额
        account_balance = new_balance
    else:
        print("Insufficient funds.")

print(f"Initial balance: {account_balance}")  # 输出 "Initial balance: 1000"
deposit(500)  # 输出 "Deposited 500. New balance: 1500"
withdraw(200)  # 输出 "Withdrew 200. New balance: 1300"
print(f"Current balance: {account_balance}")  # 输出 "Current balance: 1300"
```

**代码解释**：

- `account_balance` 是一个全局变量，存储银行账户的初始余额。
- `deposit(amount)` 函数：
  - `global account_balance`：首先声明 `account_balance` 是全局变量。
  - `new_balance = account_balance + amount`：计算新的余额，即原有的余额加上要存入的金额。
  - `print(f"Deposited {amount}. New balance: {new_balance}")`：打印存款信息。
  - `account_balance = new_balance`：将全局变量 `account_balance` 更新为新的余额。
- `withdraw(amount)` 函数：
  - `global account_balance`：首先声明 `account_balance` 是全局变量。
  - `if amount <= account_balance`：检查要取出的金额是否小于或等于当前余额。
  - `new_balance = account_balance - amount`：如果满足条件，计算取款后的新余额。
  - `print(f"Withdrew {amount}. New balance: {new_balance}")`：打印取款信息。
  - `account_balance = new_balance`：更新全局变量 `account_balance` 的值。
  - `else: print("Insufficient funds.")`：如果要取出的金额大于当前余额，打印资金不足的信息。

这段代码模拟了一个简单的银行账户操作，包括存款和取款功能，通过使用全局变量 `account_balance` 来存储和更新账户余额，并且使用 `global` 关键字在函数内部正确地修改全局变量。

通过对局部变量和全局变量的理解和恰当使用，可以使 Python 程序的结构更清晰，更易于维护和扩展。在实际编程中，要根据具体需求选择使用局部变量或全局变量，并注意避免变量命名冲突和不必要的全局状态修改。  
使用局部变量和全局变量的关键在于根据具体的需求和编程场景做出合适的选择。对于封装和隔离代码逻辑，局部变量是更好的选择；而对于需要在多个函数之间共享数据的情况，全局变量可以提供便利，但需要谨慎使用，避免代码变得难以维护和出现意外的副作用。

### 六、匿名函数

在 Python 编程中，匿名函数是一种非常强大且简洁的工具，它们允许我们创建小型的、一次性使用的函数，而无需正式定义函数名称。匿名函数在很多场景下可以大大简化代码，提高代码的可读性和简洁性。今天，让我们深入了解 Python 中的匿名函数及其使用方法。

### 1、什么是匿名函数？

匿名函数，也称为 `lambda` 函数，是使用 `lambda` 关键字创建的小型函数。与普通函数不同，匿名函数不需要使用 `def` 关键字来定义，并且通常只包含一个表达式。匿名函数的语法如下：

```
lambda arguments: expression
```

其中：

- `lambda`：关键字，用于声明这是一个匿名函数。
- `arguments`：函数的参数列表，可以是零个或多个，用逗号分隔。这些参数在 `expression` 中被使用，就像普通函数的参数一样，可以在函数体（即 `expression`）中进行操作。例如，`lambda x, y: x + y` 中，`x` 和 `y` 就是函数的参数。
- `expression`：是一个单一的表达式，它是匿名函数的核心部分，该表达式的结果将作为函数的返回值。这个表达式会在函数被调用时执行，并且只能是一个表达式，不能包含复杂的语句，如赋值语句、循环语句或条件语句（除了简单的三元表达式）。例如，在 `lambda x: x ** 2` 中，`x ** 2` 就是 `expression`，它计算 `x` 的平方，当这个匿名函数被调用时，会返回输入 `x` 的平方值。

例如，以下是一个简单的匿名函数，用于计算两个数的和：

```
sum = lambda x, y: x + y
print(sum(3, 5))  # 输出 8
```

在这个例子中，`lambda x, y: x + y` 是一个匿名函数，它接收两个参数 `x` 和 `y`，并返回它们的和。我们将这个匿名函数赋值给变量 `sum`，然后像调用普通函数一样调用它。

### 2、匿名函数的使用场景

### ① 作为高阶函数的参数

匿名函数经常作为参数传递给高阶函数，例如 `map()`、`filter()` 和 `reduce()`。

**`map()` 函数**：

`map()` 函数将一个函数应用于一个可迭代对象的每个元素，并返回一个包含结果的新迭代器。例如，我们可以使用匿名函数将一个列表中的每个元素乘以 2：

```
numbers = [1, 2, 3, 4, 5]
doubled_numbers = map(lambda x: x * 2, numbers)
print(list(doubled_numbers))  # 输出 [2, 4, 6, 8, 10]
```

在这个例子中，`lambda x: x * 2` 是一个匿名函数，它将每个元素 `x` 乘以 2。`map()` 函数将这个匿名函数应用于 `numbers` 列表中的每个元素，最终将结果存储在 `doubled_numbers` 中。

**`filter()` 函数**：

`filter()` 函数用于过滤可迭代对象中的元素，只保留满足条件的元素。我们可以使用匿名函数作为过滤条件。例如，筛选出列表中的偶数：

```
numbers = [1, 2, 3, 4, 5, 6]
even_numbers = filter(lambda x: x % 2 == 0, numbers)
print(list(even_numbers))  # 输出 [2, 4, 6]
```

这里的 `lambda x: x % 2 == 0` 是一个匿名函数，它返回 `True` 当 `x` 是偶数时，`filter()` 函数使用这个匿名函数来筛选出偶数元素。

**`reduce()` 函数（需要从 `functools` 导入）**：

`reduce()` 函数用于对可迭代对象中的元素进行累积操作。例如，计算列表中所有元素的乘积：

```
from functools import reduce
numbers = [1, 2, 3, 4, 5]
product = reduce(lambda x, y: x * y, numbers)
print(product)  # 输出 120
```

`lambda x, y: x * y` 作为匿名函数，将列表中的元素依次相乘。

### ② 排序中的自定义排序规则

`sort()` 和 `sorted()` 方法可以接受一个 `key` 参数，用于指定排序的依据。匿名函数可以作为 `key` 参数，提供自定义的排序规则。例如，根据字符串的长度进行排序：

```
fruits = ['apple', 'banana', 'cherry', 'date']
sorted_fruits = sorted(fruits, key=lambda x: len(x))
print(sorted_fruits)  # 输出 ['date', 'apple', 'cherry', 'banana']
```

这里的 `lambda x: len(x)` 是一个匿名函数，它返回每个元素的长度，`sorted()` 函数根据元素的长度对 `fruits` 列表进行排序。

### ③ 快速定义回调函数

在某些情况下，我们需要快速定义一个简单的回调函数，而不想使用 `def` 定义一个完整的函数。例如，在 GUI 编程或事件处理中：

```
import tkinter as tk

def main():
    root = tk.Tk()
    button = tk.Button(root, text="Click me", command=lambda: print("Button clicked"))
    button.pack()
    root.mainloop()

if __name__ == "__main__":
    main()
```

在这个例子中，`lambda: print("Button clicked")` 作为 `command` 的参数，当按钮被点击时执行打印操作。

### 3、匿名函数的限制

虽然匿名函数很方便，但也有一些限制：

- 只能包含一个表达式，不能包含多个语句或复杂的逻辑。如果需要复杂的逻辑，应该使用 `def` 定义普通函数。
- 匿名函数没有 `return` 语句，表达式的结果自动作为返回值。

### 4、匿名函数的优势

- **简洁性**：匿名函数使代码更加简洁，尤其是在只需要使用一次的情况下，避免了为简单函数定义函数名。
- **提高代码可读性**：在某些场景下，使用匿名函数可以使代码更清晰，尤其是在使用高阶函数时。  
  根据您提供的实战内容，以下是每个实战的Python脚本示例：

### 实例训练50：导演为剧本选主角

```
# 导演选定的主角
main_actor = "关羽"

# 输出主角名字
print(f"导演选定的主角是：{main_actor}")
print(f"{main_actor}开始参演这个剧本")
```

### 实例训练51：模拟美团外卖商家的套餐

```
# 定义套餐和价格
meals = {
    "考神套餐": 13,
    "单人套餐": 9.9,
    "情侣套餐": 20
}

# 输出套餐信息
print("米线店套餐如下：")
for index, (meal, price) in enumerate(meals.items(), start=1):
    print(f"{index}. {meal}")
    print(f"{meal}{price}元")
```

### 实例训练52：根据生日判断星座

```
# 定义星座和对应的日期范围
zodiacs = {
    "摩羯座": (12, 22, 1, 19),
    "水瓶座": (1, 20, 2, 18),
    "双鱼座": (2, 19, 3, 20),
    "白羊座": (3, 21, 4, 19),
    "金牛座": (4, 20, 5, 20),
    "双子座": (5, 21, 6, 20),
    "巨蟹座": (6, 21, 7, 22),
    "狮子座": (7, 23, 8, 22),
    "处女座": (8, 23, 9, 22),
    "天秤座": (9, 23, 10, 22),
    "天蝎座": (10, 23, 11, 21),
    "射手座": (11, 22, 12, 21)
}

# 用户输入生日
month = int(input("请输入月份（例如：5）："))
day = int(input("请输入日期（例如：17）："))

# 判断星座
for zodiac, (start_month, start_day, end_month, end_day) in zodiacs.items():
    if (month == start_month and day >= start_day) or (month == end_month and day <= end_day):
        print(f"{month}月{day}日星座为：{zodiac}")
        break
```

### 实例训练53：将美元转换为人民币

```
# 定义汇率
exchange_rate = 6.28

# 用户输入美元金额
usd_amount = float(input("请输入美元金额："))

# 转换为人民币
cny_amount = usd_amount * exchange_rate

# 输出结果
print(f"{usd_amount}美元等于{cny_amount}人民币")
```

### 总结

匿名函数是 Python 中一种非常实用的工具，特别适合在需要快速定义简单函数的场景下使用。通过使用匿名函数，我们可以避免编写大量的小型函数，提高代码的简洁性和可读性。但要注意，匿名函数不适合复杂逻辑，在这种情况下，使用普通函数会更合适。希望通过这篇博客，你对 Python 中的匿名函数有了更深入的理解，并能在你的编程实践中灵活运用它们。

这篇博客从匿名函数的基本概念开始，逐步深入到各种使用场景，并且提到了它的限制和优势，最后进行了总结。你可以根据自己的实际情况添加更多的示例和解释，也可以将这篇博客作为一个基础，不断完善和扩展对 Python 匿名函数的介绍。如果你还有其他需求，例如添加更多的代码示例、更深入的解释某些概念，欢迎继续向我提出。
