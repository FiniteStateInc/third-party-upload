import * as core from '@actions/core'
import {
  createNewAssetVersionAndUploadBinaryParams,
  CreateNewAssetVersionAndUploadBinaryResponseType,
  CreateNewAssetVersionParams,
  FiniteStateSDK,
  UploadMethod
} from 'finite-state-sdk'

import {
  extractAssetVersion,
  generateAssetVersionUrl,
  sanitizeInput
} from './lib/utils/utils'
import {
  generateComment,
  githubInputParamsType,
  isPullRequest
} from './lib/utils/github_utils'
import { CompleteTestResultUploadResponse } from 'node_modules/finite-state-sdk/dist/fs/main'

export async function getInputs(): Promise<githubInputParamsType> {
    return {
      inputFiniteStateClientId: sanitizeInput(core.getInput('FINITE-STATE-CLIENT-ID', {required: true})),
      inputFiniteStateSecret: sanitizeInput(core.getInput('FINITE-STATE-SECRET', {required: true})),
      inputFiniteStateOrganizationContext: sanitizeInput(core.getInput(
        'FINITE-STATE-ORGANIZATION-CONTEXT', {required: true}
      )),
      inputAssetId: sanitizeInput(core.getInput('ASSET-ID', {required: true})),
      inputVersion: sanitizeInput(core.getInput('VERSION', {required: true})),
      inputFilePath: sanitizeInput(core.getInput('FILE-PATH', {required: true})),
      inputTestType: sanitizeInput(core.getInput('TEST-TYPE', {required: true})),
  
      // non required parameters:
      inputBusinessUnitId: sanitizeInput(core.getInput('BUSINESS-UNIT-ID')),
      inputCreatedByUserId: sanitizeInput(core.getInput('CREATED-BY-USER-ID')),
      inputProductId: sanitizeInput(core.getInput('PRODUCT-ID')),
      inputArtifactDescription: sanitizeInput(core.getInput('ARTIFACT-DESCRIPTION')),
      inputAutomaticComment: sanitizeInput(core.getBooleanInput('AUTOMATIC-COMMENT')),
      inputGithubToken: sanitizeInput(core.getInput('GITHUB-TOKEN'))
    }
  }

export async function uploadThirdParty(): Promise<
CompleteTestResultUploadResponse | undefined
> {
  const inputVariables = await getInputs()
  core.setSecret('FINITE-STATE-CLIENT-ID')
  core.setSecret('FINITE-STATE-SECRET')
  core.setSecret('FINITE-STATE-ORGANIZATION-CONTEXT')

  const params: CreateNewAssetVersionParams = {
    assetId: inputVariables.inputAssetId,
    version: inputVariables.inputVersion,
    filePath: inputVariables.inputFilePath,
    artifactDescription: inputVariables.inputArtifactDescription,
    testType: inputVariables.inputTestType,
    createdByUserId: inputVariables.inputCreatedByUserId,
    businessUnitId: inputVariables.inputBusinessUnitId,
    productId: inputVariables.inputProductId,
    uploadMethod: UploadMethod.GITHUB_INTEGRATION,
  }
  const clientId= inputVariables.inputFiniteStateClientId
  const clientSecret=inputVariables.inputFiniteStateSecret
  const organizationContext= inputVariables.inputFiniteStateOrganizationContext;
  const automaticComment = inputVariables.inputAutomaticComment
  const githubToken = inputVariables.inputGithubToken;
  
  core.info('Starting - Authentication')
  let client: FiniteStateSDK | undefined
  try {
    client = new FiniteStateSDK({ clientId, clientSecret, organizationContext })
  } catch (error) {
    const msgError = `Caught an exception trying to create client on FiniteStateSDK: ${error}`
    core.error(msgError)
    core.setFailed(msgError)
    core.setOutput('error', error)
  }

  if (client) {
    try {
      const response = await client.createNewAssetVersionAndUploadTestResults(params)
      core.info('File uploaded')
      core.setOutput('response', response)

      const assetVersion = await extractAssetVersion(response)
      if (!assetVersion) {
        core.setFailed(`Response from Finite state API invalid: ${response}`)
        core.setOutput('error', assetVersion)
      }

      const assetVersionUrl = await generateAssetVersionUrl({
        assetId: params.assetId,
        version: assetVersion as string
      })
      core.setOutput('asset-version-url', assetVersionUrl)
      core.info(`Asset version URL: ${assetVersionUrl}`)

      if (!automaticComment) {
        core.info('Automatic comment disabled')
      } else {
        if (await isPullRequest()) {
          core.info('Automatic comment enabled. Generating comment...')
          generateComment(githubToken, assetVersionUrl)
        } else {
          core.info(
            "Automatic comment enabled. But this isn't a pull request. Skip generating comment..."
          )
        }
      }
      return response
    } catch (error) {
      core.setOutput('error', error)
      core.setFailed(
        `Caught a ValueError trying to create new asset version and upload binary: ${error}`
      )
    }
  }
}
