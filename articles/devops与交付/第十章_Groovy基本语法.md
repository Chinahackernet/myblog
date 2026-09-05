# Groovy 简介

Groovy 是一种基于 JVM 的动态语言，他的语法和 Java 相似，最终也是要编译 .class 在JVM上运行。

Groovy 完全兼容 Java 并且在此基础上添加了很多动态类型和灵活的特性，比如支持闭包，支持DSL，是一门非常灵活的动态脚本语言。

**这篇文章是为了能看懂在 Gradle脚本中的代码，知道怎么写。所以不会深入Groovy。**

每个 build 脚本配置文件都是一个 Groovy脚本文件。在里面可以写任何符合 Groovy 语法的代码。 例如定义类，方法，变量等。又因为Groovy 是完全兼容Java的，故也可以写任何Java代码，是完全兼容的。

# DSL

DSL（Domain Specific Language) 中文意思是 领域特定语言，专门关注某一领域，在于专而不是全。所以才是领域特定的。

Gradle 的脚本就是基于 Groovy 的DSL，专门解决自动化构建的DSL。 我们只需要按照相应的语法，配置相应的 Gradle 脚本就可以达到自动化构建的目的，这也是 DSL 的初衷。

# 注释

### 单行注释

```groovy
//这里是注释
def name = "佛系编码"
```

### 多行注释

```groovy
/* 这里是多行注释
   啦啦啦啦 */
```

### doc 注释

```groovy
/**
 * 这里是 doc 注释
 * 啦啦啦啦
 */
```

# 数据类型

Java中的基本数据类型，对象它都支持；另外还有 闭包 加强的 List，Map的集合 加强的File，Stream等IO类型

类型可以显式声明，也可以用 def 来声明，用 def 声明的类型Groovy将会进行类型推断。

基本数据类型都是和Java 中的一致，就不拿出来说了。下面说一下，对象，字符串，闭包等;

另外：Groovy 中的分号是可以省略的；

# 字符串

使用单引号和双引号都可以定义一个字符串常量。

差别是 单引号只是单纯的字符串，不能使用表达式，运算，求值，正则等。

```groovy
task character(){
  doLast{
      def name = '张三'
      def address ="北京市"
      def age = 19
      println "单引号双引号都是字符串 name is ${name}; age is $age ; address is ${address}"
      println '单引号里无法运算表达式例如 name is ${name}'
  }
}
```

执行 character

```plain
gradle character
复制代码
```

得到结果如下

```groovy
单引号双引号都是字符串 name is 张三; age is 19 ; address is 北京市
单引号里无法运算表达式例如 name is ${name}
```

双引号的字符串可以直接进行表达式计算，规则是一个美元符号紧跟一个花括号: ![](assets/devops与交付/第十章_Groovy基本语法/第十章_Groovy基本语法-1.svg)age

# 集合

集合默认是 java.util.ArrayList 类型的

```groovy
def nums = [1,2,4,5,6]
println "nums is ${nums.getClass().getName()} size = ${nums.size()}"
```

输出结果为

```groovy
nums is java.util.ArrayList size = 5
```

也可以显式指定集合类型 使用 as 关键字；

```groovy
def nums1 = [0,"23",4,5,62,false] as LinkedList
println "nums1 is ${nums1.getClass().getName()};size = ${nums1.size()}"
```

输出为

```groovy
nums1 is java.util.LinkedList;size = 6
```

或者在前面显式指定类型

```groovy
LinkedList otherLinked = [3, 4, 5]
```

## 访问元素

元素的访问是通过下标访问的

```groovy
println "第三个元素是 ${nums1[2]},倒数第一个是 ${nums1[-1]};第一个和倒数第一个：${nums1[0,-1]}"
println "第二个到第四个：${nums1[1..3]}"
```

输出为：

```groovy
第三个元素是 4,倒数第一个是 false;第一个和倒数第一个：[0, false]
第二个到第四个：[23, 4, 5]
```

## 遍历元素

使用 each 方法遍历集合 参数默认是 it

```groovy
//遍历
nums1.each {
  print "$it, "
}
```

输出为：

```groovy
0, 23, 4, 5, 62, false,
```

带有下标的遍历：使用 eachWithIndex 方法

```groovy
numList.eachWithIndex { int value ,int index->
    println "list[$index] = $value"
    }
```

## 数组

数组的定义要明确的指定数组类型

```groovy
String [] strings = ["I","'","m","is","a","dog","."]
   println "\n 数组 :${strings.getClass().getName()}"
   strings.each{
       print "$it "
   }
   def multi = [5,7,5,8,54,87] as int[]
   println "\n使用 as 显式指定类型: ${multi.getClass().getName()}"
   multi.each{
       print "$it "
   }
```

