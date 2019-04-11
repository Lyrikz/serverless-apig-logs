# Serverless API Gateway Logs

Serverless plugin to enable API Gateway logs

## Install

```bash
$ npm i serverless-apig-logs
```

## Usage

Your IAM user should have access to the policy: `apigateway:updateStage`.

1. Add the plugin to the plugin list :
```yaml
# serverless.yml

plugins:
  - serverless-apig-logs
```

2. Deploy!
```bash
$ sls deploy
```

## Config

The plugin provides some configurations. Region and stage default values are from CLI options or serverless file.
```yaml
# serverless.yml

custom:
  apigLogs:
    region: 'us-east-1' # default to CLI option (--region) or ${self:provider.region}
    stage: 'dev' # default to CLI option (--stage) or ${self:provider.stage}
    logLevel: 'INFO' # default to CLI option (--apig-log-level) or 'ERROR'
```
