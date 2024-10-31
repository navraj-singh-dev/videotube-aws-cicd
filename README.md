# VideoTube - Cloud-Native Backend with CI/CD Pipeline

## 🎯 Project Overview

VideoTube is a production-grade video sharing platform backend, showcasing cloud-native development and DevOps practices. The project implements a complete CI/CD pipeline using [GitHub Actions](https://github.com/features/actions) and [ArgoCD](https://argoproj.github.io/argo-cd/), deployed on [AWS EKS](https://aws.amazon.com/eks/) with comprehensive monitoring and logging solutions.

## 🫣 Little Story About This Project

The backend project 'videotube' which is deployed here using devops is a separate repository of its own. I created this backend 'videotube' few months back.. i think this January's starting.. when i was learning backend development in javascript based tools and frameworks. Then i came to know about devops and its benefits. There i made a promise to myself that i will take this videotube project from my local laptop to the production deployment environment using devops myself. Today i have done it after many months of grinding!

It was not called videotube before, i gave it a very stupid name when i was first making this backend, the name was: [`mega-project-javascript-backend`](https://github.com/navraj-singh-dev/mega-project-javascript-backend.git). Yeah i know its weird.

Please visit this repository, if you are interested in learning jsut about my backend project and its details:
[`Visit The Independant Repository Of Videotube`](https://github.com/navraj-singh-dev/mega-project-javascript-backend.git)

## 📺 Live Demo Video

**Please watch this live demo video, in this video the complete project was fully deployed live on AWS EKS and i was explaning it..**
<br>
[`Live Demo On Youtube`](https://youtu.be/l8UB04Sm9FQ)

## 🏗️ Architecture & Tech Stack

#### Backend Technologies

- [Node.js](https://nodejs.org/en) 18 with ES6 modules
- [Express.js](https://expressjs.com/) for RESTful API
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for database
- [JWT](https://jwt.io/) for authentication
- [Cloudinary](https://cloudinary.com/) for media storage
- [Docker](https://www.docker.com/) for containerization

#### DevOps & Cloud Infrastructure

- AWS EKS (Elastic Kubernetes Service)
- Custom [Helm](https://helm.sh/) Charts for application deployment
- GitHub Actions for CI pipeline
- ArgoCD for CD pipeline
- [Prometheus](https://prometheus.io/) & [Grafana](https://grafana.com/) for monitoring ([kube-prometheus-stack](https://prometheus-community.github.io/helm-charts))
- [EFK Stack](https://www.elastic.co/what-is/elk-stack) for logging ([Elasticsearch](https://www.elastic.co/elasticsearch/), [Fluentbit](https://fluentbit.io/), [Kibana](https://www.elastic.co/kibana/))
- [NGINX](https://www.nginx.com/) Ingress Controller for traffic management

## 🚀 CI/CD Pipeline

#### Continuous Integration (GitHub Actions)

1. Code build and validation
2. Static code analysis
3. Docker image build and push to [Docker Hub](https://hub.docker.com/)
4. Automatic Helm chart values update

#### Continuous Deployment (ArgoCD)

1. Automated detection of Helm chart changes
2. GitOps-based deployment to AWS EKS
3. Zero-downtime deployment strategy
4. Application health monitoring

## 📊 Monitoring & Logging

#### Prometheus & Grafana Stack

- Real-time metrics collection
- Dashboards for application metrics
- Alert management
- Resource utilization monitoring

#### EFK Stack

- Centralized logging solution
- Log aggregation with Fluentbit
- Elasticsearch for log storage and search
- Kibana for log visualization and analysis

## 🛠️ Project Structure

The repository folder/file structure shows the main components of the repository:

1. `.github/workflows/` - Contains CI workflow files
2. `helm/` - [Kubernetes](https://kubernetes.io/) Helm charts for project deployment
3. `src/` - Main application source code
   - `controllers/` - Business logic
   - `middlewares/` - [Express](https://expressjs.com/) middleware functions
   - `models/` - [MongoDB](https://www.mongodb.com/) schema definitions
   - `routes/` - API route definitions
   - `utils/` - Helper functions and utilities
4. `public/` - Static assets
5. `views/` - [EJS](https://ejs.co/) templates for my simple frontend webpage
6. Root configuration files

The project follows a typical [Node.js] MVC architecture pattern with additional DevOps components for containerization and Kubernetes deployment.

## 🔑 Key Features

- Secure user authentication and authorization
- Video upload and management
- Comment and playlist functionality
- User subscription system
- Watch history tracking
- Tweet-like social features
- MVC Design Pattern
- Automated deployment pipeline
- Production-grade monitoring and logging

## 🏃‍♂️ Local Development Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/navraj-singh-dev/videotube-aws-cicd.git
   ```

2. Install dependencies:

   ```bash
   cd videotube-aws-cicd
   npm install
   ```

3. Set up environment variables:

   - The sensitive enviroment variable that `videotube` backend code uses internally are actually deployed using k8s secrets in the cluster itself.

   - The non-sensitive enviroment variables are deployed using the '/helm/vt-ingress/values.yaml' file in the helm chart.

   - Make sure to configure the non sensitive env variables in the '/helm/vt-ingress/values.yaml' as you like. Now here your non-sensitive env variables are configured and no need to worry about them.

   - Setting up sensitive env variables is explained in this README below.

   - So simply follow this README as it is.

<br>

4. Start the development server:

   ```bash
   npm run dev
   ```

## 🌐 Deployment Guide (Hard To Do)

### Prerequisites

- A mongoDB Atlas database created and setup properly with its URI
- Cloudinary account and its proper configuration and its sensitive keys
- AWS Account with EKS permissions and IAM configured
- kubectl & eksctl installed & configured for your cluster on your laptop
- Helm 3.x installed in your laptop
- ArgoCD installed on running cluster
- You must have atleast some knowledge of all the devops tools i am using in this project, otherwise for begginers this will be really very hard to follow.

### Deployment Steps

1. Create EKS cluster using provided manifest configuration:

   ```bash
   # make sure to configure your own cluster configuration manifest file as you like..
   # make user your IAM permissions are configured by yourself properly..
   # my provided manifest file 'eks-cluster-config-dummy.yaml' is for reference only
   eksctl create cluster -f eks-cluster-config/<your cluster manifest file>
   ```

2. Deploy your own sensitive environment variables as k8s secrets:

   ```bash
   # The backend i created depends on many third party tools to work like cloudinary and mongoDB Atlas.
   # Their sensitive values and keys must be deployed securely and manually.
   # Just after cluster creation deploy these env variables by adding your own sensitive values.
   # Dont change the name of any env variable here.
   kubectl create secret generic videotube-secrets \
     --from-literal=MONGODB_URI="" \
     --from-literal=ACCESS_TOKEN_SECRET="" \
     --from-literal=REFRESH_TOKEN_SECRET="" \
     --from-literal=CLOUDINARY_CLOUD_NAME="" \
     --from-literal=CLOUDINARY_API_KEY="" \
     --from-literal=CLOUDINARY_API_SECRET=""
   ```

3. Deploy the project in EKS using the 'vt-ingress' helm chart from helm/videotube folder:

   ```bash
   # Configure the 'values.yaml' as your requirements, before running this command..
   helm install <your custom installation name> helm/videotube/vt-ingress/

   # Now your deployment-set, ingress-resource, service has been deployed to eks cluster.
   # Now a ingress-controller needs to be deployed to the cluster,
   # which will use this ingress-resource..
   # See the next step..
   ```

4. Deploy NGINX Ingress Controller:

   ```bash
   # The nginx ingress controller to manage and route the incoming traffic to our services..
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/aws/deploy.yaml
   ```

5. Locally map your `ingress-resource-host-name` with `ingress-load-balancer` numerical IP-Address in `/etc/hosts` file of your linux machine:
   - The `nginx-ingress-controller` in our EKS cluster will only accept our browser's request to enter into the videotube application, if the internet requests are coming on the same host-name defined in the manifest file of our ingress resource. In my case the host-name is `videotube.local` defined in the `values.yaml` of the `vt-ingress` helm chart.
   - Simply put, we cannot access our videotube application on internet, if the hostname is not `videotube.local` in my case. Ofcourse you can use any other host name other than `videotube.local`.

   ```plaintext
   root@Acer:~# kubectl get ing
   NAME                         CLASS   HOSTS             ADDRESS                                                                          PORTS   AGE
   videotube-aws-cicd-ingress   nginx   videotube.local   afd1e224cce414033908cdb1188a213e-8b76cb7ce7835aef.elb.ap-south-1.amazonaws.com   80      89m
   ```

   ```bash
   # When you deploy a nginx-ingress-controller to EKS cluster (in step 4), it also creates a loadbalancer on AWS.
   # This 'videotube.local' hostname maped to nginx-ingress-loadbalancer numerical IP Address is the gateway to open this project, 'videotube.local' this is where you will go and send API requests to this backend, a webpage will open if a browser sends a http request here.

   # After step 4 do this..
   # This command will show external IP Address (it will be a long alphabetical string) of this nginx-ingress-loadbalancer, copy that..
   kubectl get ing

   # Then run this command below..
   # 'netstat' will show multiple numerical IP Addresses in output. Copy any one of them.
   netstat <copied external address>

   # Then open the /etc/hosts
   sudo nano /etc/hosts

   # Now paste the numerical IP Address on the left side and put a space and then paste your ingress resource host name you defined in the 'values.yaml' file..
   # In my manifest file i defined my ingress hostname as 'videotube.local', so my '/etc/hosts' entry will look like this:
   <numerical IP Address of load balancer you copied from netstat> video.local

   # Save & now open your browser and type 'http://videotube.local' and it must open a EJS frontend webpage of this backend project.

   # This means now this backend project is running/deployed on EKS properly and you can access it on internet and it API request using POSTMAN..
   ```

6. Set up monitoring stack:

   ```bash
   # Add Prometheus helm charts repo to your helm repo list
   helm repo add <custom repo name> https://prometheus-community.github.io/helm-charts

   # Install this specific 'kube-prometheus-stack'
   helm install <custom installation name> prometheus-community/kube-prometheus-stack
   ```

7. Deploy EFK stack for logging:

   ```bash
   # As this step is very long, i have made a separate markdown file for this step.

   # Please go to the '/helm/efk/Guide to deploy EFK stack to EKS.md' file of this repository.

   # In this mentioned file you will be guided on how to deploy the EFK logging stack to EKS cluster.
   ```

8. Configure ArgoCD on ArgoCD UI:

   ```bash
   # Deploy/Install Argo CD using manifests
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```

   ```bash
   # This will make the argoCD UI k8s service a load balancer to be accessed from your browser..
   # Access the Argo CD UI (Loadbalancer service)
   kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
   ```

   ```bash
   # Get the Loadbalancer service IP
   kubectl get svc argocd-server -n argocd

   # From the output copy the loadbalancer url/ip

   # Now in the browser paste the link as: http://<argoCD load balancer ip>
   # The argoCD UI will open..

   # Configure it propely and then your CD will be properly setup.

   # Now your CI and CD is completely configured and running..
   ```

9. Done, Now Experiment:

   ```bash
   # 1. Now you have backend & EJS-frontend running on ingress load balancer
   # where you can send Postman requests..

   # 2. You have monitoring and logging setup..
   # 3. You have CI and CD setup..

   # 4. Now you can do any changes in the backend/frontend code,
   # like you can for example do a little front-end change in the ejs webpage
   # as changing the text and then commit it to your github, the CI pipeline will run in
   # github actions, then your CD will run by argoCD, in few seconds or minutes the changes
   # you done to your front end will appear on the webpage if you refresh the webpage.
   # 5. DONE!!
   ```

## 🔒 Security Considerations

- Sensitive data management through Kubernetes secrets
- JWT-based authentication
- CORS configuration
- Secure media upload handling

## 🤝 Contributing

Contributions are welcome! Please contact me persoanally through any medium you like!

## 👨‍💻 About ME

- LinkedIn: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[My LinkedIN Profile](https://www.linkedin.com/in/navraj-singh-78b746210/)
- X (Twitter): &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[My X Profile](https://x.com/NavrajSinghDev)
- Hasnode (My Technical Blogs): &nbsp;[My Blogs](https://navraj-blog.hashnode.dev/)
- Email: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;navrajsingh.dev@gmail.com
