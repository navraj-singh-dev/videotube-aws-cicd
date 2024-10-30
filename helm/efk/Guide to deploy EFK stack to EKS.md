## 📝 Step-by-Step Setup

<aside>

This is step 7 from the repository's README file.

Please First Follow The Steps 1 - 6 from the main README file of this repository, then follow this.

</aside>

### 1) Create Namespace for Logging

```bash
# This is where EFK stack will be deployed
kubectl create namespace logging
```

### 2) Install Elasticsearch on K8s

```bash
# Add the open source helm chart of elastic ecosystem
helm repo add elastic <https://helm.elastic.co>

# Install helm chart of elasticsearch tool
helm install elasticsearch \\
 --set replicas=1 \\
 --set volumeClaimTemplate.storageClassName=gp2 \\
 --set persistence.labels.enabled=true elastic/elasticsearch -n logging

```

- Installs Elasticsearch in the `logging` namespace.
- It sets the number of replicas, specifies the storage class, and enables persistence labels to ensure
data is stored on persistent volumes.

### 6) Retrieve Elasticsearch Username & Password

```bash
# for username, get elasticsearch username using this command
kubectl get secrets --namespace=logging elasticsearch-master-credentials -ojsonpath='{.data.username}' | base64 -d

# for password, get elasticsearch password using this command
kubectl get secrets --namespace=logging elasticsearch-master-credentials -ojsonpath='{.data.password}' | base64 -d

```

- Retrieves the password for the Elasticsearch cluster's master credentials from the Kubernetes secret.
- The password is base64 encoded, so it needs to be decoded before use.
- Write down the password and username as it will be used in ‘fluentbit-values.yaml’ file of fluent-bit. Because fluent-bit sends logs to the elasticsearch, so it needs the username and password of the elasticsearch.

### 7) Install Kibana

```bash
helm install kibana --set service.type=LoadBalancer elastic/kibana -n logging

```

- Kibana provides a user-friendly interface for visualizing data stored in Elasticsearch.
- It is exposed as a LoadBalancer service, making it accessible from outside the cluster.

### 8) Install Fluentbit with Custom Values/Configurations

- 👉 **Note**: Please update the `HTTP_Passwd` field in the `fluentbit-values.yaml` file with the password retrieved earlier in step 6: (i.e JNyO47UqeYBsoaUA)"

```bash
helm repo add fluent <https://fluent.github.io/helm-charts>
helm install fluent-bit fluent/fluent-bit -f fluentbit-values.yaml -n logging

```

## ✅ Conclusion

- We have successfully installed the EFK stack in our Kubernetes cluster, which includes Elasticsearch for storing logs, Fluentbit for collecting and forwarding logs, and Kibana for visualizing logs.
- To verify the setup, access the Kibana dashboard by entering the `LoadBalancer DNS name followed by :5601 in your browser.
    - `http://<LOAD_BALANCER_DNS_NAME>:5601`
- Use the username and password retrieved in step 6 to log in.
- Once logged in, create a new dataview in Kibana and explore the logs collected from your Kubernetes cluster.