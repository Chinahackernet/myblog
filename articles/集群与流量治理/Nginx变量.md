在 Nginx 配置中，变量只能存放一种类型的值，那就是字符串。

## 1 自定义变量

### 1.1 配置 $foo=hello

```plain
server {
    listen 8080;
    server_name  localhost;
    
    location /test {
            set $foo hello;
            echo "foo: $foo";
    }
}
```

输出

```plain
[root@localhost html]# nginx -s reload
[root@localhost html]# curl localhost/test
foo:  hello
```

### 1.2 输出 $ 符

如果我们想通过 echo 指令直接输出含有“美元符”（$）的字符串，那么有没有办法把特殊的 $ 字符给转义掉呢？答案是否定的。不过幸运的是，我们可以绕过这个限制，比如通过不支持“变量插值”的模块配置指令专门构造出取值为 $ 的 Nginx 变量，然后再在 echo 中使用这个变量。看下面这个例子：

```plain
http {
    ...
    geo $dollar {
        default "$";
    }
    server {
        ...
        
        location /test-dollar {
            echo "This is a dollar sign: $dollar";
        }
    }
}
```

输出

```plain
[root@localhost html]# nginx -s reload
[root@localhost html]# curl localhost/test-dollar
This is a dollar sign: \$
```

这里用到了标准模块 ngx\_geo 提供的配置指令 geo 来为变量 $dollar 赋予字符串 "$"，这样我们在下面需要使用美元符的地方，就直接引用我们的 $dollar 变量就可以了。

### 1.3 使用大括号插值

在“变量插值”的上下文中，还有一种特殊情况，即当引用的变量名之后紧跟着变量名的构成字符时（比如后跟字母、数字以及下划线），我们就需要使用特别的记法来消除歧义，例如：

```plain
server {
    ...
    location /test-brace {
        set $first "hello ";
        echo "${first}world";
    }
}
```

输出

```plain
[root@localhost html]# nginx -s reload
[root@localhost html]# curl localhost/test-brace
hello world
```

这里，我们在 echo 配置指令的参数值中引用变量 $first 的时候，后面紧跟着 world 这个单词，所以如果直接写作 "$firstworld" 则 Nginx “变量插值”计算引擎会将之识别为引用了变量 $firstworld. 为了解决这个难题，Nginx 的字符串记法支持使用花括号在 $ 之后把变量名围起来，比如这里的 ${first}。

### 1.4 变量作用域

set 指令（以及前面提到的 geo 指令）不仅有赋值的功能，它还有创建 Nginx 变量的副作用，即当作为赋值对象的变量尚不存在时，它会自动创建该变量。比如在上面这个例子中，如果 $a 这个变量尚未创建，则 set 指令会自动创建 $a 这个用户变量。如果我们不创建就直接使用它的值，则会报错。

例如

```plain
server {
    ...
    location /bad {
        echo $foo;
    }
}
```

此时 Nginx 服务器会拒绝加载配置:

```plain
[emerg] unknown "foo" variable
```

Nginx 变量的创建和赋值操作发生在全然不同的时间阶段，Nginx 变量的创建只能发生在 Nginx 配置加载的时候，或者说 Nginx 启动的时候，而赋值操作则只会发生在请求实际处理的时候。

这意味着不创建而直接使用变量会导致启动失败，同时也意味着我们无法在请求处理时动态地创建新的 Nginx 变量。

Nginx 变量一旦创建，其变量名的可见范围就是整个 Nginx 配置，甚至可以跨越不同虚拟主机的 server 配置块。我们来看一个例子：

```plain
server {
    listen 8080;
    
    location /foo {
        echo "foo = [$foo]";
    }
    
    location /bar {
        set $foo 32;
        echo "foo = [$foo]";
    }
}
```

输出

```plain
[root@localhost html]# curl 'http://localhost/foo'
foo = []
[root@localhost html]# curl 'http://localhost/bar'
foo = [32]
[root@localhost html]# curl 'http://localhost/foo'
foo = []
```

这里我们在 location /bar 中用 set 指令创建了变量 $foo，于是在整个配置文件中这个变量都是可见的，因此我们可以在 location /foo 中直接引用这个变量而不用担心 Nginx 会报错。

从这个例子我们可以看到，set 指令因为是在 location /bar 中使用的，所以赋值操作只会在访问 /bar 的请求中执行。而请求 /foo 接口时，我们总是得到空的 $foo值，因为用户变量未赋值就输出的话，得到的便是空字符串。

