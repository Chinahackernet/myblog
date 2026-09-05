### 1、在Pipeline中使用nohup...&不生效解决办法

原因：在Jenkins中，默认情况下pipeline在执行完后后会自动清理其产生的子进程，而我们放在pipeline的nohup命令会被当作其子进程，所以就会被kill掉。

  

解决：在Pipeline中设置 JENKINS\_NODE\_COOKIE，如下：

```plain
stage('Deploy') {
	steps {
		script {
			withEnv(['JENKINS_NODE_COOKIE=background_job']) {
				sh """
					nohup java -jar app.jar > app.log &
				   """
			}
		}
	}
}
```

这样在执行pipeline的时候就不会kill掉我们的命令。

> 补充：如果是传统的配置方式，可以设置BUILD\_ID。