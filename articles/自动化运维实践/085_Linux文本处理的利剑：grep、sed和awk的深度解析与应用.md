---
title: Linux文本处理的利剑：grep、sed和awk的深度解析与应用
---

**前言：在Linux系统管理与开发工作中，文本处理是一项核心技能。面对海量日志文件、配置文件或数据文件，如何快速提取、分析或修改所需信息，成为衡量一个Linux用户熟练度的重要标准。Linux系统中的grep、sed和awk工具，因其强大且灵活的文本处理能力，被冠以“文本处理三剑客”的美誉。它们不仅能够简化日常的文本编辑任务，更能在数据处理和报告生成中发挥关键作用。**

### 一、grep——强大的文本搜索工具

grep是搜索文本中匹配特定模式的利器。在你需要从大量数据中快速定位包含某些关键词的记录时，grep能迅速发挥作用。比如，系统管理员可能需要从海量的日志文件中找出错误信息，或者开发者需要搜索代码库中的所有相关函数调用。

### （一）grep的基本原理

grep通过逐行读取文件内容，使用指定的模式（可以是简单字符串或正则表达式）对每一行进行匹配。一旦发现某行包含与模式匹配的内容，就将该行输出。

### （二）常见选项及其用法

### 1. 基本显示选项

- **-color=auto**
  - 功能：对匹配到的文本着色显示，便于用户快速识别。
  - 示例：`grep -color=auto 'keyword' file.txt`，在`file.txt`中搜索“keyword”时，匹配的内容会以颜色突出显示。
- **-m [num]**
  - 功能：匹配[num]次后停止搜索。
  - 示例：`grep -m 3 'error' log.txt`，在`log.txt`中只查找前3次出现“error”的行。
- **-v**
  - 功能：显示不被模式匹配到的行，即反向匹配。
  - 示例：`grep -v 'debug' data.txt`，从`data.txt`中筛选出不含“debug”的行。
- **-i**
  - 功能：忽略字符大小写进行匹配。
  - 示例：`grep -i 'Case' document.txt`，在`document.txt`中查找“Case”，无论大小写如何。
- **-n**
  - 功能：显示匹配行的行号。
  - 示例：`grep -n 'function_call' code.c`，在`code.c`中查找“function_call”并显示行号。
- **-c**
  - 功能：统计匹配的行数。
  - 示例：`grep -c 'result' report.txt`，统计`report.txt`中包含“result”的行数。
- **-o**
  - 功能：仅显示匹配到的字符串。
  - 示例：`grep -o 'pattern' text.txt`，只显示`text.txt`中每行匹配“pattern”的部分。
- **-q**
  - 功能：静默模式，不输出任何信息，通常用于脚本中判断是否存在匹配。
  - 示例：`grep -q '[section]' config.ini`，在脚本中检查`config.ini`是否存在“[section]”。

### 2. 上下文相关选项

- **-A [num]**
  - 功能：显示匹配行及其后[num]行。
  - 示例：`grep -A 2 'error' log.log`，在`log.log`中查找“error”并显示该行及其后2行。
- **-B [num]**
  - 功能：显示匹配行及其前[num]行。
  - 示例：`grep -B 3 'denied' access.log`，在`access.log`中查找“denied”并显示该行及其前3行。
- **-C [num]**
  - 功能：显示匹配行前后各[num]行。
  - 示例：`grep -C 1 'warning' system.log`，在`system.log`中查找“warning”并显示该行前后各1行。

### 3. 逻辑与表达式相关选项

- **-e [pattern1] -e [pattern2]...**
  - 功能：实现多个模式间的逻辑“或”关系。
  - 示例：`grep -e 'cat' -e 'dog' file.txt`，在`file.txt`中查找包含“cat”或者“dog”的行。
- **-w**
  - 功能：匹配整个单词，避免部分匹配。
  - 示例：`grep -w 'apple' words.txt`，在`words.txt`中查找单词“apple”，而非“applet”等包含“apple”的单词。

