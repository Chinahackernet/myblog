Go语言中的`defer`语句会将其后面跟随的语句进行延迟处理。在`defer`归属的函数即将返回时，将延迟处理的语句按`defer`定义的逆序进行执行，也就是说，先被`defer`的语句最后被执行，最后被`defer`的语句，最先被执行。

  

如下：

  

```
package main

import "fmt"

func main() {
	fmt.Println("start")
	defer fmt.Println(1)
	defer fmt.Println(2)
	defer fmt.Println(3)
	fmt.Println("end")
}
```

  

输出结果如下：

  

```
start
end
3
2
1
```

  

由于`defer`语句延迟调用的特性，所以`defer`语句能非常方便的处理资源释放问题。比如：资源清理、文件关闭、解锁及记录时间等。

  

## defer执行机

  

在Go语言的函数中`return`语句在底层并不是原子操作，它分为给返回值赋值和RET指令两步。而`defer`语句执行的时机就在返回值赋值操作后，RET指令执行前。具体如下图所示：![](https://s1.ax1x.com/2020/03/15/88Ku6g.png?x-oss-process=image%2Fwatermark%2Ctype_d3F5LW1pY3JvaGVp%2Csize_9%2Ctext_5LmU5YWL5Y-U5Y-UQGpva2VyYmFpLmNvbQ%3D%3D%2Ccolor_FFFFFF%2Cshadow_50%2Ct_80%2Cg_se%2Cx_10%2Cy_10)

  

## panic和recover

  

在函数部分介绍了几个内部函数，其中`panic`和`revocer`是Go语言中用来处理错误的。

  

比如：

  

```go
package main

import "fmt"

func f1() {
	fmt.Println("f1 func...")
}

func f2() {
	var status bool
	// 关闭数据库
	func() {
		fmt.Println("关闭数据库失败")
		status = false
	}()

	if !status {
		panic("这里出现了严重的错误")
	}
	fmt.Println("f2 func...")
}

func f3() {
	fmt.Println("f3 func...")
}
func main() {
	f1()
	f2()
	f3()
}
```

  

执行的结果如下：

  

```
f1 func
关闭数据库失败
panic: 这里出现了严重的错误

goroutine 1 [running]:
main.f2()
        E:/DEV/Go/src/code.rookieops.com/day02/defer/main.go:14 +0x40
main.main()
        E:/DEV/Go/src/code.rookieops.com/day02/defer/main.go:24 +0x85
exit status 2
```

  

上面的例子程序执行到`f2`函数的`panic`的时候就触发错误直接退出了，后面的语句和`f3`函数没有继续执行。如果要继续执行后面的语句就需要使用`recover`函数，如下：

  

```go
package main

import "fmt"

func f1() {
	fmt.Println("f1 func...")
}

func f2() {
	var status bool
	// 关闭数据库
	func() {
		fmt.Println("关闭数据库失败")
		status = false
	}()

	// 用revocer()恢复
	defer func() {
		err := recover()
		if err != nil {
			fmt.Println("恢复了，继续执行后面语句")
		}
	}()

	if !status {
		panic("这里出现了严重的错误")
	}
	fmt.Println("f2 func...")
}

func f3() {
	fmt.Println("f3 func...")
}
func main() {
	f1()
	f2()
	f3()

}
```

  

其输出的结果如下：

  

```go
f1 func...
关闭数据库失败
恢复了，继续执行后面语句
f3 func...
```

  

**注意**：

  

-   recover必须和defer搭配使用
-   defer一定 要在可能引发panic之前定义