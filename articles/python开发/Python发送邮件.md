# 一、发送普通邮件

  

```bash
#!/usr/bin/python
# -*- encoding:utf-8 -*-
####################################################
# auth: Uncle.Joker
# mail: unclejoker520@163.com
# func: send mail
####################################################

import sys
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header

# Message sender information,These parameters need to be modified
# 发送者信息，这些信息需要根据情况自己修改

mail_info = {
  'mail_host': "smtp.163.com",
  'mail_user': "unclejoker520@163.com",
  'mail_password': "joker520"
}
# --Diary records
# --日志信息

def logger(e):
    logger_dir = "/var/log/mail/"
    # --If the log directory does not exist, create the log directory
    # --如果日志目录不存在，就创建这个目录
    if not os.path.exists(logger_dir):
        os.makedirs(logger_dir)
    logger_name = os.path.join(logger_dir, "mail.log")
    with open(logger_name, "a") as f:
        f.write(str(e) + "\n")

def send_mail(receiver, subject, content):
    """
    :param:receiver:
    :param:subject:
    :param:content:
    :return:
    """
    message = MIMEText(content, "plain", "utf-8")
    message["Subject"] = subject
    message["From"] = mail_info["mail_user"]
    message["to"] = receiver
    try:
        smtp = smtplib.SMTP_SSL(mail_info["mail_host"], 465)
        smtp.login(mail_info["mail_user"], mail_info["mail_password"])
        smtp.sendmail(mail_info["mail_user"], [receiver], message.as_string())
        smtp.close()
        # logger('Email send to [%s] successfully' % receiver)
    except Exception as e:
        # logger('Email send to [%s] failed,The reason for the failure is [%s]' % (receiver, e))
        print("error",e)

if __name__ == "__main__":
    # mail_recv = sys.argv[1]
    # mail_sub = sys.argv[2]
    # mail_content = sys.argv[3]
    mail_recv = "xxxx@163.com"    # 收件箱
    mail_sub = "test"
    mail_content = "test"
    send_mail(mail_recv, mail_sub, mail_content)
```

  

# 二、发送邮件带附件

  

```bash
#!/usr/bin/python
# -*- encoding:utf-8 -*-
####################################################
# auth: Uncle.Joker
# mail: unclejoker520@163.com
# func: send mail
####################################################

import sys
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
# Message sender information,These parameters need to be modified
# 发送者信息，这些信息需要根据情况自己修改

mail_info = {
  'mail_host': "smtp.163.com",
  'mail_user': "unclejoker520@163.com",
  'mail_password': "joker520"
}
# --Diary records
# --日志信息

def logger(e):
    logger_dir = "/var/log/mail/"
    # --If the log directory does not exist, create the log directory
    # --如果日志目录不存在，就创建这个目录
    if not os.path.exists(logger_dir):
        os.makedirs(logger_dir)
    logger_name = os.path.join(logger_dir, "mail.log")
    with open(logger_name, "a") as f:
        f.write(str(e) + "\n")

def send_mail(receiver, subject, content):
    """
    :param:receiver:
    :param:subject:
    :param:content:
    :return:
    """
    message = MIMEMultipart()
    message["Subject"] = subject
    message["From"] = mail_info["mail_user"]
    message["to"] = receiver
    att1 = MIMEText(open('E:\测试\上线核对模板.xlsx', 'rb').read(), 'base64', 'utf-8')
    att1["Content-Type"] = 'application/octet-stream'
    att1["Content-Disposition"] = 'attachment; filename="test.xlsx"'
    message.attach(att1)
    try:
        smtp = smtplib.SMTP_SSL(mail_info["mail_host"], 465)
        smtp.login(mail_info["mail_user"], mail_info["mail_password"])
        smtp.sendmail(mail_info["mail_user"], [receiver], message.as_string())
        smtp.close()
        logger('Email send to [%s] successfully' % receiver)
    except Exception as e:
        logger('Email send to [%s] failed,The reason for the failure is [%s]' % (receiver, e))

if __name__ == "__main__":
    # mail_recv = sys.argv[1]
    mail_recv = 'xxxx@163.com'     # 收件箱
    # mail_sub = sys.argv[2]
    mail_sub = 'test'
    # mail_content = sys.argv[3]
    mail_content = 'test'
    send_mail(mail_recv, mail_sub, mail_content)

```