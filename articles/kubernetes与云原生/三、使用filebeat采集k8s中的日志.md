```plain
[root@holder-ops-common filebeat]# cat filebeat-logs.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-logs-config
  namespace: kube-system

data:
  filebeat.yml: |-
    filebeat.inputs:
    - type: log
      enabled: true
      paths:
        - /data/app/*/*/logs/error.log
      fields:
        type: holder_error
      multiline.pattern: ^\[
      multiline.negate: true
      multiline.match: after

    - type: log
      enabled: true
      paths:
        - /data/app/*/*/logs/info.log
      fields:
        type: holder_info          
      multiline.pattern: ^\[
      multiline.negate: true
      multiline.match: after
          
    - type: log
      enabled: true
      paths:
        - /data/app/*/*/logs/debug.log
      fields:
        type: holder_debug         
      multiline.pattern: ^\[
      multiline.negate: true
      multiline.match: after

    - type: log
      enabled: true
      paths:
        - /data/app/*/*/logs/warn.log
      fields:
        type: holder_warn         
      multiline.pattern: ^\[
      multiline.negate: true
      multiline.match: after

    setup.ilm.enabled: false
    setup.template.settings:
      index.number_of_shards: 1
      index.number_of_replicas: 0
      index.codec: best_compression 

    output.elasticsearch:
      hosts: ['${ELASTICSEARCH_HOST:elasticsearch}:${ELASTICSEARCH_PORT:9200}']
      username: ${ELASTICSEARCH_USERNAME}
      password: ${ELASTICSEARCH_PASSWORD}
      indices:
        - index: "holder_error_%{+yyyy.MM.dd}"
          when.equals:
            fields.type: "holder_error"
        - index: "holder_info_%{+yyyy.MM.dd}"
          when.equals:
            fields.type: "holder_info"
        - index: "holder_debug%{+yyyy.MM.dd}"
          when.equals:
            fields.type: "holder_debug"
        - index: "holder_warn%{+yyyy.MM.dd}"
          when.equals:
            fields.type: "holder_warn"

---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: filebeat-logs
  namespace: kube-system
spec:
  selector:
    matchLabels:
      project: k8s
      app: filebeat
  template:
    metadata:
      labels:
        project: k8s
        app: filebeat
    spec:
      containers:
      - name: filebeat
        image: elastic/filebeat:7.4.2
        env:
        - name: ELASTICSEARCH_HOST
          value: "172.16.204.250"
        - name: ELASTICSEARCH_PORT
          value: "9200"
        - name: ELASTICSEARCH_USERNAME
          value: elastic
        - name: ELASTICSEARCH_PASSWORD
          value: Holder@123
        resources:
          requests:
            cpu: 100m
            memory: 100Mi
          limits:
            cpu: 500m
            memory: 500Mi
        securityContext:
          runAsUser: 0
        volumeMounts:
        - name: filebeat-config
          mountPath: /usr/share/filebeat/filebeat.yml
          subPath: filebeat.yml
        - name: logs
          mountPath: /data/app/
      volumes:
      - name: logs
        hostPath: 
          path: /data/app/
      - name: filebeat-config
        configMap:
          name: filebeat-logs-config
```