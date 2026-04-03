const { SSMClient, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');

async function loadSecrets() {
  const client = new SSMClient({ region: 'eu-west-3' });
  try {
    const { Parameters } = await client.send(
      new GetParametersByPathCommand({ Path: '/openlatex', WithDecryption: true })
    );
    for (const param of Parameters) {
      const key = param.Name.replace('/openlatex/', '');
      process.env[key] = param.Value;
    }
  } catch (err) {
    if (err.name === 'CredentialsProviderError' || err.name === 'ExpiredTokenException') {
      console.log('Pas de credentials AWS, fallback sur les variables d\'environnement');
      return;
    }
    throw err;
  }
}

module.exports = { loadSecrets };
