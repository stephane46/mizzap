# MIZZAP - Claude Progress Update Prompt

**Use this prompt when working with Claude in Windsurf**

Copy this and paste it to Claude whenever you finish a task or at end of day:

---

```
Before we finish today, please update PROGRESS.md with:

1. Mark any COMPLETED tasks as ✅ with commit links
2. Update progress percentage for current week
3. Add time spent on each task
4. Note any blockers or questions that came up
5. Briefly describe what was built

Format:
- Status: ✅ Done (or 🟡 In Progress, or 🚧 Blocked)
- Commit link: https://github.com/stephane46/mizzap/commit/XXXXX
- What was built: [1-2 line description]
- Time: X hours
- Next: [what comes next]

If there are blockers or questions, add them to the Blockers section so Stéphane can review.
```

---

## How to Use This

**At the end of each work session**:

Ask Claude in Windsurf:
```
Update PROGRESS.md with today's work. We:
1. Built [feature]
2. Time spent: X hours
3. Commits: [list commits]
4. Any blockers? [describe]
```

Claude updates the file and commits it to GitHub.

---

## Every Friday

Ask Claude:
```
Generate a weekly status report in PROGRESS.md following the "Template for Weekly Status" section.
Include all this week's tasks, blockers, and questions for Stéphane.
```

---

## Every 2 Weeks (Check-in with Stéphane)

Go back to Stéphane and share:
1. PROGRESS.md file (show him the table)
2. Any blockers that need his decision
3. Any questions about architecture

Stéphane reviews and provides guidance for next 2 weeks.

---

## Key Things to Track

✅ **Always update**:
- [ ] Task status (Done / In Progress / Blocked)
- [ ] GitHub commit links
- [ ] Time spent
- [ ] Test coverage
- [ ] Security checks completed

⚠️ **Alert Stéphane about**:
- Blockers (can't proceed without decision)
- Architecture questions (should we do X or Y?)
- Timeline concerns (falling behind?)
- Scope changes (needs different approach)

📊 **For Stéphane's overview**:
- Overall completion %
- Current week's progress
- Any risks to timeline

---

## Benefits

For **You**:
- Track exactly what you've built
- See progress visually
- Easy to resume next day
- Know what's blocked

For **Claude**:
- Knows what's been done
- Can reference commits
- Won't duplicate work
- Keeps context across sessions

For **Stéphane**:
- One file to see status
- Knows where to unblock
- Can plan next steps
- Can track timeline
- Easy to give guidance every 2 weeks

---

**This is your project dashboard.** Keep it updated! 📊
