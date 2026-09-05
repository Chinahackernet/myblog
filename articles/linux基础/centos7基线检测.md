### 系统登录弱密码 | 身份鉴别

**描述** 若系统使用弱口令，存在极大的被恶意猜解入侵风险，需立即修复。 **加固建议** 将弱密码修改复杂密码，应符合复杂性要求：

1、长度8位以上

2、包含以下四类字符中的三类字符:

英文大写字母(A 到 Z)

英文小写字母(a 到 z)

10 个基本数字(0 到 9)

非字母字符(例如 !、$、#、%、@、^、&)

3、避免使用已公开的弱密码，如：abcd.1234 、admin@123等

操作时建议做好记录或备份

### 设置密码失效时间 | 身份鉴别

**描述** 设置密码失效时间，强制定期修改密码，减少密码被泄漏和猜测风险，使用非密码登录方式（如密钥对）请忽略此项。 **加固建议** 使用非密码登录方式如密钥对，请忽略此项。在`/etc/login.defs`中将 `PASS_MAX_DAYS` 参数设置为 60-180之间，如:

PASS\_MAX\_DAYS 90

需同时执行命令设置root密码失效时间：

chage \--maxdays 90 root

操作时建议做好记录或备份

### 设置密码修改最小间隔时间 | 身份鉴别

**描述** 设置密码修改最小间隔时间，限制密码更改过于频繁 **加固建议** 在`/etc/login.defs` 中将 `PASS_MIN_DAYS` 参数设置为7-14之间,建议为7：

PASS\_MIN\_DAYS 7

需同时执行命令为root用户设置：

chage \--mindays 7 root

操作时建议做好记录或备份

### 密码复杂度检查 | 身份鉴别

**描述** 检查密码长度和密码是否使用多种字符类型 **加固建议** 编辑`/etc/security/pwquality.conf`，把minlen（密码最小长度）设置为9-32位，把minclass（至少包含小写字母、大写字母、数字、特殊字符等4类字符中的3类或4类）设置为3或4。如：

minlen\=10

minclass\=3

操作时建议做好记录或备份

### 检查密码重用是否受限制 | 身份鉴别

**描述** 强制用户不重用最近使用的密码，降低密码猜测攻击风险 **加固建议** 在`/etc/pam.d/password-auth`和`/etc/pam.d/system-auth`中password sufficient pam\_unix.so 这行的末尾配置remember参数为5-24之间，原来的内容不用更改，只在末尾加了remember=5。

操作时建议做好记录或备份

### 检查系统空密码账户 | 身份鉴别

**描述** 检查系统空密码账户 **加固建议** 为用户设置一个非空密码，或者执行`passwd -l <username>`锁定用户

操作时建议做好记录或备份

### 确保密码到期警告天数为7或更多 | 身份鉴别

**描述** 确保密码到期警告天数为28或更多 **加固建议**

在`/etc/login.defs` 中将 `PASS_WARN_AGE` 参数设置为7-14之间，建议为7：

PASS\_WARN\_AGE 7

同时执行命令使root用户设置生效：

chage \--warndays 7 root

操作时建议做好记录或备份

### 设置SSH空闲超时退出时间 | 服务配置

**描述** 设置SSH空闲超时退出时间，可降低未授权用户访问其他用户SSH会话的风险 **加固建议** 编辑`/etc/ssh/sshd_config`，将`ClientAliveInterval` 设置为300到900，即5-15分钟，将`ClientAliveCountMax`设置为0-3之间。

ClientAliveInterval 600

ClientAliveCountMax 2

操作时建议做好记录或备份

### 确保SSH MaxAuthTries设置为3到6之间 | SSH服务配置

**描述** 设置较低的Max AuthTrimes参数将降低SSH服务器被暴力攻击成功的风险。 **加固建议** 在`/etc/ssh/sshd_config`中取消MaxAuthTries注释符号#，设置最大密码尝试失败次数3-6，建议为4：

MaxAuthTries 4

操作时建议做好记录或备份

### 确保rsyslog服务已启用 | 安全审计

**描述** 确保rsyslog服务已启用，记录日志用于审计 **加固建议** 运行以下命令启用rsyslog服务：

systemctl enable rsyslog

systemctl start rsyslog

操作时建议做好记录或备份