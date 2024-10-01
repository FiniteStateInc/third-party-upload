import * as core from '@actions/core'
import * as github from '@actions/github'

export async function isPullRequest(): Promise<true | null> {
  const context = github.context

  if (context.eventName !== 'pull_request') {
    core.info('This context does not belongs to a pull request.')
    return null
  }
  return true
}
async function getPRNumber(): Promise<number | null> {
  if (!(await isPullRequest())) {
    core.info('This context does not belongs to a pull request.')
    return null
  }
  const context = github.context
  const prNumber = context.payload.pull_request?.number

  if (!prNumber) {
    core.setFailed('Pull request number is missing.')
    return null
  }
  return prNumber
}

export async function generateComment(
  githubToken: string,
  assetVersionUrl: string
): Promise<void> {
  const PRNumber = await getPRNumber()
  const context = github.context
  if (PRNumber) {
    const octokit = github.getOctokit(githubToken)

    const commentBody = [
      `**Hello**, Finite State is uploading your scan! :rocket:. \n`,
      `Please, [click here](${assetVersionUrl}) to see the progress of the analysis over your file.`,
      `<br />\n`,
      `[Finite State](https://platform.finitestate.io/)`
    ]

    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: PRNumber,
      body: commentBody.join('')
    })

    core.info(`Commented on PR #${PRNumber}`)
  }
}

export type githubInputParamsType = {
  inputFiniteStateClientId: string
  inputFiniteStateSecret: string
  inputFiniteStateOrganizationContext: string
  inputAssetId: string
  inputVersion: string
  inputFilePath: string
  inputTestType: string

  // non required parameters:
  inputBusinessUnitId: string
  inputCreatedByUserId: string
  inputProductId: string
  inputArtifactDescription: string
  inputAutomaticComment: boolean
  inputGithubToken: string
}