### 4. 正则表达式相关选项

- **-E**
  - 功能：使用扩展正则表达式（ERE），类似于egrep。
  - 示例：`grep -E '^abc' regex.txt`，在`regex.txt`中使用扩展正则表达式查找以“abc”开头的行。
- **-F**
  - 功能：不支持正则表达式，按固定字符串匹配，类似于fgrep。
  - 示例：`grep -F 'exact_string' simple.txt`，在`simple.txt`中按固定字符串查找“exact_string”。

### 5. 文件处理相关选项

- **-f file**
  - 功能：根据模式文件处理，从指定文件中读取模式进行匹配。
  - 示例：`grep -f patterns.txt target.txt`，从`patterns.txt`读取模式在`target.txt`中查找。
- **-r**
  - 功能：递归目录搜索，但不处理软链接。
  - 示例：`grep -r 'keyword' /home/user/docs`，在`/home/user/docs`及其子目录中查找“keyword”。
- **-R**
  - 功能：递归目录搜索，且处理软链接。
  - 示例：`grep -R 'keyword' /home/user/docs_with_links`，在`/home/user/docs_with_links`及其子目录（包括软链接指向的目录）中查找“keyword”。

### 二、sed——灵活的流编辑器

sed用于对文本数据进行编辑和替换。当你需要批量修改文件中的某些文本，或者进行更复杂的文本变形时，sed提供了强大的功能来实现这些需求。它不仅可以替换文本，还能删除、插入、甚至执行更复杂的脚本操作。

### （一）sed的工作原理

sed是一种非交互式的流编辑器，它逐行处理输入文件（或输入流），根据用户指定的编辑命令对文本进行操作。默认情况下，它不会直接修改原文件，而是将处理后的结果输出，除非使用`-i`选项进行原地修改。

### （二）常见选项及其用法

### 1. 基本编辑选项

- **-n**
  - 功能：取消默认的输出，只有当执行的命令明确指定输出时才会显示结果。
  - 示例：`sed -n '/pattern/p' file.txt`，只输出`file.txt`中匹配“pattern”的行（`p`命令用于输出）。
- **-e 'commands'**
  - 功能：允许多个编辑命令同时执行，每个命令用`-e`指定。
  - 示例：`sed -e 's/old1/new1/g' -e 's/old2/new2/g' file.txt`，在`file.txt`中同时将“old1”替换为“new1”，“old2”替换为“new2”。
- **-f scriptfile**
  - 功能：从文件中读取编辑命令并执行。
  - 示例：`sed -f commands.sed file.txt`，从`commands.sed`文件中读取编辑命令处理`file.txt`。
- **-i[SUFFIX]**
  - 功能：直接在原文件上进行编辑。如果指定了[SUFFIX]，则会先备份原文件，备份文件名为原文件名加上[SUFFIX]。
  - 示例：`sed -i.bak's/old/new/g' file.txt`，在`file.txt`中原地替换“old”为“new”，并备份原文件为`file.txt.bak`。

### 2. 地址范围选项

- **行号**
  - 功能：指定操作的行号。
  - 示例：`sed '3s/word/replace/' file.txt`，只对`file.txt`的第3行进行替换操作。
- **起始行号,结束行号**
  - 功能：指定操作的行号范围。
  - 示例：`sed '2,4s/old/new/g' file.txt`，对`file.txt`的第2行到第4行进行替换操作。
- **/pattern/ **
  - 功能：通过模式匹配指定操作的行。
  - 示例：`sed '/start_pattern/,/end_pattern/s/old/new/g' file.txt`，对`file.txt`中从匹配“start_pattern”的行到匹配“end_pattern”的行进行替换操作。

### 3. 常用编辑命令

- **s/旧字符串/新字符串/g**
  - 功能：全局替换，将文件中所有的旧字符串换成新字符串。
  - 示例：`sed's/color/colour/g' article.txt`，将`article.txt`中的所有“color”替换为“colour”。
