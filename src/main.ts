import * as core from '@actions/core'
import { uploadThirdParty } from './upload_third_party'
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    core.debug(
      `Starting execute upload third party ${new Date().toTimeString()}`
    )
    await uploadThirdParty()

    core.debug(`Finish execute upload third party ${new Date().toTimeString()}`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.debug(`Error executing upload third party ${JSON.stringify(error)}`)
    if (error instanceof Error) core.setFailed(error.message)
  }
}
