const config = require('./weird.config');
console.log('::set-output name=env::' + config.env);
console.log('::set-output name=region::' + config.scheduler.sqs.construct.region);