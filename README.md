# setup-opentofu

The `opentofu/setup-opentofu` action sets up OpenTofu CLI in your GitHub Actions workflow by:

- Downloading the latest version of OpenTofu CLI and adding it to the `PATH`.
- Configuring the [CLI configuration file](https://opentofu.org/docs/cli/config/config-file/) with a Terraform Cloud/Enterprise hostname and API token.
- Installing a wrapper script to wrap subsequent calls of the `tofu` binary and expose its STDOUT, STDERR, and exit code as outputs named `stdout`, `stderr`, and `exitcode` respectively. (This can be optionally skipped if subsequent steps in the same job do not need to access the results of
  OpenTofu commands.)

After you've used the action, subsequent steps in the same job can run arbitrary OpenTofu commands using [the GitHub Actions `run` syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsrun). This allows most OpenTofu commands to work exactly
like they do on your local command line.

## Experimental Status

By using the software in this repository (the "Software"), you acknowledge that: (1) the Software is still in development, may change, and has not been released as a commercial product by OpenTofu; (2) the Software is provided on an "as-is" basis, and may include bugs, errors, or other issues; (3) the Software is NOT INTENDED FOR PRODUCTION USE, use of the Software may result in unexpected results, loss of data, or other unexpected results, and OpenTofu disclaims any and all liability resulting from use of the Software.

## Usage

This action can be run on `ubuntu-latest`, `windows-latest`, and `macos-latest` GitHub Actions runners. When running on `windows-latest` the shell should be set to Bash.

The default configuration installs the latest version of OpenTofu CLI and installs the wrapper script to wrap subsequent calls to the `tofu` binary:

```yaml
steps:
- uses: opentofu/setup-opentofu@v1
```

A specific version of OpenTofu CLI can be installed:

```yaml
steps:
- uses: opentofu/setup-opentofu@v1
  with:
    tofu_version: 1.6.0-alpha1
```

Credentials for Terraform Cloud ([app.terraform.io](https://app.terraform.io/)) can be configured:

```yaml
steps:
- uses: opentofu/setup-opentofu@v1
  with:
    cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}
```

Credentials for Terraform Enterprise (TFE) can be configured:

```yaml
steps:
- uses: opentofu/setup-opentofu@v1
  with:
    cli_config_credentials_hostname: 'tofu.example.com'
    cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}
```

The wrapper script installation can be skipped by setting the `tofu_wrapper` variable to `false`:

```yaml
steps:
- uses: opentofu/setup-opentofu@v1.0.0
  with:
    tofu_wrapper: false
```

Subsequent steps can access outputs when the wrapper script is installed:

```yaml
steps:
- uses: opentofu/setup-opentofu@v1.0.0

- run: tofu init

- id: plan
  run: tofu plan -no-color

- run: echo ${{ steps.plan.outputs.stdout }}
- run: echo ${{ steps.plan.outputs.stderr }}
- run: echo ${{ steps.plan.outputs.exitcode }}
```

Outputs can be used in subsequent steps to comment on the pull request:

> **Notice:** There's a limit to the number of characters inside a GitHub comment (65535).
>
> Due to that limitation, you might end up with a failed workflow run even if the plan succeeded.
>
> Another approach is to append your plan into the $GITHUB_STEP_SUMMARY environment variable which supports markdown.

```yaml
defaults:
  run:
    working-directory: ${{ env.tf_actions_working_dir }}
permissions:
  pull-requests: write
steps:
- uses: actions/checkout@v3
- uses: opentofu/setup-opentofu@v1.0.0

- name: OpenTofu fmt
  id: fmt
  run: tofu fmt -check
  continue-on-error: true

- name: OpenTofu Init
  id: init
  run: tofu init

- name: OpenTofu Validate
  id: validate
  run: tofu validate -no-color

- name: OpenTofu Plan
  id: plan
  run: tofu plan -no-color
  continue-on-error: true

- uses: actions/github-script@v6
  if: github.event_name == 'pull_request'
  env:
    PLAN: "tofu\n${{ steps.plan.outputs.stdout }}"
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    script: |
      const output = `#### OpenTofu Format and Style 🖌\`${{ steps.fmt.outcome }}\`
      #### OpenTofu Initialization ⚙️\`${{ steps.init.outcome }}\`
      #### OpenTofu Validation 🤖\`${{ steps.validate.outcome }}\`
      <details><summary>Validation Output</summary>

      \`\`\`\n
      ${{ steps.validate.outputs.stdout }}
      \`\`\`

      </details>

      #### OpenTofu Plan 📖\`${{ steps.plan.outcome }}\`

      <details><summary>Show Plan</summary>

      \`\`\`\n
      ${process.env.PLAN}
      \`\`\`

      </details>

      *Pusher: @${{ github.actor }}, Action: \`${{ github.event_name }}\`, Working Directory: \`${{ env.tf_actions_working_dir }}\`, Workflow: \`${{ github.workflow }}\`*`;

      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: output
      })
```

Instead of creating a new comment each time, you can also update an existing one:

```yaml
defaults:
  run:
    working-directory: ${{ env.tf_actions_working_dir }}
permissions:
  pull-requests: write
steps:
- uses: actions/checkout@v3
- uses: opentofu/setup-opentofu@v1

- name: OpenTofu fmt
  id: fmt
  run: tofu fmt -check
  continue-on-error: true

- name: OpenTofu Init
  id: init
  run: tofu init

- name: OpenTofu Validate
  id: validate
  run: tofu validate -no-color

- name: OpenTofu Plan
  id: plan
  run: tofu plan -no-color
  continue-on-error: true

- uses: actions/github-script@v6
  if: github.event_name == 'pull_request'
  env:
    PLAN: "tofu\n${{ steps.plan.outputs.stdout }}"
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    script: |
      // 1. Retrieve existing bot comments for the PR
      const { data: comments } = await github.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
      })
      const botComment = comments.find(comment => {
        return comment.user.type === 'Bot' && comment.body.includes('OpenTofu Format and Style')
      })

      // 2. Prepare format of the comment
      const output = `#### OpenTofu Format and Style 🖌\`${{ steps.fmt.outcome }}\`
      #### OpenTofu Initialization ⚙️\`${{ steps.init.outcome }}\`
      #### OpenTofu Validation 🤖\`${{ steps.validate.outcome }}\`
      <details><summary>Validation Output</summary>

      \`\`\`\n
      ${{ steps.validate.outputs.stdout }}
      \`\`\`

      </details>

      #### OpenTofu Plan 📖\`${{ steps.plan.outcome }}\`

      <details><summary>Show Plan</summary>

      \`\`\`\n
      ${process.env.PLAN}
      \`\`\`

      </details>

      *Pusher: @${{ github.actor }}, Action: \`${{ github.event_name }}\`, Working Directory: \`${{ env.tf_actions_working_dir }}\`, Workflow: \`${{ github.workflow }}\`*`;

      // 3. If we have a comment, update it, otherwise create a new one
      if (botComment) {
        github.rest.issues.updateComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          comment_id: botComment.id,
          body: output
        })
      } else {
        github.rest.issues.createComment({
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: output
        })
      }