- **d**
  - 功能：删除指定行。
  - 示例：`sed '/^#/d' config.ini`，删除`config.ini`中以“#”开头的注释行。
- **a\新文本**
  - 功能：在指定行后添加新文本。
  - 示例：`sed '2a\Copyright © 2024' readme.md`，在`readme.md`的第2行后插入版权声明。
- **i\新文本**
  - 功能：在指定行前插入新文本。
  - 示例：`sed '3i\This is a new line' text.txt`，在`text.txt`的第3行前插入新行。
- **c\新文本**
  - 功能：用新文本替换指定行。
  - 示例：`sed '4c\Replaced line' file.txt`，用“Replaced line”替换`file.txt`的第4行。

### 三、awk——多功能的数据处理工具

awk在数据分析和报告生成方面特别有用。它能够对文本文件中的数据进行排序、统计和汇总，是处理结构化数据（如CSV文件）的理想工具。当你需要从文本文件中提取特定列进行计算或分析时，awk能提供强大的功能来实现。

### （一）awk的工作原理

awk把文件看作是由记录（通常是行）和字段（由分隔符分隔的单词）组成的数据集。它逐行读取文件，根据用户指定的条件和操作来处理每一行的数据。默认分隔符是空格或制表符，但可以通过`-F`选项指定其他分隔符。

### （二）常见选项及其用法

### 1. 基本操作选项

- **-F '分隔符'**
  - 功能：指定输入字段的分隔符。
  - 示例：`awk -F ',' '{print $1, $2}' data.csv`，以逗号为分隔符处理`data.csv`，输出每行的第1和第2个字段。
- **-v var=value**
  - 功能：定义变量并赋值，可在awk脚本中使用。
  - 示例：`awk -v num=10 '{print num, $0}' test.txt`，定义变量`num`为10，并在处理`test.txt`时输出`num`和每行内容。

### 2. 模式与动作选项

- **模式{动作}**
  - 功能：根据模式筛选行，并对筛选出的行执行动作。
  - 示例：`awk '/pattern/{print $0}' file.txt`，输出`file.txt`中匹配“pattern”的行。
- **BEGIN{动作}**
  - 功能：在处理文件之前执行动作，常用于初始化变量等。
  - 示例：`awk 'BEGIN{sum = 0}{sum += $1}END{print sum}' numbers.txt`，在处理`numbers.txt`之前初始化`sum`为0，然后累加每行的第1个字段，最后输出总和。
- **END{动作}**
  - 功能：在处理完所有文件行后执行动作，常用于输出汇总结果等。
  - 示例：`awk '{count++}END{print count}' lines.txt`，统计`lines.txt`的行数并输出。

### 3. 常用内置变量和操作

- **$0**
  - 功能：代表整行文本。
  - 示例：`awk '{print $0}' file.txt`，输出`file.txt`的每一行。
- **$1、$2等**
  - 功能：分别代表每行按分隔符划分后的第1、2个字段。
  - 示例：`awk -F ',' '{print $2}' data.csv`，输出`data.csv`中每行以逗号分隔后的第2个字段。
- **NF**
  - 功能：表示当前行的字段数。
  - 示例：`awk '{print NF}' file.txt`，输出`file.txt`中每行的字段数。
- **NR**
  - 功能：代表当前处理的行号。
  - 示例：`awk '{print NR, $0}' file.txt`，输出`file.txt`中每行的行号和内容。

### 4. 条件判断与循环操作

- **if - else**
  - 语法：`awk '{if(条件){操作1}else{操作2}}' 文件名`
  - 示例：`awk '{if($1 > 5){print "Large"}else{print "Small"}}' test.txt`，判断`test.txt`中每行第1个字段是否大于5，分别输出“Large”或“Small”。
