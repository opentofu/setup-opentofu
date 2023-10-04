# setup-opentofu

[![Continuous Integration](https://github.com/opentofu/setup-opentofu/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/opentofu/setup-opentofu/actions/workflows/continuous-integration.yml)
[![Setup OpenTofu](https://github.com/opentofu/setup-opentofu/actions/workflows/setup-opentofu.yml/badge.svg)](https://github.com/opentofu/setup-opentofu/actions/workflows/setup-opentofu.yml)

The `opentofu/setup-opentofu` action is a JavaScript action that sets up OpenTofu CLI in your GitHub Actions workflow by:

- Downloading a specific version of OpenTofu CLI and adding it to the `PATH`.
- Installing a wrapper script to wrap subsequent calls of the `opentofu` binary and expose its STDOUT, STDERR, and exit code as outputs named `stdout`, `stderr`, and `exitcode` respectively. (This can be optionally skipped if subsequent steps in the same job do not need to access the results of OpenTofu commands.)

After you've used the action, subsequent steps in the same job can run arbitrary OpenTofu commands using [the GitHub Actions `run` syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsrun). This allows most OpenTofu commands to work exactly like they do on your local command line.

## Usage

This action can be run on `ubuntu-latest`, `windows-latest`, and `macos-latest` GitHub Actions runners. When running on `windows-latest` the shell should be set to Bash.

The default configuration installs the latest version of OpenTofu CLI and installs the wrapper script to wrap subsequent calls to the `opentofu` binary:

```yaml
steps:
- uses: opentofu/setup-opentofu@v2
```

A specific version of OpenTofu CLI can be installed:

```yaml
steps:
- uses: opentofu/setup-opentofu@v2
  with:
    opentofu_version: 1.1.7
```

The wrapper script installation can be skipped by setting the `opentofu_wrapper` variable to `false`:

```yaml
steps:
- uses: opentofu/setup-opentofu@v2
  with:
    opentofu_wrapper: false
```

Subsequent steps can access outputs when the wrapper script is installed:

```yaml
steps:
- uses: opentofu/setup-opentofu@v2

- run: opentofu init

- id: plan
  run: opentofu plan -no-color

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
- uses: opentofu/setup-opentofu@v2

- name: OpenTofu fmt
  id: fmt
  run: opentofu fmt -check
  continue-on-error: true

- name: OpenTofu Init
  id: init
  run: opentofu init

- name: OpenTofu Validate
  id: validate
  run: opentofu validate -no-color

- name: OpenTofu Plan
  id: plan
  run: opentofu plan -no-color
  continue-on-error: true

- uses: actions/github-script@v6
  if: github.event_name == 'pull_request'
  env:
    PLAN: "opentofu\n${{ steps.plan.outputs.stdout }}"
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
- uses: opentofu/setup-opentofu@v2

- name: OpenTofu fmt
  id: fmt
  run: opentofu fmt -check
  continue-on-error: true

- name: OpenTofu Init
  id: init
  run: opentofu init

- name: OpenTofu Validate
  id: validate
  run: opentofu validate -no-color

- name: OpenTofu Plan
  id: plan
  run: opentofu plan -no-color
  continue-on-error: true

- uses: actions/github-script@v6
  if: github.event_name == 'pull_request'
  env:
    PLAN: "opentofu\n${{ steps.plan.outputs.stdout }}"
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

- `opentofu_version` - (optional) The version of OpenTofu CLI to install. Instead of a full version string,
   you can also specify a constraint string (see [Semver Ranges](https://www.npmjs.com/package/semver#ranges)
   for available range specifications). Examples are: `<1.2.0`, `~1.1.0`, `1.1.7` (all three installing
   the latest available `1.1` version). Prerelease versions can be specified and a range will stay within the
   given tag such as `beta` or `rc`. If no version is given, it will default to `latest`.
- `opentofu_wrapper` - (optional) Whether to install a wrapper to wrap subsequent calls of
   the `opentofu` binary and expose its STDOUT, STDERR, and exit code as outputs
   named `stdout`, `stderr`, and `exitcode` respectively. Defaults to `true`.

## Outputs

This action does not configure any outputs directly. However, when you set the `opentofu_wrapper` input
to `true`, the following outputs are available for subsequent steps that call the `opentofu` binary:

- `stdout` - The STDOUT stream of the call to the `opentofu` binary.
- `stderr` - The STDERR stream of the call to the `opentofu` binary.
- `exitcode` - The exit code of the call to the `opentofu` binary.
