#!/usr/bin/env bash
# บันทึกทุกการแก้ไขใน D:\ProJect ลงประวัติ (git) อัตโนมัติ
# เรียกจาก Stop hook ของ Claude Code (.claude/settings.json) หลังจบแต่ละรอบการทำงาน
# ไม่มีอะไรเปลี่ยน = ไม่ทำอะไร · ดูประวัติ: git log --oneline · ย้อนไฟล์: git checkout <รหัส> -- <ไฟล์>
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}" || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
git add -A
git diff --cached --quiet && exit 0
git commit -q -m "บันทึกอัตโนมัติ $(date '+%Y-%m-%d %H:%M')" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || exit 0
printf '{"systemMessage":"บันทึกการแก้ไขลงประวัติแล้ว (%s)"}\n' "$(git rev-parse --short HEAD)"
