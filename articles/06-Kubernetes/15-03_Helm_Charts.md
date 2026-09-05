# Helm Charts

> 分类：Kubernetes / 第15章：helm
> 原文：https://www.cuiliangblog.cn/detail/section/15287399
> 来源：崔亮的博客

---

# 一、Charts文件组织结构


> 一个Charts就是按特定格式组织的目录结构，目录名即为Charts名，目录名称本身不包含版本信息。目录结构中除了charts/和templates/是目录之外，其他的都是文件。它们的基本功用如下。
>



1. Chart.yaml：当前Charts的描述信息，yaml格式的文件。
2. LICENSE：当前Charts的许可证信息，纯文本文件；此为可选文件。
3. README.md：易读格式的README文件；可选。
4. requirements.yaml：当前Charts的依赖关系描述文件；可选。
5. values.yaml：当前Charts用到的默认配置值。
6. charts/：目录，存放当前Charts依赖到的所有Charts文件。
7. templates/：目录，存放当前Charts用到的模板文件，可应用于Charts生成有效的Kuber-netes清单文件。
8. templates/NOTES.txt：纯文本文件，Templates简单使用注解
+ 尽管Charts和Templates目录均为可选，但至少应该存在一个Charts依赖文件或一个模板文件。另外，Helm保留使用charts/和templates/目录以及上面列出的文件名称，其他文件都将被忽略。



# 二、Chart.yaml文件组织格式


> Chart.yaml用于提供Charts相关的各种元数据，如名称、版本、关键词、维护者信息、使用的模板引擎等，它是一个Charts必备的核心文件，主要包含以下字段。
>



1. name：当前Charts的名称，必选字段。
2. version：遵循语义化版本规范第2版的版本号，必选字段。
3. description：当前项目的单语句描述信息，可选字段。
4. keywords：当前项目的关键词列表，可选字段。
5. home：当前项目的主页URL，可选字段。
6. sources：当前项目用到的源码的来源URL列表，可选字段。
7. maintainers：项目维护者信息，主要嵌套name、email和URL几个属性组成；可选字段。
8. engine：模板引擎的名称，默认为gotpl，即go模板。
9. icon:URL，指向当前项目的图标，SVG或PNG格式的图片；可选字段。
10. appVersion：本项目用到的应用程序的版本号，可选字段，且不必为语义化版本。
11. tillerVersion：当前Charts依赖的Tiller版本号，可以是语义化版本号的范围，如“>2.4.0”；可选字段。



# 三、Charts中的依赖关系


> Helm中的一个Charts可能会依赖不止一个其他的Charts，这种依赖关系可经requirements.yaml进行动态链接，也可直接存储于charts/目录中进行手动管理。
>



1. requirements.yaml文件  
requirements.yaml文件本质上只是一个简单的依赖关系列表，可用字段具体如下。
2. name：被依赖的Charts的名称。
3. version：被依赖的Charts的版本。
4. repository：被依赖的Charts所属的仓库及其URL；如果是非官方的仓库，则需要先用helm  
repo add命令将其添加进本地可用仓库。
5. alias：为被依赖的Charts创建一个别名，从而让当前Charts可以将所依赖的Charts对应到新名称，即别名；可选字段。
6. tags：默认情况下所有的Charts都会被装载，若给定了tags，则仅装载那些匹配到的Charts。
7. condition：类似于tags字段，但需要通过自定义的条件来指明要装载的charts。
8. import-values：导入子Charts中的的值；被导入的值需要在子charts中导出。
9. Charts目录
+ 若需要对依赖关系进行更多的控制，则所有被依赖到的Charts都能以手工方式直接复制到Charts目录中。一个被依赖到的Charts既可以是归档格式，也可以是展开的目录格式，不过，其名称不能以下划线（_）或点号（.）开头，此类文件会被Charts装载器自动忽略。  
例如，Wordpress Charts依赖关系在其Charts目录中的反映类似如下所示：

![](assets/06-Kubernetes/03df1a50fdaf8d4fd0e5.png)

+ Helm  
Charts模板（template）遵循Go模板语言格式，并支持50种以上的来自Spring库的模板函数附件，以及为数不少的其他专用函数。所有的模板文件都存储于Templates目录中，在当前Charts被Helm引用时，此目录中的所有模板文件都会传递给模板引擎进行处理。模板文件中用到的值（value）有如下两种提供方式。□通过Charts的values.yaml文件提供，通常用于提供默认值。□在运行“helm  
install”命令时传递包含所需要的自定义值的YAML文件；此处传递的值会覆盖默认值。


