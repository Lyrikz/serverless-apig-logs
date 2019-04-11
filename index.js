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

    if (service.custom && service.custom.apigLogs) {
      const customConf = service.custom.apigLogs;
      conf.region = customConf.region || conf.region;
      conf.stage = customConf.stage || conf.stage;
      conf.logLevel = customConf.logLevel || conf.logLevel;
    }

    if (this.options['aws-profile']) {
      AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: this.options['aws-profile'] });
    }

    AWS.config.region = conf.region;

    const cf = new AWS.CloudFormation();
    const { StackResourceSummaries: resources } = await cf.listStackResources({
      StackName: `${service.service}-${conf.stage}`,
    }).promise();

    const restApi = resources.find((resource) => {
      return resource.ResourceType === 'AWS::ApiGateway::RestApi';
    });

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

    await apig.updateStage(params).promise();

    this.serverless.cli.log('Update complete!');
  }
}

module.exports = ServerlessApiGLogs;
