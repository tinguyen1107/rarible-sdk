@Library('shared-library') _

def pipelineConfig = [:]

withCredentials([
  string(credentialsId: 'sdk-solana-devnet-node-endpoint', variable: 'SOLANA_CUSTOM_ENDPOINT'),
  string(credentialsId: 'sdk-api-key-testnet', variable: 'SDK_API_KEY_TESTNET'),
  string(credentialsId: 'sdk-api-key-prod', variable: 'SDK_API_KEY_PROD')
]) {
  pipelineAppCI(pipelineConfig)
}