从这个例子我们可以窥见的另一个重要特性是，Nginx 变量名的可见范围虽然是整个配置，但每个请求都有所有变量的独立副本，或者说都有各变量用来存放值的容器的独立副本，彼此互不干扰。比如前面我们请求了 /bar 接口后，$foo 变量被赋予了值 32，但它丝毫不会影响后续对 /foo 接口的请求所对应的 $foo 值（它仍然是空的！），因为各个请求都有自己独立的 $foo 变量的副本。

对于 Nginx 新手来说，最常见的错误之一，就是将

Nginx 变量理解成某种在请求之间全局共享的东西，或者说“全局变量”。而事实上，Nginx 变量的生命期是不可能跨越请求边界的。

关于 Nginx 变量的另一个常见误区是认为变量容器的生命期，是与 location 配置块绑定的。其实不然。我们来看一个涉及“内部跳转”的例子：

```plain
server {
    listen 8080;
    location /foo {
        set $a hello;
        echo_exec /bar;
    }
    location /bar {
        echo "a = [$a]";
    }
}
```

输出

```plain
[root@localhost html]# curl localhost/foo
a = [hello]
```

这 里我们在 location /foo 中，使用第三方模块 ngx\_echo 提供的 echo\_exec 配置指令，发起到 location /bar 的“内部跳转”。所谓“内部跳转”，就是在处理请求的过程中，于服务器内部，从一个 location 跳转到另一个 location 的过程。这不同于利用 HTTP 状态码 301 和 302 所进行的“外部跳转”，因为后者是由 HTTP 客户端配合进行跳转的，而且在客户端，用户可以通过浏览器地址栏这样的界面，看到请求的 URL 地址发生了变化。内部跳转和 Bourne Shell（或 Bash）中的 exec 命令很像，都是“有去无回”。另一个相近的例子是 C 语言中的 goto 语句。

既然是内部跳转，当前正在处理的请求就还是原来那个，只是当前的 location 发生了变化，所以还是原来的那一套 Nginx 变量的容器副本。对应到上例，如果我们请求的是 /foo 这个接口，那么整个工作流程是这样的：先在 location /foo 中通过 set 指令将 $a 变量的值赋为字符串 hello，然后通过 echo\_exec 指令发起内部跳转，又进入到 location /bar 中，再输出 $a 变量的值。因为 $a 还是原来的 $a，所以我们可以期望得到 hello 这行输出。测试证实了这一点：

但如果我们从客户端直接访问 /bar 接口，就会得到空的 $a 变量的值，因为它依赖于 location /foo 来对 $a 进行初始化。

从上面这个例子我们看到，一个请求在其处理过程中，即使经历多个不同的 location 配置块，它使用的还是同一套 Nginx 变量的副本。这里，我们也首次涉及到了“内部跳转”这个概念。值得一提的是，标准 ngx\_rewrite 模块的 rewrite 配置指令其实也可以发起“内部跳转”，例如上面那个例子用 rewrite 配置指令可以改写成下面这样的形式：

```plain
server {
    listen 8080;
    location /foo {
        set $a hello;
        rewrite ^ /bar;
    }
    location /bar {
        echo "a = [$a]";
    }
}
```

从上面这个例子我们看到，Nginx 变量值容器的生命期是与当前正在处理的请求绑定的，而与 location 无关。

## 2 内建变量

Nginx 内建变量最常见的用途就是获取关于请求或响应的各种信息。

### 2.1 $uri vs $request\_uri

由 ngx\_http\_core 模块提供的内建变量 $uri，可以用来获取当前请求的 URI（经过解码，并且不含请求参数），

而 $request\_uri 则用来获取请求最原始的 URI （未经解码，并且包含请求参数）。

```plain
location /test-uri {
    echo "uri = $uri";
    echo "request_uri = $request_uri";
}
```

输出

```plain
[root@localhost html]# nginx -s reload
[root@localhost html]# curl localhost/test-uri
uri = /test-uri
request_uri = /test-uri
[root@localhost html]# curl "localhost/test-uri?a=3&b=4"
uri = /test-uri
request_uri = /test-uri?a=3&b=4
[root@localhost html]# curl "localhost/test-uri/hello%20world?a=3&b=4"
uri = /test-uri/hello world
request_uri = /test-uri/hello%20world?a=3&b=4
```

### 2.2 $arg\_XXX

另一个特别常用的内建变量其实并不是单独一个变量，而是有无限多变种的一群变量，即名字以 arg\_ 开头的所有变量，我们估且称之为 $arg\_XXX 变量群。

