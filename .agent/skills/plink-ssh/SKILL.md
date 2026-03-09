---
name: plink-ssh
description: >
  Remote SSH access to AlmaLinux 9.7 server via PuTTY plink using persistent session.
  Use this skill when the user needs to execute commands on the remote AlmaLinux server,
  manage services, install packages, transfer files, check system status,
  or perform any remote administration tasks.
  Trigger phrases: "ssh", "remote", "server", "almalinux", "plink",
  "run on server", "execute remotely", "check server", "172.168.1.204"
---

# Plink SSH Skill — AlmaLinux 9.7 Remote Access (Persistent Session)

## Server Information

| Property       | Value                                |
|----------------|--------------------------------------|
| **Host**       | `172.168.1.204`                      |
| **Port**       | `22`                                 |
| **Username**   | `komsun`                             |
| **Password**   | `n11111111111`                       |
| **OS**         | AlmaLinux 9.7 (Moss Jungle Cat)      |
| **OS Family**  | RHEL 9 / CentOS / Fedora compatible  |
| **User UID**   | 1000 (non-root)                      |
| **Sudo**       | ✅ **Available** — user has sudo privileges   |
| **Plink Path** | `C:\Program Files\PuTTY\plink.exe`   |

### Available System Tools

| Tool            | Path                  |
|-----------------|-----------------------|
| `systemctl`     | `/usr/bin/systemctl`  |
| `dnf`           | `/usr/bin/dnf`        |
| `firewall-cmd`  | `/usr/bin/firewall-cmd` |

---

## Persistent Session Workflow

> [!IMPORTANT]
> **ALWAYS use a persistent SSH session.** Open ONE session, keep it alive, and send all commands to it.
> Do NOT open a new plink connection for every command — it wastes time and resources.

### Step 1: Open a Persistent SSH Session

Use `run_command` to start an interactive plink session. This gives you a **CommandId** to reuse:

```bash
plink -ssh -P 22 -l komsun -pw n11111111111 -batch 172.168.1.204
```

**Important `run_command` settings:**
- `WaitMsBeforeAsync`: `3000` (wait for connection to establish)
- `SafeToAutoRun`: `false` (require user approval on first connection)

**Save the returned `CommandId`** — you will use it for ALL subsequent commands.

### Step 2: Send Commands to the Session

Use `send_command_input` with the **same CommandId** from Step 1:

- **Input**: The command to execute, **must end with a newline character**
- **WaitMs**: Time to wait for output (adjust based on expected command duration)
  - Simple commands (ls, cat, echo): `2000`–`3000`
  - Medium commands (dnf search, find): `5000`–`10000`
  - Long commands (dnf install, updates): `10000`+
- **SafeToAutoRun**: `true` for read-only commands, `false` for commands that modify state

### Step 3: Read Output

The output from `send_command_input` includes the command's response. If you need to check later, use `command_status` with the same **CommandId**.

### Step 4: Close the Session (When Done)

Use `send_command_input` with `Terminate: true` to close the session:

```
CommandId: <the-session-command-id>
Terminate: true
```

---

## Command Patterns

### Basic Command

```
Input: "hostname\n"
WaitMs: 2000
SafeToAutoRun: true
```

### Command with Sudo

```
Input: "echo n11111111111 | sudo -S COMMAND 2>&1\n"
WaitMs: 3000
SafeToAutoRun: false
```

> [!TIP]
> Always append `2>&1` to sudo commands to capture the password prompt in stdout,
> preventing it from mixing with the output unpredictably.

### Multiple Commands in One Input

```
Input: "echo '===START==='; hostname; uptime; df -h; echo '===END==='\n"
WaitMs: 3000
SafeToAutoRun: true
```

> [!TIP]
> Wrapping output with `===START===` and `===END===` markers makes it easier to parse
> the relevant output from the shell prompt noise.

---

## Complete Usage Example

Here is the exact workflow an agent should follow:

### 1. Open Session

```
Tool: run_command
CommandLine: plink -ssh -P 22 -l komsun -pw n11111111111 -batch 172.168.1.204
Cwd: d:\datacenter
WaitMsBeforeAsync: 3000
SafeToAutoRun: false
→ Returns CommandId: "abc-123-def"
```

### 2. Run a Read-Only Command

```
Tool: send_command_input
CommandId: "abc-123-def"
Input: "df -h\n"
WaitMs: 3000
SafeToAutoRun: true
```

### 3. Run a Sudo Command

```
Tool: send_command_input
CommandId: "abc-123-def"
Input: "echo n11111111111 | sudo -S systemctl restart nginx 2>&1\n"
WaitMs: 5000
SafeToAutoRun: false
```

### 4. Close Session When Finished

```
Tool: send_command_input
CommandId: "abc-123-def"
Terminate: true
WaitMs: 1000
SafeToAutoRun: true
```

---

## Common AlmaLinux Operations

All commands below are the **Input** to send via `send_command_input` to the persistent session.

### System Information

```bash
# OS version
cat /etc/os-release

# Kernel version
uname -r

# Disk usage
df -h

# Memory usage
free -h

# CPU info
lscpu

# System uptime and load
uptime

# Running processes (top 20 by CPU)
ps aux --sort=-%cpu | head -20
```

### Service Management (systemctl)

