# Learner

```bash
# config
cp .env.example .env

# build
npm install
npm run graphql:generate
npm run build

# run
npx sun-learn learn "Immanuel Kant"
npx sun-learn learn "Transcendental Idealism" --parent "Immanuel Kant"
npx sun-learn learn "Stoicism" --questions 8 --dry-run
npx sun-learn learn "Logos" --source wikipedia

# review
npx sun-learn review --parent "Immanuel Kant"
npx sun-learn review

# config
npx sun-learn config
```

```bash
# Sun backend (after schema changes)
npm --prefix ../Sun run graphql:generate
```
