# setup-opentofu

The `opentofu/setup-opentofu` action sets up OpenTofu CLI in your GitHub Actions workflow by:

- [ ] Downloading the latest version of OpenTofu CLI and adding it to the `PATH`.
- [ ] Configuring the [CLI configuration file](https://www.terraform.io/docs/commands/cli-config.html) with a Terraform Cloud/Enterprise hostname and API token.
- [ ] Installing a wrapper script to wrap subsequent calls of the `tofu` binary and expose its STDOUT, STDERR, and exit code as outputs named `stdout`, `stderr`, and `exitcode` respectively. (This can be optionally skipped if subsequent steps in the same job do not need to access the results of
  OpenTofu commands.)

After you've used the action, subsequent steps in the same job can run arbitrary OpenTofu commands using [the GitHub Actions `run` syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsrun). This allows most OpenTofu commands to work exactly
like they do on your local command line.

## Usage

This action can be run on `ubuntu-latest`, `windows-latest`, and `macos-latest` GitHub Actions runners. When running on `windows-latest` the shell should be set to Bash.

The default configuration installs the latest version of OpenTofu CLI and installs the wrapper script to wrap subsequent calls to the `tofu` binary:

```yaml
steps:
- uses: opentofu/setup-opentofu
```

## Inputs

The action supports the following inputs:

- `cli_config_credentials_hostname` - (optional) The hostname of a Terraform Cloud/Enterprise instance to
  place within the credentials block of the OpenTofu CLI configuration file. Defaults to `app.terraform.io`.
- `cli_config_credentials_token` - (optional) The API token for a Terraform Cloud/Enterprise instance to
  place within the credentials block of the OpenTofu CLI configuration file.
- `tofu_version` - (optional) The version of OpenTofu CLI to install. If no version is given, it will default to `latest`.
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

## Experimental Status

By using the software in this repository (the "Software"), you acknowledge that: (1) the Software is still in development, may change, and has not been released as a commercial product by OpenTofu; (2) the Software is provided on an "as-is" basis, and may include bugs, errors, or other issues; (3) the Software is NOT INTENDED FOR PRODUCTION USE, use of the Software may result in unexpected results, loss of data, or other unexpected results, and OpenTofu disclaims any and all liability resulting from use of the Software.
