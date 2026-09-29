pipeline {
    agent any

    stages {
        stage('Docker Build') {
            steps {
                sh '''
                    docker build \
                        -t a-stock-simulator-frontend:latest \
                        .
                '''
            }
        }

        stage('ECR Login') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        aws ecr get-login-password --region ap-northeast-2 \
                        | docker login \
                            --username AWS \
                            --password-stdin 784917519469.dkr.ecr.ap-northeast-2.amazonaws.com
                    '''
                }
            }
        }

        stage('Docker Tag') {
            steps {
                sh '''
                    docker tag \
                        a-stock-simulator-frontend:latest \
                        784917519469.dkr.ecr.ap-northeast-2.amazonaws.com/a-stock-simulator-frontend:latest
                '''
            }
        }

        stage('ECR Push') {
            steps {
                sh '''
                    docker push \
                        784917519469.dkr.ecr.ap-northeast-2.amazonaws.com/a-stock-simulator-frontend:latest
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        COMMAND_ID=$(aws ssm send-command \
                            --instance-ids "i-037c1a8ae96b5d24c" \
                            --document-name "AWS-RunShellScript" \
                            --parameters 'commands=[
                                "aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 784917519469.dkr.ecr.ap-northeast-2.amazonaws.com",
                                "docker pull 784917519469.dkr.ecr.ap-northeast-2.amazonaws.com/a-stock-simulator-frontend:latest",
                                "docker stop a-stock-simulator-frontend || true",
                                "docker rm a-stock-simulator-frontend || true",
                                "docker run -d --name a-stock-simulator-frontend --restart unless-stopped -p 3000:80 784917519469.dkr.ecr.ap-northeast-2.amazonaws.com/a-stock-simulator-frontend:latest"
                            ]' \
                            --region ap-northeast-2 \
                            --query 'Command.CommandId' \
                            --output text)

                        echo "SSM Command ID: $COMMAND_ID"

                        aws ssm wait command-executed \
                            --command-id "$COMMAND_ID" \
                            --instance-id "i-037c1a8ae96b5d24c" \
                            --region ap-northeast-2

                        aws ssm get-command-invocation \
                            --command-id "$COMMAND_ID" \
                            --instance-id "i-037c1a8ae96b5d24c" \
                            --region ap-northeast-2
                    '''
                }
            }
        }
    }
}