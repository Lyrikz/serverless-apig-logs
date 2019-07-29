class ServerlessApiGLogs {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      enable_apig_logs: {
        usage: 'Enable API Gateway Logs',
        lifeCycleEvents: [
          'enable',
        ],
        options: {
          'apig-log-level': {
            usage: 'Specify the log level wanted. Possible value : INFO | ERROR'
          },
          'apig-log-dataTraceEnabled': {
            usage: 'If set, full request bodies will be included in the logs'
          },
          'apig-metricsEnabled': {
            usage: 'If set, will enable detailed CloudWatch metrics'
          }
        }
      },
    };

    this.hooks = {
      'after:deploy:deploy': this.enable.bind(this),
    };
  }

  async enable() {
    this.serverless.cli.log('Updating Log Level...');
    const AWS = this.serverless.providers.aws.sdk;
    const { service } = this.serverless;
    const conf = {
      region: this.options['region'] || service.provider.region,
      stage: this.options['stage'] || service.provider.stage,
      logLevel: this.options['apig-log-level'] || 'ERROR',
    }

    if (this.options['apig-log-dataTraceEnabled']) conf.dataTraceEnabled = true;
    if (this.options['apig-metricsEnabled']) conf.metricsEnabled = true;

    if (service.custom && service.custom.apigLogs) {
      const customConf = service.custom.apigLogs;
      conf.region = customConf.region || conf.region;
      conf.stage = customConf.stage || conf.stage;
      conf.logLevel = customConf.logLevel || conf.logLevel;
      if (customConf.dataTraceEnabled && !conf.dataTraceEnabled) conf.dataTraceEnabled = true;
      if (customConf.metricsEnabled && !conf.metricsEnabled) conf.metricsEnabled = true;
    }

    if (this.options['aws-profile']) {
      AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: this.options['aws-profile'] });
    }

    AWS.config.region = conf.region;

    const cf = new AWS.CloudFormation();

    const listStackResources = async (StackName, NextToken) => {
      const result = await cf.listStackResources({ StackName, NextToken }).promise();
      return result.NextToken
        ? [...result.StackResourceSummaries, ...await listStackResources(StackName, result.NextToken)]
        : result.StackResourceSummaries;
    };

    const restApi = (await listStackResources(`${service.service}-${conf.stage}`))
      .find((resource) => resource.ResourceType === 'AWS::ApiGateway::RestApi');

    const apiId = restApi.PhysicalResourceId;
    const apig = new AWS.APIGateway();
    const params = {
      restApiId: apiId,
      stageName: conf.stage,
      patchOperations: [
        {
          op: 'replace',
          path: '/*/*/logging/loglevel',
          value: conf.logLevel,
        }
      ],
    };

    if (conf.dataTraceEnabled) {
      params.patchOperations.push({
        op: 'replace',
          path: '/*/*/logging/dataTrace',
        value: `${conf.dataTraceEnabled}`,
      });
    }

    if (conf.metricsEnabled) {
      params.patchOperations.push({
        op: 'replace',
        path: '/*/*/metrics/enabled',
        value: `${conf.metricsEnabled}`,
      });
    }

    await apig.updateStage(params).promise();

    this.serverless.cli.log('Update complete!');
  }
}

module.exports = ServerlessApiGLogs;
