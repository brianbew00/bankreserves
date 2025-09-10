# 📝 DEV_NOTES.md  
## Replit → GitHub → Vercel Workflow Cheat Sheet

### 🔄 Check status
`git status`  
*(Shows which files are modified, staged, or untracked.)*

---

### ➕ Stage changes
`git add <file>`  
Example: `git add components/BankReserves.tsx`  

Stage all files:  
`git add .`

---

### 💬 Commit changes
`git commit -m "fix: remove explicit any in BankReserves.tsx"`  
*(Use a clear message about what you changed.)*

---

### ⬆️ Push to GitHub
`git push origin main`  

If you’re on a feature branch:  
`git push origin feature/my-change`

---

### 🌱 Create new branch (optional, for experiments)
`git checkout -b feature/my-change`  

Switch back to main:  
`git checkout main`

---

### ⏬ Pull latest changes (important if you edited in GitHub too)
`git pull origin main`

---

## 🚀 Deployment Flow
1. Make changes in **Replit**.  
2. Run/test locally: `npm run dev`  
3. Stage → Commit → Pull → Push:  
- `git add .`
- `git commit -m "your message"`
- `git pull origin main`
- `git push origin main`
4. Vercel auto-builds → check logs in Vercel dashboard.  
5. Confirm your deployed site works.  

---

## 🏷️ Commit Message Conventions
Use **Conventional Commits** for clarity:

- `feat:` → a new feature  
- `fix:` → a bug fix  
- `chore:` → maintenance (deps, configs, etc.)  
- `docs:` → documentation changes  
- `style:` → formatting, UI, or non-functional updates  
- `refactor:` → code change that improves structure without altering behavior  
- `test:` → adding or updating tests  

### Examples
- `git commit -m "feat: add search suggestions dropdown"`  
- `git commit -m "fix: remove explicit any types in BankReserves.tsx"`  
- `git commit -m "chore: update Tailwind to 3.4.13"`  
- `git commit -m "docs: add dev workflow cheat sheet"`

---

## ⚡ TL;DR (Quick Commands)
- `git add .`
- `git commit -m "your message"`
- `git pull origin main`
- `git push origin main`

---

## 🛟 Merge Conflict Fix (if `git pull` fails)
1. Run: `git pull origin main`  
2. If conflict: open the file(s) shown by Git.  
   - You’ll see sections like:  
     ```
     <<<<<<< HEAD
     your local changes
     =======
     changes from GitHub
     >>>>>>> origin/main
     ```
3. Keep the correct code, delete the `<<<<<<<`, `=======`, `>>>>>>>` lines.  
4. Stage resolved files: `git add <file>`  
5. Commit the resolution: `git commit -m "fix: resolve merge conflict"`  
6. Push again: `git push origin main`

---