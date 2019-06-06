# Serverless API Gateway Logs

Serverless plugin to enable API Gateway logs and extended metrics

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

The plugin provides some configurations. All default values are from CLI options or serverless file.
```yaml
# serverless.yml

custom:
  apigLogs:
    region: 'us-east-1' # default to CLI option (--region) or ${self:provider.region}
    stage: 'dev' # default to CLI option (--stage) or ${self:provider.stage}
    logLevel: 'INFO' # default to CLI option (--apig-log-level) or 'ERROR'
    dataTraceEnabled: true # Can be overriden by CLI option (--apig-log-dataTraceEnabled)
    metricsEnabled: true # Can be overriden by CLI option (--apig-metricsEnabled)
```
When parameter `dataTraceEnabled` is set to true full request and response bodies can be found in the logs.

Parameter `metricsEnabled` enables extended CloudWatch metrics for API (api calls, latency, etc). 
