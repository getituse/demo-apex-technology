# Copilot instructions — Apex Institute of Technology

Static website for Apex Institute of Technology built with React Router v7 Framework Mode (prerender), Tailwind CSS, Radix UI, and Motion.

**The authoritative rules, architecture decisions, machine notes, status, task log, and bug log live in [AGENTS.md](../AGENTS.md). Read it before acting and update it after every task.** Do not duplicate rules here.

Supporting documents:

- [docs/CONFIGURATION.md](../docs/CONFIGURATION.md) — How to modify branding, terminology, theme, pages, and content.
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — Framework pipeline and component boundaries.
- [docs/THEMING.md](../docs/THEMING.md) — Semantic CSS-variable token system.
- [resolveerror.md](../resolveerror.md) — Verified machine error fixes.

Key rules:

1. **Shared components stay neutral:** All institutional wording comes from `terminology` in [`src/site/config.ts`](../src/site/config.ts). Never hardcode domain words or institutional names in `src/components/` or `src/sections/`.
2. **Semantic theme tokens only:** `bg-background`, `text-foreground`, `bg-primary`, `border-border`. Never raw hex or Tailwind palette classes (`blue-600`) in shared components.
3. **Motion imports come from `motion/react`:** Never `framer-motion`.
4. **Cross-repository parity:** Any shared-component or styling change must preserve parity across sister repositories.