```

## Inputs

The action supports the following inputs:

- `cli_config_credentials_hostname` - (optional) The hostname of a Terraform Cloud/Enterprise instance to
  place within the credentials block of the OpenTofu CLI configuration file. Defaults to `app.terraform.io`.
- `cli_config_credentials_token` - (optional) The API token for a Terraform Cloud/Enterprise instance to
  place within the credentials block of the OpenTofu CLI configuration file.
- `tofu_version` - (optional) The version of OpenTofu CLI to install. Instead of a full version string,
  you can also specify a constraint string (see [Semver Ranges](https://www.npmjs.com/package/semver#ranges)
  for available range specifications). Examples are: `<1.6.0-beta`, `~1.6.0-alpha`, `1.6.0-alpha2` (all three installing
  the latest available `1.6.0-alpha2` version). Prerelease versions can be specified and a range will stay within the
  given tag such as `beta` or `rc`. If no version is given, it will default to `latest`.
- `tofu_wrapper` - (optional) Whether to install a wrapper to wrap subsequent calls of
  the `tofu` binary and expose its STDOUT, STDERR, and exit code as outputs
  named `stdout`, `stderr`, and `exitcode` respectively. Defaults to `true`.

## Outputs

This action does not configure any outputs directly. However, when you set the `tofu_wrapper` input
to `true`, the following outputs are available for subsequent steps that call the `tofu` binary:

- `stdout` - The STDOUT stream of the call to the `tofu` binary.
- `stderr` - The STDERR stream of the call to the `tofu` binary.
- `exitcode` - The exit code of the call to the `tofu` binary.

## License

[Mozilla Public License v2.0](LICENSE)

## Code of Conduct

[Code of Conduct](CODE_OF_CONDUCT.md)