输出是

```groovy
数组 :[Ljava.lang.String;
I ' m is a dog .
使用 as 显式指定类型: [I
5 7 5 8 54 87
```

## 添加元素

使用 List.add() 添加元素

```groovy
numList.add(-11)
```

使用 可以使用 << 操作符添加一个

```groovy
numList << 13
```

## 修改元素

```groovy
numList[0] = 0
```

不用担心下标越界；Groovy就自动增加到所需的下标,中间的会设置为 null

```groovy
def numList = [0,1,2,3,4,5] as LinkedList
        numList.each{
            print "$it "
        }
        println "\n 在 10位置添加一个 11"
        numList[10] =11
        println "添加后的："
        numList.each{
            print "$it "
        }
```

输出为：

```groovy
> Task :collect1
0 1 2 3 4 5 
 在 10位置添加一个 11
添加后的：
0 1 2 3 4 5 null null null null 11 
BUILD SUCCESSFUL in 0s
```

## 删除元素

使用 List.remove() 移除元素 参数可以是 下标，可以是值

```groovy
numList.remove 0
numList.remove((Object)10)
```

使用 List.removeLast() 移除最后一个元素

```groovy
numList.removeLast()
```

## 查找元素

使用 List.find() 查找第一个符合条件的元素

```groovy
print "\n list.find() 查找第一个符合条件的元素 numList.find { it%2==0}"
print numList.find { it%2==0}
```

使用 List.findAll() 查找所有符合条件的元素

```groovy
print "\n list.findAll() 查找所有符合条件的元素 numList.findAll {it % 2 ==0 }"
print numList.findAll { it % 2 ==0}
```

使用 List.any() 查找元素，只要有一个元素符合就返回 true

```plain
print "\n list.any() 只要有一个元素符合条件就返回 true numList.any { it % 2 ==1} "
print numList.any { it % 2 ==1}
```

使用 List.every() 查找元素，必须所有元素都符合条件才会返回 true

```plain
print "\n list.every() 必须所有元素都符合条件才会返回 true numList.every {it % 2 == 0} "
print numList.every { it % 2 == 0}
```

## 统计元素

统计符合条件的元素个数：使用 List.count()

```plain
print numList.count { it % 2 ==0 }
```

统计最大值：List.max()，最小值：List.min()

```plain
print "\n 最大值是 ${numList.max()} ,最小值是 ${numList.min()}， 最小的绝对值是 "
print numList.min { Math.abs it}
```

# Map

Map 的定义是键值对的方式，使用逗号隔开

```plain
def colors = [red:'#FF0000',green:'#00FF00',blue:'#0000FF']
```

访问 Map 中的元素有三种方式：

-   map.key
-   map[key]
-   map.get(key)

例如：

```plain
task map{
    doLast{
        def colors = [red:'#FF0000',green:'#00FF00',blue:'#0000FF']
        println " map calss is ${colors.getClass().getName()}"
        println "通过 map.key 的方式访问 colors.red = ${colors.red}"
        println "通过 map[key] 的方式访问 colors['red'] = ${colors['red']}"
        println "通过 map.get(key) 的方式访问 colors.get(red) = ${colors.get('red')}"
    }
}
```

输出为 ：

```plain
> Task :map
 map calss is java.util.LinkedHashMap
通过 map.key 的方式访问 colors.red = #FF0000
通过 map[key] 的方式访问 colors['red'] = #FF0000
通过 map.get(key) 的方式访问 colors.get(red) = #FF0000
BUILD SUCCESSFUL in 0s
1 actionable task: 1 executed
```

## 添加元素

```plain
//添加元素
colors['pink'] = '#FF00FF'
colors.yellow = '#FFFF00'
```

## 修改元素

```plain
//修改元素
colors.red = 'red'
colors['blue'] = 'blue'
println "修改后的元素是 colors.red = ${colors.red},colors.blue = ${colors.blue}"
```

## 删除元素

```plain
//删除元素
colors.remove('red')
```

## 遍历元素

和上面的一样 使用 each 方法

```plain
//遍历 
colors.each{
    println "${it.key} :${it.value}"
}
```

## 查找元素

查找的方法 和 上面的都一样，只是 参数换成了 Map.Entry 或者 key,value ; 这里只用 find 做一个示例：

find 方法

```plain
def green = colors.find { key ,value ->
  if(key.equals('green')) {
      return colors[key]
  }
  return null
}
println "查找结果是 ${green}"
def blue = colors.find { Map.Entry entry ->
    if(entry.key.equals('blue')){
        return entry.value
    }
    return null
}
println "查找的结果是 ${blue}"
```

