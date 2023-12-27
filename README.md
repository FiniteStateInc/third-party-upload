# [Finite State](https://finitestate.io) `third-party-upload` Action

![Finite state logo](./imgs/FS-Logo.png)
[finitestate.io](https://finitestate.io)

<!-- action-docs-description -->

## Description

The `third-party-upload` Github Action allows you to integrate Finite State's third-party upload scanning capabilities into your workflow.

The action will:

- Create a new asset version for an existing asset
- Upload the SBOM, scan, or test output
- Associate the results with the new asset version

By default, the new version adopts the asset's existing values for Business Unit and Created By User. If you need to change these, you can provide IDs for them.

<!-- action-docs-description -->

<!-- action-docs-inputs -->

## Inputs

| parameter | description | required | type | default |
| --- | --- | --- | --- | --- |
| finite-state-client-id            | Finite State API client ID                                                                                                                           | `true`   | `string`   |         |
| finite-state-secret               | Finite State API secret                                                                                                                              | `true`   | `string`   |         |
| finite-state-organization-context | The Organization-Context should have been provided to you by your Finite State representative and looks like `xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`                    | `true`   | `string`   |         |
| asset-id                          | Asset ID for the asset that the new  asset version will belong to                                                                                                             | `true`   | `string`   |         |
| version                           | The name of the asset version that will be created                                                                                                  | `true`   | `string`   |         |
| file-path                         | Local path of the file to be uploaded                                                                                                                   | `true`   | `string`   |         |
| test-type | Test type. This must be one of the list of supported upload types. For the full list of supported upload types, review [this list](https://docs.finitestate.io/supported-file-types). | `true` | `string` |  |
| business-unit-id | (optional) Business Unit ID to assign to the new asset version. If not provided, the existing business unit belonging to the asset will be used. | `false` | `string`  |  |
| created-by-user-id | (optional) Created By User ID to assign to the asset version. If not provided, the existing Created By User for the asset will be used. | `false` | `string`  |  |
| product-id | (optional) Product ID to assign to the asset version. If not provided, the existing product for the asset will be used. | `false` | `string`  |  |
| artifact-description | (optional) Description of the artifact being scanned (e.g. "Source Code Repository", "Container Image"). | `false` | `string`  |  |
<!-- action-docs-inputs -->

<!-- action-docs-outputs -->

## Outputs

| parameter | description |
| --- | --- |
| response | Response from Finite State servers. |
| error | Error message or details on why the action failed. |
| asset-version-url | URL to view your results in the Finite State Platform |

<!-- action-docs-outputs -->

## Set Up Workflow

To start using this action, you must generate a job within a GitHub Workflow. You can either create a [new GitHub Workflow](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions) or use an existing one that aligns with your use case.

After selecting a GitHub Workflow, proceed to [customize the events](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows) that will activate the workflow, such as pull requests or scheduled events:

**Example**:

```yaml
name: Your workflow
on:
  pull_request:
    branches:
      - main
  schedule:
    - cron: "0 0 * * *"
```

## Usage of this Action

You will also need to add some code into your workflow. We have provided an example below. Note, in the example, we only include the required parameters. Refer to the **Inputs** section for more details, including descriptions of optional fields.

**Example:**

```yaml
uses: @FiniteStateInc/third-party-upload@v1.0.0
with:
  finite-state-client-id: ${{ secrets.CLIENT_ID }}
  finite-state-secret: ${{ secrets.CLIENT_SECRET }}
  finite-state-organization-context: ${{ secrets.ORGANIZATION_CONTEXT }}
  asset-id: # The ID of the Asset associated with this scan
  version: # The name of the new Asset Version that will be created
  file-path: # The path to the file that will be uploaded to the Finite State Platform (e.g., ./cyclonedx.sbom.json)
  test-type: # The type of third-party scan being uploaded (e.g., cyclonedx). See below for more details.
```

Possible `test-types` values can be found at [this link](https://github.com/FiniteStateInc/finite-state-asoc/blob/5f04a982501ab37c9356cddc6e5c65ac6d6a563a/graphql-api/business/src/resolvers/mutations/uploads/accepted_test_types.py#L7).

## Action Debugging

All details pertaining to the execution of the action will be recorded. You can review this information in the workflow execution logs, which is a helpful starting point if you encounter any errors during the action's run.

![logging example](./imgs/debug_info.png)

## Extended Feature Example (optional)

In this section, we provide a code snippet for integrating this action into your existing workflow. Primarily, it uploads the file to the Finite State Platform for analysis. Once that process is completed, it uses the output of that job to automatically add a comment to the pull request, including a link pointing to the Finite State Binary Analysis URL for the uploaded file. You can customize the comment as desired or utilize the outputs of the action to construct your own.

The job, named `show-link-as-comment`, is responsible for generating the comment using the output provided by the action.

Ensure to replace certain values, as indicated in the example workflow:

```yaml
name: Build

on:
  pull_request:
    branches:
      - main
  schedule:
    - cron: "0 0 * * *" # At 00:00 every day

env:
  CLIENT_ID: ${{ secrets.CLIENT_ID }}
  CLIENT_SECRET: ${{ secrets.CLIENT_SECRET }}
  ORGANIZATION_CONTEXT: ${{ secrets.ORGANIZATION_CONTEXT }}
  ASSET_ID: # Complete with your Asset ID

jobs:
  finitestate-third-party-upload:
    runs-on: ubuntu-latest
    steps:
      - name: checkout repo content
        uses: actions/checkout@v3
        with:
          ref: ${{ github.event.pull_request.head.ref }}

      # - name: (Potentially) Generate SBOM
      # Uncomment the previous line and add the steps to conduct your third-party scan (which likely already exist) based on the project

      - name: Upload third-party scan
        uses: actions/upload-artifact@v3
        with:
          name: third-party-artifact
          path: # The path to the scan results generated in the previous step

      - name: Get commit hash to use as version # Optional step to auto tag the version
        id: commit_hash
        run: |
          echo "COMMIT_HASH=$(git rev-parse --short HEAD)" >> $GITHUB_ENV

      - name: SBOM analysis
        uses: @FiniteStateInc/third-party-upload@v1.0.0
        id: third_party_upload
        with:
          finite-state-client-id: ${{ secrets.CLIENT_ID }}
          finite-state-secret: ${{ secrets.CLIENT_SECRET }}
          finite-state-organization-context: ${{ secrets.ORGANIZATION_CONTEXT }}
          asset-id: ${{env.ASSET_ID}}
          version: ${{env.COMMIT_HASH}} # You can name this version anything you'd like. Here, we're using the git commit hash associated with the current run.
          file-path: # Add the same path of the "Upload third-party scan" step here.
          test-type: # The type of third-party scan being uploaded (e.g., cyclonedx)

      - name: Set response of binary quick scan
        if: steps.third_party_upload.outcome=='success'
        id: set_response
        run: |
          echo Asset version URL: ${{steps.third_party_upload.outputs.asset-version-url}}
          echo Response: "${{steps.third_party_upload.outputs.response}}"
          echo Error: "${{steps.third_party_upload.outputs.error}}"
    outputs:
      ASSET_VERSION_URL: ${{steps.third_party_upload.outputs.asset-version-url}}
      ERROR: ${{steps.third_party_upload.outputs.error}}
      RESPONSE: ${{steps.third_party_upload.outputs.response}}

  show-link-as-comment: # This job generates a comment automatically in the PR in order to link to the Finite State Platform
    needs: finitestate-third-party-upload
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - name: Add link to finitestate
        uses: mshick/add-pr-comment@v2
        with:
          message: |
            **Hello**, Finite State is uploading your scan! :rocket:.
            Please <a href="${{needs.finitestate-third-party-upload.outputs.ASSET_VERSION_URL}}">click here</a> to see the progress of the analysis over your file.
            <br />

            <a href="https://platform.finitestate.io/">Finite State</a>
          message-failure: |
            **Hello**, We're sorry, but something went wrong. Please contact Finite State Support.
            <a href="https://platform.finitestate.io/">Finite State</a>
```
