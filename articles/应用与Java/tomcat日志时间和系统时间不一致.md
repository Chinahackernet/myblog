问题描述：tomcat控制台显示的日志时间与当前时间相差8个小时（或其它数值）

解决方法是：

修改catalina.sh文件

在文件的开头添加如下内容：

export JAVA\_OPTS="$JAVA\_OPTS -Duser.timezone=Asia/shanghai"

然后重启服务器，即可解决此问题。