---
title: Python字符串及正则表达式（十）：字符串常用操作、字符串编码转换
---

**前言：在编程的世界里，字符串无处不在。它们是构建用户界面、存储数据、进行通信的基础元素。无论是财务系统的总账报表、电子游戏的比赛结果，还是火车站的列车时刻表，这些信息最终都需要以文本的形式呈现给用户。这些文本的背后，是程序经过精确计算、逻辑判断和数据整理的结果，它们将复杂的数据转化为直观易懂的文本信息。正如一位经验丰富的程序员所说：“开发一个项目，基本上就是在不断地处理字符串。”**

**在本章节中，我们将详细介绍如何高效地操作字符串，包括但不限于字符串的分割、连接、替换和格式化等。同时，我们也会探讨字符串编码的转换，这对于处理不同语言和字符集的数据尤为重要。通过这些内容的学习，你将能够更加灵活地处理字符串数据，为你的项目开发提供强大的支持。让我们开始这段深入探索Python字符串吧。**

### 一、字符串常用操作

Python 中的字符串操作是非常丰富和灵活的。以下是一些常用的字符串操作：

### 1、拼接字符串：

使用 `+` 操作符来拼接两个或多个字符串。

```
str1 = "Hello"
str2 = "World"
result = str1 + " " + str2  
print(str1 + str2)# 结果为 "Hello World"
```

### 注意字符串不允许和其他类型的数据拼接，如使用下列的代码将字符串与数值拼接在一起将会报错

```
str1 = '我今天一共走了'        # 定义字符串
num = 16058                   # 定义一个整数
str2 = '步'                   # 定义字符串
print(str1 + num + str2)      # 对字符串和整数进行拼接
```

### 改进后：

```
str1 = '我今天一共走了'             # 定义字符串
num = 16058                        # 定义一个整数
str2 = '步'                        # 定义字符串
print(str1 + str(num) + str2)      # 对字符串和整数进行拼接
```

### 实例训练34 -使用字符串拼接输出一个关于程序员的笑话

```
programmer_1 = '程序员甲:搞IT太累了,我想换行......怎么办？'
programmer_2 = '程序员乙:敲以下回车键'
print(programmer_1 + '\n' + programmer_2)
```

### 2、计算字符串的长度：

由于不同的字符所占字节数不同，所以要计算字符串的长度，需要先了解各字符所占的字节数。在Python 中，数字、英文、小数点、下划线和空格占一个字节;一个汉字可能会占 2~4个字节，占几个字节取决于采用的编码。汉字在 GBK/GB2312编码中占2个字节，在 UTF-8humicode 编码中一般占用3个字节(或4个字节)。  
使用 `len()` 函数来获取字符串的长度。

```
str = "Hello,World"
length = len(str)  
print(length)   # 结果为 11
```

### 中文字符串说明

```
str1 = '人生苦短,我用Ptyhon!'  # 定义字符串
length = len(str1)            # 计算字符串的长度
print(length)           # 结果为 14
```