一个例子是 $arg\_name，这个变量的值是当前请求中名为 name 的参数的值，而且还是未解码的原始形式的值。

```plain
location /test-arg {
    echo "name: $arg_name";
    echo "class: $arg_class";
}
```

输出

```plain
[root@localhost html]# nginx -s reload
[root@localhost html]# curl localhost/test-arg
name: 
class:
[root@localhost html]# curl "localhost/test-arg?name=Tom&class=3"
name: Tom
class: 3
[root@localhost html]# curl "localhost/test-arg?name=hello%20world&class=9"
name: hello%20world
class: 9
```

### 2.3 $arg\_XXX 不区分大小写

其实 $arg\_name 不仅可以匹配 name 参数，也可以匹配 NAME 参数，抑或是 Name，Nginx 会在匹配参数名之前，自动把原始请求中的参数名调整为全部小写的形式。

```plain
[root@localhost html]# curl "localhost/test-arg?NAME=Marry"
name: Marry
class:
[root@localhost html]# curl "localhost/test-arg?Name=Jimmy"
name: Jimmy
class:
```

### 2.4 对 uri 解码

如果你想对 URI 参数值中的 %XX 这样的编码序列进行解码，可以使用第三方 ngx\_set\_misc 模块提供的

```plain
location /test-unescape-uri {
    set_unescape_uri $name $arg_name;
    set_unescape_uri $class $arg_class;
    echo "name: $name";
    echo "class: $class";
}
```

现在我们再看一下效果：

```plain
[root@localhost html]# curl "localhost/test-arg?name=hello%20world&class=9"
name: hello world
class: 9
```

从这个例子我们同时可以看到，这个 set\_unescape\_uri 指令也像 set 指令那样，拥有自动创建 Nginx 变量的功能。后面我们还会专门介绍到 ngx\_set\_misc 模块。

像 $arg\_XXX 这种类型的变量拥有无穷无尽种可能的名字，所以它们并不对应任何存放值的容器。而且这种变量在 Nginx 核心中是经过特别处理的，第三方 Nginx 模块是不能提供这样充满魔法的内建变量的。

类 似 $arg\_XXX 的内建变量还有不少，比如用来取 cookie 值的 $cookie\_XXX 变量群，用来取请求头的 $http\_XXX 变量群，以及用来取响应头的 $sent\_http\_XXX 变量群。这里就不一一介绍了，感兴趣的读者可以参考 ngx\_http\_core 模块的官方文档。

### 2.4 全局变量

arg\_PARAMETER #这个变量包含GET请求中，如果有变量PARAMETER时的值。

args #这个变量等于请求行中(GET请求)的参数，如：foo=123&bar=blahblah;

binary\_remote\_addr #二进制的客户地址。

body\_bytes\_sent #响应时送出的body字节数数量。即使连接中断，这个数据也是精确的。

content\_length #请求头中的Content-length字段。

content\_type #请求头中的Content-Type字段。

cookie\_COOKIE #cookie COOKIE变量的值

document\_root #当前请求在root指令中指定的值。

document\_uri #与uri相同。

host #请求主机头字段，否则为服务器名称。

hostname #Set to themachine’s hostname as returned by gethostname

http\_HEADER

is\_args #如果有args参数，这个变量等于”?”，否则等于”"，空值。

http\_user\_agent #客户端agent信息

http\_cookie #客户端cookie信息

limit\_rate #这个变量可以限制连接速率。

query\_string #与args相同。

request\_body\_file #客户端请求主体信息的临时文件名。

request\_method #客户端请求的动作，通常为GET或POST。

remote\_addr #客户端的IP地址。

remote\_port #客户端的端口。

remote\_user #已经经过Auth Basic Module验证的用户名。

request\_completion #如果请求结束，设置为OK. 当请求未结束或如果该请求不是请求链串的最后一个时，为空(Empty)。

request\_method #GET或POST

request\_filename #当前请求的文件路径，由root或alias指令与URI请求生成。

request\_uri #包含请求参数的原始URI，不包含主机名，如：”/foo/bar.php?arg=baz”。不能修改。

scheme #HTTP方法（如http，https）。

server\_protocol #请求使用的协议，通常是HTTP/1.0或HTTP/1.1。

server\_addr #服务器地址，在完成一次系统调用后可以确定这个值。

server\_name #服务器名称。

server\_port #请求到达服务器的端口号。