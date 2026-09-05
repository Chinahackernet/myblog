## **Apollo** **添加和修改配置文件**

**第一步：登录 Apollo 界面**

测试环境地址：[apollo.holderzone.cn](http://apollo.holderzone.cn/)                    登录用户名/密码     java /java

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-1.png)

**第二步：创建项目**

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-2.png)

**第三步：指定环境，新建Namespace**

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-3.png)

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-4.png)

**第四步：对配置文件授权对配置文件授权**

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-5.png)

可以指定某个用户在所有环境下都可以修改，也可以指定在FAT 或者UAT 环境下才能修改。选择完成后点击添加按钮即可。

**第五步：发布新的配置**

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-6.png)

## **客户端使用**

**第一步：引包**

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-7.png)

**第二步：配置文件中添加相关配置**

**environment：**

常用两种方式

       1、运行jar 文件，需要注意格式是java -Denv=YOUR-ENVIRONMENT -jar xxx.jar

       2、通过配置文件：对于Mac/Linux，新建文件： /opt/settings/server.properties

                                      对于Windows，新建文件：C:\\opt\\settings\\server.properties

**appid、namespaces、meta-service-url：**

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-8.png)

meta：代表apollo 的config-service 的地址

namespces：代表读取 console 的namespace 名称，切记不能写成 namespace

app.id：新建项目时指定的appid

**第三步：@EnableApolloConfig**

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-9.png)

## **配置实时更新使用**

@Value 的值会随发布后立即生效

@ConfigProperties 里的值需要结合EnvironmentChangeEvent 事件

例子：

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-10.png)

## **踩坑指南**

1、AppId命名不能包含下划线，如：holder\_saas\_store\_staff 是不能被客户端识别到的

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-11.png)

2、服务运行的时候首先会去解析对应的application.yml中apollo的配置

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-12.png)

3、当apollo没有对应的namespace的时候会报如下错误

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-13.png)

4、服务默认会先去加载application这个namespace的配置，然后去加载配置的namespace的配置，由于默认的application没有配置，所有会报如下错误，可以忽略

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-14.png)

为了防止报默认配置找不到影响排查，可以在默认的application添加无效配置

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-15.png)

5、当服务加载apollo配置成功的时候，会在对应配置文件的实列列表中查看到对应服务

![image.png](assets/中间件/Apollo使用文档/Apollo使用文档-16.png)