上面的代码在执行后，将输出结果`14`。从上面的结果中可以看出，在默认的情况下，通过`len()`函数计算字符串的长度时，不区分英文、数字、和汉字，所有字符都按一个字符计算。  
在实际开发时，有时需要获取字符串实际所占的字节数，即如果采用`UTF-8`编码，汉字占3个字节，采用`GBK`或者`GB2312`时，汉字占2个字节。这时，可以通过使用`encode()`方法(进行编码后再进行获取。例如，如果要获取采用UTF-8编码的字符串的长度，可以使用下面的代码:

```
str1 = '人生苦短，我用Ptyhon!'      # 定义字符串
length = len(str1.encode())       # 计算UTF-8编码的字符串的长度
print(length)          # 结果为 28
```

上面的代码在执行后，将显示“28”。这是因为汉字加中文标点符号共7个，占21个字节，英文字母和英文的标点符号占7个字节，共28个字节。

如果要获取采用 GBK编码的字符串的长度，可以使用下面的代码：

```
str1 = '人生苦短，我用Ptyhon!'          # 定义字符串
length = len(str1.encode('gbk'))       # 计算UTF-8编码的字符串的长度
print(length)          # 结果为 21
```

上面的代码在执行后，将显示“21”。这是因为汉字加中文标点符号共7个，占14个字节，英文字母和英文的标点符号占7个字节，共28个字节。

### 3、截取字符串：

由于字符串也属于序列，所以要截取字符串，可以采用切片方法实现。通过切片方法截取字符串的语法格式如下:  
`string[start : end : step]`  
参数说明:

- `string`:表示要截取的字符串。
- `start`:表示要截取的第一个字符的索引(包括该字符)，如果不指定，则默认为0。
- `end`:表示要截取的最后一个字符的索引(不包括该字符)，如果不指定则默认为字符串的长度
- `step`:表示切片的步长，如果省略，则默认为1，当省略该步长时，最后一个冒号也可以省略。  
  使用切片操作来截取字符串的一部分。

  ```
  str = "Hello World"
  substr = str[0:5]  # 结果为 "Hello"
  ```

### 拓展：

| 索引 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 字符 | 人 | 生 | 苦 | 短 | ， | 我 | 用 | P | y | t | h | o | n | ! |

在编程中，字符串通常以0作为第一个字符的索引，这在大多数编程语言中都是通用的。在上表中，"人" 是字符串的第一个字符，其索引为0，而 "!" 是最后一个字符，其索引为13。

```
str1 = '人生苦短,我用Ptyhon!'            # 定义字符串
substr1 = str1[1]                       # 截取第2个(索引1)字符
substr2 = str1[5:]                      # 从第6个(索引5）字符截取
substr3 = str1[:5]                      # 从左边开始截取5个（索引4）字符
substr4 = str1[2:5]                     # 截取第3个（索引2）到第5个（索引4）字符
print('原字符串: ',str1)
print(substr1 + '\n' + substr2 + '\n' + substr3 + '\n' + substr4)
```

### 捕获异常范例

```
str1 = '人生苦短,我用Ptyhon!'            # 定义字符串
substr1 = str1[15]                      # 截取第15个字符
print(substr1)
```

解决方法：采用`try...except`语句捕获异常：

```
str1 = '人生苦短,我用Ptyhon!'            # 定义字符串
try:
    substr1 = str1[15]                  # 截取第15个字符
except IndexError:
    print('指定的索引不存在')
```

### 4、分割字符串：

字符串对象的 `split()` 方法用于将一个字符串按照指定的分隔符切分为字符串列表。该列表中的元素不包括分隔符。`split()` 方法的语法格式如下：

```
str.split(sep, maxsplit)
```

### 参数说明：

① **str**: 需要进行分割的字符串。  
② **sep**: 指定的分隔符，可以是多个字符。默认为 `None`，即会将所有空字符（包括空格、换行符 `\n`、制表符 `\t` 等）作为分隔符。  
③ **maxsplit**: 可选参数，用于指定分割的次数。如果不指定或设为 -1，则表示分割次数没有限制；否则，返回结果列表的元素个数最多为 `maxsplit + 1`。  
④ **返回值**: 分隔后的字符串列表。该列表的元素是以分隔符为界限切分的字符串（不含分隔符）。如果分隔符前面（或与前一个分隔符之间）没有内容，则会返回一个空字符串元素。

注意: 在使用 `split()` 方法时，如果不指定 `sep` 参数，则不能同时指定 `maxsplit` 参数。

使用 `split()` 方法来分割字符串，返回一个字符串列表。

```
str = "Hello,World,Python"
parts = str.split(",")  
print(parts)   # 结果为 ['Hello', 'World', 'Python']
```

### 实例训练35 -输出被@的好友名称

```
str1 = '@马哥教育 @海瑞 @马斯克'
list1 = str1.split(' ')              #用空格分割字符串
print('您@的好友有: ')
for item in list1:
    print(item[1:])                 # 输出每个好友名时，去掉@符号
```

### 5、合并字符串：

合并字符串是将多个字符串通过一个固定的分隔符连接起来的过程。与拼接字符串不同，合并字符串会使用一个指定的分隔符来连接各个字符串。例如，如果我们有字符串列表 `['绮梦', '冷伊一', '香凝', '黛兰']`，我们可以通过分隔符 `"*"` 将它们合并为一个字符串 `"绮梦*冷伊一*香凝*黛兰"`。

合并字符串的操作可以通过字符串对象的 `join()` 方法来实现。该方法的语法格式如下：

```
strnew = string.join(iterable)
```

### 参数说明：

- **strnew**：表示合并后生成的新字符串。
- **string**：字符串类型，用于指定合并时的分隔符。
- **iterable**：可迭代对象，该迭代对象中的所有元素（字符串表示）将被合并为一个新的字符串。`string` 作为边界点分割这些元素。

  使用 `join()` 方法来合并字符串列表或元组。

```
parts = ["Hello", "World", "Python"]
result = " ".join(parts)  
print(result)            # 结果为 Hello World Python
```

### 实例训练36 -通过好友列表生成全部被@的好友

```
list_friend = ['马哥教育','海瑞','马云','马斯克','俞洪敏']         # 好友列表
str_friend = ' @'.join(list_friend)                             # 用空格+@符号进行连接
at = '@'+str_friend                                             # 由于使用join()方法时，第一个元素前不加分隔符，所以需要在前面加上@符号
print('您要@的好友: ',at)
```

### 6、检索字符串：

检索字符串是编程中用于查找和统计特定字符或子串在字符串中出现的次数、位置的方法。以下是几种常用的字符串检索方法：

### ① count()

`count()` 方法用于统计指定子串在字符串中出现的次数。如果子串不存在于字符串中，则返回0。

**语法格式：**

```
count = str.count(sub[, start[, end]])
```

- **str**: 原始字符串。
- **sub**: 需要统计的子串。
- **start**: 可选参数，统计的起始位置，默认为字符串的开始。
- **end**: 可选参数，统计的结束位置，默认为字符串的结束。

### 举例：

`count()` 方法用于统计指定子串在字符串中出现的次数：

```
text = "moonshot moonshot"
count_moonshot = text.count("moonshot")
print(count_moonshot)  # 输出: 2
```

### ② find()

`find()`方法用于查找子串在字符串中第一次出现的索引，如果未找到则返回-1。

**语法格式：**

```
position = str.find(sub[, start[, end]])
```

- **str**: 原始字符串。
- **sub**: 需要查找的子串。
- **start**: 可选参数，查找的起始位置，默认为字符串的开始。
- **end**: 可选参数，查找的结束位置，默认为字符串的结束。

### 举例

`find()` 方法用于查找子串在字符串中第一次出现的索引：

```
text = "hello world"
index = text.find("world")
print(index)  # 输出: 6
```

如果子串不存在，返回-1：

```
index = text.find("python")
print(index)  # 输出: -1
```

### ③ index()

`index()` 方法与`find()`类似，用于查找子串在字符串中第一次出现的索引。不同的是，如果子串未找到，`index()`会抛出一个异常。

**语法格式：**

```
position = str.index(sub[, start[, end]])
```

- **str**: 原始字符串。
- **sub**: 需要查找的子串。
- **start**: 可选参数，查找的起始位置，默认为字符串的开始。
- **end**: 可选参数，查找的结束位置，默认为字符串的结束。

### 举例：

`index()` 方法与`find()`类似，但若子串不存在则抛出异常:

```
text = "hello world"
index = text.index("world")
print(index)  # 输出: 6
```

如果子串不存在，会抛出ValueError：

```
# 这将抛出异常，因为"python"不在文本中
index = text.index("python")
```

### ④ startswith()

`startswith()` 方法用于检查字符串是否以指定的子串开始，如果是，则返回True，否则返回False。

**语法格式：**

```
bool = str.startswith(prefix[, start[, end]])
```

- **str**: 原始字符串。
- **prefix**: 需要检查的子串。
- **start**: 可选参数，检查的起始位置，默认为字符串的开始。
- **end**: 可选参数，检查的结束位置，默认为字符串的结束。

### 举例：

`startswith()` 方法用于检查字符串是否以指定的子串开始:

```
text = "hello world"
starts_with_hello = text.startswith("hello")
print(starts_with_hello)  # 输出: True
```

### ⑤ endswith()

`endswith()` 方法用于检查字符串是否以指定的子串结束，如果是，则返回True，否则返回False。

**语法格式：**

```
bool = str.endswith(suffix[, start[, end]])
```

- **str**: 原始字符串。
- **suffix**: 需要检查的子串。
- **start**: 可选参数，检查的起始位置，默认为字符串的开始。
- **end**: 可选参数，检查的结束位置，默认为字符串的结束。

### 举例

`endswith()` 方法用于检查字符串是否以指定的子串结束：

```
text = "hello world"
ends_with_world = text.endswith("world")
print(ends_with_world)  # 输出: True
```

这些方法为字符串的检索提供了灵活且强大的工具，使得在处理文本数据时更加高效和准确。通过这些方法，开发者可以轻松地实现对字符串内容的检索和统计，从而满足各种编程需求。

### 7、字母的大小写转换：

在编程中，经常需要对字符串中的字母进行大小写转换，以满足不同的格式要求或进行不区分大小写的比较。以下是两种常用的字符串大小写转换方法：

### ① lower()

`lower()` 方法用于将字符串中的所有大写字母转换为小写字母。

**语法格式：**

```
lower_str = str.lower()
```

- **str**: 原始字符串。

### 举例：

```
text = "Hello World"
lower_text = text.lower()
print(lower_text)  # 输出: "hello world"
```

### ② upper()

`upper()` 方法用于将字符串中的所有小写字母转换为大写字母。

**语法格式：**

```
upper_str = str.upper()
```

- **str**: 原始字符串。

### 举例：

```
text = "hello world"
upper_text = text.upper()
print(upper_text)  # 输出: "HELLO WORLD"
```

### 实例训练37 -不区分大小写验证会员名是否唯一

```
username_1 = '|MingRi|mr|mingrisoft|WGH|MRSoft|'          #假设已经注册的会员名称保存在一个字符串中，以“|”进行分隔
username_2 = username_1.lower()                           #将会员名称字符串全部转换为小写
regname_1 = input('输入要注册的会员名称:')
regname_2 = '|' + regname_1.lower() + '|'                  #将要注册的会员名称全部转换为小写
if regname_2 in username_2:                               #判断输入的会员名称是否存在
    print('会员名',regname_1,'已经存在! ')
else:
    print('会员名',regname_1,'可以注册! ')
```

这些方法使得在处理字符串时，可以轻松地进行大小写转换，以适应不同的应用场景，如用户输入的规范化、文件命名的统一等。通过这些简单的方法，可以提高代码的可读性和健壮性。

### 8、去除字符串中的空格和特殊字符：

在编程中，经常需要对字符串进行清理，去除不需要的空格或特殊字符。以下是几种常用的字符串清理方法：

### ① strip()

`strip()` 方法用于去除字符串两端的空格和特殊字符。默认情况下，它去除空白字符，包括空格、换行符（`\n`）、制表符（`\t`）等。也可以指定一个字符集合，去除两端的这些字符。

**语法格式：**

```
cleaned_str = str.strip([chars])
```

- **str**: 原始字符串。
- **chars**: 可选参数，指定要去除的字符集合。

### 举例：

```
text = "   Hello, World!   "
cleaned_text = text.strip()
print(cleaned_text)  # 输出: "Hello, World!"
```

### ② lstrip()

`lstrip()` 方法与`strip()`类似，但它只去除字符串左侧（开头）的空格和特殊字符。

**语法格式：**

```
cleaned_str = str.lstrip([chars])
```

### 举例：

```
text = "   Hello, World!   "
cleaned_text = text.lstrip()
print(cleaned_text)  # 输出: "Hello, World!   "
```

### ③ rstrip()

`rstrip()` 方法与strip()类似，但它只去除字符串右侧（结尾）的空格和特殊字符。

**语法格式：**

```
cleaned_str = str.rstrip([chars])
```

### 举例：

```
text = "   Hello, World!   "
cleaned_text = text.rstrip()
print(cleaned_text)  # 输出: "   Hello, World!"
```

这些方法使得在处理字符串时，可以轻松地去除两端的不必要字符，从而提高数据的清洁度和可用性。通过这些简单的方法，可以确保字符串数据在进一步处理或展示前达到预期的格式。

### 9、格式化字符串：

格式化字符串是编程中用于生成具有特定格式的字符串的方法。以下是两种常用的字符串格式化方法：

### ① %

`%` 操作符用于格式化字符串，它允许你在字符串中嵌入变量的值。

**语法格式：**

```
formatted_str = "%s%d%f" % (var1, var2, var3)
```

- **%s**: 字符串格式化占位符。
- **%d**: 整数格式化占位符。
- **%f**: 浮点数格式化占位符。
- **var1, var2, var3**: 要格式化的变量。

### 常用格式化字符表

| 格式化字符 | 说明 | 格式化字符 | 说明 |
| --- | --- | --- | --- |
| `%s` | 字符串（采用 `str()` 显示） | `%r` | 字符串（采用 `repr()` 显示） |
| `%c` | 单个字符 | `%o` | 八进制整数 |
| `%d` 或 `%i` | 十进制整数 | `%e` | 指数（基底写为 `e`） |
| `%x` | 十六进制整数 | `%E` | 指数（基底写为 `E`） |
| `%f` 或 `%g` | 浮点数 | `%%` | 字符 `%` |

### 说明

- `m`: 可选参数，表示占有宽度。用于指定输出的最小宽度。
- `.n`: 可选参数，表示小数点后保留的位数。用于控制浮点数的精度。
- 格式化字符用于指定类型，其值如表所示。

### 举例1

```
# 使用 %s 格式化字符串
name = "Alice"
print("Name: %s" % name)  # 输出: Name: Alice

# 使用 %d 格式化十进制整数
age = 30
print("Age: %d" % age)  # 输出: Age: 30

# 使用 %f 格式化浮点数
height = 165.5
print("Height: %.1f" % height)  # 输出: Height: 165.5

# 使用 %x 格式化十六进制整数
number = 255
print("Number in hex: %x" % number)  # 输出: Number in hex: ff

# 使用 %e 格式化指数
value = 123.456
print("Value in scientific notation: %e" % value)  # 输出: Value in scientific notation: 1.234560e+02

# 使用 %% 转义字符 %
print("Percentage: %%" % 0)  # 输出: Percentage: %
```

### 举例2：

```
name = "Alice"
age = 30
height = 165.5
formatted_text = "Name: %s, Age: %d, Height: %.1f" % (name, age, height)
print(formatted_text)  # 输出: "Name: Alice, Age: 30, Height: 165.5"
```

这些格式化字符在Python中用于控制字符串的输出格式，使得在生成具有特定格式的字符串时更加灵活和精确。通过这些格式化字符，可以轻松地对数字、字符串等进行格式化，以满足各种编程需求。

### ② format()

`format()`方法提供了一种更现代的字符串格式化方式，它允许你使用大括号 `{}` 作为占位符，并可以指定变量的格式。

**语法格式：**

```
formatted_str = "{}{}{}".format(var1, var2, var3)
```

- **{}**: 格式化占位符。
- **var1, var2, var3**: 要格式化的变量。

### format()方法常用格式化字符表

| 格式化字符 | 说明 | 格式化字符 | 说明 |
| --- | --- | --- | --- |
| `s` | 对字符串类型格式化 | `b` | 将十进制整数自动转换成二进制表示再格式化 |
| `d` | 十进制整数 | `o` | 将十进制整数自动转换成八进制表示再格式化 |
| `c` | 将十进制整数自动转换成对应的Unicode字符 | `x` 或 `X` | 将十进制整数自动转换成十六进制表示再格式化 |
| `e` 或 `E` | 转换为科学计数法表示再格式化 | `f` 或 `F` | 转换为浮点数（默认小数点后保留6位）再格式化 |
| `g` 或 `G` | 自动在 `e` 和 `f` 或 `E` 和 `F` 中切换 | `%` | 显示百分比（默认显示小数点后6位） |

### 说明

- `#`: 可选参数，对于二进制数、八进制数和十六进制数，如果加上 `#`，表示会显示 `0b`/`0o`/`0x` 前缀，否则不显示前缀。
- `width`: 可选参数，用于指定所占宽度。
- `.precision`: 可选参数，用于指定保留的小数位数。
- `type`: 可选参数，用于指定类型。

### 举例：

```
name = "Bob"
age = 25
weight = 70.3
formatted_text = "Name: {0}, Age: {1}, Weight: {2:.1f}".format(name, age, weight)
print(formatted_text)  # 输出: "Name: Bob, Age: 25, Weight: 70.3"
```

**使用变量位置：**

```
name = "Bob"
age = 25
weight = 70.3
formatted_text = "Name: {1}, Age: {0}, Weight: {2:.1f}".format(age, name, weight)
print(formatted_text)  # 输出: "Name: Bob, Age: 25, Weight: 70.3"
```

**使用关键字参数：**

```
name = "Bob"
age = 25
weight = 70.3
formatted_text = "Name: {name}, Age: {age}, Weight: {weight:.1f}".format(name=name, age=age, weight=weight)
print(formatted_text)  # 输出: "Name: Bob, Age: 25, Weight: 70.3"
```

这些方法为字符串的格式化提供了灵活且强大的工具，使得在生成具有特定格式的字符串时更加高效和准确。通过这些方法，可以轻松地将变量嵌入到字符串中，满足各种编程需求。

**以上是 Python 中处理字符串时最常用的一些操作。Python 的字符串是不可变的，这意味着一旦创建，就不能被改变。每次对字符串的操作都会生成一个新的字符串。**

### 二、字符串编码转换

字符串编码转换是编程中用于将字符串转换为不同编码格式的字节序列，或将字节序列解码回字符串的方法。以下是两种常用的字符串编码转换方法：

### 1、 使用encode()方法编码

`encode()`方法用于将字符串编码为字节序列。默认情况下，它使用UTF-8编码，但可以指定其他编码格式。

**语法格式：**

```
byte_sequence = str.encode([encoding])
```

- **str**: 原始字符串。
- **encoding**: 可选参数，指定编码格式，默认为UTF-8。

**举例：**

```
text = "Hello, World!"
encoded_text = text.encode('utf-8')
print(encoded_text)  # 输出: b'Hello, World!'
```

### 2、使用decode()方法解码

`decode()` 方法用于将字节序列解码回字符串。它需要指定字节序列的编码格式。

**语法格式：**

```
str = byte_sequence.decode([encoding])
```

- **byte_sequence**: 字节序列。
- **encoding**: 指定字节序列的编码格式。

**举例：**

```
byte_sequence = b'\xe4\xbd\xa0\xe5\xa5\xbd'
decoded_text = byte_sequence.decode('utf-8')
print(decoded_text)  # 输出: "你好"
```

**这些方法为字符串的编码和解码提供了灵活的工具，使得在处理不同编码格式的数据时更加高效和准确。通过这些方法，可以轻松地在字符串和字节序列之间进行转换，以满足各种编程需求。**
