# pipeline基本语法

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/31174769
> 来源：崔亮的博客

---

# 区段
1. Logstash用{}来定义区域。区域内可以包括插件区域定义，你可以在一个区域内定义多个插件。插件区域内则可以定义键值对设置。
2. 示例如下：

```bash
input { #输入
	stdin {}
	syslog {}
}
filter { #过滤，对数据进行分割、截取等处理
	...
}
output { #输出
	stdout { ... } #标准输出
}
```

# 数据类型
1. 布尔值（bool）

`debug =＞ true`

2. 字符串（string）

`host =＞"hostname"`

3. 数值（number）

`port =＞ 514`

4. 数组（array）

`match =＞ ["datetime", "UNIX", "ISO8601"]`

5. 哈希（hash）

```bash
options =＞ {
	key1 =＞"value1",
	key2 =＞"value2"
}
```

# 字段引用
1. 在Logstash配置中使用字段的值，只需把字段的名字写在中括号[]里即可。
2. 对于“嵌套字段”，每层的字段名都写在[]里就可以了。
3. Logstash还支持变量内插，在字符串里使用字段引用的方法是这样：

"the longitude is ％{[geoip][location][0]}"

# 条件判断
equality, etc：==,！=, ＜, ＞, ＜=, ＞=

regexp：=～,！～

inclusion：in, not in

boolean：and, or, nand, xor

unary：！()

• 例如：

```json
if "_grokparsefailure" not in [tags] {
  } else if [status]！～ /^2\d\d/ and [url] == "/noc.gif" {
  } else {
}
```