```bash
# Check service status
systemctl status nginx

# List active services
systemctl list-units --type=service --state=active

# List enabled services
systemctl list-unit-files --type=service --state=enabled

# Check if a service is active
systemctl is-active nginx

# Start a service (sudo)
echo n11111111111 | sudo -S systemctl start nginx 2>&1

# Stop a service (sudo)
echo n11111111111 | sudo -S systemctl stop nginx 2>&1

# Restart a service (sudo)
echo n11111111111 | sudo -S systemctl restart nginx 2>&1

# Enable a service at boot (sudo)
echo n11111111111 | sudo -S systemctl enable nginx 2>&1
```

### Package Management (dnf)

```bash
# List installed packages
dnf list installed

# Search for a package
dnf search nginx

# Check if a package is installed
rpm -q nginx

# List available updates
dnf check-update

# Install a package (sudo)
echo n11111111111 | sudo -S dnf install -y nginx 2>&1

# Remove a package (sudo)
echo n11111111111 | sudo -S dnf remove -y nginx 2>&1

# Update all packages (sudo)
echo n11111111111 | sudo -S dnf update -y 2>&1
```

### Firewall (firewall-cmd)

```bash
# Check firewall status
systemctl status firewalld

# List open ports
firewall-cmd --list-all

# List active zones
firewall-cmd --get-active-zones

# Open a port (sudo)
echo n11111111111 | sudo -S firewall-cmd --permanent --add-port=8080/tcp 2>&1

# Reload firewall (sudo)
echo n11111111111 | sudo -S firewall-cmd --reload 2>&1
```

### Network

```bash
# Show IP addresses
ip addr show

# Show routing table
ip route

# Check DNS resolution
cat /etc/resolv.conf

# Test connectivity
ping -c 3 8.8.8.8

# Show listening ports
ss -tlnp
```

### File Operations

```bash
# List files
ls -la /home/komsun/

# Read a file
cat /home/komsun/somefile.txt

# Create a file
echo 'content' > /home/komsun/newfile.txt

# Create a directory
mkdir -p /home/komsun/newdir

# Find files
find /home/komsun -name '*.log' -type f

# Disk usage of a directory
du -sh /home/komsun/*
```

### Log Viewing

```bash
# View system logs (last 50 lines)
journalctl --no-pager -n 50

# View logs for a specific service
journalctl --no-pager -u nginx -n 50

# View logs since today
journalctl --no-pager --since today

# View dmesg (kernel messages)
dmesg | tail -30
```

### User & Permission Management

```bash
# Current user info
id

# List users
cat /etc/passwd

# List groups
groups komsun

# Check SELinux status
getenforce
```

---

## File Transfer with PSCP

PuTTY comes with `pscp` for file transfers. These are run as **separate commands** (not through the persistent session):

### Upload a File to the Server

```bash
pscp -P 22 -pw n11111111111 "C:\local\path\file.txt" komsun@172.168.1.204:/home/komsun/file.txt
```

### Download a File from the Server

```bash
pscp -P 22 -pw n11111111111 komsun@172.168.1.204:/home/komsun/file.txt "C:\local\path\file.txt"
```

### Upload a Directory (recursive)

```bash
pscp -P 22 -pw n11111111111 -r "C:\local\path\mydir" komsun@172.168.1.204:/home/komsun/
```

### Download a Directory (recursive)

```bash
pscp -P 22 -pw n11111111111 -r komsun@172.168.1.204:/home/komsun/mydir "C:\local\path\"
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Session hangs on open | Missing `-batch` flag | Always add `-batch` to prevent interactive prompts |
| `Host key not cached` | First-time connection | Run once with `echo y \| plink ...` (without `-batch`) to accept the host key |
| No output from `send_command_input` | `WaitMs` too short | Increase `WaitMs` value for the command |
| Session disconnected | Idle timeout or network issue | Open a new session with `run_command` |
| `Access denied` | Wrong password or username | Verify credentials |
| `Connection refused` | SSH not running or firewall blocking | Check if sshd is running on the server |

### Initial Host Key Setup

If connecting for the first time ever, accept the host key:

```bash
echo y | plink -ssh -P 22 -l komsun -pw n11111111111 172.168.1.204 "echo connected"
```

After this, `-batch` mode will work without prompting.

---

## Best Practices

1. **Open ONE session, reuse it** — never open a new connection per command
2. **Always use `-batch`** when opening the session to prevent hanging on prompts
3. **Save the CommandId** and pass it to every `send_command_input` call
4. **End input with newline** — every command sent must end with `\n`
5. **Set appropriate WaitMs** — too short = missing output, too long = wasted time
6. **Use `2>&1`** on sudo commands to capture stderr in stdout
7. **Use output markers** (`===START===` / `===END===`) for easy parsing
8. **Limit output** — use `head`, `tail`, or `grep` to prevent excessive output
9. **Use `echo n11111111111 | sudo -S`** pattern for commands requiring root privileges
10. **Add `-y` flag** to `dnf install/remove/update` to avoid interactive confirmation prompts
11. **Close the session** with `Terminate: true` when all work is done
12. **If session dies**, simply open a new one — sessions can disconnect due to network issues

---

## Quick Reference

```
# Open session
Tool: run_command
CommandLine: plink -ssh -P 22 -l komsun -pw n11111111111 -batch 172.168.1.204
WaitMsBeforeAsync: 3000

# Send command (reuse CommandId from above)
Tool: send_command_input
CommandId: <session-command-id>
Input: "YOUR_COMMAND\n"
WaitMs: 3000

# Send sudo command
Tool: send_command_input
CommandId: <session-command-id>
Input: "echo n11111111111 | sudo -S YOUR_COMMAND 2>&1\n"
WaitMs: 5000

# Close session
Tool: send_command_input
CommandId: <session-command-id>
Terminate: true
WaitMs: 1000
```
