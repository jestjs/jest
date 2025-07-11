Sure! Here’s a simple and clean CONTRIBUTING.md with just the essential commands and no extra explanation:

⸻

# Contributing

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/jest.git
cd jest
corepack enable
yarn install --immutable

Create a Branch

git checkout -b feat/your-feature-name

Lint & Format

yarn lint
yarn prettier --write .

Run Tests

yarn test

Commit & Push

git add .
git commit -m "feat: your message"
git push origin feat/your-feature-name

Create Pull Request

Go to your fork on GitHub and click “Compare & pull request”.

---

Let me know if you want to add a Docker section or test workflow too.
```
