# AI Agent Operational Rules

## 1. Documentation Synchronization (CRITICAL)
**Rule**: "Code Change = Doc Change"
Every time you modify the codebase (add features, refactor, fix bugs, or change configuration), you **MUST** verify and update the corresponding documentation in the same session.

**Scope**:
1.  **README.md**: For high-level architectural changes, new features, installation steps, or important configuration notes.
2.  **.trae/documents/**: For detailed technical architecture updates (`stream-ai-chat-tech-arch.md`) or product requirement updates (`stream-ai-chat-prd.md`).
3.  **Code Comments**: Ensure JSDoc and inline comments explain the "Why", not just the "How".

**Actionable Steps**:
- Before finishing a task, ask yourself: "Did I change how this works? Does the documentation still reflect reality?"
- If the answer is yes, update the docs immediately.
- Explicitly mention in your final response that documentation has been updated.

## 2. Code Style & Quality
- Follow existing patterns (Zustand for state, Tailwind for styling).
- Maintain type safety (Strict TypeScript).
  - **Avoid `any`**: Use precise type definitions (e.g., for 3rd-party libraries lacking types, create detailed `.d.ts` files instead of `any`).
- Prefer functional components and hooks.
