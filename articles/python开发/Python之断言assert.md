# assert基本语法

Python中的assert语句是debug的好工具，主要用于测试一些条件是否满足。如果测试条件满足，则什么都不做，相当于pass语句。如果测试条件不满足，便会抛出异常AssertionError，并返回具体的错误信息。

  

它的语法如下：

```plain
assert_stmt ::=  "assert" expression ["," expression]
```

  

先来看一下简单的测试：

```plain
>>> assert 1 == 2
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AssertionError
>>> assert 1 == 1
```

从上面可以看到，如果测试条件不满足，则抛出异常，如果满足，则什么都不做。

  

再来看一个指定错误名的测试：

```plain
>>> assert 1 == 2, "assert is wrong"
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AssertionError: assert is wrong
```

从上面可以看到，条件不满足，依然会抛出一样，并且将我们自定义的 异常内容也一并显示出来了。这样就很方便我们调试自己的代码。

  

注意：不要在使用assert的时候加括号，如下：

```plain
>>> assert(1 == 2, "assert is wrong")
<stdin>:1: SyntaxWarning: assertion is always true, perhaps remove parentheses?
>>>
```

如果按照上面这样写，无论表达式是对还是错，assert永远不会检查fail，程序只给你提示SyntaxWarning。正确的写法应该是不带括号的。

  

总的来说，assert在程序中的作用，是对代码进行safe-check，使用assert，就表示你很确定这个条件一定会发生或者一定不会发生。举个例子，如果你有一个函数，其中一个参数是人的性别，正常情况下，性别只有男女之分，这时候就可以使用assert来防止非法输入，如果你的程序没有bug，那么assert就永远不会执行，如果一旦抛出异常，你也能很方便的知道程序出现了问题，并且很清楚问题出现在什么地方。

  

# assert基本用法

通过应用场景来简述assert的基本用法。

  

第一个场景：假设现在有一个促销活动，要对一些商品进行打折，这时候就可以写一个函数，要求输入原来的价格和折扣，输出打折后的价格。

```plain
def apply_discount(price, discount):
    updated_price = price * (1 - discount)
    assert 0 <= updated_price <= price, 'price should be greater or equal to 0 and less or equal to original price'
    return updated_price
```

可以看到在计算价格的后面加入了一个assert语句，折后价格应该大于0并且小于现有价格，如果不在这个区间内就抛出异常。

测试如下：

```plain
apply_discount(100, 0.2)
80.0

apply_discount(100, 2)
AssertionError: price should be greater or equal to 0 and less or equal to original price

```

可以看到，在正常价格内就不会抛出异常，否则就会抛出异常。这样对于开发人员来说就会很容易的发现问题，并且知道问题的位置。

  

第二个场景：最常见的除法操作，假设后台想知道每个商品的平均价格和售卖数量还有销售总额，这样可以写成如下函数：

```plain
def calculate_average_price(total_sales, num_sales):
    assert num_sales > 0, 'number of sales should be greater than 0'
    return total_sales / num_sales
```

同样，我们插入了assert，表明销售数目必须大于0。

  

除了上面这两个场景，assert还有一些很常见的用法，如下：

```plain
def func(input):
    assert isinstance(input, list), 'input must be type of list'
    # 下面的操作都是基于前提：input 必须是 list
    if len(input) == 1:
        ...
    elif len(input) == 2:
        ...
    else:
        ... 
```

这个func函数的所有操作，都必须基于input是list的前提。

  

# assert错误示例

上面说了assert的几种常见的使用场景，可能给人一个错觉，我们在很多地方都可以使用assert，那么我们是不是可以将很多if语句都换成assert呢？我们还是从一个例子来看。

  

例子：后台要删除一些上线时间较长的商品，于是，开发人员就设计了下面一段代码：

```plain
def delete_course(user, course_id):
    assert user_is_admin(user), 'user must be admin'
    assert course_exist(course_id), 'course id must exist'
    delete(course_id)
```

按规定，要删除商品，必须是admin用户才有权限删除，所以就设计了上面这种代码。按理说上面这种设计也没毛病，但是assert语法是可以被关闭的，当我们在运行python程序的时候加-o参数，就会忽略掉assert语句，因此，一旦assert失效，上面那两个assert语句就不会被执行，这就会导致我们预期的效果达不到。

正确的代码示例如下：

```plain
def delete_course(user, course_id):
    if not user_is_admin(user):
        raise Exception('user must be admin')
    if not course_exist(course_id):
        raise Exception('coursde id must exist')
    delete(course_id)  

```

  

再看一个例子，如果想打开一个文件，进行读取，处理等一系列操作，那么下面的写法显然是有问题的。

```plain
def read_and_process(path):
    assert file_exist(path), 'file must exist'
    with open(path) as f:
      ...
```

因为assert的使用，表示你强行需要文件必须存在，但事实上很多情况下这种假设并不成立，所以就会抛出异常，正确的做法如下：

```plain
def read_and_process(path):
    try:
        with open(path) as f:
            ...
    except Exception as e:
            ...  

```

  

总的来说，assert并不设置run-time error的检查。

  

# 总结

assert通常是用来对代码进行safe-check，表明你确定这种情况一定发生或者一定不发生，需要主义的是使用assert一定不要加括号，否则无论表达式对错，assert都不会检查failed，另外，程序中的assert语句可以通过-o等选择被全局disabled。

  

合理使用assert，可以提升代码的健壮性，同时也方便排查问题。

  

但是，assert不可以进行滥用，很多情况下，程序中出现的不同情况都是意料之中的，需要我们用不同的方案去处理，这时候用条件语句进行判断更合适，对于程序中的一些run-time error，用异常处理。