# 方法

方法也是使用 def 定义的

```plain
/*
 * 返回大的那个
 */
def max(int a ,int b){
    if(a>b){
      return   a
    }else{
      return   b
    }
}
```

### return 是可以省略的

Groovy 会把执行过程中的最后一句代码作为返回值

```plain
/*
 * 返回大的那个
 */
def max(int a ,int b){
    if(a>b){
         a
    }else{
       b
    }
}
```

### 括号是可以省略的；

在调用方法时括号是可以省略的；使用 空格间隔开参数即可

```plain
def printMaximum(int a,int b){
    if(a>b){
        println "The maximum value of $a and $b is $a"
    }else{
        println "The maximum value of $a and $b is $b"
    }
}
task method {
    doLast{
        println "max is ${max(0,1)}"
        printMaximum 10,20
    }
}
```

输出是

```plain
> Task :method
max is 1
The maximum value of 10 and 20 is 20
BUILD SUCCESSFUL in 0s
1 actionable task: 1 executed
```

### 代码块是可以作为参数传递的

代码块就是一段被花括号包围的代码，其实就是闭包；

例如 each 方法

最原始的应该是这样的

```plain
colors.each({println it})
```

格式化后

```plain
colors.each({
    println it
})
```

Groovy 规定最后一个参数是闭包,可以将闭包放在方法外面

```plain
colors.each(){
    println it
}
```

调用时方法的括号是可以省略的 就成了这样

```plain
colors.each {
    println it
}
```

# 闭包

闭包是 Groovy 的一个重要特性，可以说是 DSL 的基础。

闭包其实就是一段匿名代码块。

闭包在 Groovy 中是 groovy.lang.Closure 类的实例，这使得闭包可以赋值给变量或字段。

定义一个闭包

```plain
def hello = { println "Hello 佛系编码" }
```

调用这个闭包

```plain
hello.call()
```

另一种调用方式 直接在后面跟上 ()

```plain
hello()
```

下面模拟一个 each 的执行，定一个方法迭代集合中的元素

```plain
/*
  * closure 就是 闭包参数
  */
def customEach(closure){
    //迭代元素
    for(int i in 1..10){
    //在闭包后跟上 () 就是调用了 括号里的参数就是闭包要接收的参数
        closure(i)
    }
}
```

调用这个方法，传入一个闭包打印元素; 如果闭包只有一个参数，那么默认就是 it

```plain
// 如果只有一个参数 默认就是 it
customEach {
     println it
}
```

如果闭包要接收多个参数，那就必须把参数显式的列出来，使用 -> 将参数和主体分开

再次模拟一个 map 的 迭代:

```plain
def eachMap(closure){
    def map1 = [name:'佛系编码',age:666]
    map1.each {
        closure(it.key,it.value)
    }
}
·····
//如果有多个参数，就必须要把参数列出来，使用 -> 将 参数和主体分开
eachMap { key,value ->
    println "$key:$value"
}
```

## 闭包委托

Groovy 闭包的强大之处在于它支持闭包方法的委托。

Groovy 的闭包有三个重要属性

-   thisObject 闭包定义所在的类
-   owner 表示闭包定义所在的对象或闭包（闭包内还是可以定义闭包的），这个是最近原则，下面会做说明
-   delegate 默认和 owner 一致，可以手动修改。

如果将闭包定义在一个类中，默认三个属性都是相等的；

举个例子： 在 Person 类中 定义了 一个 act 闭包

```plain
class Person{
    private String name
    public int getAge(){
       12
    }
    Closure act ={
         println "thisObject:${thisObject.getClass()}"
        println "owner:${owner.getClass()}"
        println "delegate:${delegate.getClass()}"
    }
}
```

调用这个闭包，将会有下面的输出

```plain
> Task :test
thisObject:class Person
owner:class Person
delegate:class Person
BUILD SUCCESSFUL in 0s
1 actionable task: 1 executed
```

如果将 闭包定义在一个 闭包里，那么 thisOjbect 就和 其他两个不一样，因为 thisObject 是表示的定义闭包所在的类，而 owner 表示 类或闭包

这次在 一个闭包里再定一个闭包看一下

```plain
class Person{
    private String name
    public int getAge(){
       12
    }
    Closure act ={
        println "thisObject:$thisObject"
        println "owner:$owner"
        println "delegate:$delegate"
    }
    Closure eat = {
        def test = {
            println "thisObject:${thisObject.getClass()}"
            println "owner:${owner.getClass()}"
            println "delegate:${delegate.getClass()}"
        }
        test()
    }
}
```