- **switch**
  - 语法：`awk '{switch(表达式){case 值1:操作1; break; case 值2:操作2; break;... default:操作n}}' 文件名`
  - 示例：

  ```
  awk '{
    switch(int($1)){
      case 1:
      case 2:
      case 3:
        print "Category 1";
        break;
      case 4:
      case 5:
      case 6:
        print "Category 2";
        break;
      default:
        print "Other Category"
    }
  }' test.txt
  ```

  根据`test.txt`中每行第1个字段的值分类输出。
- **while**
  - 语法：`awk '{while(条件){操作}}' 文件名`
  - 示例：

  ```
  awk '{
    product = 1;
    i = 1;
    while(product <= 100 && i <= NF){
      product *= $i;
      i++;
    }
    print product
  }' numbers.txt
  ```

  对`numbers.txt`中的数字进行累乘操作。
- **do - while**
  - 语法：`awk '{do{操作}while(条件)}' 文件名`
  - 操作与while类似，但先执行一次操作再判断条件。
- **for**
  - 语法：`awk '{for(初始化;条件;步长){操作}}' 文件名`
  - 示例：

  ```
  awk '{
    sum = 0;
    for(i = 1; i <= NF; i++){
      if($i ~ /^[0 - 9]+$/){
        sum += $i;
      }
    }
    print sum
  }' test.txt
  ```

  计算`test.txt`中每行数字字段的总和。
- **continue和break**
  - `continue`用于跳过当前循环中的剩余语句，直接进入下一次循环。
  - 示例：

  ```
  awk '{
    sum = 0;
    for(i = 1; i <= NF; i++){
      if($i < 5){
        continue;
      }
      sum += $i;
    }
    print sum
  }' test.txt
  ```

  计算`test.txt`中每行数字总和，跳过小于5的数字。
  - `break`用于跳出当前循环。
  - 示例：

  ```
  awk '{
    sum = 0;
    for(i = 1; i <= NF; i++){
      sum += $i;
      if(sum > 50){
        break;
      }
    }
    print sum
  }' test.txt
  ```

  计算`test.txt`中每行数字总和，当总和大于50时停止计算。
- **next**
  - 功能：跳过当前行的剩余处理，直接处理下一行。
  - 示例：`awk '{if($0 ~ /skip/){next}; print $0}' test.txt`，跳过`test.txt`中包含“skip”的行。

### 5. 数组操作

- **创建和使用数组**
  - 语法：`awk '{数组名[下标]=值}' 文件名`
  - 示例：

  ```
  awk '{
    for(i = 1; i <= NF; i++){
      word = $i;
      count[word]++;
    }
  }
  END{
    for(word in count){
      print word, count[word];
    }
  }' test.txt
  ```

  统计`test.txt`中每个单词出现的次数。

### 6. 函数操作

- **常见内置函数**
  - `length()`：返回字符串的长度。
  - 示例：`awk '{print length($0)}' test.txt`，输出`test.txt`中每行的长度。
  - `substr()`：提取字符串的子串。
  - 示例：`awk '{print substr($0, 1, 5)}' test.txt`，提取`test.txt`中每行的前5个字符。
- **自定义函数**
  - 语法：`awk 'function 函数名(参数){函数体} {操作}' 文件名`
  - 示例：

  ```
  awk 'function add(num1, num2){return num1 + num2} {print add($1, $2)}' test.txt
  ```

  定义函数计算两个数字的和并在处理`test.txt`时使用。

### 综合使用Linux文本三剑客在实际工作中的应用例子：

### （一）、grep

### 1. 查找特定扩展名文件中的关键词

- **场景**：在一个包含众多.java文件的项目目录中，查找所有包含特定方法调用的文件。
- **示例**：

  ```
  grep -r "methodName()" /path/to/java/project/*.java
  ```
- **解释**：`-r`选项表示递归搜索，它会在`/path/to/java/project/`目录下的所有`.java`文件（`*.java`）中查找包含“methodName()”的行。

