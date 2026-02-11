# Plan: GitHub Readiness & Public Publishing

Prepare the Stängelispass repository for a safe and professional launch on GitHub.

## Scope

- **In**: Secret masking (Supabase keys), `.gitignore` audit, `README.md` refinement, License addition.
- **Out**: GitHub Actions CI (Future phase), Private Repo hosting (Assuming Public).

## Action Items

[ ] **Mask Secrets**: Move hardcoded keys in `supabase.ts` to `.env` using `expo-constants`.
[ ] **Git Audit**: Verify `.expo/`, `node_modules/`, and `.env` are strictly ignored in `.gitignore`.
[ ] **Legal Prep**: Add an `LICENSE` file (e.g., MIT) to the root.
[ ] **Readme Polish**: Update "Setup" section with clear environment variable instructions.
[ ] **Path Hygiene**: Ensure all project documentation is relative and clickable on GitHub.
[ ] **Final Push**: Initialize local git, add remote, and push to main.

## Validation

- **Safety Check**: Search codebase for the string `rsduijvlwlyspilrjalm` to ensure no keys remain hardcoded.
- **Preview**: Run `npx expo config` to verify that variables are correctly injected from `.env`.

## Open Questions

- Do you have a preferred license (MIT, GPL, etc.)?
- Do you want to include a "Buy me a beer" donation link in the README?