执行这个 eat 闭包，将会得到以下结果

```plain
> Task :test
thisObject:class Person
owner:class Person$_closure2
delegate:class Person$_closure2
BUILD SUCCESSFUL in 0s
1 actionable task: 1 executed
```

可以看到 thisObject 和 owner 已经不一样了，因为 thisObject 表示的是 所在的类，而 owner 表示的定义所在的类或闭包（最近原则）

三个属性已经很明白了吧，

## 委托策略

无论什么时候在闭包中访问某属性或调用某方法时，若没有明确的设置对象，那么就会调用一个委托策略。通过这个委托策略来决定如果访问属性或调用方法。

有以下几个策略，可以通过 闭包的属性更改：resolveStrategy

-   [Closure.OWNER\_FIRST](https://docs.groovy-lang.org/latest/html/gapi/groovy/lang/Closure.html#OWNER_FIRST) 默认策略，首先在 owner 上寻找属性和方法，找不到则在 delegate 上找。
-   [Closure.DELEGATE\_FIRST](https://docs.groovy-lang.org/latest/html/gapi/groovy/lang/Closure.html#DELEGATE_FIRST) 和上面的相反，首先在 delegate 上寻找，找不到则在 owner 上找
-   [Closure.OWNER\_ONLY](https://docs.groovy-lang.org/latest/html/gapi/groovy/lang/Closure.html#OWNER_ONLY) 只在 owner 上找，忽略 delegate
-   [Closure.DELEGATE\_ONLY](https://docs.groovy-lang.org/latest/html/gapi/groovy/lang/Closure.html#DELEGATE_ONLY) 只在 delegate 上找 忽略 owner
-   [Closure.TO\_SELF](https://docs.groovy-lang.org/latest/html/gapi/groovy/lang/Closure.html#TO_SELF) 高级选项，开发者自己定义策略

下面通过一个嵌套类演示一下 策略更改的实际应用。

定义两个类 Person 和 内部类 Foot ，并且两者都有 name 属性。Person 多一个 age 属性。

```plain
class Person{
    private String name
    public int getAge(){
       12
    }
    class Foot {
      String name
      Closure walk = { it ->
          println "name is $name,age is $age ,delegate is ${delegate.getClass()}"
          //设置 delegate 属性
          delegate = it;
          resolveStrategy = Closure.DELEGATE_FIRST
          println "修改策略为 Closure.DELEGATE_FIRST delegate 优先"
          println "name is $name, age is $age ,delegate is ${delegate.getClass()}"
      }
    }
    void walk(){
        Foot foot = new Foot(name:'脚');
        foot.walk(this)
    }
}
```

调用 Person 的 walk 方法

```plain
Person person = new Person()
person.name ="佛系编码"
person.walk()
```

将会得到下面的输出

```plain
> Task :test
name is 脚,age is 12 ,delegate is class Person$Foot
修改策略为 Closure.DELEGATE_FIRST delegate 优先
name is 佛系编码, age is 12 ,delegate is class Person
BUILD SUCCESSFUL in 0s
1 actionable task: 1 executed
```

我来解释一下这个输出

第一个name 是 脚 ；这是因为默认策略是 Closure.OWNER\_FIRST 是在 owner 寻找属性的；owner 当然是 Foot了。

第二个 name 是 佛系编码;这是因为 策略改为了 Clousre.DELEGATE\_FIRST 是优先在 delegate 上寻找的，而又把 delegate 属性修改为了传进去的 Person 实例，他的值在上面已经明确声明为了 佛系编码 。

而 age 只有在 Person 中声明了 getAge() 方法，明确返回了 12.所以即使更改了策略，换了delegate 的值，仍然是 12.

> 注：三个属性中 只有 delegate 属性可以修改。

在 Gradle 中常见的闭包使用

定义一个 User 类

```plain
class User{
    String name
    int age
    
    def dumpUser(){
        println "name is $name,age is $age ."
    }
}
```

在构建配置脚本中定义一个方法，传入一个闭包参数用来配置 User 类

将闭包委托策略更改，并设置 delegate 属性

```plain
def user(Closure<User> closure){
    User user = new User()
    closure.delegate = user
    closure.resolveStrategy = Closure.DELEGATE_FIRST
    closure()
}
```

在使用的时候就是这样的了，Gradle 中就有很多这种的 DSL 配置，例如我们创建的 task

```plain
task configClosure(){
    doLast{
      user {
        name = '佛系编码'
        age = 0
        dumpUser()
      }
    }
}
```

输出为

```plain
> Task :configClosure
name is 佛系编码,age is 0 .
BUILD SUCCESSFUL in 0s
1 actionable task: 1 executed
```

[这里是闭包 API 传送门](https://docs.groovy-lang.org/latest/html/gapi/groovy/lang/Closure.html)

# 类

这里只介绍和 Java 中不同的地方.

先看段代码：

```plain
task obj{
    doLast{
        Person p = new Person()
        println "没赋值前的 ：${p.name}"
        p.name = '佛系编码'
        println "赋值后的 ：${p.name}"
        println "age is ${p.age}"
    }
}
class Person{
    private String name
    public int getAge(){
       12
    }
}
```

执行 obj 任务的输出

```plain
Task :obj
没赋值前的 ：null
赋值后的 ：佛系编码
age is 12
BUILD SUCCESSFUL in 0s
1 actionable task: 1 executed
```

在 Person 类中并没有定义 name 属性的 get/set 方法；却可以设置和修改它的值；

这是因为 Groovy 帮我们搞定了 get/set 方法。

age 属性也没有在 Person 类中定义，只是定义了一个 getAge() 方法却可以使用 age 属性。

但是,因为没有定义 set 方法，所以 age 属性只能访问。

# 运算符

这里只列出来和 Java 不同且常用的运算符

### 可空运算符

对象非空时使用对象本身，对象为空时使用给定值；常用于给定某个可空变量的默认值。

```plain
task operator {
    doLast{
        Person person = new Person();
        //person.name 为 null 所以会使用 佛系编码
        def name = person.name ? person.name:'佛系编码'
        // getAge 返回 12 不为空 所以使用本身
        def age = person.age ?:10
        println "name is $name , age is $age"
    }
}
```

输出

```plain
> Task :operator
name is 佛系编码 , age is 12
BUILD SUCCESSFUL in 0s
1 actionable task: 1 executed
```

### 安全导航运算符

当调用一个对象上的属性或方法时，如果对象是空的，就会抛出空异常，这个使用 ?. 运算符，当对象为空时，表达式的值也是空，就不会抛出异常。

```plain
task operator {
    doLast{
        User user
        println "user.name is ${user?.name}"
    }
}
```

输出是

```plain
> Task :operator
user.name is null
BUILD SUCCESSFUL in 0s
1 actionable task: 1 executed
```

# 断言

断言是用于验证假设条件是否为真，在Groovy的断言中，如果假设的条件不为真，那么就会抛出java.lang.AssertionError异常。

Groovy断言和Java断言完全不同。Groovy断言是一项语言功能，一直处于开启状态，和JVM的断言功能-ea完全无关。所以它是我们进行单元测试的首选方式。

例如

```plain
assert 1==2 :"1不等于2"
```

会抛出以下异常

```plain
FAILURE: Build failed with an exception.
······
* What went wrong:
Execution failed for task ':operator'.
> 1不等于2. Expression: (1 == 2)
```

当然不给出消息也是可以的

```plain
assert 1==2
```

那么异常就是这样的。

```plain
Execution failed for task ':operator'.
> assert 1==2
          |
          false
```

在使用断言时最好是给出一条消息，此消息可以帮助其他人理解和维护你的代码，理清你的意图。

# Groovy API 查询方式

对于闭包的参数，只能在 API 查询了，没有什么好的办法。

这里把 Groovy 文档地址列出来，方便大家查询相关 API

-   [语法](http://www.groovy-lang.org/syntax.html)
-   [API 文档](http://docs.groovy-lang.org/latest/html/groovy-jdk/java/lang/Object.html)

# 运行须知

要使用 gradle 或者 ./gradle 或者 gradlew 命令，必须是要安装Gradle 并设置过环境变量的，当然在Gradle所在的目录也是可以的。

build.gradle 是Gradle 的默认构建脚本文件，在执行 Gradle 命令的时候会默认找在当前目录下的 build.gradle 文件。

也可以通过 -b 参数指定加载执行的文件。

例如 要执行 groovu-basic.build 里的 operator 任务

```plain
gradle -b groovy-basic.gradle operator
```

如果要执行上面的测试代码，步骤是

1.  新建一个 build.grale 文件 或者是通过 gradle 新建一个项目 看这篇
2.  定义一个任务，添加动作

```plain
task test{
    doLast{
        //这里是代码
    }
}
```

3.  粘贴代码
4.  运行任务

```plain
gradle test
```

  

作者：佛系编码

链接：[https://juejin.im/post/5d59499ee51d4561cd246630](https://juejin.im/post/5d59499ee51d4561cd246630)

来源：掘金

著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。