---
title: Agent chats
order: 1
---

# Agent chats

A chat is where you give an agent a task and follow its work. You can watch each step, approve what it wants to do, and review the changes it makes.

## Start a chat

1. Select **New** in the sidebar. The chat uses the agent you used last.
2. Type your task in the message box and press Enter.

To use a different agent, open **Agents** from the sidebar, go to **Your agents**, and select **New chat** next to the agent you want.

## Give your agent context

- **Files**: select **Add**, then **Attach files**. Or type @ and a file's name.
- **Your screen**: select **Add**, then **Capture part of the screen**.
- **A folder to work in**: open the chat's folder menu and choose **Share a folder**. Turn on **Allow changes** to let the agent edit files there.

In the message box, you can also type $ to use a skill, ! for a saved prompt, and # for a persona.

## Plan before you run

For bigger tasks, ask the agent to plan first. Type `/plan` followed by the task, or choose a planning mode from the **Mode** menu. Shift+Tab cycles through the modes.

1. The agent replies with a plan.
2. Read it. Select **Edit** or **Keep planning** to change it.
3. Select **Run plan** when you're happy with it.

## Approve actions

Some actions need your OK, such as using a connected app or a folder. The chat shows a card with the request.

- **Accept and continue** allows it this time.
- **Accept and remember** allows it from now on. You can undo this in **Settings** under **Access**.
- **Deny** stops the action.

## Stop an agent

While the agent is replying, the send button becomes **Stop response**. Select it, or type `/stop`.

## Review the agent's work

The panel on the right of a chat shows what the agent is doing:

- **Steps**: each step the agent has taken.
- **Changes**: the files it changed. You can stage, commit and push from here.
- **Files**: the chat's folder. Right-click a file and choose **Send to chat** to mention it.
- **Terminal**: a terminal in the chat's folder.
- **Browser**: Misty's browser, when the agent uses it.

## Let the agent use a browser or your screen

- **Misty's browser**: the agent browses in its own browser. Select **Take over** to use it yourself, then **Resume** to hand it back.
- **Your screen**: with `/computer`, the agent uses its own cursor on your screen. Press Esc to stop it at any time.

> When you share a folder and let the agent browse on its own, a web page could try to trick it into sending your files somewhere. Only share what the task needs.

## Commands

Type / in the message box to see every command. These are the most useful:

| Command | What it does |
| --- | --- |
| `/new` | Start a new chat with this agent. |
| `/plan` | Switch to planning, then send what follows. |
| `/model` | Choose the model the agent uses. |
| `/stop` | Stop the agent's current reply. |
| `/browser` | Do this message's work in Misty's browser. |
| `/computer` | Let the agent see and use your screen for this message. |
| `/diff` | Show the changes in this chat's folder. |
| `/cd` | Change the folder this chat works in. |
| `/goal` | Set what should be true when the chat is done. |
| `/export` | Save this chat as a Markdown file. |

## Organize your chats

Your chats are listed in the sidebar. Right-click a chat to **Pin**, **Rename**, **Archive** or **Delete** it, or to open it in a split view.

A chat's status shows next to it: **Working**, **Needs you** or **Failed**.