### 2. 查找文件中不包含特定字符串的行

- **场景**：在一个配置文件中，查看哪些行没有被注释掉（假设注释以“#”开头）。
- **示例**：

  ```
  grep -v "^#" /path/to/config/file
  ```
- **解释**：`-v`选项是反向匹配，`^#`表示以“#”开头的行，所以这个命令会输出配置文件中不以“#”开头的行。

### （二）、sed

### 1. 在文件特定位置插入内容

- **场景**：在HTML文件的`<head>`标签内插入一个CSS样式表链接。
- **示例**：

  ```
  sed -i '/<head>/i <link rel="stylesheet" href="styles.css">' /path/to/html/file
  ```
- **解释**：`-i`选项表示直接在原文件修改，`/<head>/`是匹配`<head>`标签的行，`i`后面跟着要插入的内容，即插入一个CSS样式表链接。

### 2. 转换文件中的文本格式

- **场景**：将一个文本文件中的所有Windows风格的换行符（`\r\n`）转换为Unix风格的换行符（`\n`）。
- **示例**：

  ```
  sed -i 's/\r$//' /path/to/text/file
  ```
- **解释**：`$`表示行尾，`\r`是Windows风格换行符中的回车符，这个命令会将行尾的回车符删除，从而实现换行符格式的转换。

### （三）、awk

### 1. 计算文件中某列数据的平均值

- **场景**：在一个包含学生成绩的CSV文件（逗号分隔，第一列是学生姓名，第二列是成绩）中，计算平均成绩。
- **示例**：

  ```
  awk -F ',' '{sum+=$2; count++} END {print sum/count}' /path/to/grades.csv
  ```
- **解释**：`-F ','`指定逗号为分隔符，在处理每一行时，将第二列（成绩，`$2`）累加到`sum`变量中，并使`count`变量加1，最后在`END`块中计算并输出平均值（`sum/count`）。

### 2. 根据条件筛选并处理数据

- **场景**：在一个服务器访问日志文件中，筛选出特定IP地址的访问记录，并统计其访问次数。
- **示例**：

  ```
  awk '$1 == "192.168.1.100" {count++} END {print count}' /path/to/access.log
  ```
- **解释**：`$1`表示每行的第一个字段（假设是IP地址），当IP地址等于“192.168.1.100”时，`count`变量加1，最后输出该IP地址的访问次数。

### （四）、综合应用

### 1. 分析网站访问日志，找出最常访问的页面并统计访问次数

- **示例**：

  ```
  grep "GET /" /path/to/access.log | awk -F'"' '{page=$2; count[page]++} END {for (p in count) print p, count[p]}' | sort -k2 -nr | head
  ```
- **解释**：
  - 首先，`grep "GET /"`从访问日志中筛选出所有对网页的GET请求（通常表示页面访问）。
  - 然后，`awk -F'"'`以双引号为分隔符处理每一行，将请求的页面路径（`$2`）作为键，访问次数作为值存储在`count`数组中。
  - 接着，`sort -k2 -nr`按照访问次数（第二列）进行数值降序排序。
  - 最后，`head`输出前几行，即最常访问的页面及其访问次数。

### 2. 处理配置文件，将特定配置项的值修改后备份原文件

- **示例**：

  ```
  cp /path/to/config/file /path/to/config/file.bak
  sed -i 's/key=value/key=new_value/g' /path/to/config/file
  ```
- **解释**：
  - 首先，`cp`命令将原配置文件备份为`/path/to/config/file.bak`。
  - 然后，`sed -i`在原配置文件中把“key = value”替换为“key = new_value”，实现配置项值的修改。

Linux文本三剑客各有千秋，grep专注于快速准确地搜索文本，sed擅长对文本进行灵活多样的编辑操作，awk则在数据处理和分析方面表现出色。在实际工作中，根据具体的任务需求，选择和使用这些工具。
