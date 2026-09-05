template是Go语言的文本模板引擎，它提供了两个标准库。这两个标准库使用了同样的接口，但功能略有不同，具体如下：

-   text/template：基于模板输出文本内容
-   html/template：基于模板输出安全的HTML格式的内容，可以理解为其进行了转义，以避免受某些注入攻击

  

简单示例：

```go
package main

import (
	"html/template"
	"os"
	"strings"
)

const templateText = `
output 0: {{title .Name1}}
output 1: {{title .Name2}}
output 2: {{.Name3 | title}}
`

func main()  {
	funcMap := template.FuncMap{"title": strings.Title}
	tp1 := template.New("go-test")
	tp1,_=tp1.Funcs(funcMap).Parse(templateText)
	data := map[string]string{
		"Name1": "go",
		"Name2": "php",
		"Name3": "python",
	}
	_ = tp1.Execute(os.Stdout, data)
}
```

首先调用标准库text/template中的New方法，其根据我们给定的名称标识创建了一个全新的模板对象。接下来调用Parse方法，将常量templateText（预定义的待解析模板）解析为当前文本模板的主体内容。最后调用Execute 方法，进行模板渲染。简单来说，就是将传入的data动态参数渲染到对应的模板标识位上。因为我们将Execute方法的io.Writer指定到了os.Stdout中。

  

template模板定义：

-   双层大括号：也就是{{和}}标识符，在template中，所有的动作（Actions）、数据评估（Data Evaluations）、控制流转都需要用标识符双层大括号包裹，其余的模板内容均全部原样输出
-   点（DOT）：会根据点（DOT）标识符进行模板变量的渲染，其参数可以为任何值，但特殊的复杂类型需进行特殊处理。例如，当为指针时，内部会在必要时自动表示为指针所指向的值。如果执行结果生成了一个函数类型的值，如结构体的函数类型字段，那么该函数不会自动调用
-   函数调用：在前面的代码中，通过FuncMap方法注册了名title的自定义函数。在模板渲染中一共用了两类处理方法，即使用{{title.Name1}}和管道符（|）对.Name3 进行处理。在template中，会把管道符前面的运算结果作为参数传递给管道符后面的函数，最终，命令的输出结果就是这个管道的运算结果