# Multi-Channel Notification

A **Node.js** GitHub Action that sends notifications to **10 platforms** using [Apprise](https://github.com/caronc/apprise). Zero npm dependencies at runtime — the script uses only Node.js built-ins.

Provide content in one of two ways:

- **Preset** — pick a built-in template (`workflow`, `deployment`, `release`) and the action fills in title and message from GitHub context automatically.
- **Custom** — supply your own `title` and `message` directly.

## Supported Platforms

| Platform | Channel Key | Apprise URL Format |
|---|---|---|
| **Slack** | `slack` | `slack://botname@T.../A.../W.../#channel` |
| **Discord** | `discord` | `discord://webhook_id/webhook_token` |
| **Telegram** | `telegram` | `tgram://bottoken/chatid` |
| **Microsoft Teams** | `teams` | `msteams://TokenA/TokenB/TokenC/TokenD` |
| **Google Chat** | `gchat` | `gchat://workspace/key/token` |
| **Email** | `email` | `mailtos://user:pass@gmail.com` |
| **AWS SNS** | `sns` | `sns://AccessKeyID/SecretKey/Region/Topic` |
| **Gotify** | `gotify` | `gotify://hostname/token` |
| **ntfy** | `ntfy` | `ntfy://ntfy.sh/your-topic` |
| **Generic Webhook** | `webhook` | `json://hostname/path` |

---

## Quick Start

### Using a preset

```yaml
- name: Notify workflow result
  uses: HasanHajHasan/multi-channel-notification-node@v1
  if: always()
  with:
    preset:    workflow
    channels:  slack,telegram
    slack_url:    ${{ secrets.SLACK_URL }}
    telegram_url: ${{ secrets.TELEGRAM_URL }}
```

### Using custom content

```yaml
- name: Notify deployment
  uses: HasanHajHasan/multi-channel-notification-node@v1
  with:
    title:    "Deployed to Production"
    message:  "Version ${{ env.VERSION }} is live."
    channels: slack,email
    slack_url: ${{ secrets.SLACK_URL }}
    email_url: ${{ secrets.EMAIL_URL }}
```

---

## Inputs

### General

| Input | Description | Required | Default |
|---|---|---|---|
| `preset` | Built-in content preset: `workflow` \| `deployment` \| `release` | No | _(none)_ |
| `title` | Notification title. Required when `preset` is not set; overrides preset title when both provided. | Conditional | _(none)_ |
| `message` | Notification body. Required when `preset` is not set; overrides preset message when both provided. | Conditional | _(none)_ |
| `channels` | Comma-separated list of channel keys to notify | No | `slack` |
| `debug` | Enable verbose Apprise output (`true`/`false`) | No | `false` |

### Built-in Presets

Each preset generates a `title` and `message` from GitHub context. You can override either field individually.

| Preset | Generated Title | Message Contains |
|---|---|---|
| `workflow` | `Workflow: {WORKFLOW} [{BRANCH}]` | repository, branch, workflow, commit, author, run URL |
| `deployment` | `Deployment: {REPOSITORY} → {BRANCH}` | repository, branch, commit, author, run URL |
| `release` | `Release: {REPOSITORY} @ {BRANCH}` | repository, tag, commit, author, release URL |

### URLs

Store these as **GitHub Secrets** and pass them via `secrets.*`.

| Input | Platform |
|---|---|
| `slack_url` | Slack |
| `discord_url` | Discord |
| `telegram_url` | Telegram |
| `teams_url` | Microsoft Teams |
| `gchat_url` | Google Chat |
| `email_url` | Email |
| `sns_url` | AWS SNS |
| `gotify_url` | Gotify |
| `ntfy_url` | ntfy |
| `webhook_url` | Generic JSON Webhook |

### Custom Templates

Override the built-in platform template by pointing to a file in your repo (path relative to the repo root).

| Input | Applies to |
|---|---|
| `slack_template` | Slack |
| `discord_template` | Discord |
| `telegram_template` | Telegram |
| `teams_template` | Microsoft Teams |
| `gchat_template` | Google Chat |
| `email_template` | Email (HTML) |
| `sns_template` | AWS SNS |
| `gotify_template` | Gotify |
| `ntfy_template` | ntfy |
| `webhook_template` | Generic Webhook |

---

## Template Variables

These placeholders are replaced in all template files:

| Variable | Description |
|---|---|
| `{TITLE}` | Notification title |
| `{MESSAGE}` | Notification body |
| `{REPOSITORY}` | `owner/repo` |
| `{BRANCH}` | Git branch or tag name |
| `{WORKFLOW}` | Workflow name |
| `{COMMIT}` | Full commit SHA |
| `{AUTHOR}` | GitHub actor |
| `{RUN_URL}` | Direct URL to the workflow run |

---

## Usage Examples

### Notify on every job result (preset)

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Build
    run: npm run build

  - name: Notify result
    uses: HasanHajHasan/multi-channel-notification-node@v1
    if: always()
    with:
      preset:      workflow
      channels:    slack,discord,email
      slack_url:   ${{ secrets.SLACK_URL }}
      discord_url: ${{ secrets.DISCORD_URL }}
      email_url:   ${{ secrets.EMAIL_URL }}
```

### Deployment notification (preset + title override)

```yaml
- name: Notify deployment
  uses: HasanHajHasan/multi-channel-notification-node@v1
  with:
    preset:    deployment
    title:     "Production deploy — v${{ env.VERSION }}"
    channels:  slack,teams
    slack_url: ${{ secrets.SLACK_URL }}
    teams_url: ${{ secrets.TEAMS_URL }}
```

### Fully custom content

```yaml
- name: Custom notification
  uses: HasanHajHasan/multi-channel-notification-node@v1
  with:
    title:    "Database migration complete"
    message:  "All migrations ran successfully on production."
    channels: slack,telegram
    slack_url:    ${{ secrets.SLACK_URL }}
    telegram_url: ${{ secrets.TELEGRAM_URL }}
```

### All 10 channels

```yaml
- uses: HasanHajHasan/multi-channel-notification-node@v1
  if: always()
  with:
    preset:       workflow
    channels:     slack,discord,telegram,teams,gchat,email,sns,gotify,ntfy,webhook
    slack_url:    ${{ secrets.SLACK_URL }}
    discord_url:  ${{ secrets.DISCORD_URL }}
    telegram_url: ${{ secrets.TELEGRAM_URL }}
    teams_url:    ${{ secrets.TEAMS_URL }}
    gchat_url:    ${{ secrets.GCHAT_URL }}
    email_url:    ${{ secrets.EMAIL_URL }}
    sns_url:      ${{ secrets.SNS_URL }}
    gotify_url:   ${{ secrets.GOTIFY_URL }}
    ntfy_url:     ${{ secrets.NTFY_URL }}
    webhook_url:  ${{ secrets.WEBHOOK_URL }}
```

### Custom template file

Create `.github/notifications/slack.txt` in your repo:

```
*{TITLE}*

{MESSAGE}

Repository: {REPOSITORY} | Branch: {BRANCH}
<{RUN_URL}|View Run>
```

Reference it in the action:

```yaml
- uses: HasanHajHasan/multi-channel-notification-node@v1
  with:
    title:          "Build finished"
    message:        "All checks passed."
    channels:       slack
    slack_url:      ${{ secrets.SLACK_URL }}
    slack_template: .github/notifications/slack.txt
```

---

## Platform URL Guides

### Slack
Create an incoming webhook or bot token: [Apprise Slack docs](https://github.com/caronc/apprise/wiki/Notify_slack)

```
slack://botname@TokenA/TokenB/TokenC/#channel
```

### Discord
Create a webhook in your Discord channel settings: [Apprise Discord docs](https://github.com/caronc/apprise/wiki/Notify_discord)

```
discord://webhook_id/webhook_token
```

### Telegram
Create a bot via [@BotFather](https://t.me/botfather) and get your chat ID: [Apprise Telegram docs](https://github.com/caronc/apprise/wiki/Notify_telegram)

```
tgram://bottoken/chatid
```

### Microsoft Teams
Create an incoming webhook connector in your Teams channel: [Apprise Teams docs](https://github.com/caronc/apprise/wiki/Notify_msteams)

```
msteams://TokenA/TokenB/TokenC/TokenD
```

### Google Chat
Create a webhook in your Google Chat space: [Apprise Google Chat docs](https://github.com/caronc/apprise/wiki/Notify_googlechat)

```
gchat://workspace/key/token
```

### Email (Gmail)
Use an [App Password](https://myaccount.google.com/apppasswords): [Apprise Email docs](https://github.com/caronc/apprise/wiki/Notify_email)

```
mailtos://user:apppassword@gmail.com
```

### AWS SNS
IAM user with `sns:Publish` permission: [Apprise SNS docs](https://github.com/caronc/apprise/wiki/Notify_sns)

```
sns://AccessKeyID/SecretAccessKey/us-east-1/TopicName
```

### Gotify
Self-hosted push server: [Apprise Gotify docs](https://github.com/caronc/apprise/wiki/Notify_gotify)

```
gotify://your-server.com/apptoken
gotifys://your-server.com/apptoken    # TLS
```

### ntfy
Push to phone/desktop via [ntfy.sh](https://ntfy.sh) or self-hosted: [Apprise ntfy docs](https://github.com/caronc/apprise/wiki/Notify_ntfy)

```
ntfy://ntfy.sh/your-unique-topic
ntfy://your-server.com/topic          # self-hosted
```

### Generic JSON Webhook
Any HTTP endpoint accepting a POST request: [Apprise JSON docs](https://github.com/caronc/apprise/wiki/Notify_Custom_JSON)

```
json://hostname/path          # HTTP
jsons://hostname/path         # HTTPS
form://hostname/path          # form-encoded
xml://hostname/path           # XML body
```

---

## License

MIT


| Platform | Channel Key | Apprise URL Format |
|---|---|---|
| **Slack** | `slack` | `slack://botname@T.../A.../W.../#channel` |
| **Discord** | `discord` | `discord://webhook_id/webhook_token` |
| **Telegram** | `telegram` | `tgram://bottoken/chatid` |
| **Microsoft Teams** | `teams` | `msteams://TokenA/TokenB/TokenC/TokenD` |
| **Google Chat** | `gchat` | `gchat://workspace/key/token` |
| **Email** | `email` | `mailtos://user:pass@gmail.com` |
| **AWS SNS** | `sns` | `sns://AccessKeyID/SecretKey/Region/Topic` |
| **Gotify** | `gotify` | `gotify://hostname/token` |
| **ntfy** | `ntfy` | `ntfy://ntfy.sh/your-topic` |
| **Generic Webhook** | `webhook` | `json://hostname/path` |

---

## Quick Start

```yaml
- name: Notify on failure
  uses: HasanHajHasan/multi-channel-notification-node@v1
  if: failure()
  with:
    status: ${{ job.status }}
    channels: slack,telegram
    slack_url:    ${{ secrets.SLACK_URL }}
    telegram_url: ${{ secrets.TELEGRAM_URL }}
```

---

## Inputs

### General

| Input | Description | Default |
|---|---|---|
| `status` | Job status: `success` \| `failure` \| `cancelled` \| custom | `failure` |
| `job_name` | Job name shown in the notification | `${{ github.job }}` |
| `channels` | Comma-separated list of channel keys to notify | `slack` |
| `title` | Custom notification title (overrides auto-generated title) | _(auto)_ |
| `message` | Custom message body — **skips built-in templates** when set | _(auto)_ |
| `debug` | Enable verbose Apprise output (`true`/`false`) | `false` |

### URLs

Store these as **GitHub Secrets** and pass them via `secrets.*`.

| Input | Platform |
|---|---|
| `slack_url` | Slack |
| `discord_url` | Discord |
| `telegram_url` | Telegram |
| `teams_url` | Microsoft Teams |
| `gchat_url` | Google Chat |
| `email_url` | Email |
| `sns_url` | AWS SNS |
| `gotify_url` | Gotify |
| `ntfy_url` | ntfy |
| `webhook_url` | Generic JSON Webhook |

### Custom Templates

Override the built-in template for any channel by pointing to your own file (path relative to the repo root):

| Input | Applies to |
|---|---|
| `slack_template` | Slack |
| `discord_template` | Discord |
| `telegram_template` | Telegram |
| `teams_template` | Microsoft Teams |
| `gchat_template` | Google Chat |
| `email_template` | Email (HTML) |
| `sns_template` | AWS SNS |
| `gotify_template` | Gotify |
| `ntfy_template` | ntfy |
| `webhook_template` | Generic Webhook |

---

## Template Variables

These placeholders are replaced in all template files:

| Variable | Description |
|---|---|
| `{EMOJI}` | Status emoji — 🟢 / 🔴 / ⚪️ / 🔵 |
| `{STATUS}` | Raw status string |
| `{COLOR}` | CSS class — `success` / `danger` / `warning` / `info` |
| `{TITLE}` | Notification title |
| `{MESSAGE}` | Full message body |
| `{REPOSITORY}` | `owner/repo` |
| `{BRANCH}` | Git branch name |
| `{WORKFLOW}` | Workflow name |
| `{JOB}` | Job name |
| `{COMMIT}` | Full commit SHA |
| `{AUTHOR}` | GitHub actor |
| `{RUN_URL}` | Direct URL to the workflow run |

---

## Usage Examples

### Notify on every job result

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Build
    run: npm run build

  - name: Notify result
    uses: HasanHajHasan/multi-channel-notification-node@v1
    if: always()
    with:
      status:      ${{ job.status }}
      channels:    slack,discord,email
      slack_url:   ${{ secrets.SLACK_URL }}
      discord_url: ${{ secrets.DISCORD_URL }}
      email_url:   ${{ secrets.EMAIL_URL }}
```

### Deployment success notification

```yaml
- name: Notify deployment
  uses: HasanHajHasan/multi-channel-notification-node@v1
  with:
    status:   success
    channels: slack,telegram
    title:    "🚀 Deployed to Production"
    message:  "Version ${{ env.VERSION }} is live."
    slack_url:    ${{ secrets.SLACK_URL }}
    telegram_url: ${{ secrets.TELEGRAM_URL }}
```

### All 10 channels

```yaml
- uses: HasanHajHasan/multi-channel-notification-node@v1
  if: always()
  with:
    status:       ${{ job.status }}
    channels:     slack,discord,telegram,teams,gchat,email,sns,gotify,ntfy,webhook
    slack_url:    ${{ secrets.SLACK_URL }}
    discord_url:  ${{ secrets.DISCORD_URL }}
    telegram_url: ${{ secrets.TELEGRAM_URL }}
    teams_url:    ${{ secrets.TEAMS_URL }}
    gchat_url:    ${{ secrets.GCHAT_URL }}
    email_url:    ${{ secrets.EMAIL_URL }}
    sns_url:      ${{ secrets.SNS_URL }}
    gotify_url:   ${{ secrets.GOTIFY_URL }}
    ntfy_url:     ${{ secrets.NTFY_URL }}
    webhook_url:  ${{ secrets.WEBHOOK_URL }}
```

### Custom template

Create `.github/notifications/slack.txt` in your repo:

```
{EMOJI} *{TITLE}*
Environment: production
Triggered by: {AUTHOR}
<{RUN_URL}|View Details>
```

Reference it in the action:

```yaml
- uses: HasanHajHasan/multi-channel-notification-node@v1
  with:
    channels:       slack
    slack_url:      ${{ secrets.SLACK_URL }}
    slack_template: .github/notifications/slack.txt
```

---

## Platform URL Guides

### Slack
Create an incoming webhook or bot token: [Apprise Slack docs](https://github.com/caronc/apprise/wiki/Notify_slack)

```
slack://botname@TokenA/TokenB/TokenC/#channel
```

### Discord
Create a webhook in your Discord channel settings: [Apprise Discord docs](https://github.com/caronc/apprise/wiki/Notify_discord)

```
discord://webhook_id/webhook_token
```

### Telegram
Create a bot via [@BotFather](https://t.me/botfather) and get your chat ID: [Apprise Telegram docs](https://github.com/caronc/apprise/wiki/Notify_telegram)

```
tgram://bottoken/chatid
```

### Microsoft Teams
Create an incoming webhook connector in your Teams channel: [Apprise Teams docs](https://github.com/caronc/apprise/wiki/Notify_msteams)

```
msteams://TokenA/TokenB/TokenC/TokenD
```

### Google Chat
Create a webhook in your Google Chat space: [Apprise Google Chat docs](https://github.com/caronc/apprise/wiki/Notify_googlechat)

```
gchat://workspace/key/token
```

### Email (Gmail)
Use an [App Password](https://myaccount.google.com/apppasswords): [Apprise Email docs](https://github.com/caronc/apprise/wiki/Notify_email)

```
mailtos://user:apppassword@gmail.com
```

### AWS SNS
IAM user with `sns:Publish` permission: [Apprise SNS docs](https://github.com/caronc/apprise/wiki/Notify_sns)

```
sns://AccessKeyID/SecretAccessKey/us-east-1/TopicName
```

### Gotify
Self-hosted push server: [Apprise Gotify docs](https://github.com/caronc/apprise/wiki/Notify_gotify)

```
gotify://your-server.com/apptoken
gotifys://your-server.com/apptoken    # TLS
```

### ntfy
Push to phone/desktop via [ntfy.sh](https://ntfy.sh) or self-hosted: [Apprise ntfy docs](https://github.com/caronc/apprise/wiki/Notify_ntfy)

```
ntfy://ntfy.sh/your-unique-topic
ntfy://your-server.com/topic          # self-hosted
```

### Generic JSON Webhook
Any HTTP endpoint accepting a POST request: [Apprise JSON docs](https://github.com/caronc/apprise/wiki/Notify_Custom_JSON)

```
json://hostname/path          # HTTP
jsons://hostname/path         # HTTPS
form://hostname/path          # form-encoded
xml://hostname/path           # XML body
```

---

## License

MIT
